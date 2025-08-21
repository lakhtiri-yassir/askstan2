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

  // FIXED: Use existing session instead of new Supabase calls
  const loadUserData = async (authUser: User) => {
  try {
    addDebug(`🔄 Loading data for: ${authUser.email}`);
    
    // Create basic profile from auth user data first (always works)
    const basicProfile: UserProfile = {
      id: authUser.id,
      email: authUser.email || '',
      display_name: authUser.user_metadata?.full_name || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      email_verified: authUser.email_confirmed_at != null,
      created_at: authUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setProfile(basicProfile);
    addDebug('✅ Basic profile created from auth data');

    // Attempt subscription query with timeout protection
    addDebug('🔍 Attempting subscription query with timeout protection...');
    
    let subscriptionData: Subscription | null = null;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Subscription query timeout after 5 seconds')), 5000);
      });

      // Create subscription query promise
      const subscriptionPromise = supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          stripe_customer_id,
          stripe_subscription_id,
          plan_type,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          created_at,
          updated_at
        `)
        .eq('user_id', authUser.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Race between query and timeout
      const result = await Promise.race([subscriptionPromise, timeoutPromise]);
      
      if (result.error) {
        addDebug(`⚠️ Subscription query error: ${result.error.message}`);
        
        // Check for specific RLS error
        if (result.error.message.includes('row-level security') || 
            result.error.message.includes('permission') ||
            result.error.message.includes('policy')) {
          addDebug('🔒 RLS policy blocking access - subscription set to null');
        }
        
        subscriptionData = null;
      } else {
        addDebug(`✅ Subscription query successful`);
        subscriptionData = result.data;
        
        if (subscriptionData) {
          addDebug(`✅ Active subscription found: ${subscriptionData.status}`);
        } else {
          addDebug('ℹ️ No active subscription found in database');
        }
      }

    } catch (queryError: any) {
      addDebug(`❌ Subscription query failed: ${queryError.message}`);
      
      // Handle specific error types
      if (queryError.message.includes('timeout')) {
        addDebug('⏰ Query timed out - likely RLS or network issue');
      } else if (queryError.message.includes('permission') || 
                 queryError.message.includes('policy') ||
                 queryError.message.includes('row-level security')) {
        addDebug('🔒 Permission denied - RLS policies need fixing');
      } else {
        addDebug(`🔍 Unexpected error type: ${queryError.message}`);
      }
      
      subscriptionData = null;
    }

    // Set the subscription state
    setSubscription(subscriptionData);
    
    // Log final subscription status
    if (subscriptionData) {
      addDebug(`💳 Final subscription status: ${subscriptionData.status}`);
    } else {
      addDebug('💳 Final subscription status: none (null)');
    }
    
    addDebug('🏁 loadUserData complete');
    
  } catch (error: any) {
    addDebug(`❌ Critical error in loadUserData: ${error.message}`);
    
    // Ensure we have at least basic profile data
    if (!profile) {
      const fallbackProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        display_name: null,
        avatar_url: null,
        email_verified: authUser.email_confirmed_at != null,
        created_at: authUser.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(fallbackProfile);
      addDebug('🔄 Fallback profile created');
    }
    
    // Ensure subscription is null on error
    setSubscription(null);
    addDebug('💳 Subscription set to null due to error');
    
  } finally {
    // CRITICAL: Always set loading to false
    addDebug('🎯 Setting loading to false from loadUserData');
    setLoading(false);
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
          addDebug('✅ Setting loading to false (error)');
          setLoading(false);
        }
      }
    };

    // Safety timeout - never let loading stay true forever
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        addDebug('⏰ Safety timeout - forcing loading false');
        setLoading(false);
      }
    }, 10000); // 10 second max

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
      clearTimeout(safetyTimeout);
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
      {/* CRITICAL DEBUG PANEL - ALWAYS VISIBLE */}
      {true && (
        <div style={{
          position: 'fixed',
          top: '0px',
          left: '0px',
          background: 'red',
          color: 'white',
          padding: '15px',
          fontSize: '14px',
          zIndex: 99999,
          fontFamily: 'monospace',
          border: '3px solid yellow',
          maxWidth: '100vw',
          overflow: 'auto'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
            🚨 AUTH DEBUG - ALWAYS VISIBLE 🚨
          </div>
          
          <div style={{ marginBottom: '10px', background: 'black', padding: '10px' }}>
            <div style={{ color: 'yellow', fontWeight: 'bold' }}>CURRENT STATE:</div>
            <div>✉️ User Email: {user?.email || '❌ NO USER'}</div>
            <div>💳 Subscription: {subscription?.status || '❌ NO SUBSCRIPTION'}</div>
            <div>🎯 Has Active Sub: <span style={{ 
              color: hasActiveSubscription ? 'lime' : 'red',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {hasActiveSubscription ? '✅ TRUE' : '❌ FALSE'}
            </span></div>
            <div>⏳ Loading State: <span style={{ 
              color: loading ? 'red' : 'lime',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {loading ? '🔴 LOADING (BAD!)' : '🟢 LOADED (GOOD!)'}
            </span></div>
          </div>
          
          <div style={{ background: 'black', padding: '10px' }}>
            <div style={{ color: 'yellow', fontWeight: 'bold' }}>ACTIVITY LOG (Last 8 messages):</div>
            {debugLog.slice(-20).map((log, i) => (
              <div key={i} style={{ 
                fontSize: '12px', 
                marginBottom: '3px',
                color: log.includes('❌') ? '#ff4444' : 
                      log.includes('✅') ? '#44ff44' : 
                      log.includes('⚠️') ? '#ffaa00' : 
                      log.includes('🔄') ? '#44aaff' : '#ffffff',
                fontWeight: log.includes('Setting loading') ? 'bold' : 'normal'
              }}>
                {log}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '10px', background: 'darkblue', padding: '10px', color: 'white' }}>
            <div style={{ fontWeight: 'bold', color: 'yellow' }}>🎯 WHAT TO LOOK FOR:</div>
            <div>1. Loading should turn GREEN within 10 seconds</div>
            <div>2. You should see "✅ Setting loading to false" in the log</div>
            <div>3. User email should appear (not "NO USER")</div>
            <div>4. If stuck at "Loading data for: [email]" = database query problem</div>
            <div>5. If no "✅ Setting loading to false" = initialization problem</div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};