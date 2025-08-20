// src/contexts/AuthContext.tsx - FINAL COMPLETE FIX: Sign out & subscription detection
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

  // Subscription logic
  const hasActiveSubscription = !!(subscription && ['active', 'trialing'].includes(subscription.status));

  // Enhanced user data loading with better subscription detection
  const loadUserData = useCallback(async (authUser: User, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log('🔄 Loading user data for:', authUser.email);
      
      // Load profile with timeout
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .abortSignal(controller.signal)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            console.warn('⚠️ Profile loading error:', error);
          }
          return data || null;
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            console.warn('⏱️ Profile loading timed out');
          } else {
            console.warn('❌ Profile loading failed:', error);
          }
          return null;
        });

      // ENHANCED: Better subscription query to match database structure
      const subscriptionPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.warn('⚠️ Subscription loading error:', error);
            return null;
          }
          if (data) {
            console.log('✅ Subscription found:', {
              id: data.id.slice(0, 8),
              status: data.status,
              plan_type: data.plan_type,
              created_at: data.created_at
            });
          } else {
            console.log('ℹ️ No subscription found for user');
          }
          return data;
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            console.warn('⏱️ Subscription loading timed out');
          } else {
            console.warn('❌ Subscription loading failed:', error);
          }
          return null;
        });

      // Execute both queries with timeout
      const [profileData, subscriptionData] = await Promise.all([
        profilePromise,
        subscriptionPromise
      ]);

      clearTimeout(timeoutId);

      // Update states
      setProfile(profileData);
      setSubscription(subscriptionData);

      console.log('📊 User data loaded:', {
        profile: !!profileData,
        subscription: !!subscriptionData,
        subscriptionStatus: subscriptionData?.status,
        hasActiveSubscription: !!(subscriptionData && ['active', 'trialing'].includes(subscriptionData.status))
      });

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name !== 'AbortError') {
        console.error('❌ Error loading user data:', error);
      }
      // Set to null on error
      setProfile(null);
      setSubscription(null);
    }
  }, []);

  // Enhanced initialization
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
            console.log('👤 User found in session:', session.user.email);
            setUser(session.user);
            // Load user data in background
            loadUserData(session.user);
          } else {
            console.log('🚫 No user in session');
            setUser(null);
            setProfile(null);
            setSubscription(null);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        // Always initialize
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          console.log('✅ Auth initialization complete');
        }
      }
    };

    // Maximum timeout protection
    const maxTimeout = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn('⏱️ Auth initialization timed out, proceeding anyway');
        setLoading(false);
        setInitialized(true);
      }
    }, 3000);

    initAuth();

    // Enhanced auth state change handler
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');

        clearTimeout(maxTimeout);

        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out - clearing all state');
          setUser(null);
          setProfile(null);
          setSubscription(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔑 User signed in:', session.user.email);
          setUser(session.user);
          // Load user data in background
          loadUserData(session.user);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed for:', session.user.email);
          // Only reload if different user
          if (!user || user.id !== session.user.id) {
            setUser(session.user);
            loadUserData(session.user);
          }
        }
        
        // Always ensure we're initialized
        setInitialized(true);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(maxTimeout);
      authSubscription.unsubscribe();
    };
  }, [loadUserData]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    console.log('🔐 Signing in:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      throw new Error(error.message);
    }
  }, []);

  // FIXED: Enhanced sign out that properly clears session
  const signOut = useCallback(async (): Promise<void> => {
    console.log('👋 Starting sign out process...');
    
    try {
      // STEP 1: Clear local state immediately for better UX
      setUser(null);
      setProfile(null);
      setSubscription(null);
      
      console.log('✅ Local state cleared');
      
      // STEP 2: Sign out from Supabase (clears session/cookies)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase sign out error:', error);
        // Continue anyway - local state is already cleared
      } else {
        console.log('✅ Supabase session cleared');
      }
      
      // STEP 3: Force reload to clear any cached state
      console.log('🔄 Forcing page reload to clear all cached state...');
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Force reload anyway to clear state
      window.location.reload();
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<void> => {
    console.log('📝 Signing up:', email);
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
    console.log('🔄 Refreshing subscription data...');
    await loadUserData(user);
  }, [user, loadUserData]);

  // Enhanced debug logging
  useEffect(() => {
    console.log('📊 Auth state update:', {
      user: user ? `${user.email} (${user.id.slice(0, 8)})` : null,
      hasActiveSubscription,
      loading,
      initialized,
      subscriptionStatus: subscription?.status,
      subscriptionId: subscription?.id?.slice(0, 8)
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