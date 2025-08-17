// src/contexts/AuthContext.tsx - CRITICAL FIX: Eliminates hook order violations causing React Error #300
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

// CRITICAL FIX: Simplified helper function - no hooks inside
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

// CRITICAL FIX: Standalone subscription check function - no hooks
const checkUserSubscription = async (userId: string): Promise<SubscriptionCheckResult> => {
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
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // CRITICAL FIX: All hooks must be called in exactly the same order every time
  // No conditional hooks, no hooks in callbacks, no complex dependency chains
  
  // State management - simple, flat state structure
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionCheckResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);

  // CRITICAL FIX: Simplified computed values with minimal dependencies
  const hasActiveSubscription = useMemo(() => {
    return subscriptionStatus?.hasActiveSubscription ?? false;
  }, [subscriptionStatus?.hasActiveSubscription]);

  const isEmailVerified = useMemo(() => {
    return profile?.email_verified ?? (user?.email_confirmed_at !== null);
  }, [profile?.email_verified, user?.email_confirmed_at]);

  // CRITICAL FIX: Load user data function - no useCallback with complex dependencies
  const loadUserData = async (authUser: User) => {
    try {
      console.log("🔄 Loading user data for:", authUser.id);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn("Profile load error:", profileError);
      }

      setProfile(profileData || null);

      // Load subscription
      const subStatus = await checkUserSubscription(authUser.id);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);

    } catch (error) {
      console.error("Error loading user data:", error);
      setProfile(null);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        status: "inactive",
      });
      setSubscription(null);
    }
  };

  // CRITICAL FIX: Simplified initialization effect with minimal dependencies
  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            await loadUserData(initialSession.user);
          } else {
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
        console.error("Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // CRITICAL FIX: Simplified auth listener
    const setupAuthListener = () => {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (!mounted || authInProgress) return;

          console.log("Auth state change:", event);
          
          switch (event) {
            case 'SIGNED_OUT':
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
              setSession(newSession);
              setUser(newSession?.user ?? null);
              break;
          }
        }
      );

      authSubscription = data;
    };

    const init = async () => {
      await initializeAuth();
      setupAuthListener();
    };

    init();

    return () => {
      mounted = false;
      if (authSubscription?.subscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - no complex dependencies

  // CRITICAL FIX: Simple callback functions - no complex dependency arrays
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    if (authInProgress) return;

    setAuthInProgress(true);
    setLoading(true);
    setError(null);

    try {
      console.log("🔐 Starting sign in...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Sign in failed");

      setSession(data.session);
      setUser(data.user);
      await loadUserData(data.user);

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
  }, [authInProgress]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<void> => {
    if (authInProgress) return;

    setAuthInProgress(true);
    setLoading(true);
    setError(null);

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
      if (!authData.user) throw new Error("Signup failed");

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
  }, [user]);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    return forgotPassword(email);
  }, [forgotPassword]);

  // CRITICAL FIX: Simple context value object - no complex dependencies
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