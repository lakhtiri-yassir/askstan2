// src/contexts/AuthContext.tsx - FIXED SESSION INITIALIZATION (Based on Working Version)
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

// Simple inline types to avoid import issues
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
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  hasActiveSubscription: boolean;
  isEmailVerified: boolean;
  resetPassword: (email: string) => Promise<void>; // Added for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
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

  // Computed values with proper memoization
  const hasActiveSubscription = useMemo(
    () => subscriptionStatus?.hasActiveSubscription ?? false,
    [subscriptionStatus?.hasActiveSubscription]
  );
  
  const isEmailVerified = useMemo(() => true, []);

  // Simple user service functions
  const getProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.log('Profile query error:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  };

  const createProfileSafe = async (userId: string, email: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: email,
          email_verified: true
        })
        .select()
        .single();

      if (error) {
        console.log('Profile creation error:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };

  const checkUserSubscription = async (userId: string): Promise<SubscriptionCheckResult> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.log('Subscription query error:', error.message);
        return {
          hasActiveSubscription: false,
          subscription: null,
          status: "inactive",
        };
      }

      return {
        hasActiveSubscription: !!data,
        subscription: data,
        status: data?.status || "inactive",
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        status: "inactive",
      };
    }
  };

  // CRITICAL FIX: Memoized loadUserData to prevent infinite loops
  const loadUserData = useCallback(async (authUser: User) => {
    try {
      console.log("🔄 Loading user data for:", authUser.id);

      // Load or create user profile
      let userProfile = await getProfile(authUser.id);
      
      if (!userProfile && authUser.email) {
        console.log("📝 No profile found, creating one manually...");
        userProfile = await createProfileSafe(authUser.id, authUser.email);
      }

      // Set profile state
      setProfile(userProfile);
      console.log("👤 Profile loaded:", userProfile?.id);

      // Load subscription status
      console.log("💳 Loading subscription status...");
      const userIdForSubscription = userProfile?.id || authUser.id;
      
      const subStatus = await checkUserSubscription(userIdForSubscription);
      console.log("💳 Subscription status loaded:", subStatus);

      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);

      console.log("✅ User data loaded successfully");
      
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      
      // Set default values to prevent infinite loading
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        status: "inactive",
      });
    }
  }, []);

  // CRITICAL FIX: Proper session initialization and state management
  useEffect(() => {
    let mounted = true;
    let authSubscription: { subscription: { unsubscribe: () => void } } | null = null;

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        
        // FIXED: Get initial session with proper error handling
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Error getting initial session:", error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        console.log("📱 Initial session:", initialSession?.user?.id || 'No session');

        // FIXED: Set initial state properly
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          // Load user data if session exists
          if (initialSession?.user) {
            console.log("🔄 Loading initial user data...");
            await loadUserData(initialSession.user);
          } else {
            console.log("👤 No initial session - user needs to sign in");
            // Set default subscription status for non-authenticated users
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
        console.error("❌ Session initialization error:", error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Setup auth state listener AFTER initial session check
    const setupAuthListener = () => {
      console.log("👂 Setting up auth state listener...");
      
      const { data } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log("🔄 Auth state change:", event, newSession?.user?.id || 'No session');
          
          if (!mounted) {
            console.log("⚠️ Component unmounted, ignoring auth state change");
            return;
          }

          // Handle different auth events
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
              // Don't reload user data on token refresh if we already have it
              if (newSession?.user && !profile) {
                await loadUserData(newSession.user);
              }
              break;
              
            default:
              console.log("📡 Auth event:", event);
              setSession(newSession);
              setUser(newSession?.user ?? null);
          }

          // Always ensure loading is false after auth state change
          if (mounted) {
            setLoading(false);
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

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up auth context...");
      mounted = false;
      if (authSubscription?.subscription && typeof authSubscription.subscription.unsubscribe === "function") {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, [loadUserData]);

  // Additional safety timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && !initialized) {
        console.warn("⚠️ Auth initialization timeout - forcing completion");
        setLoading(false);
        setInitialized(true);
        // Set default state for timeout case
        setSubscriptionStatus({
          hasActiveSubscription: false,
          subscription: null,
          status: "inactive",
        });
      }
    }, 6000); // 6 second timeout

    return () => clearTimeout(timeoutId);
  }, [loading, initialized]);

  // Memoized auth functions
  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log("📝 Starting signup process");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            email_verified: true,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed - no user returned");

      console.log("✅ Auth user created:", authData.user.id);

      // Create user profile
      try {
        const profile = await createProfileSafe(
          authData.user.id,
          email.trim().toLowerCase()
        );
        setProfile(profile);
        console.log("✅ Profile created successfully");
      } catch (profileError) {
        console.error("❌ Profile creation error:", profileError);
      }

    } catch (error: any) {
      console.error("❌ Signup error:", error);
      throw new Error(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log("🔑 Starting sign in process");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      console.log("✅ Sign in successful:", data.user?.id);
      // Auth state change handler will handle the rest
    } catch (error: any) {
      console.error("❌ Sign in error:", error);

      if (error.message?.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please check your credentials and try again.");
      } else {
        throw new Error(error.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      console.log("🚪 Starting sign out process...");

      // Clear all state first
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Supabase signOut error:", error);
        // Don't throw - we still want to redirect
      }

      console.log("✅ Sign out completed");

      // Force redirect to ensure clean state
      window.location.replace("/");
    } catch (error: any) {
      console.error("❌ Sign out error:", error);
      
      // Force clear state and redirect even on error
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);
      window.location.replace("/");
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("❌ Password reset error:", error);
      throw new Error(error.message || "Failed to send reset email. Please try again.");
    }
  }, []);

  // Added for compatibility
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    return await forgotPassword(email);
  }, [forgotPassword]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error("User not authenticated");

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
      console.error("❌ Profile update error:", error);
      throw new Error(error.message || "Failed to update profile. Please try again.");
    }
  }, [user]);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      console.log("🔄 Refreshing subscription status...");
      const subStatus = await checkUserSubscription(user.id);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);
      console.log("✅ Subscription refreshed:", subStatus);
    } catch (error) {
      console.error("❌ Refresh subscription error:", error);
    }
  }, [user]);

  // Memoized context value
  const value = useMemo((): AuthContextType => ({
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
    resetPassword, // Added for compatibility
  }), [
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
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};