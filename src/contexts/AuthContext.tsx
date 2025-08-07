import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, userService } from "../lib/supabase";
import {
  subscriptionService,
  SubscriptionCheckResult,
} from "../lib/subscriptionService";
import { UserProfile, Subscription } from "../types/supabase";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionCheckResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  // FIXED: Add initialization tracking to prevent infinite loops
  const [isInitialized, setIsInitialized] = useState(false);

  const hasActiveSubscription =
    subscriptionStatus?.hasActiveSubscription ?? false;
  const isEmailVerified = true; // Skip email verification completely

  // FIXED: Better loading state calculation with initialization check
  const isLoading = loading || (dataLoading && !isInitialized);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log("🔐 Starting sign in process");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      console.log("✅ Sign in successful:", data.user?.id);
    } catch (error: any) {
      console.error("❌ Sign in error:", error);

      if (error.message?.includes("Invalid login credentials")) {
        throw new Error(
          "Invalid email or password. Please check your credentials and try again."
        );
      } else {
        throw new Error(
          error.message || "Failed to sign in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log("🚪 Starting sign out process...");

      // Clear all state immediately
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);
      setIsInitialized(false); // FIXED: Reset initialization state

      console.log("🧹 State cleared, calling Supabase signOut...");

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log("✅ Supabase signOut successful");

      // Force reload to ensure clean state
      window.location.replace("/");
    } catch (error: any) {
      console.error("❌ Sign out error:", error);

      // Force clear state even if Supabase signOut fails
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);
      setIsInitialized(false);

      // Force redirect
      window.location.replace("/");
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("❌ Password reset error:", error);
      throw new Error(
        error.message || "Failed to send reset email. Please try again."
      );
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<void> => {
    if (!user) throw new Error("User not authenticated");

    try {
      const updatedProfile = await userService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (error: any) {
      console.error("❌ Profile update error:", error);
      throw new Error(
        error.message || "Failed to update profile. Please try again."
      );
    }
  };

  // FIXED: Improved refreshSubscription with timeout
  const refreshSubscription = async (): Promise<void> => {
    if (!user) return;

    try {
      console.log("🔄 Refreshing subscription status...");
      
      const subscriptionPromise = subscriptionService.checkUserSubscription(user.id);
      const timeoutPromise = new Promise<SubscriptionCheckResult>((_, reject) => 
        setTimeout(() => reject(new Error('Subscription refresh timeout')), 5000)
      );

      const subStatus = await Promise.race([subscriptionPromise, timeoutPromise]);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);
      
      console.log("✅ Subscription refreshed:", subStatus);
    } catch (error) {
      console.error("❌ Refresh subscription error:", error);
      
      // Keep existing status if refresh fails
      console.log("⚠️  Keeping existing subscription status due to refresh error");
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
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

      if (authError) {
        console.error("❌ Auth signup error:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Signup failed - no user returned");
      }

      console.log("✅ Auth user created:", authData.user.id);

      // Create user profile using safe function
      try {
        const profile = await userService.createProfileSafe(
          authData.user.id,
          email.trim().toLowerCase()
        );
        setProfile(profile);
        console.log("✅ Profile created successfully");
      } catch (profileError) {
        console.error("❌ Profile creation error:", profileError);
        // Don't fail signup if profile creation fails
      }

      console.log("✅ Signup completed successfully");
    } catch (error: any) {
      console.error("❌ Signup error:", error);
      throw new Error(
        error.message || "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load user data function with improved error handling
  const loadUserData = async (user: User, isMounted: boolean = true) => {
    if (!isMounted) return;

    try {
      console.log("🔄 Loading user data for:", user.id);

      // Initialize with default status immediately to prevent infinite loading
      const defaultStatus: SubscriptionCheckResult = {
        hasActiveSubscription: false,
        subscription: null,
        status: "inactive" as const,
      };

      if (isMounted) {
        setSubscriptionStatus(defaultStatus);
      }

      // Load or create user profile with timeout
      let userProfile = null;
      try {
        console.log("👤 Loading user profile...");
        
        const profilePromise = userService.getProfile(user.id);
        const profileTimeout = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Profile loading timeout')), 5000)
        );

        userProfile = await Promise.race([profilePromise, profileTimeout]);
        
        if (!userProfile && user.email && isMounted) {
          console.log("📝 No profile found, creating one...");
          const createProfilePromise = userService.createProfileSafe(user.id, user.email);
          const createTimeout = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Profile creation timeout')), 5000)
          );
          
          userProfile = await Promise.race([createProfilePromise, createTimeout]);
        }

        // Set profile if we got one and component is still mounted
        if (isMounted && userProfile) {
          setProfile(userProfile);
          console.log("✅ Profile loaded:", userProfile.id);
        }

      } catch (profileError) {
        console.error("⚠️  Profile loading failed:", profileError);
        // Continue without profile - don't block subscription loading
      }

      // Load subscription status with timeout and fallback
      try {
        console.log("💳 Loading subscription status...");
        
        const userIdForSubscription = userProfile?.id || user.id;
        console.log("🔍 Using user ID for subscription query:", userIdForSubscription);

        // Shorter timeout for subscription loading
        const subscriptionPromise = subscriptionService.checkUserSubscription(userIdForSubscription);
        const timeoutPromise = new Promise<SubscriptionCheckResult>((_, reject) => 
          setTimeout(() => reject(new Error('Subscription loading timeout')), 3000)
        );

        const subStatus = await Promise.race([subscriptionPromise, timeoutPromise]);
        
        if (isMounted) {
          setSubscriptionStatus(subStatus);
          setSubscription(subStatus.subscription);
          console.log("✅ Subscription status loaded:", subStatus.status);
        }

      } catch (subscriptionError) {
        console.error("⚠️  Subscription loading failed:", subscriptionError);
        
        // Keep default status on error - don't update if already set
        console.log("🔄 Keeping default subscription status due to error");
      }

      console.log("✅ User data loading completed");

    } catch (error) {
      console.error("❌ Critical error loading user data:", error);
      
      // Ensure we always have a subscription status set
      if (isMounted) {
        const failsafeStatus: SubscriptionCheckResult = {
          hasActiveSubscription: false,
          subscription: null,
          status: "inactive" as const,
        };
        setSubscriptionStatus(failsafeStatus);
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authListener: any = null;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Error getting initial session:", error);
        }

        if (isMounted) {
          // Set initial session data
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // If we have a user, load their data
          if (initialSession?.user) {
            console.log('👤 Found initial session, loading user data...');
            setDataLoading(true);
            
            try {
              await loadUserData(initialSession.user, true);
            } catch (error) {
              console.error("❌ Error loading initial user data:", error);
            } finally {
              if (isMounted) {
                setDataLoading(false);
              }
            }
          } else {
            console.log('👤 No initial session found');
            // Ensure subscription status is set to prevent infinite loading
            setSubscriptionStatus({
              hasActiveSubscription: false,
              subscription: null,
              status: "inactive" as const,
            });
          }
          
          // Mark as initialized and stop loading
          setLoading(false);
          setIsInitialized(true);
        }

      } catch (error) {
        console.error("💥 Auth initialization error:", error);
        if (isMounted) {
          // Always set default state on error
          setLoading(false);
          setDataLoading(false);
          setIsInitialized(true);
          setSubscriptionStatus({
            hasActiveSubscription: false,
            subscription: null,
            status: "inactive" as const,
          });
        }
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      console.log('🔔 Setting up auth listener...');
      
      authListener = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`🔔 Auth state changed: ${event}`, session?.user?.id);

        if (!isMounted) return;

        // Update session and user immediately
        setSession(session);
        setUser(session?.user ?? null);

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('✅ User signed in, loading data...');
              setDataLoading(true);
              try {
                await loadUserData(session.user, true);
              } catch (error) {
                console.error("❌ Error loading user data after sign in:", error);
              } finally {
                if (isMounted) {
                  setDataLoading(false);
                }
              }
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('🚪 User signed out, clearing data...');
            setProfile(null);
            setSubscription(null);
            setSubscriptionStatus({
              hasActiveSubscription: false,
              subscription: null,
              status: "inactive" as const,
            });
            setDataLoading(false);
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            // Don't reload data on token refresh, just update session
            break;
            
          default:
            console.log(`🔔 Auth event: ${event}`);
        }

        // Ensure we're marked as initialized after any auth event
        if (!isInitialized && isMounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      });
    };

    // Initialize everything
    initializeAuth().then(() => {
      setupAuthListener();
    });

    return () => {
      isMounted = false;
      if (authListener?.data?.subscription?.unsubscribe) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - only run once

  const value: AuthContextType = {
    user,
    profile,
    subscription,
    subscriptionStatus,
    session,
    loading: isLoading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    updateProfile,
    refreshSubscription,
    hasActiveSubscription,
    isEmailVerified,
  };

  // Add debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 AuthContext State:', {
      loading: isLoading,
      dataLoading,
      isInitialized,
      user: user?.id,
      profile: profile?.id,
      subscriptionStatus: subscriptionStatus?.status,
      hasActiveSubscription
    });
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionCheckResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  // FIXED: Add initialization tracking to prevent infinite loops
  const [isInitialized, setIsInitialized] = useState(false);

  const hasActiveSubscription =
    subscriptionStatus?.hasActiveSubscription ?? false;
  const isEmailVerified = true; // Skip email verification completely

  // FIXED: Better loading state calculation with initialization check
  const isLoading = loading || (dataLoading && !isInitialized);

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted

    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Error getting session:", error);
          if (isMounted) {
            setLoading(false);
            setIsInitialized(true);
          }
          return;
        }

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            console.log('👤 Initial session found, loading user data...');
            setDataLoading(true);
            await loadUserData(initialSession.user, isMounted);
            if (isMounted) {
              setDataLoading(false);
            }
          } else {
            console.log('👤 No initial session found');
          }

          setLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("💥 Session initialization error:", error);
        if (isMounted) {
          setLoading(false);
          setDataLoading(false);
          setIsInitialized(true);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth event:", event, session?.user?.id);

      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('👤 Auth change with user, loading data...');
          setDataLoading(true);
          await loadUserData(session.user, isMounted);
          if (isMounted) {
            setDataLoading(false);
          }
        } else {
          console.log('👤 Auth change without user, clearing data...');
          setProfile(null);
          setSubscription(null);
          setSubscriptionStatus(null);
        }

        if (!isInitialized) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    });

    return () => {
      isMounted = false; // Prevent state updates after unmount
      if (
        authSubscription &&
        typeof authSubscription.unsubscribe === "function"
      ) {
        authSubscription.unsubscribe();
      }
    };
  }, [isInitialized]); // Only depend on isInitialized

  // FIXED: Improved loadUserData with mount checking and better error handling
  const loadUserData = async (user: User, isMounted: boolean = true) => {
    try {
      console.log("🔄 Loading user data for:", user.id);

      // Load or create user profile
      let userProfile = await userService.getProfile(user.id);

      if (!userProfile && user.email && isMounted) {
        console.log("📝 No profile found, creating one manually...");
        try {
          userProfile = await userService.createProfileSafe(user.id, user.email);
        } catch (profileError) {
          console.error("❌ Profile creation failed:", profileError);
          // Continue without profile - don't block subscription loading
        }
      }

      // Set profile if component is still mounted
      if (isMounted) {
        setProfile(userProfile);
        console.log("👤 Profile set:", userProfile?.id);
      }

      // FIXED: Load subscription with timeout and better error handling
      console.log("💳 Loading subscription status...");
      
      try {
        // Use profile ID for subscription query, fallback to user ID
        const userIdForSubscription = userProfile?.id || user.id;
        console.log("🔍 Using user ID for subscription query:", userIdForSubscription);

        // Set a timeout for subscription loading to prevent infinite loading
        const subscriptionPromise = subscriptionService.checkUserSubscription(userIdForSubscription);
        const timeoutPromise = new Promise<SubscriptionCheckResult>((_, reject) => 
          setTimeout(() => reject(new Error('Subscription loading timeout')), 10000)
        );

        const subStatus = await Promise.race([subscriptionPromise, timeoutPromise]);
        console.log("💳 Subscription status loaded:", subStatus);

        if (isMounted) {
          setSubscriptionStatus(subStatus);
          setSubscription(subStatus.subscription);
        }

        console.log("✅ User data loaded successfully:", {
          authUserId: user.id,
          profileId: userProfile?.id,
          subscription: subStatus,
          hasActiveSubscription: subStatus.hasActiveSubscription,
        });

      } catch (subscriptionError) {
        console.error("❌ Error loading subscription:", subscriptionError);
        
        // FIXED: Set default subscription status with error indication
        const defaultStatus: SubscriptionCheckResult = {
          hasActiveSubscription: false,
          subscription: null,
          status: "inactive" as const,
        };
        
        console.log("🔄 Setting default subscription status due to error");
        
        if (isMounted) {
          setSubscriptionStatus(defaultStatus);
          setSubscription(null);
        }
      }

    } catch (error) {
      console.error("❌ Error loading user data:", error);
      
      // FIXED: Always set default subscription status to prevent infinite loading
      const defaultStatus: SubscriptionCheckResult = {
        hasActiveSubscription: false,
        subscription: null,
        status: "inactive" as const,
      };
      
      console.log("🔄 Setting default subscription status due to general error");
      
      if (isMounted) {
        setSubscriptionStatus(defaultStatus);
        setSubscription(null);
      }
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
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

      if (authError) {
        console.error("❌ Auth signup error:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Signup failed - no user returned");
      }

      console.log("✅ Auth user created:", authData.user.id);

      // Create user profile using safe function
      try {
        const profile = await userService.createProfileSafe(
          authData.user.id,
          email.trim().toLowerCase()
        );
        setProfile(profile);
        console.log("✅ Profile created successfully");
      } catch (profileError) {
        console.error("❌ Profile creation error:", profileError);
        // Don't fail signup if profile creation fails
      }

      console.log("✅ Signup completed successfully");
    } catch (error: any) {
      console.error("❌ Signup error:", error);
      throw new Error(
        error.message || "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const