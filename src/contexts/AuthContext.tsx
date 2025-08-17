// src/contexts/AuthContext.tsx - SIMPLIFIED VERSION WITHOUT TIMEOUTS
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// Type definitions
interface UserProfile {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_type: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
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
  // SIMPLIFIED: Basic state management without timeout complexity
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionCheckResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const hasActiveSubscription = useMemo(
    () => subscriptionStatus?.hasActiveSubscription ?? false,
    [subscriptionStatus]
  );

  const isEmailVerified = useMemo(
    () => profile?.email_verified ?? user?.email_confirmed_at !== null,
    [profile?.email_verified, user?.email_confirmed_at]
  );

  // SIMPLIFIED: Load user data without timeouts
  const loadUserData = useCallback(async (authUser: User) => {
    try {
      console.log("🔄 Loading user data for:", authUser.id);
      
      // Load user profile
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

      // Load subscription status
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
  }, []); // Remove checkUserSubscription from dependencies to avoid circular dependency

  // SIMPLIFIED: Session initialization without timeout logic
  useEffect(() => {
    let mounted = true;
    let authSubscription: { subscription: { unsubscribe: () => void } } | null = null;

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        setError(null);
        
        // Get initial session - let Supabase handle timeouts
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          if (mounted) {
            setError("Failed to initialize authentication");
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        console.log("📱 Initial session:", initialSession?.user?.id || 'No session');

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          // Load user data if we have a session
          if (initialSession?.user) {
            console.log("🔄 Loading initial user data...");
            await loadUserData(initialSession.user);
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
          setError("Authentication initialization failed");
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

    // SIMPLIFIED: Auth state listener without timeout handling
    const setupAuthListener = () => {
      console.log("👂 Setting up auth state listener...");
      
      const { data } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          try {
            console.log("🔄 Auth state change:", event, newSession?.user?.id || 'No session');
            
            if (!mounted) return;

            setError(null);

            switch (event) {
              case 'SIGNED_IN':
                console.log("✅ User signed in");
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (newSession?.user) {
                  await loadUserData(newSession.user);
                }
                break;
                
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
                
              default:
                console.log("📡 Auth event:", event);
                setSession(newSession);
                setUser(newSession?.user ?? null);
            }

            if (mounted) {
              setLoading(false);
            }
          } catch (error) {
            console.error("Auth state change error:", error);
            if (mounted) {
              setLoading(false);
            }
          }
        }
      );

      authSubscription = data;
    };

    // Initialize auth and setup listener
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
  }, [loadUserData]);

  // SIMPLIFIED: Auth functions without timeout logic
  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<void> => {
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
        // Continue with signup even if profile creation fails
      }

    } catch (error: any) {
      console.error("Signup error:", error);
      throw new Error(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      // Auth state change handler will handle the rest
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
      setLoading(false);
    }
  }, []);

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
    // This is the same as forgotPassword - keeping for compatibility
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
  }, [user]); // Remove checkUserSubscription from dependencies

  // Helper function to check subscription status - SINGLE DEFINITION
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

      const hasActiveSubscription = !!data && ['active', 'trialing'].includes(data.status);
      
      return {
        hasActiveSubscription,
        subscription: data || null,
        status: data?.status || 'inactive'
      };
    } catch (error) {
      console.warn("Subscription check failed:", error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        status: 'inactive'
      };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      subscription,
      subscriptionStatus,
      session,
      loading,
      initialized,
      error,
      signUp,
      signIn,
      signOut,
      forgotPassword,
      resetPassword,
      updateProfile,
      refreshSubscription,
      hasActiveSubscription,
      isEmailVerified,
      checkUserSubscription, // Export this function
    }),
    [
      user,
      profile,
      subscription,
      subscriptionStatus,
      session,
      loading,
      initialized,
      error,
      signUp,
      signIn,
      signOut,
      forgotPassword,
      resetPassword,
      updateProfile,
      refreshSubscription,
      hasActiveSubscription,
      isEmailVerified,
      checkUserSubscription, // Add to dependencies
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};