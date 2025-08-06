// src/contexts/AuthContext.tsx - FIXED VERSION WITH DEBUG LOGGING
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

  const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription ?? false;
  const isEmailVerified = true; // Skip email verification completely

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    const getInitialSession = async () => {
      try {
        console.log('🔄 AuthContext: Getting initial session...');
        
        // Set a maximum loading timeout to prevent infinite loading
        loadingTimeout = setTimeout(() => {
          if (mounted) {
            console.error('⏰ AuthContext: Loading timeout reached, forcing loading to false');
            setLoading(false);
          }
        }, 10000); // 10 second timeout

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthContext: Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }

        console.log('📝 AuthContext: Initial session:', !!initialSession?.user, initialSession?.user?.id);

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
        
        if (initialSession?.user && mounted) {
          console.log('👤 AuthContext: Loading user data for:', initialSession.user.id);
          await loadUserData(initialSession.user);
        } else {
          console.log('🚫 AuthContext: No user session, setting loading to false');
        }
        
        if (mounted) {
          console.log('✅ AuthContext: Initial setup complete, setting loading to false');
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      } catch (error) {
        console.error('💥 AuthContext: Session initialization error:', error);
        if (mounted) {
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthContext: Auth event:', event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 AuthContext: Auth change - loading user data');
          await loadUserData(session.user);
        } else {
          console.log('🚫 AuthContext: Auth change - clearing user data');
          setProfile(null);
          setSubscription(null);
          setSubscriptionStatus(null);
        }
        
        console.log('✅ AuthContext: Auth state change complete, setting loading to false');
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 AuthContext: Cleanup');
      mounted = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const loadUserData = async (user: User) => {
    try {
      console.log('📊 AuthContext: Loading user data for:', user.id);
      
      // Load or create user profile
      let userProfile = await userService.getProfile(user.id);
      
      if (!userProfile && user.email) {
        console.log('🆕 AuthContext: No profile found, creating one...');
        userProfile = await userService.createProfileSafe(user.id, user.email);
      }
      
      console.log('👤 AuthContext: Profile loaded:', !!userProfile);
      if (userProfile) {
        setProfile(userProfile);
        
        // Load subscription status with timeout
        console.log('💳 AuthContext: Loading subscription status...');
        
        try {
          const subStatus = await Promise.race([
            subscriptionService.checkUserSubscription(user.id),
            new Promise<SubscriptionCheckResult>((_, reject) => 
              setTimeout(() => reject(new Error('Subscription check timeout')), 5000)
            )
          ]);
          
          console.log('💰 AuthContext: Subscription status loaded:', {
            hasActive: subStatus.hasActiveSubscription,
            status: subStatus.status,
            subscription: !!subStatus.subscription
          });
          
          setSubscriptionStatus(subStatus);
          setSubscription(subStatus.subscription);
        } catch (subscriptionError) {
          console.error('⚠️ AuthContext: Subscription check failed:', subscriptionError);
          // Set default inactive subscription status to prevent infinite loading
          const defaultStatus: SubscriptionCheckResult = {
            hasActiveSubscription: false,
            subscription: null,
            status: 'inactive'
          };
          setSubscriptionStatus(defaultStatus);
          setSubscription(null);
        }
        
        console.log('✅ AuthContext: User data loading complete');
      } else {
        console.error('❌ AuthContext: Failed to load or create user profile');
      }
    } catch (error) {
      console.error('💥 AuthContext: Load user data error:', error);
      // Set defaults to prevent infinite loading
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus({
        hasActiveSubscription: false,
        subscription: null,
        status: 'inactive'
      });
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      console.log('📝 AuthContext: Starting sign up for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('❌ AuthContext: Sign up error:', error);
        throw error;
      }
      
      console.log('✅ AuthContext: Sign up successful:', data.user?.id);
    } catch (error: any) {
      console.error('💥 AuthContext: Sign up error:', error);
      throw new Error(error.message || 'Failed to create account. Please try again.');
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    
    try {
      console.log('🔐 AuthContext: Starting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ AuthContext: Sign in error:', error);
        throw error;
      }
      
      console.log('✅ AuthContext: Sign in successful:', data.user?.id);
    } catch (error: any) {
      console.error('💥 AuthContext: Sign in error:', error);
      setLoading(false);
      
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else {
        throw new Error(error.message || 'Failed to sign in. Please try again.');
      }
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext: Starting sign out process...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ AuthContext: Supabase signOut error:', error);
      } else {
        console.log('✅ AuthContext: Supabase signOut completed');
      }
      
      // Clear all state immediately regardless of error
      console.log('🧹 AuthContext: Clearing all auth state...');
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);
      setLoading(false);
      
      // Force navigation to home
      console.log('🏠 AuthContext: Redirecting to home page...');
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('💥 AuthContext: Sign out error:', error);
      
      // Force clear state and redirect even if signOut fails
      console.log('🧹 AuthContext: Force clearing state after error...');
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);
      setLoading(false);
      
      console.log('🏠 AuthContext: Force redirecting to home page...');
      window.location.href = '/';
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      console.log('📧 AuthContext: Sending password reset for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        console.error('❌ AuthContext: Password reset error:', error);
        throw error;
      }
      
      console.log('✅ AuthContext: Password reset email sent');
    } catch (error: any) {
      console.error('💥 AuthContext: Password reset error:', error);
      throw new Error(error.message || 'Failed to send reset email. Please try again.');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      console.log('👤 AuthContext: Updating profile for:', user.id, updates);
      const updatedProfile = await userService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
      console.log('✅ AuthContext: Profile updated successfully');
    } catch (error: any) {
      console.error('💥 AuthContext: Profile update error:', error);
      throw new Error(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    if (!user) return;
    
    try {
      console.log('🔄 AuthContext: Refreshing subscription status...');
      const subStatus = await subscriptionService.checkUserSubscription(user.id);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);
      console.log('✅ AuthContext: Subscription refreshed:', subStatus.hasActiveSubscription ? 'ACTIVE' : 'INACTIVE');
    } catch (error) {
      console.error('⚠️ AuthContext: Refresh subscription error:', error);
    }
  };

  // DEBUG: Log current auth state every few seconds in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log('🐛 AuthContext DEBUG State:', {
          loading,
          user: !!user,
          userId: user?.id,
          profile: !!profile,
          hasActiveSubscription,
          subscriptionStatus: subscriptionStatus?.status,
          subscription: !!subscription
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [loading, user, profile, hasActiveSubscription, subscriptionStatus, subscription]);

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
    isEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};