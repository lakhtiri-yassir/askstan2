// src/contexts/AuthContext.tsx - FIXED VERSION
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, userService } from '../lib/supabase';
import { subscriptionService, SubscriptionCheckResult } from '../lib/subscriptionService';
import { UserProfile, Subscription } from '../types/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  subscriptionStatus: SubscriptionCheckResult | null;
  session: Session | null;
  loading: boolean;
  isAuthenticating: boolean; // NEW: Track authentication in progress
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
    throw new Error('useAuth must be used within an AuthProvider');
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionCheckResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // NEW: Track auth operations
  const [subscriptionLoading, setSubscriptionLoading] = useState(false); // NEW: Track subscription loading

  const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription ?? false;
  const isEmailVerified = true; // Skip email verification completely

  // Combined loading state that includes subscription loading
  const isOverallLoading = loading || subscriptionLoading;

  useEffect(() => {
    let mounted = true; // Prevent state updates if component unmounted

    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
        
        if (initialSession?.user && mounted) {
          await loadUserData(initialSession.user);
        }
        
        if (mounted) setLoading(false);
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.id);
        
        if (!mounted) return; // Don't update if component unmounted
        
        // Only update state if not currently authenticating
        // This prevents premature state updates during sign-in process
        if (!isAuthenticating || event === 'SIGNED_OUT') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserData(session.user);
          } else {
            setProfile(null);
            setSubscription(null);
            setSubscriptionStatus(null);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
        authSubscription.unsubscribe();
      }
    };
  }, [isAuthenticating]); // Add isAuthenticating as dependency

  const loadUserData = async (user: User) => {
    try {
      console.log('Loading user data for:', user.id);
      setSubscriptionLoading(true); // NEW: Set subscription loading
      
      // Load or create user profile
      let userProfile = await userService.getProfile(user.id);
      
      if (!userProfile && user.email) {
        console.log('No profile found, creating one manually...');
        userProfile = await userService.createProfileSafe(user.id, user.email);
      }
      
      if (userProfile) {
        setProfile(userProfile);
        
        // Load subscription status
        console.log('Loading subscription status...');
        const subStatus = await subscriptionService.checkUserSubscription(user.id);
        setSubscriptionStatus(subStatus);
        setSubscription(subStatus.subscription);
        
        console.log('User data loaded:', { profile: userProfile, subscription: subStatus });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't throw - allow user to continue with limited functionality
    } finally {
      setSubscriptionLoading(false); // NEW: Clear subscription loading
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    setIsAuthenticating(true); // NEW: Set authenticating flag
    setLoading(true);
    try {
      console.log('Starting signup process without email confirmation');
      
      // Create auth user without email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            email_verified: true
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Signup failed - no user returned');
      }

      console.log('Auth user created:', authData.user.id);

      // Create user profile using safe function
      try {
        const profile = await userService.createProfileSafe(authData.user.id, email.trim().toLowerCase());
        setProfile(profile);
        console.log('Profile created successfully');
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail signup if profile creation fails
      }

      console.log('Signup completed successfully');
      
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsAuthenticating(false); // NEW: Clear authenticating flag
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsAuthenticating(true); // NEW: Prevent premature state updates
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) throw error;
      
      // Wait for authentication state change to complete
      if (data.session) {
        console.log('Sign in successful, waiting for state update...');
        // Allow onAuthStateChange to handle the state update
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for state consistency
      }
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else {
        throw new Error(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsAuthenticating(false); // NEW: Allow normal state updates
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 Starting sign out process...');
      
      // Set loading state but don't clear user data yet
      setLoading(true);
      
      console.log('🧹 Calling Supabase signOut...');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('✅ Supabase signOut successful');
      
      // Clear all state after successful signOut
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);
      setLoading(false);
      
      // Force navigation to home without reload
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      // Force clear state even if Supabase signOut fails
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);
      setLoading(false);
      
      // Force redirect
      window.location.href = '/';
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        throw error;
      }
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send reset email. Please try again.');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const updatedProfile = await userService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    if (!user) return;
    
    setSubscriptionLoading(true); // NEW: Set loading during refresh
    try {
      console.log('Refreshing subscription status...');
      const subStatus = await subscriptionService.checkUserSubscription(user.id);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);
      console.log('Subscription refreshed:', subStatus);
    } catch (error) {
      console.error('Refresh subscription error:', error);
    } finally {
      setSubscriptionLoading(false); // NEW: Clear loading
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    subscription,
    subscriptionStatus,
    session,
    loading: isOverallLoading, // NEW: Use combined loading state
    isAuthenticating, // NEW: Expose authenticating state
    signUp,
    signIn,
    signOut,
    forgotPassword,
    updateProfile,
    refreshSubscription,
    hasActiveSubscription,
    isEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};