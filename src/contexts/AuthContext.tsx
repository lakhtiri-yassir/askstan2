// src/contexts/AuthContext.tsx - ROOT PROBLEM FIX
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

  // Proper subscription check
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

  // Helper function to add debug messages
  const addDebug = (message: string) => {
    setDebugLog(prev => [...prev.slice(-15), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Get user from sessionStorage
  const getUserFromSessionStorage = (): User | null => {
    try {
      addDebug('🔍 Checking sessionStorage for user...');
      
      const keys = Object.keys(localStorage);
      const supabaseKey = keys.find(key => 
        key.startsWith('sb-') && key.includes('-auth-token')
      );
      
      if (!supabaseKey) {
        addDebug('❌ No Supabase auth key found');
        return null;
      }
      
      const sessionData = localStorage.getItem(supabaseKey);
      if (!sessionData) {
        addDebug('❌ No session data found');
        return null;
      }
      
      const parsed = JSON.parse(sessionData);
      const user = parsed?.user;
      
      if (user && user.id && user.email) {
        addDebug(`✅ Found user: ${user.email}`);
        return user as User;
      } else {
        addDebug('❌ Invalid user data');
        return null;
      }
    } catch (error: any) {
      addDebug(`❌ SessionStorage error: ${error.message}`);
      return null;
    }
  };

  // ROOT FIX: Create a new Supabase client with better configuration
  const createOptimizedSupabaseClient = () => {
    addDebug('🔧 Creating optimized Supabase client...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Create client with optimized settings for better performance
    const { createClient } = require('@supabase/supabase-js');
    
    const optimizedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false, // Disable auto refresh to avoid conflicts
        persistSession: false,   // Don't persist, we handle this manually
        detectSessionInUrl: false // Don't detect session in URL
      },
      global: {
        headers: {
          'x-client-info': 'optimized-client',
          'Prefer': 'return=minimal' // Request minimal response for better performance
        }
      },
      db: {
        schema: 'public' // Explicitly set schema
      }
    });
    
    addDebug('✅ Optimized client created');
    return optimizedClient;
  };

  // ROOT FIX: Improved subscription loading with proper client
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

      // ROOT FIX: Use optimized client and proper query structure
      addDebug('🔍 Loading subscription with optimized approach...');
      
      try {
        // Create optimized client for this specific query
        const optimizedSupabase = createOptimizedSupabaseClient();
        
        addDebug(`🎯 Querying subscriptions for user: ${authUser.id}`);
        
        // ROOT FIX: Use more specific and optimized query
        const subscriptionQuery = optimizedSupabase
          .from('subscriptions')
          .select('id, user_id, plan_type, status, created_at, updated_at, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, cancel_at_period_end')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        // ROOT FIX: Use AbortController for proper timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const { data: subscriptions, error } = await subscriptionQuery.abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        
        if (error) {
          if (error.name === 'AbortError') {
            addDebug('❌ Query aborted due to timeout');
          } else {
            addDebug(`❌ Query error: ${error.message}`);
            addDebug(`❌ Error code: ${error.code}`);
          }
          setSubscription(null);
        } else {
          addDebug(`✅ Query successful!`);
          addDebug(`📊 Found ${subscriptions?.length || 0} subscription records`);
          
          if (subscriptions && subscriptions.length > 0) {
            const subscription = subscriptions[0]; // Get the most recent one
            addDebug(`📋 Subscription: ${subscription.status} - ${subscription.plan_type}`);
            
            // Set subscription regardless of status - let the app decide what to do with it
            setSubscription(subscription);
            addDebug(`✅ Subscription set: ${subscription.status}`);
          } else {
            setSubscription(null);
            addDebug('ℹ️ No subscription records found');
          }
        }
        
      } catch (queryError: any) {
        addDebug(`❌ Query exception: ${queryError.message}`);
        
        if (queryError.name === 'AbortError') {
          addDebug('⏰ Query was aborted due to timeout');
        } else {
          addDebug(`🔍 Error details: ${queryError.stack || 'No stack trace'}`);
        }
        
        setSubscription(null);
      }
      
      addDebug('🏁 loadUserData complete');
      
    } catch (error: any) {
      addDebug(`❌ Error in loadUserData: ${error.message}`);
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
        addDebug('🚀 Initializing auth...');
        
        // Try sessionStorage first
        const sessionUser = getUserFromSessionStorage();
        
        if (sessionUser && mounted) {
          addDebug(`👤 User found: ${sessionUser.email}`);
          setUser(sessionUser);
          await loadUserData(sessionUser);
          return;
        }
        
        // Fallback to Supabase auth
        addDebug('🔍 Trying Supabase auth...');
        
        try {
          const { data: { user }, error } = await Promise.race([
            supabase.auth.getUser(),
            new Promise<any>((_, reject) => 
              setTimeout(() => reject(new Error('Auth timeout')), 5000)
            )
          ]);
          
          if (user && mounted) {
            addDebug(`👤 Supabase user: ${user.email}`);
            setUser(user);
            await loadUserData(user);
          } else if (mounted) {
            addDebug('🚫 No user found');
            setUser(null);
            setProfile(null);
            setSubscription(null);
            setLoading(false);
          }
        } catch (authError: any) {
          addDebug(`❌ Auth failed: ${authError.message}`);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setSubscription(null);
            setLoading(false);
          }
        }
        
      } catch (error: any) {
        addDebug(`❌ Init error: ${error.message}`);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        addDebug('⏰ Safety timeout');
        setLoading(false);
      }
    }, 15000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Auth state listener
  useEffect(() => {
    if (loading) return;
    
    addDebug('🔗 Setting up auth listener...');
    
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
              setLoading(true);
              await loadUserData(session.user);
            }
            break;
        }
      }
    );

    return () => authSub.unsubscribe();
  }, [loading]);

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
      addDebug('👋 Signing out...');
      setUser(null);
      setProfile(null);
      setSubscription(null);
      await supabase.auth.signOut();
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
      setLoading(true);
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
      {/* DEBUG PANEL */}
      {true && (
        <div style={{
          position: 'fixed',
          top: '0px',
          left: '0px',
          background: 'darkblue',
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
            🔧 ROOT PROBLEM FIX - OPTIMIZED QUERIES 🔧
          </div>
          
          <div style={{ marginBottom: '10px', background: 'black', padding: '10px' }}>
            <div style={{ color: 'yellow', fontWeight: 'bold' }}>CURRENT STATE:</div>
            <div>✉️ User: {user?.email || '❌ NO USER'}</div>
            <div>💳 Subscription: {subscription?.status || '❌ NO SUBSCRIPTION'}</div>
            <div>🎯 Has Active Sub: <span style={{ 
              color: hasActiveSubscription ? 'lime' : 'red',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {hasActiveSubscription ? '✅ TRUE' : '❌ FALSE'}
            </span></div>
            <div>⏳ Loading: <span style={{ 
              color: loading ? 'red' : 'lime',
              fontWeight: 'bold'
            }}>
              {loading ? '🔴 LOADING' : '🟢 READY'}
            </span></div>
          </div>
          
          <div style={{ background: 'black', padding: '10px' }}>
            <div style={{ color: 'yellow', fontWeight: 'bold' }}>ACTIVITY LOG:</div>
            {debugLog.slice(-12).map((log, i) => (
              <div key={i} style={{ 
                fontSize: '12px', 
                marginBottom: '2px',
                color: log.includes('❌') ? '#ff4444' : 
                      log.includes('✅') ? '#44ff44' : 
                      log.includes('🔧') ? '#ffaa00' : '#ffffff'
              }}>
                {log}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '10px', background: 'darkgreen', padding: '10px' }}>
            <div style={{ color: 'lime', fontWeight: 'bold' }}>ROOT FIXES APPLIED:</div>
            <div>🔧 Optimized Supabase client configuration</div>
            <div>🔧 Proper AbortController timeout handling</div>
            <div>🔧 Specific query with minimal response</div>
            <div>🔧 Better error handling and diagnostics</div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};