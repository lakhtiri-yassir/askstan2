// src/contexts/AuthContext.tsx - BULLETPROOF FIX: Non-blocking initialization
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

  // BULLETPROOF: Background data loading that never blocks initialization
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
          if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
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

      // Load subscription with timeout
      const subscriptionPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .in('status', ['active', 'trialing', 'cancelled', 'expired'])
        .order('created_at', { ascending: false })
        .limit(1)
        .abortSignal(controller.signal)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.warn('⚠️ Subscription loading error:', error);
          }
          return data || null;
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

      // Update states only if we got results
      if (profileData) {
        console.log('✅ Profile loaded');
        setProfile(profileData);
      }
      
      if (subscriptionData) {
        console.log('✅ Subscription loaded:', subscriptionData.status);
        setSubscription(subscriptionData);
      } else {
        console.log('ℹ️ No subscription found');
        setSubscription(null);
      }

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name !== 'AbortError') {
        console.error('❌ Error loading user data:', error);
      }
    }
  }, []);

  // BULLETPROOF: Initialization that NEVER hangs
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
            // CRITICAL: Load user data in background, don't wait for it
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
        // BULLETPROOF: ALWAYS set initialized and stop loading
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          console.log('✅ Auth initialization complete');
        }
      }
    };

    // Set a maximum timeout for initialization
    const maxTimeout = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn('⏱️ Auth initialization timed out, proceeding anyway');
        setLoading(false);
        setInitialized(true);
      }
    }, 3000); // 3 second max timeout

    initAuth();

    // Auth state change handler
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state change:', event);

        clearTimeout(maxTimeout);

        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setProfile(null);
          setSubscription(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔑 User signed in');
          setUser(session.user);
          // Load user data in background
          loadUserData(session.user);
        }
        
        // Always ensure we're initialized after auth events
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
    
    // Clear states immediately
    setUser(null);
    setProfile(null);
    setSubscription(null);
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
    
    console.log('✅ Sign out complete');
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
  }, [user, loadUserData]);

  // Debug logging
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