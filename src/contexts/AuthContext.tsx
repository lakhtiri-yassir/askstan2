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
    
    // CRITICAL TEST: Check if Supabase URL is reachable
    addDebug('🌐 Testing Supabase network connectivity...');
    
    try {
      const response = await Promise.race([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 3000)
        )
      ]);
      
      addDebug(`✅ Network test: ${response.status} - Supabase is reachable`);
    } catch (networkError: any) {
      addDebug(`❌ Network test failed: ${networkError.message}`);
      
      // If network fails, skip all Supabase calls
      setSubscription(null);
      addDebug('💳 Subscription set to null (network issue)');
      setLoading(false);
      return;
    }
    addDebug(`🔄 Loading data for: ${authUser.email}`);
    
    // Create profile first
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
    addDebug('✅ Basic profile created');

    // DEBUG: Test basic Supabase connectivity first
    addDebug('🔍 Testing basic Supabase connectivity...');
    
    try {
      // Test 1: Can we connect to Supabase at all?
      const { data: { session } } = await supabase.auth.getSession();
      addDebug(`✅ Session check: ${session ? 'Active session' : 'No session'}`);
      
      // Test 2: Can we make ANY database call?
      addDebug('🔍 Testing simple database connectivity...');
      const { data: testData, error: testError } = await Promise.race([
        supabase.from('subscriptions').select('count', { count: 'exact', head: true }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Test query timeout')), 3000)
        )
      ]) as any;
      
      if (testError) {
        addDebug(`❌ Basic DB test failed: ${testError.message}`);
      } else {
        addDebug(`✅ Basic DB test passed: count query worked`);
      }
      
      // Test 3: Can we query user_profiles table?
      addDebug('🔍 Testing user_profiles table access...');
      const { data: profileData, error: profileError } = await Promise.race([
        supabase.from('user_profiles').select('id').eq('id', authUser.id).limit(1),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Profile query timeout')), 3000)
        )
      ]) as any;
      
      if (profileError) {
        addDebug(`❌ Profile table test failed: ${profileError.message}`);
      } else {
        addDebug(`✅ Profile table test passed`);
      }
      
      // Test 4: Try the actual subscription query with detailed logging
      addDebug('🔍 Testing subscription query with full logging...');
      addDebug(`🎯 User ID: ${authUser.id}`);
      addDebug(`🎯 Query: subscriptions where user_id = ${authUser.id}`);
      
      const startTime = Date.now();
      const { data: subData, error: subError } = await Promise.race([
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', authUser.id),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Subscription query timeout')), 5000)
        )
      ]) as any;
      
      const endTime = Date.now();
      addDebug(`⏱️ Query took ${endTime - startTime}ms`);
      
      if (subError) {
        addDebug(`❌ Subscription query failed: ${subError.message}`);
        addDebug(`❌ Error code: ${subError.code}`);
        addDebug(`❌ Error details: ${JSON.stringify(subError.details || {})}`);
      } else {
        addDebug(`✅ Subscription query succeeded!`);
        addDebug(`📊 Found ${subData?.length || 0} subscription records`);
        
        if (subData && subData.length > 0) {
          subData.forEach((sub, index) => {
            addDebug(`📋 Sub ${index + 1}: ${sub.status} (${sub.plan_type})`);
          });
          
          const activeSub = subData.find(s => s.status === 'active' || s.status === 'trialing');
          if (activeSub) {
            setSubscription(activeSub);
            addDebug(`✅ Set active subscription: ${activeSub.status}`);
          } else {
            addDebug('ℹ️ No active subscriptions found');
            setSubscription(null);
          }
        } else {
          addDebug('ℹ️ No subscription records found');
          setSubscription(null);
        }
      }
      
    } catch (debugError: any) {
      addDebug(`❌ Debug test failed: ${debugError.message}`);
      setSubscription(null);
    }
    
    addDebug('🏁 Debug loadUserData complete');
    
  } catch (error: any) {
    addDebug(`❌ Critical error: ${error.message}`);
    setSubscription(null);
    
  } finally {
    addDebug('🎯 Setting loading to false');
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