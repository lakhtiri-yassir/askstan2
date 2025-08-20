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

  // Load user data function with enhanced debug
  const loadUserData = async (authUser: User) => {
    try {
      addDebug(`🔄 Loading data for: ${authUser.email}`);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        addDebug(`⚠️ Profile error: ${profileError.message}`);
      } else {
        addDebug(`✅ Profile loaded: ${!!profileData}`);
      }

      // Load subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        addDebug(`⚠️ Subscription error: ${subscriptionError.message}`);
      }

      // Check ALL subscriptions for debugging
      const { data: allSubs, error: allSubsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id);
      
      if (allSubsError) {
        addDebug(`❌ All subs error: ${allSubsError.message}`);
      } else {
        addDebug(`🔍 Found ${allSubs?.length || 0} total subs`);
        if (allSubs && allSubs.length > 0) {
          allSubs.forEach((sub, i) => {
            addDebug(`Sub ${i + 1}: ${sub.status} (${sub.plan_type})`);
          });
        }
      }

      // Update states
      setProfile(profileData || null);
      setSubscription(subscriptionData || null);
      
      addDebug(`✅ Final: Profile=${!!profileData}, Sub=${subscriptionData?.status || 'none'}`);

    } catch (error) {
      addDebug(`❌ Critical error: ${error.message}`);
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
      {/* DEBUG PANEL - Shows everything we need */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        zIndex: 9999,
        fontFamily: 'monospace',
        maxWidth: '350px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '8px' }}>
          🔍 AUTH DEBUG
        </div>
        
        <div style={{ marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
          <div style={{ color: '#ffff00' }}>CURRENT STATE:</div>
          <div>User: {user?.email || 'none'}</div>
          <div>Subscription: {subscription?.status || 'none'}</div>
          <div>Active: <span style={{ color: hasActiveSubscription ? '#00ff00' : '#ff0000' }}>
            {hasActiveSubscription.toString()}
          </span></div>
          <div>Loading: <span style={{ color: loading ? '#ffff00' : '#00ff00' }}>
            {loading.toString()}
          </span></div>
        </div>
        
        <div>
          <div style={{ color: '#ffff00', marginBottom: '4px' }}>ACTIVITY LOG:</div>
          {debugLog.map((log, i) => (
            <div key={i} style={{ 
              fontSize: '10px', 
              marginBottom: '2px',
              color: log.includes('❌') ? '#ff0000' : 
                    log.includes('✅') ? '#00ff00' : 
                    log.includes('⚠️') ? '#ffaa00' : '#cccccc'
            }}>
              {log}
            </div>
          ))}
        </div>
      </div>
      {children}
    </AuthContext.Provider>
  );
};