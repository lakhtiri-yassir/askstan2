// src/contexts/AuthContext.tsx - IMPROVED: Better error handling for database issues
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
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

// IMPROVED: Better error handling for profile creation
const createProfileSafe = async (userId: string, email: string): Promise<UserProfile | null> => {
  try {
    console.log("🔧 Creating profile for user:", userId);
    
    // First try the safe function
    const { data, error } = await supabase.rpc('create_user_profile_safe', {
      user_id: userId,
      user_email: email
    });

    if (error) {
      console.warn('RPC function failed, trying direct insert:', error);
      
      // Fallback: try direct insert
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          email_verified: false
        })
        .select()
        .single();

      if (insertError) {
        console.warn('Direct insert failed, trying upsert:', insertError);
        
        // Final fallback: try upsert
        const { data: upsertData, error: upsertError } = await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            email,
            email_verified: false,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (upsertError) {
          console.error('All profile creation methods failed:', upsertError);
          return null;
        }
        return upsertData;
      }
      return insertData;
    }
    return data;
  } catch (error) {
    console.error('Profile creation completely failed:', error);
    return null;
  }
};

// IMPROVED: Better error handling for subscription checking
const checkUserSubscription = async (userId: string): Promise<SubscriptionCheckResult> => {
  try {
    console.log("🔍 Checking subscription for user:", userId);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.warn("Subscription query error:", error);
      // IMPROVED: Don't throw on database errors, return inactive state
      return {
        hasActiveSubscription: false,
        subscription: null,
        status: 'inactive',
      };
    }

    const subscription = data && data.length > 0 ? data[0] : null;
    const hasActiveSubscription = !!subscription;

    return {
      hasActiveSubscription,
      subscription,
      status: subscription?.status || 'inactive',
    };
  } catch (error) {
    console.error("Subscription check failed completely:", error);
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
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionCheckResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);

  // Stable refs
  const userRef = useRef<User | null>(null);
  const authInProgressRef = useRef(false);
  
  // Update refs when state changes
  userRef.current = user;
  authInProgressRef.current = authInProgress;

  // Computed values
  const hasActiveSubscription = useMemo(() => {
    return subscriptionStatus?.hasActiveSubscription ?? false;
  }, [subscriptionStatus?.hasActiveSubscription]);

  const isEmailVerified = useMemo(() => {
    return profile?.email_verified ?? (user?.email_confirmed_at !== null);
  }, [profile?.email_verified, user?.email_confirmed_at]);

  // IMPROVED: Load user data with comprehensive error handling
  const loadUserData = async (authUser: User) => {
    try {
      console.log("🔄 Loading user data for:", authUser.id);
      
      // Load profile with error handling
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found - try to create one
          console.log("📝 No profile found, creating new profile");
          const newProfile = await createProfileSafe(authUser.id, authUser.email || '');
          setProfile(newProfile);
        } else {
          console.error("Profile load error:", profileError);
          // Don't fail completely, continue with null profile
          setProfile(null);
        }
      } else {
        setProfile(profileData);
      }

      // Load subscription with error handling
      const subStatus = await checkUserSubscription(authUser.id);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);

      console.log("✅ User data loaded:", {
        profile: !!profileData,
        hasSubscription: subStatus.hasActiveSubscription,
        status: subStatus.status
      });

    } catch (error) {
      console.error("Error loading user data:", error);
      // IMPROVED: Set safe default values instead of throwing
      setProfile(null);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        status: "inactive",
      });
      setSubscription(null);
    }
  };

  // Auth initialization
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
            setError(`Session error: ${error.message}`);
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
          setError(`Initialization failed: ${error}`);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

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
              setError(null);
              break;
              
            case 'TOKEN_REFRESHED':
              setSession(newSession);
              setUser(newSession?.user ?? null);
              break;
              
            case 'SIGNED_IN':
              setSession(newSession);
              setUser(newSession?.user ?? null);
              if (newSession?.user) {
                loadUserData(newSession.user);
              }
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
  }, []);

  // Auth functions with better error handling
  const signInRef = useRef<(email: string, password: string) => Promise<void>>();
  signInRef.current = async (email: string, password: string): Promise<void> => {
    if (authInProgressRef.current) return;

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
      setError(error.message);
      if (error.message?.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please check your credentials and try again.");
      } else if (error.message?.includes("Email not confirmed")) {
        throw new Error("Please check your email and click the confirmation link before signing in.");
      } else {
        throw new Error(error.message || "Sign in failed. Please try again.");
      }
    } finally {
      setAuthInProgress(false);
      setLoading(false);
    }
  };

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<void> => {
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: fullName ? { full_name: fullName } : undefined,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      throw new Error(error.message || "Failed to create account");
    }
  }, []);

  const signIn = useCallback((email: string, password: string) => 
    signInRef.current?.(email, password) || Promise.resolve(), []);

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
    if (!userRef.current) throw new Error("No authenticated user");

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userRef.current.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      throw new Error(error.message || "Failed to update profile");
    }
  }, []);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!userRef.current) return;

    try {
      const subStatus = await checkUserSubscription(userRef.current.id);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    return forgotPassword(email);
  }, [forgotPassword]);

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