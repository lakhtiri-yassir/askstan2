// src/contexts/AuthContext.tsx - COMPLETE PROPERLY FIXED VERSION
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

  // PROPER FIX: loadUserData function that actually loads subscription data
  const loadUserData = async (authUser: User) => {
    try {
      addDebug(`🔄 Loading data for: ${authUser.email}`);
      
      // Create profile immediately
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
      addDebug('✅ Profile created');

      // CRITICAL FIX: Try subscription query with better error handling
      addDebug('🔍 Loading subscription data...');
      
      try {
        // Use a more direct query approach
        addDebug(`🎯 Querying subscriptions for user: ${authUser.id}`);
        
        const { data: subscriptions, error: subError } = await Promise.race([
          supabase
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
            .eq('user_id', authUser.id),
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Subscription query timeout after 8 seconds')), 8000)
          )
        ]);
        
        if (subError) {
          addDebug(`❌ Subscription query error: ${subError.message}`);
          addDebug(`❌ Error code: ${subError.code || 'unknown'}`);
          addDebug(`❌ Error details: ${JSON.stringify(subError.details || {})}`);
          setSubscription(null);
        } else {
          addDebug(`✅ Subscription query successful`);
          addDebug(`📊 Found ${subscriptions?.length || 0} subscription records`);
          
          if (subscriptions && subscriptions.length > 0) {
            // Log all subscriptions found
            subscriptions.forEach((sub, index) => {
              addDebug(`📋 Sub ${index + 1}: ${sub.status} - ${sub.plan_type}`);
            });
            
            // Find active or trialing subscription
            const activeSub = subscriptions.find(sub => 
              sub.status === 'active' || sub.status === 'trialing'
            );
            
            if (activeSub) {
              setSubscription(activeSub);
              addDebug(`✅ Active subscription set: ${activeSub.status}`);
            } else {
              setSubscription(null);
              addDebug('ℹ️ No active subscription found in results');
            }
          } else {
            setSubscription(null);
            addDebug('ℹ️ No subscription records found for user');
          }
        }
        
      } catch (queryError: any) {
        addDebug(`❌ Subscription query exception: ${queryError.message}`);
        setSubscription(null);
      }
      
      addDebug('🏁 loadUserData complete');
      
    } catch (error: any) {
      addDebug(`❌ Error in loadUserData: ${error.message}`);
      setSubscription(null);
    } finally {
      // Always set loading to false when done
      addDebug('🎯 Setting loading to false (loadUserData complete)');
      setLoading(false);
    }
  };

  // Initialize auth
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        addDebug('🔍 Initializing auth...');
        
        // CRITICAL FIX: Skip getSession() entirely and use getUser() instead
        addDebug('🚀 Bypassing getSession, using getUser directly...');
        
        try {
          // Use getUser() instead of getSession() - it's more reliable
          const { data: { user }, error } = await Promise.race([
            supabase.auth.getUser(),
            new Promise<any>((_, reject) => 
              setTimeout(() => reject(new Error('getUser timeout')), 5000)
            )
          ]);
          
          if (error) {
            addDebug(`❌ getUser error: ${error.message}`);
            throw error;
          }

          if (mounted) {
            if (user) {
              addDebug(`👤 Found user via getUser: ${user.email}`);
              setUser(user);
              
              // NOW call loadUserData with the user we found
              await loadUserData(user);
              addDebug('🔄 loadUserData completed via getUser');
            } else {
              addDebug('🚫 No user found via getUser');
              setUser(null);
              setProfile(null);
              setSubscription(null);
              addDebug('🎯 Setting loading to false (no user)');
              setLoading(false);
            }
          }
        } catch (userError: any) {
          addDebug(`❌ getUser failed: ${userError.message}`);
          
          // FALLBACK: Try to check if user is signed in via auth state
          addDebug('🔄 Fallback: checking auth state listener...');
          
          if (mounted) {
            setUser(null);
            setProfile(null);
            setSubscription(null);
            addDebug('🎯 Setting loading to false (auth check failed)');
            setLoading(false);
          }
        }
      } catch (error: any) {
        addDebug(`❌ Init error: ${error.message}`);
        if (mounted) {
          addDebug('🎯 Setting loading to false (init error)');
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
    }, 15000); // 15 second max

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
            setLoading(false);
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
    } catch (error: any) {
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
      {/* DEBUG PANEL - ALWAYS VISIBLE */}
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
            {debugLog.slice(-8).map((log, i) => (
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
            <div>1. Should see "👤 Found user via getUser"</div>
            <div>2. Should see "🔍 Loading subscription data..."</div>
            <div>3. Should see subscription query results</div>
            <div>4. Should see "🎯 Setting loading to false (loadUserData complete)"</div>
            <div>5. Loading should turn GREEN only after trying to load subscription</div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};