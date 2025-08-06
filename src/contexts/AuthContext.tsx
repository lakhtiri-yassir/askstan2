// src/contexts/AuthContext.tsx - PRODUCTION READY VERSION
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
    let loadingTimeoutId: NodeJS.Timeout;

    const initialize = async () => {
      try {
        console.log('🚀 AuthContext: Starting initialization...');
        
        // Set emergency timeout to prevent infinite loading
        loadingTimeoutId = setTimeout(() => {
          if (mounted) {
            console.error('⏰ AuthContext: Emergency timeout - forcing loading to false');
            setLoading(false);
          }
        }, 15000); // 15 second timeout

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthContext: Error getting session:', error);
          if (mounted) {
            setLoading(false);
            clearTimeout(loadingTimeoutId);
          }
          return;
        }

        console.log('✅ AuthContext: Session retrieved successfully');
        console.log('👤 User found:', !!initialSession?.user, initialSession?.user?.id);

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
        
        if (initialSession?.user && mounted) {
          console.log('📊 AuthContext: Loading user data...');
          await loadUserData(initialSession.user);
        }
        
        if (mounted) {
          console.log('✅ AuthContext: Initialization complete');
          setLoading(false);
          clearTimeout(loadingTimeoutId);
        }
      } catch (error) {
        console.error('💥 AuthContext: Initialization error:', error);
        if (mounted) {
          setLoading(false);
          clearTimeout(loadingTimeoutId);
        }
      }
    };

    initialize();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 AuthContext: Auth state changed:', event, !!newSession?.user);
        
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          console.log('📊 AuthContext: Loading user data after auth change...');
          await loadUserData(newSession.user);
        } else {
          console.log('🧹 AuthContext: Clearing user data');
          setProfile(null);
          setSubscription(null);
          setSubscriptionStatus(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('🧹 AuthContext: Cleanup');
      mounted = false;
      if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const loadUserData = async (user: User) => {
    try {
      console.log('👤 AuthContext: Loading profile for user:', user.id);
      
      // Load or create user profile with proper error handling
      let userProfile: UserProfile | null = null;
      
      try {
        userProfile = await userService.getProfile(user.id);
      } catch (profileError) {
        console.error('⚠️ AuthContext: Error getting profile:', profileError);
      }
      
      if (!userProfile && user.email) {
        console.log('🆕 AuthContext: Creating new profile...');
        try {
          userProfile = await userService.createProfileSafe(user.id, user.email);
        } catch (createError) {
          console.error('⚠️ AuthContext: Error creating profile:', createError);
          // Fallback to basic profile
          userProfile = {
            id: user.id,
            email: user.email,
            display_name: null,
            avatar_url: null,
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      }
      
      if (userProfile) {
        console.log('✅ AuthContext: Profile loaded successfully');
        setProfile(userProfile);
        
        // Load subscription status with timeout and error handling
        console.log('💳 AuthContext: Loading subscription status...');
        
        try {
          const subStatusPromise = subscriptionService.checkUserSubscription(user.id);
          const timeoutPromise = new Promise<SubscriptionCheckResult>((_, reject) => 
            setTimeout(() => reject(new Error('Subscription check timeout')), 8000)
          );
          
          const subStatus = await Promise.race([subStatusPromise, timeoutPromise]);
          
          console.log('✅ AuthContext: Subscription status loaded:', {
            hasActive: subStatus.hasActiveSubscription,
            status: subStatus.status
          });
          
          setSubscriptionStatus(subStatus);
          setSubscription(subStatus.subscription);
        } catch (subscriptionError) {
          console.error('⚠️ AuthContext: Subscription check failed:', subscriptionError);
          // Set default inactive subscription to prevent blocking
          const defaultStatus: SubscriptionCheckResult = {
            hasActiveSubscription: false,
            subscription: null,
            status: 'inactive'
          };
          setSubscriptionStatus(defaultStatus);
          setSubscription(null);
        }
      } else {
        console.error('❌ AuthContext: Failed to load/create profile');
        // Set minimal defaults to prevent blocking
        setProfile({
          id: user.id,
          email: user.email || '',
          display_name: null,
          avatar_url: null,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setSubscriptionStatus({
          hasActiveSubscription: false,
          subscription: null,
          status: 'inactive'
        });
      }
    } catch (error) {
      console.error('💥 AuthContext: Load user data error:', error);
      // Set fallback data to prevent blocking
      setProfile({
        id: user.id,
        email: user.email || '',
        display_name: null,
        avatar_url: null,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
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
      
      console.log('✅ AuthContext: Sign up successful');
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
      
      console.log('✅ AuthContext: Sign in successful');
      // Loading will be set to false in the auth state change handler
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
      console.log('🚪 AuthContext: Starting sign out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ AuthContext: Supabase signOut error:', error);
      } else {
        console.log('✅ AuthContext: Supabase signOut completed');
      }
      
      // Clear all state immediately
      console.log('🧹 AuthContext: Clearing auth state...');
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);
      setLoading(false);
      
      // Force navigation to home
      console.log('🏠 AuthContext: Redirecting to home...');
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('💥 AuthContext: Sign out error:', error);
      
      // Force clear state and redirect even if signOut fails
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSession(null);
      setLoading(false);
      
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
      console.log('👤 AuthContext: Updating profile:', updates);
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
      console.log('🔄 AuthContext: Refreshing subscription...');
      const subStatus = await subscriptionService.checkUserSubscription(user.id);
      setSubscriptionStatus(subStatus);
      setSubscription(subStatus.subscription);
      console.log('✅ AuthContext: Subscription refreshed:', subStatus.hasActiveSubscription ? 'ACTIVE' : 'INACTIVE');
    } catch (error) {
      console.error('⚠️ AuthContext: Refresh subscription error:', error);
    }
  };

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