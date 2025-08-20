// src/contexts/AuthContext.tsx - FIXED: Proper initialization and loading states
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // FIXED: Improved subscription logic
  const hasActiveSubscription = !!(subscription && ['active', 'trialing'].includes(subscription.status));

  // FIXED: Improved user data loading with better error handling
  const loadUserData = async (authUser: User) => {
    try {
      console.log('🔄 Loading user data for:', authUser.email);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile loading error:', profileError);
      } else if (profileData) {
        console.log('✅ Profile loaded');
        setProfile(profileData);
      }

      // Load subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .in('status', ['active', 'trialing', 'cancelled', 'expired'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle to handle no results gracefully

      if (subscriptionError) {
        console.warn('⚠️ Subscription loading error:', subscriptionError);
      } else if (subscriptionData) {
        console.log('✅ Subscription loaded:', subscriptionData.status);
        setSubscription(subscriptionData);
      } else {
        console.log('ℹ️ No subscription found');
        setSubscription(null);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      // Don't throw - just set states to null and continue
      setProfile(null);
      setSubscription(null);
    }
  };

  // FIXED: Better initialization logic
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
        }
        
        if (mounted) {
          if (session?.user) {
            console.log('👤 User found in session');
            setUser(session.user);
            await loadUserData(session.user);
          } else {
            console.log('🚫 No user in session');
          }
          
          // CRITICAL FIX: Always set initialized and loading to false after processing
          setLoading(false);
          setInitialized(true);
          console.log('✅ Auth initialization complete');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    // FIXED: Better auth state change handling
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state change:', event);

        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setProfile(null);
          setSubscription(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔑 User signed in');
          setUser(session.user);
          await loadUserData(session.user);
        }
        
        // CRITICAL FIX: Ensure we're always initialized after auth changes
        if (!initialized) {
          setInitialized(true);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    console.log('🔐 Signing in...');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      throw new Error(error.message);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    console.log('👋 Signing out...');
    await supabase.auth.signOut();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<void> => {
    console.log('📝 Signing up...');
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
      },
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      throw new Error(error.message);
    }
  }, []);

  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!user) return;
    console.log('🔄 Refreshing subscription...');
    await loadUserData(user);
  }, [user]);

  // FIXED: Add logging to understand state changes
  useEffect(() => {
    console.log('📊 Auth state:', {
      user: !!user,
      hasActiveSubscription,
      loading,
      initialized,
      subscriptionStatus: subscription?.status
    });
  }, [user, hasActiveSubscription, loading, initialized, subscription]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      subscription,
      hasActiveSubscription,
      loading,
      initialized,
      signIn,
      signOut,
      signUp,
      refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
};