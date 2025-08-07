// src/contexts/AuthContext.tsx - FIXED VERSION
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
  const [dataLoading, setDataLoading] = useState(false);

  // Computed values with proper memoization
  const hasActiveSubscription = useMemo(
    () => subscriptionStatus?.hasActiveSubscription ?? false,
    [subscriptionStatus?.hasActiveSubscription]
  );
  
  const isEmailVerified = useMemo(() => true, []); // Skip email verification

  const isLoading = useMemo(() => loading || dataLoading, [loading, dataLoading]);

  // CRITICAL FIX: Memoized loadUserData to prevent infinite loops
  const loadUserData = useCallback(async (authUser: User) => {
    try {
      console.log("🔄 Loading user data for:", authUser.id);

      // Load or create user profile
      let userProfile = await userService.getProfile(authUser.id);
      
      if (!userProfile && authUser.email) {
        console.log("📝 No profile found, creating one manually...");
        userProfile = await userService.createProfileSafe(authUser.id, authUser.email);
      }

      // Set profile state
      setProfile(userProfile);
      console.log("👤 Profile loaded:", userProfile?.id);

      // Load subscription status
      console.log("💳 Loading subscription status...");
      const userIdForSubscription = userProfile?.id || authUser.id;
      
      const subStatus = await subscriptionService.checkUserSubscription(userIdForSubscription);
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
  }, []); // Empty dependency array - this function should be stable

  // CRITICAL FIX: Proper useEffect with stable dependencies
  useEffect(() => {
    let mounted = true; // Prevent state updates if component unmounted

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Set initial session and user
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          // Load user data if session exists
          if (initialSession?.user) {
            setDataLoading(true);
            await loadUserData(initialSession.user);
            setDataLoading(false);
          }

          setLoading(false);
        }
        
      } catch (error) {
        console.error("Session initialization error:", error);
        if (mounted) {
          setLoading(false);
          setDataLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes with proper cleanup
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("🔄 Auth state change:", event, newSession?.user?.id);
        
        if (!mounted) return; // Prevent state updates if unmounted

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setDataLoading(true);
          await loadUserData(newSession.user);
          setDataLoading(false);
        } else {
          // Clear data when user signs out
          setProfile(null);
          setSubscription(null);
          setSubscriptionStatus(null);
        }

        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      if (authSubscription && typeof authSubscription.unsubscribe === "function") {
        authSubscription.unsubscribe();
      }
    };
  }, [loadUserData]); // Include memoized loadUserData

  // Memoized auth functions
  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log("Starting signup process");

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

      console.log("Auth user created:", authData.user.id);

      // Create user profile
      try {
        const profile = await userService.createProfileSafe(
          authData.user.id,
          email.trim().toLowerCase()
        );
        setProfile(profile);
        console.log("Profile created successfully");
      } catch (profileError) {
        console.error("Profile creation error:", profileError);
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

      console.log("Sign in successful:", data.user?.id);
    } catch (error: any) {
      console.error("Sign in error:", error);

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

      // Clear all state immediately
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Force redirect to ensure clean state
      window.location.replace("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      
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
      console.error("Password reset error:", error);
      throw new Error(error.message || "Failed to send reset email. Please try again.");
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error("User not authenticated");

    try {
      const updatedProfile = await userService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (error: any) {
      console.error("Profile update error:", error);
      throw new Error(error.message || "Failed to update profile. Please try again.");
    }
  }, [user]);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const subStatus = await subscriptionService.checkUserSubscription(user.id);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);
    } catch (error) {
      console.error("Refresh subscription error:", error);
    }
  }, [user]);

  // Memoized context value
  const value = useMemo((): AuthContextType => ({
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
  }), [
    user,
    profile,
    subscription,
    subscriptionStatus,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    updateProfile,
    refreshSubscription,
    hasActiveSubscription,
    isEmailVerified,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};