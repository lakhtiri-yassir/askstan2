// src/contexts/AuthContext.tsx - FIXED VERSION with proper timeout handling and correct imports
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, Subscription } from '../types/supabase';

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

  // FIXED: Optimized user data loading with timeout handling
  const loadUserData = async (authUser: User) => {
    try {
      addDebug(`🔄 Loading data for: ${authUser.email}`);
      
      // Create timeout wrapper for individual queries
      const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, queryName: string): Promise<T> => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`${queryName} query timeout after ${timeoutMs}ms`));
          }, timeoutMs);
          
          promise
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timeout));
        });
      };

      // Run ALL queries in parallel with individual timeouts (3 seconds each)
      const [profileResult, subscriptionResult, allSubsResult] = await Promise.allSettled([
        // Profile query with timeout
        withTimeout(
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authUser.id)
            .single(),
          3000,
          'Profile'
        ),
        
        // Active subscription query with timeout
        withTimeout(
          supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', authUser.id)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          3000,
          'Subscription'
        ),
        
        // All subscriptions for debug with timeout
        withTimeout(
          supabase
            .from('subscriptions')
            .select('id, status, plan_type, created_at')
            .eq('user_id', authUser.id)
            .limit(5),
          3000,
          'AllSubscriptions'
        )
      ]);

      // Process profile result with detailed error handling
      let profileData: UserProfile | null = null;
      if (profileResult.status === 'fulfilled') {
        const { data, error } = profileResult.value;
        if (error) {
          addDebug(`⚠️ Profile error: ${error.message}`);
          // Continue without profile - not critical for auth
        } else {
          profileData = data;
          addDebug(`✅ Profile loaded`);
        }
      } else {
        const errorMessage = profileResult.reason instanceof Error ? profileResult.reason.message : 'Unknown error';
        addDebug(`❌ Profile query failed: ${errorMessage}`);
        // Continue without profile - not critical for auth
      }

      // Process subscription result with detailed error handling
      let subscriptionData: Subscription | null = null;
      if (subscriptionResult.status === 'fulfilled') {
        const { data, error } = subscriptionResult.value;
        if (error) {
          addDebug(`⚠️ Sub error: ${error.message}`);
          // Continue without subscription data
        } else {
          subscriptionData = data;
          addDebug(`✅ Subscription: ${data?.status || 'none'}`);
        }
      } else {
        const errorMessage = subscriptionResult.reason instanceof Error ? subscriptionResult.reason.message : 'Unknown error';
        addDebug(`❌ Subscription query failed: ${errorMessage}`);
        // Continue without subscription - user might not have one
      }

      // Process all subscriptions for debug with error handling
      if (allSubsResult.status === 'fulfilled') {
        const { data: allSubs, error } = allSubsResult.value;
        if (error) {
          addDebug(`⚠️ Debug query error: ${error.message}`);
        } else if (allSubs && allSubs.length > 0) {
          addDebug(`🔍 Found ${allSubs.length} total subs`);
        } else {
          addDebug(`🔍 No subscriptions found`);
        }
      } else {
        const errorMessage = allSubsResult.reason instanceof Error ? allSubsResult.reason.message : 'Unknown error';
        addDebug(`❌ Debug query failed: ${errorMessage}`);
      }

      // Update states - always set states even if queries failed
      setProfile(profileData);
      setSubscription(subscriptionData);
      
      addDebug(`✅ Loading complete - ${subscriptionData?.status || 'no sub'}`);

    } catch (error) {
      // This catch block should now rarely be hit due to Promise.allSettled + timeouts
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addDebug(`❌ Critical error in loadUserData: ${errorMessage}`);
      setProfile(null);
      setSubscription(null);
    } finally {
      // CRITICAL: Always complete the loading process
      addDebug(`🏁 loadUserData finished`);
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addDebug(`❌ Init error: ${errorMessage}`);
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
  }, []); // Empty dependency array to avoid infinite loops

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addDebug(`❌ Sign out error: ${errorMessage}`);
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
            <div>1. Loading should turn GREEN within 3-4 seconds (not 10)</div>
            <div>2. You should see "✅ Loading complete" and "🏁 loadUserData finished"</div>
            <div>3. User email should appear (not "NO USER")</div>
            <div>4. If timeout errors appear = database connection issue</div>
            <div>5. Safety timeout should NOT trigger with this fix</div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};