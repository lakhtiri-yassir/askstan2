// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_type: string;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionCheckResult {
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  status: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  subscriptionStatus: SubscriptionCheckResult | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  hasActiveSubscription: boolean;
  isEmailVerified: boolean;
  resetPassword: (email: string) => Promise<void>;
  initialized: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper function for safe profile creation
const createProfileSafe = async (userId: string, email: string): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase.rpc('create_user_profile_safe', {
      user_id: userId,
      user_email: email
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Profile creation error:', error);
    // Fallback: try direct insert
    const { data, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        email_verified: false
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return data;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionCheckResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // CRITICAL FIX: Add auth operation tracking to prevent race conditions
  const [authInProgress, setAuthInProgress] = useState(false);

  // Computed values
  const hasActiveSubscription = useMemo(
    () => subscriptionStatus?.hasActiveSubscription ?? false,
    [subscriptionStatus]
  );

  const isEmailVerified = useMemo(
    () => profile?.email_verified ?? user?.email_confirmed_at !== null,
    [profile?.email_verified, user?.email_confirmed_at]
  );

  // Helper function to check subscription status
  const checkUserSubscription = useCallback(async (userId: string): Promise<SubscriptionCheckResult> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn("Subscription query error:", error);
      }

      const hasActiveSubscription = !!(data && ['active', 'trialing'].includes(data.status));

      return {
        hasActiveSubscription,
        subscription: data || null,
        status: data?.status || 'inactive',
      };
    } catch (error) {
      console.error("Subscription check error:", error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        status: 'inactive',
      };
    }
  }, []);

  // CRITICAL FIX: Sequential user data loading to prevent race conditions
  const loadUserDataSequential = useCallback(async (authUser: User) => {
    try {
      console.log("🔄 Loading user data sequentially for:", authUser.id);
      
      // Step 1: Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn("Profile load error:", profileError);
      }

      setProfile(profileData || null);
      console.log("👤 Profile loaded:", profileData?.id || 'none');

      // Step 2: Load subscription status (wait for profile to complete)
      console.log("💳 Loading subscription status...");
      const userIdForSubscription = profileData?.id || authUser.id;
      const subStatus = await checkUserSubscription(userIdForSubscription);
      
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);
      console.log("💳 Subscription status loaded:", subStatus.status);

    } catch (error) {
      console.error("Error loading user data:", error);
      // Set safe defaults
      setProfile(null);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        status: "inactive",
      });
      setSubscription(null);
    }
  }, [checkUserSubscription]);

  // Session initialization
  useEffect(() => {
    let mounted = true;
    let authSubscription: { subscription: { unsubscribe: () => void } } | null = null;

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        console.log("📱 Initial session:", initialSession?.user?.id || 'No session');

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            console.log("🔄 Loading initial user data...");
            await loadUserDataSequential(initialSession.user);
          } else {
            console.log("👤 No initial session - user needs to sign in");
            setSubscriptionStatus({
              hasActiveSubscription: false,
              subscription: null,
              status: "inactive",
            });
          }

          setLoading(false);
          setInitialized(true);
        }
        
      } catch (error) {
        console.error("Session initialization error:", error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          setSubscriptionStatus({
            hasActiveSubscription: false,
            subscription: null,
            status: "inactive",
          });
        }
      }
    };

    // CRITICAL FIX: Simplified auth state listener to prevent conflicts
    const setupAuthListener = () => {
      console.log("👂 Setting up auth state listener...");
      
      const { data } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          try {
            console.log("🔄 Auth state change:", event, newSession?.user?.id || 'No session');
            
            if (!mounted) return;
            
            // CRITICAL FIX: Skip handling if manual auth is in progress
            if (authInProgress) {
              console.log("⏸️ Skipping auth state change - manual auth in progress");
              return;
            }

            switch (event) {
              case 'SIGNED_OUT':
                console.log("🚪 User signed out");
                setSession(null);
                setUser(null);
                setProfile(null);
                setSubscription(null);
                setSubscriptionStatus({
                  hasActiveSubscription: false,
                  subscription: null,
                  status: "inactive",
                });
                break;
                
              case 'TOKEN_REFRESHED':
                console.log("🔄 Token refreshed");
                setSession(newSession);
                setUser(newSession?.user ?? null);
                break;
                
              // CRITICAL FIX: Don't handle SIGNED_IN here to prevent race conditions
              // Let manual signIn function handle the complete flow
            }

            if (mounted) {
              setLoading(false);
              setInitialized(true);
            }
          } catch (error) {
            console.error("Auth state change error:", error);
            if (mounted) {
              setLoading(false);
              setInitialized(true);
            }
          }
        }
      );

      authSubscription = data;
    };

    const initialize = async () => {
      await initializeAuth();
      setupAuthListener();
    };

    initialize();

    return () => {
      console.log("🧹 Cleaning up auth context...");
      mounted = false;
      if (authSubscription?.subscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, [loadUserDataSequential, authInProgress]);

  // CRITICAL FIX: Completely rewritten signIn function to prevent race conditions
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    // Prevent concurrent auth operations
    if (authInProgress) {
      console.log("⏸️ Auth already in progress, skipping");
      return;
    }

    setAuthInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log("🔐 Starting manual sign in...");
      
      // Step 1: Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Sign in failed - no user returned");

      console.log("✅ Sign in successful, updating state...");

      // Step 2: Update session and user state immediately
      setSession(data.session);
      setUser(data.user);

      // Step 3: Load user data sequentially
      await loadUserDataSequential(data.user);

      console.log("🎉 Complete sign in flow finished");

    } catch (error: any) {
      console.error("Sign in error:", error);

      if (error.message?.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please check your credentials and try again.");
      } else if (error.message?.includes("Email not confirmed")) {
        throw new Error("Please check your email and click the confirmation link before signing in.");
      } else {
        throw new Error(error.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setAuthInProgress(false);
      setLoading(false);
    }
  }, [loadUserDataSequential, authInProgress]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<void> => {
    if (authInProgress) return;

    setAuthInProgress(true);
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed - no user returned");

      // Create user profile
      try {
        const profile = await createProfileSafe(
          authData.user.id,
          email.trim().toLowerCase()
        );
        setProfile(profile);
      } catch (profileError) {
        console.warn("Profile creation warning:", profileError);
      }

    } catch (error: any) {
      console.error("Signup error:", error);
      throw new Error(error.message || "Failed to create account. Please try again.");
    } finally {
      setAuthInProgress(false);
      setLoading(false);
    }
  }, [authInProgress]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      console.log("🚪 Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log("✅ Sign out successful");
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw new Error(error.message || "Failed to sign out");
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || "Failed to send reset email");
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    return forgotPassword(email);
  }, [forgotPassword]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error("No authenticated user");

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      throw new Error(error.message || "Failed to update profile");
    }
  }, [user]);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const subStatus = await checkUserSubscription(user.id);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
    }
  }, [user, checkUserSubscription]);

  const value: AuthContextType = {
    user,
    profile,
    subscription,
    subscriptionStatus,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    updateProfile,
    refreshSubscription,
    hasActiveSubscription,
    isEmailVerified,
    resetPassword,
    initialized,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};