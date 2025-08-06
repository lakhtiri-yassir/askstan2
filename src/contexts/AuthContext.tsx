// src/contexts/AuthContext.tsx - MINIMAL VERSION FOR DEBUGGING
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, Subscription } from '../types/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // TEMPORARY: For debugging, assume user has subscription if logged in
  const hasActiveSubscription = !!user;
  const isEmailVerified = true;

  useEffect(() => {
    console.log('🚀 AuthContext: Starting initialization...');
    
    let mounted = true;

    const initialize = async () => {
      try {
        // Test Supabase connection first
        console.log('🔍 Testing Supabase connection...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Supabase connection error:', error);
          throw error;
        }

        console.log('✅ Supabase connected successfully');
        console.log('👤 Session data:', !!data.session?.user, data.session?.user?.id);

        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user || null);
          
          if (data.session?.user) {
            console.log('👤 User found, setting up profile...');
            // For debugging, create a minimal profile
            setProfile({
              id: data.session.user.id,
              email: data.session.user.email || '',
              display_name: data.session.user.email?.split('@')[0] || 'User',
              avatar_url: null,
              email_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

            // For debugging, create a fake subscription
            console.log('💳 Creating fake active subscription for debugging...');
            setSubscription({
              id: 'debug-subscription',
              user_id: data.session.user.id,
              stripe_customer_id: 'debug-customer',
              stripe_subscription_id: 'debug-sub',
              plan_type: 'monthly',
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              cancel_at_period_end: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }

        console.log('✅ AuthContext initialization complete');
      } catch (error) {
        console.error('💥 AuthContext initialization error:', error);
      } finally {
        if (mounted) {
          console.log('🏁 Setting loading to false');
          setLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 Auth state changed:', event, !!newSession?.user);
        
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession?.user) {
            console.log('👤 Setting up user data after auth change...');
            setProfile({
              id: newSession.user.id,
              email: newSession.user.email || '',
              display_name: newSession.user.email?.split('@')[0] || 'User',
              avatar_url: null,
              email_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

            setSubscription({
              id: 'debug-subscription',
              user_id: newSession.user.id,
              stripe_customer_id: 'debug-customer',
              stripe_subscription_id: 'debug-sub',
              plan_type: 'monthly',
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              cancel_at_period_end: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          } else {
            setProfile(null);
            setSubscription(null);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 AuthContext cleanup');
      mounted = false;
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Simplified auth functions
  const signUp = async (email: string, password: string): Promise<void> => {
    console.log('📝 Sign up:', email);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('🔐 Sign in:', email);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      // Loading will be set to false in the auth state change handler
    }
  };

  const signOut = async (): Promise<void> => {
    console.log('🚪 Sign out');
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSession(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even on error
      window.location.href = '/';
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    console.log('📧 Forgot password:', email);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    console.log('👤 Update profile:', updates);
    if (!user) throw new Error('Not authenticated');
    
    // For debugging, just update local state
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const refreshSubscription = async (): Promise<void> => {
    console.log('🔄 Refresh subscription (debug mode - no-op)');
    // No-op in debug mode
  };

  console.log('🐛 AuthContext render:', { 
    loading, 
    user: !!user, 
    hasActiveSubscription,
    userEmail: user?.email 
  });

  const value: AuthContextType = {
    user,
    profile,
    subscription,
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