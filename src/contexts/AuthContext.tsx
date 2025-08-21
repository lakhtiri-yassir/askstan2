// src/contexts/AuthContext.tsx - Complete version with debug logging
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled';
  plan_type: 'monthly' | 'yearly';
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
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
  debugLogs: string[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  debugSubscriptionStatus: () => Promise<void>;
  addDebugLog: (message: string, data?: any) => void;
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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Add debug log function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    if (data) {
      console.log(logEntry, data);
    } else {
      console.log(logEntry);
    }
    setDebugLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
  };

  // Proper subscription check - matches the rest of the app
  const hasActiveSubscription = Boolean(
    subscription && (subscription.status === 'active' || subscription.status === 'trialing')
  );

  // Get user from localStorage (most reliable method)
  const getUserFromStorage = (): User | null => {
    try {
      const keys = Object.keys(localStorage);
      const supabaseKey = keys.find(key => 
        key.startsWith('sb-') && key.includes('-auth-token')
      );
      
      if (!supabaseKey) return null;
      
      const sessionData = localStorage.getItem(supabaseKey);
      if (!sessionData) return null;
      
      const parsed = JSON.parse(sessionData);
      const user = parsed?.user;
      
      if (user && user.id && user.email) {
        return user as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error reading user from storage:', error);
      return null;
    }
  };

  // Load user profile and subscription data
  const loadUserData = async (authUser: User): Promise<void> => {
    try {
      addDebugLog(`🔄 Loading data for: ${authUser.email}`);
      
      // Create basic profile from auth user data
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
      
      // CRITICAL FIX: Subscription loading with aggressive timeout and detailed error logging
      addDebugLog(`🔍 Starting subscription query for user: ${authUser.id}`);
      
      try {
        // Method 1: Standard query with detailed error tracking
        addDebugLog('🔍 Executing Supabase query...');
        
        const subscriptionPromise = supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Subscription query timeout after 3 seconds')), 3000)
        );

        const result = await Promise.race([
          subscriptionPromise,
          timeoutPromise
        ]);

        const { data: subscriptions, error } = result;
        
        addDebugLog('📊 Subscription query completed', { 
          subscriptionCount: subscriptions?.length || 0,
          hasError: !!error,
          errorMessage: error?.message || null,
          errorCode: error?.code || null,
          errorDetails: error?.details || null
        });
        
        if (error) {
          addDebugLog('❌ Subscription query error details', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            name: error.name
          });
          setSubscription(null);
        } else if (subscriptions && subscriptions.length > 0) {
          addDebugLog(`📋 Found ${subscriptions.length} subscription(s)`);
          
          // Log all found subscriptions
          subscriptions.forEach((sub, index) => {
            addDebugLog(`📄 Subscription ${index + 1}`, {
              id: sub.id,
              status: sub.status,
              plan_type: sub.plan_type,
              user_id: sub.user_id,
              created_at: sub.created_at
            });
          });
          
          // Find active or trialing subscription first
          let activeSubscription = subscriptions.find(sub => 
            sub.status === 'active' || sub.status === 'trialing'
          );
          
          // If no active/trialing found, use the most recent one
          if (!activeSubscription && subscriptions.length > 0) {
            activeSubscription = subscriptions[0];
            addDebugLog('⚠️ No active/trialing subscription found, using most recent', {
              status: activeSubscription.status,
              plan_type: activeSubscription.plan_type
            });
          }
          
          if (activeSubscription) {
            addDebugLog(`✅ Selected subscription`, {
              id: activeSubscription.id,
              status: activeSubscription.status,
              plan_type: activeSubscription.plan_type,
              user_id: activeSubscription.user_id
            });
            
            setSubscription(activeSubscription);
            
            // CRITICAL DEBUG: Log the exact hasActiveSubscription calculation
            const isActive = activeSubscription.status === 'active' || activeSubscription.status === 'trialing';
            addDebugLog(`🎯 Subscription active calculation`, {
              status: activeSubscription.status,
              isActiveStatus: activeSubscription.status === 'active',
              isTrialingStatus: activeSubscription.status === 'trialing',
              finalResult: isActive
            });
          } else {
            addDebugLog('❌ No valid subscription found after filtering');
            setSubscription(null);
          }
        } else {
          addDebugLog('ℹ️ No subscriptions returned from query (empty result)');
          setSubscription(null);
          
          // FALLBACK: Try direct count query to see if subscriptions exist at all
          try {
            addDebugLog('🔍 Running fallback count query...');
            const countResult = await Promise.race([
              supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', authUser.id),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Count query timeout')), 2000)
              )
            ]);
            
            const { count, error: countError } = countResult;
            addDebugLog('🔍 Count query result', { 
              count, 
              error: countError?.message || null 
            });
          } catch (countError) {
            addDebugLog('🔍 Count query failed', {
              message: countError.message,
              name: countError.name
            });
          }
        }
        
      } catch (subError) {
        addDebugLog('❌ Subscription loading failed with error', {
          message: subError.message,
          name: subError.name,
          stack: subError.stack,
          isTimeout: subError.message.includes('timeout')
        });
        setSubscription(null);
      }
      
      addDebugLog('✅ User data loading complete');
      
    } catch (error) {
      addDebugLog('Error loading user data', error);
      setSubscription(null);
    }
  };

  // Initialize authentication
  useEffect(() => {
    let mounted = true;
    let initializationTimeout: NodeJS.Timeout;

    const initialize = async () => {
      try {
        addDebugLog('🚀 Initializing authentication...');
        setLoading(true);
        
        // CRITICAL FIX: Add overall timeout to ensure initialization always completes
        initializationTimeout = setTimeout(() => {
          if (mounted) {
            addDebugLog('⏰ Initialization timeout - forcing completion');
            setLoading(false);
            setInitialized(true);
          }
        }, 10000); // 10 second max timeout
        
        // Try to get user from storage first (fastest)
        let currentUser = getUserFromStorage();
        
        if (!currentUser) {
          // Fallback to Supabase auth
          addDebugLog('🔍 No user in storage, checking Supabase auth...');
          try {
            const { data: { user }, error } = await Promise.race([
              supabase.auth.getUser(),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Auth timeout')), 5000)
              )
            ]);
            
            if (user && !error) {
              currentUser = user;
              addDebugLog(`✅ Found user via Supabase: ${user.email}`);
            } else {
              addDebugLog('ℹ️ No authenticated user found');
            }
          } catch (authError) {
            addDebugLog('Auth check failed', authError);
          }
        } else {
          addDebugLog(`✅ Found user in storage: ${currentUser.email}`);
        }
        
        if (mounted) {
          if (currentUser) {
            setUser(currentUser);
            // CRITICAL FIX: Load user data with timeout protection
            addDebugLog('📊 Loading user data and subscription status...');
            try {
              await Promise.race([
                loadUserData(currentUser),
                new Promise<void>((_, reject) => 
                  setTimeout(() => reject(new Error('User data loading timeout')), 8000)
                )
              ]);
            } catch (loadError) {
              addDebugLog('⚠️ User data loading timed out or failed', loadError);
              // Continue anyway - user is still authenticated
            }
          }
          
          // CRITICAL FIX: Always complete initialization
          clearTimeout(initializationTimeout);
          setLoading(false);
          setInitialized(true);
          addDebugLog('🎯 Auth initialization complete');
        }
        
      } catch (error) {
        addDebugLog('Auth initialization error', error);
        if (mounted) {
          clearTimeout(initializationTimeout);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, []); // Only run once on mount

  // FIXED: Listen for auth state changes without triggering redirects
  useEffect(() => {
    if (!initialized) return;

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        addDebugLog(`🔔 Auth event: ${event}`);
        
        switch (event) {
          case 'SIGNED_OUT':
            addDebugLog('👋 User signed out');
            setUser(null);
            setProfile(null);
            setSubscription(null);
            // Note: Redirect is handled by individual components, not here
            break;
            
          case 'SIGNED_IN':
            if (session?.user) {
              addDebugLog(`🔑 User signed in: ${session.user.email}`);
              setUser(session.user);
              setLoading(true);
              await loadUserData(session.user);
              setLoading(false);
            }
            break;
            
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              addDebugLog(`🔄 Token refreshed: ${session.user.email}`);
              // Update user if it changed
              if (!user || user.id !== session.user.id) {
                setUser(session.user);
                await loadUserData(session.user);
              }
            }
            break;
        }
      }
    );

    return () => authSub.unsubscribe();
  }, [initialized, user]);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
    
    // Redirect will be handled by the calling component
  };

  // FIXED: Improved sign out function
  const signOut = async (): Promise<void> => {
    try {
      addDebugLog('👋 Signing out...');
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setSubscription(null);
      
      // Sign out from Supabase - this should clear all session data
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Supabase sign out error:', error);
      }
      
      // Force clear any remaining session data
      try {
        const keys = Object.keys(localStorage);
        const supabaseKeys = keys.filter(key => 
          key.startsWith('sb-') && key.includes('-auth-token')
        );
        supabaseKeys.forEach(key => localStorage.removeItem(key));
      } catch (storageError) {
        console.warn('Local storage clear error:', storageError);
      }
      
      addDebugLog('✅ Sign out complete');
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if sign out fails
      setUser(null);
      setProfile(null);
      setSubscription(null);
    }
  };

  // Sign up function
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
    
    // Redirect will be handled by the calling component
  };

  // Refresh subscription data
  const refreshSubscription = async (): Promise<void> => {
    if (user) {
      addDebugLog('🔄 Manual subscription refresh requested');
      setLoading(true);
      await loadUserData(user);
      setLoading(false);
    }
  };

  // DEBUGGING: Manual subscription check function
  const debugSubscriptionStatus = async (): Promise<void> => {
    if (!user) {
      addDebugLog('❌ No user for subscription debug');
      return;
    }

    addDebugLog('🐛 DEBUGGING: Manual subscription status check');
    
    try {
      addDebugLog(`🐛 Querying subscriptions table for user_id: ${user.id}`);
      
      // Raw query to see exactly what's in the database
      const startTime = Date.now();
      const { data: allSubs, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);
      
      const queryTime = Date.now() - startTime;
      
      addDebugLog(`🐛 Query completed in ${queryTime}ms`);
      addDebugLog('🐛 All subscriptions for user', allSubs);
      
      if (error) {
        addDebugLog('🐛 Query error details', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }
      
      if (allSubs && allSubs.length > 0) {
        allSubs.forEach((sub, index) => {
          addDebugLog(`🐛 Subscription ${index + 1}`, {
            id: sub.id,
            status: sub.status,
            plan_type: sub.plan_type,
            created_at: sub.created_at,
            user_id: sub.user_id,
            isActive: sub.status === 'active',
            isTrialing: sub.status === 'trialing',
            wouldBeActive: sub.status === 'active' || sub.status === 'trialing'
          });
        });
      } else {
        addDebugLog('🐛 No subscriptions found in database');
        
        // Try to check if the table exists and if we have access
        addDebugLog('🐛 Testing table access...');
        try {
          const { count, error: countError } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true });
          
          addDebugLog('🐛 Table access test', { 
            totalCount: count, 
            error: countError?.message || null 
          });
        } catch (accessError) {
          addDebugLog('🐛 Table access failed', accessError);
        }
      }
      
      // Check current context state
      addDebugLog('🐛 Current context state', {
        hasSubscription: !!subscription,
        subscriptionStatus: subscription?.status,
        hasActiveSubscription: hasActiveSubscription,
        calculatedActive: subscription && (subscription.status === 'active' || subscription.status === 'trialing')
      });
      
    } catch (debugError) {
      addDebugLog('🐛 Debug subscription check failed', {
        message: debugError.message,
        name: debugError.name,
        stack: debugError.stack
      });
    }
  };

  // Add debugSubscriptionStatus to context for manual testing
  const contextValue = {
    user,
    profile,
    subscription,
    hasActiveSubscription,
    loading,
    initialized,
    debugLogs,
    signIn,
    signOut,
    signUp,
    refreshSubscription,
    debugSubscriptionStatus,
    addDebugLog
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};