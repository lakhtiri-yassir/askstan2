// src/contexts/AuthContext.tsx - SIMPLIFIED: Clean debug panel
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
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
  const [debugLog, setDebugLog] = useState<string[]>(['🚀 Starting auth...']);

  // Simple subscription check
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

  // Helper function to add debug messages
  const addDebug = (message: string) => {
    setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Optimized user data loading - runs queries in parallel
  const loadUserData = async (authUser: User) => {
    try {
      addDebug(`🔄 Loading data for: ${authUser.email}`);
      
      // Run ALL queries in parallel for faster loading
      const [profileResult, subscriptionResult, allSubsResult] = await Promise.allSettled([
        // Profile query
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single(),
        
        // Active subscription query
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', authUser.id)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        
        // All subscriptions for debug (only in debug mode)
        supabase
          .from('subscriptions')
          .select('id, status, plan_type, created_at')
          .eq('user_id', authUser.id)
          .limit(5)
      ]);

      // Process profile result
      let profileData = null;
      if (profileResult.status === 'fulfilled') {
        const { data, error } = profileResult.value;
        if (error) {
          addDebug(`⚠️ Profile error: ${error.message}`);
        } else {
          profileData = data;
          addDebug(`✅ Profile loaded`);
        }
      } else {
        addDebug(`❌ Profile query failed`);
      }

      // Process subscription result
      let subscriptionData = null;
      if (subscriptionResult.status === 'fulfilled') {
        const { data, error } = subscriptionResult.value;
        if (error) {
          addDebug(`⚠️ Sub error: ${error.message}`);
        } else {
          subscriptionData = data;
          addDebug(`✅ Subscription: ${data?.status || 'none'}`);
        }
      } else {
        addDebug(`❌ Subscription query failed`);
      }

      // Process all subscriptions for debug
      if (allSubsResult.status === 'fulfilled') {
        const { data: allSubs } = allSubsResult.value;
        if (allSubs?.length) {
          addDebug(`🔍 Found ${allSubs.length} total subs`);
        }
      }

      // Update states
      setProfile(profileData);
      setSubscription(subscriptionData);
      
      addDebug(`✅ Loading complete - ${subscriptionData?.status || 'no sub'}`);

    } catch (error) {
      addDebug(`❌ Error: ${error.message}`);
      setProfile(null);
      setSubscription(null);
    }
  };

  // Initialize auth
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        addDebug('🔍 Getting session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          addDebug(`❌ Session error: ${error.message}`);
        }

        if (mounted) {
          if (session?.user) {
            addDebug(`👤 Found user: ${session.user.email}`);
            setUser(session.user);
            await loadUserData(session.user);
            addDebug('🔄 loadUserData completed');
          } else {
            addDebug('🚫 No user in session');
            setUser(null);
            setProfile(null);
            setSubscription(null);
          }
          
          addDebug('✅ Setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        addDebug(`❌ Init error: ${error.message}`);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth state changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        addDebug(`🔄 Auth change: ${event}`);

        switch (event) {
          case 'SIGNED_OUT':
            addDebug('👋 User signed out');
            setUser(null);
            setProfile(null);
            setSubscription(null);
            break;
            
          case 'SIGNED_IN':
            if (session?.user) {
              addDebug(`🔑 User signed in: ${session.user.email}`);
              setUser(session.user);
              await loadUserData(session.user);
            }
            break;
            
          case 'TOKEN_REFRESHED':
            if (session?.user && (!user || user.id !== session.user.id)) {
              addDebug(`🔄 Token refreshed: ${session.user.email}`);
              setUser(session.user);
              await loadUserData(session.user);
            }
            break;
        }
      }
    );

    return () => {
      mounted = false;
      authSub.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      addDebug('👋 Starting sign out...');
      
      setUser(null);
      setProfile(null);
      setSubscription(null);
      
      await supabase.auth.signOut();
      
      addDebug('✅ Signed out, redirecting...');
      window.location.href = '/';
    } catch (error) {
      addDebug(`❌ Sign out error: ${error.message}`);
      window.location.href = '/';
    }
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    if (user) {
      await loadUserData(user);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      subscription,
      hasActiveSubscription,
      loading,
      signIn,
      signOut,
      signUp,
      refreshSubscription,
    }}>
      {/* DEBUG PANEL - Remove this after confirming everything works */}
      {false && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '10px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          <div>User: {user?.email || 'none'}</div>
          <div>Sub: {subscription?.status || 'none'}</div>
          <div>Active: {hasActiveSubscription.toString()}</div>
          <div>Loading: {loading.toString()}</div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};