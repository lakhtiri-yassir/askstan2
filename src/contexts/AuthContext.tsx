// src/contexts/AuthContext.tsx - FIXED: Proper initialization order
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

  // Simple subscription check
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

  // Load user data function with better error handling
  const loadUserData = async (authUser: User) => {
    try {
      console.log('🔄 Loading data for:', authUser.email);
      
      // Load profile with error handling
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile error:', profileError);
      }

      // Load subscription with better query
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .in('status', ['active', 'trialing', 'past_due']) // Include all potentially active statuses
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        console.warn('⚠️ Subscription error:', subscriptionError);
      }

      // Update states
      setProfile(profileData || null);
      setSubscription(subscriptionData || null);
      
      console.log('✅ Data loaded:', {
        userId: authUser.id.slice(0, 8),
        profile: !!profileData,
        subscription: !!subscriptionData,
        subscriptionStatus: subscriptionData?.status || 'none',
        subscriptionId: subscriptionData?.id?.slice(0, 8) || 'none'
      });

      // Also try loading ANY subscription for this user for debugging
      const { data: allSubs, error: allSubsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id);
      
      console.log('🔍 All subscriptions for user:', allSubs?.length || 0, allSubs);

    } catch (error) {
      console.error('❌ Critical error loading user data:', error);
      setProfile(null);
      setSubscription(null);
    }
  };

  // Initialize auth - FIXED ORDER
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        }

        if (mounted) {
          if (session?.user) {
            console.log('👤 Found user in session:', session.user.email);
            setUser(session.user);
            // Load user data and wait for completion
            await loadUserData(session.user);
          } else {
            console.log('🚫 No user in session');
            setUser(null);
            setProfile(null);
            setSubscription(null);
          }
          
          // CRITICAL: Always set loading to false after data loading completes
          console.log('✅ Setting loading to false');
          setLoading(false);
        }
              } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          console.log('✅ Setting loading to false due to error');
          setLoading(false); // Set loading false even on error
        }
      }
    };

    // Start initialization
    initialize();

    // Listen for auth state changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);

        switch (event) {
          case 'SIGNED_OUT':
            setUser(null);
            setProfile(null);
            setSubscription(null);
            break;
            
          case 'SIGNED_IN':
            if (session?.user) {
              setUser(session.user);
              await loadUserData(session.user);
            }
            break;
            
          case 'TOKEN_REFRESHED':
            if (session?.user && (!user || user.id !== session.user.id)) {
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
  }, []); // Empty dependency array - only run once

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
      console.log('Signing out...');
      
      // Clear state immediately
      setUser(null);
      setProfile(null);
      setSubscription(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
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

  // Debug current state - visible in UI
  const debugInfo = {
    user: !!user,
    userEmail: user?.email || 'none',
    hasSubscription: !!subscription,
    subscriptionStatus: subscription?.status || 'none',
    hasActiveSubscription,
    loading
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
      {/* Debug panel - remove after fixing */}
      {true && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          <div>🔍 AUTH DEBUG</div>
          <div>User: {debugInfo.userEmail}</div>
          <div>Subscription: {debugInfo.subscriptionStatus}</div>
          <div>Active: {debugInfo.hasActiveSubscription.toString()}</div>
          <div>Loading: {debugInfo.loading.toString()}</div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};