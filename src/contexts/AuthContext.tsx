// src/contexts/AuthContext.tsx - FIXED VERSION WITH PROPER INITIALIZATION
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
  resetPassword: (email: string) => Promise<void>;
  // New state for better error handling
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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // FIXED: Better state management with error tracking
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionCheckResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values with proper memoization
  const hasActiveSubscription = useMemo(
    () => subscriptionStatus?.hasActiveSubscription ?? false,
    [subscriptionStatus]
  );

  const isEmailVerified = useMemo(
    () => profile?.email_verified ?? user?.email_confirmed_at !== null,
    [profile?.email_verified, user?.email_confirmed_at]
  );

  // FIXED: Improved user data loading with better error handling
  const loadUserData = useCallback(async (authUser: User) => {
    try {
      console.log("🔄 Loading user data for:", authUser.id);
      
      // Load user profile with timeout
      let userProfile: UserProfile | null = null;
      try {
        const { data: profileData, error: profileError } = await Promise.race([
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authUser.id)
            .single(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile load timeout')), 5000)
          )
        ]) as any;

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn("⚠️ Profile load error:", profileError);
        } else {
          userProfile = profileData;
        }
      } catch (profileError) {
        console.warn("Profile loading failed, continuing without profile:", profileError);
      }

      // Set profile state (even if null)
      setProfile(userProfile);
      console.log("👤 Profile loaded:", userProfile?.id || 'none');

      // FIXED: Load subscription status with timeout and better error handling
      let subStatus: SubscriptionCheckResult = {
        hasActiveSubscription: false,
        subscription: null,
        status: "inactive",
      };
      
      try {
        console.log("💳 Loading subscription status...");
        const userIdForSubscription = userProfile?.id || authUser.id;
        
        // Add timeout to subscription check
        subStatus = await Promise.race([
          checkUserSubscription(userIdForSubscription),
          new Promise<SubscriptionCheckResult>((_, reject) => 
            setTimeout(() => reject(new Error('Subscription check timeout')), 5000)
          )
        ]);
        console.log("💳 Subscription status loaded:", subStatus);
      } catch (subError) {
        console.warn("Subscription loading failed, using default:", subError);
        // Keep default values set above
      }

      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);

      console.log("✅ User data loaded successfully");
      
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      
      // FIXED: Set safe default values to prevent infinite loading
      setProfile(null);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        status: "inactive",
      });
      setSubscription(null);
      
      // Don't throw error - just log and continue
    }
  }, []);

  // FIXED: Improved session initialization with proper error handling
  useEffect(() => {
    let mounted = true;
    let authSubscription: { subscription: { unsubscribe: () => void } } | null = null;

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        setError(null); // Clear any previous errors
        
        // FIXED: Add timeout to initial session check
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session check timeout')), 8000)
          )
        ]) as any;

        const { data: { session: initialSession }, error } = sessionResult;
        
        if (error) {
          console.error("❌ Error getting initial session:", error);
          if (mounted) {
            setError("Failed to initialize authentication");
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

          // FIXED: Load user data with proper error handling
          if (initialSession?.user) {
            console.log("🔄 Loading initial user data...");
            try {
              await loadUserData(initialSession.user);
            } catch (loadError) {
              console.warn("Failed to load user data during initialization:", loadError);
              // Continue with initialization even if user data fails
            }
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
          setError("Authentication initialization failed");
          setLoading(false);
          setInitialized(true);
          // Set safe defaults
          setSubscriptionStatus({
            hasActiveSubscription: false,
            subscription: null,
            status: "inactive",
          });
        }
      }
    };

    // FIXED: Better auth state listener setup
    const setupAuthListener = () => {
      console.log("👂 Setting up auth state listener...");
      
      const { data } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          try {
            console.log("🔄 Auth state change:", event, newSession?.user?.id || 'No session');
            
            if (!mounted) {
              console.log("⚠️ Component unmounted, ignoring auth state change");
              return;
            }

            // Clear any previous errors on auth state change
            setError(null);

            // Handle different auth events with individual try-catch
            switch (event) {
              case 'SIGNED_IN':
                try {
                  console.log("✅ User signed in");
                  setSession(newSession);
                  setUser(newSession?.user ?? null);
                  if (newSession?.user) {
                    await loadUserData(newSession.user);
                  }
                } catch (signInError) {
                  console.warn("Sign in processing error (non-fatal):", signInError);
                }
                break;
                
              case 'SIGNED_OUT':
                try {
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
                } catch (signOutError) {
                  console.warn("Sign out processing error (non-fatal):", signOutError);
                }
                break;
                
              case 'TOKEN_REFRESHED':
                try {
                  console.log("🔄 Token refreshed");
                  setSession(newSession);
                  setUser(newSession?.user ?? null);
                  // Don't reload user data on token refresh if we already have it
                  if (newSession?.user && !profile) {
                    await loadUserData(newSession.user);
                  }
                } catch (refreshError) {
                  console.warn("Token refresh processing error (non-fatal):", refreshError);
                }
                break;
                
              default:
                try {
                  console.log("📡 Auth event:", event);
                  setSession(newSession);
                  setUser(newSession?.user ?? null);
                } catch (defaultError) {
                  console.warn("Default auth event processing error (non-fatal):", defaultError);
                }
            }

            // Always ensure loading is false after auth state change
            if (mounted) {
              setLoading(false);
            }
          } catch (overallError) {
            console.warn("Overall auth state change error (non-fatal):", overallError);
            // Ensure loading is false even on error
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

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up auth context...");
      mounted = false;
      if (authSubscription?.subscription && typeof authSubscription.subscription.unsubscribe === "function") {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, [loadUserData]);

  // FIXED: Extended timeout for slower connections
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && !initialized) {
        console.warn("⚠️ Auth initialization timeout - forcing completion");
        setLoading(false);
        setInitialized(true);
        setError("Authentication took longer than expected");
        // Set default state for timeout case
        setSubscriptionStatus({
          hasActiveSubscription: false,
          subscription: null,
          status: "inactive",
        });
      }
    }, 12000); // FIXED: Increased from 6 to 12 seconds

    return () => clearTimeout(timeoutId);
  }, [loading, initialized]);

  // FIXED: Improved auth functions with better error handling
  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
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
        console.warn("⚠️ Profile creation warning:", profileError);
        // Don't throw - continue with signup
      }

    } catch (error: any) {
      console.error("❌ Signup error:", error);
      setError(error.message || "Failed to create account");
      throw new Error(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
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
      setError(error.message || "Failed to sign in");

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
      setError(null);

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
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("❌ Password reset error:", error);
      setError(error.message || "Failed to send reset email");
      throw new Error(error.message || "Failed to send reset email. Please try again.");
    }
  }, []);

  // FIXED: Add resetPassword for compatibility
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    return forgotPassword(email);
  }, [forgotPassword]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error("No user logged in");
    
    setError(null);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      console.error("❌ Profile update error:", error);
      setError(error.message || "Failed to update profile");
      throw error;
    }
  }, [user]);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    setError(null);
    try {
      const status = await checkUserSubscription(user.id);
      setSubscriptionStatus(status);
      setSubscription(status.subscription);
    } catch (error: any) {
      console.error("❌ Subscription refresh error:", error);
      setError("Failed to refresh subscription status");
    }
  }, [user]);

  // FIXED: Add the missing helper functions
  const createProfileSafe = async (userId: string, email: string): Promise<UserProfile> => {
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
        // Profile might already exist, try to fetch it
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (existingProfile) {
          return existingProfile;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.warn("Profile creation failed, returning minimal profile:", error);
      // Return minimal profile to prevent blocking
      return {
        id: userId,
        email: email,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  };

  const checkUserSubscription = async (userId: string): Promise<SubscriptionCheckResult> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const hasActiveSubscription = !!data && data.status === 'active';
      
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
  };

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
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};