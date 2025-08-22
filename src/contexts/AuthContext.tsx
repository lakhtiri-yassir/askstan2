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

  // Add debug log function with enhanced error handling
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    let logEntry = `[${timestamp}] ${message}`;
    
    if (data) {
      try {
        // Safely stringify data
        const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
        logEntry += `\nData: ${dataStr}`;
        console.log(logEntry, data);
      } catch (stringifyError) {
        logEntry += `\nData: [Unable to stringify - ${stringifyError.message}]`;
        console.log(logEntry);
      }
    } else {
      console.log(logEntry);
    }
    
    setDebugLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
  };

  // Storage keys for caching subscription data
  const SUBSCRIPTION_STORAGE_KEY = 'askstan-subscription-cache';
  const SUBSCRIPTION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Get cached subscription from sessionStorage
  const getCachedSubscription = (userId: string): Subscription | null => {
    try {
      const cached = sessionStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (!cached) return null;

      const parsedCache = JSON.parse(cached);
      
      // Check if cache is for the same user and not expired
      if (parsedCache.userId !== userId) {
        addDebugLog('🗑️ Clearing subscription cache for different user');
        sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
        return null;
      }
      
      const cacheAge = Date.now() - parsedCache.timestamp;
      if (cacheAge > SUBSCRIPTION_CACHE_DURATION) {
        addDebugLog('⏰ Subscription cache expired, clearing');
        sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
        return null;
      }
      
      addDebugLog('✅ Using cached subscription', {
        status: parsedCache.subscription?.status,
        cacheAge: Math.round(cacheAge / 1000) + 's',
        plan: parsedCache.subscription?.plan_type
      });
      
      return parsedCache.subscription;
    } catch (error) {
      addDebugLog('❌ Error reading subscription cache', error);
      sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
      return null;
    }
  };

  // Cache subscription in sessionStorage
  const cacheSubscription = (userId: string, subscription: Subscription | null): void => {
    try {
      const cacheData = {
        userId,
        subscription,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(cacheData));
      addDebugLog('💾 Cached subscription', {
        status: subscription?.status || 'null',
        plan: subscription?.plan_type || 'none'
      });
    } catch (error) {
      addDebugLog('❌ Error caching subscription', error);
    }
  };

  // Clear subscription cache (for sign out, etc.)
  const clearSubscriptionCache = (): void => {
    sessionStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    addDebugLog('🗑️ Cleared subscription cache');
  };

  // Proper subscription check - matches the rest of the app
  const hasActiveSubscription = Boolean(
    subscription && (subscription.status === 'active' || subscription.status === 'trialing')
  );

  // Get user from localStorage and ensure valid session
  const getUserFromStorage = async (): Promise<User | null> => {
    try {
      addDebugLog('🔍 Checking for stored user...');
      
      // First, try to get the current session from Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addDebugLog('❌ Session check failed', sessionError);
        return null;
      }
      
      if (sessionData.session?.user) {
        addDebugLog('✅ Valid session found in Supabase', {
          userId: sessionData.session.user.id,
          email: sessionData.session.user.email
        });
        return sessionData.session.user;
      }
      
      addDebugLog('ℹ️ No valid session found, checking localStorage...');
      
      // Fallback: check localStorage but immediately validate
      const keys = Object.keys(localStorage);
      const supabaseKey = keys.find(key => 
        key.startsWith('sb-') && key.includes('-auth-token')
      );
      
      if (!supabaseKey) {
        addDebugLog('ℹ️ No auth token in localStorage');
        return null;
      }
      
      const sessionData_stored = localStorage.getItem(supabaseKey);
      if (!sessionData_stored) {
        addDebugLog('ℹ️ No session data in localStorage');
        return null;
      }
      
      const parsed = JSON.parse(sessionData_stored);
      const storedUser = parsed?.user;
      
      if (!storedUser?.id || !storedUser?.email) {
        addDebugLog('⚠️ Invalid stored user data');
        return null;
      }
      
      addDebugLog('🔍 Found stored user, validating session...', {
        userId: storedUser.id,
        email: storedUser.email
      });
      
      // CRITICAL: Validate the stored session by refreshing it
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session?.user) {
          addDebugLog('❌ Session refresh failed, stored session is invalid', refreshError);
          // Clear invalid session
          localStorage.removeItem(supabaseKey);
          return null;
        }
        
        addDebugLog('✅ Session refreshed successfully', {
          userId: refreshData.session.user.id,
          email: refreshData.session.user.email
        });
        
        return refreshData.session.user;
        
      } catch (refreshError) {
        addDebugLog('❌ Session refresh exception', refreshError);
        return null;
      }
      
    } catch (error) {
      addDebugLog('❌ Error in getUserFromStorage', error);
      return null;
    }
  };

  // Load user profile and subscription data with caching
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
      
      // OPTIMIZATION: Try to get subscription from cache first
      addDebugLog('🔍 Checking subscription cache...');
      const cachedSubscription = getCachedSubscription(authUser.id);
      
      if (cachedSubscription !== null) {
        // Found valid cached subscription
        setSubscription(cachedSubscription);
        
        const isActive = cachedSubscription && (cachedSubscription.status === 'active' || cachedSubscription.status === 'trialing');
        addDebugLog('🎯 Using cached subscription status', {
          status: cachedSubscription?.status || 'null',
          isActive
        });
        
        addDebugLog('✅ User data loading complete (from cache)');
        return; // Skip database query entirely
      }
      
      // No cache found, need to query database
      addDebugLog('💾 No valid cache, querying database...');
      
      // Ensure we have a valid session before querying
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        addDebugLog('❌ No valid session found, cannot query subscriptions');
        setSubscription(null);
        cacheSubscription(authUser.id, null); // Cache the null result
        return;
      }
      
      addDebugLog('✅ Valid session confirmed, querying subscriptions...');
      
      try {
        const result = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        const { data: subscriptions, error } = result;
        
        addDebugLog('📊 Database query result', { 
          subscriptionCount: subscriptions?.length || 0,
          hasError: !!error
        });
        
        if (error) {
          addDebugLog('❌ Query error', {
            message: error.message,
            code: error.code
          });
          setSubscription(null);
          cacheSubscription(authUser.id, null); // Cache the null result
        } else if (subscriptions && subscriptions.length > 0) {
          addDebugLog(`📋 Found ${subscriptions.length} subscription(s)`);
          
          // Find active or trialing subscription first
          let activeSubscription = subscriptions.find(sub => 
            sub.status === 'active' || sub.status === 'trialing'
          );
          
          // If no active/trialing found, use the most recent one
          if (!activeSubscription) {
            activeSubscription = subscriptions[0];
            addDebugLog('⚠️ Using most recent subscription', {
              status: activeSubscription.status
            });
          }
          
          addDebugLog(`✅ Setting subscription`, {
            id: activeSubscription.id,
            status: activeSubscription.status,
            plan_type: activeSubscription.plan_type
          });
          
          setSubscription(activeSubscription);
          cacheSubscription(authUser.id, activeSubscription); // Cache the result
          
          // Log hasActiveSubscription calculation
          const isActive = activeSubscription.status === 'active' || activeSubscription.status === 'trialing';
          addDebugLog(`🎯 Active calculation`, {
            status: activeSubscription.status,
            result: isActive
          });
        } else {
          addDebugLog('ℹ️ No subscriptions found');
          setSubscription(null);
          cacheSubscription(authUser.id, null); // Cache the null result
        }
        
      } catch (subError) {
        addDebugLog('❌ Subscription loading failed', {
          message: subError.message,
          name: subError.name
        });
        setSubscription(null);
        cacheSubscription(authUser.id, null); // Cache the null result to prevent retries
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
        
        // Try to get user from storage first and validate session
        let currentUser = await getUserFromStorage();
        
        if (!currentUser) {
          // Fallback to Supabase auth check
          addDebugLog('🔍 No valid stored user, checking Supabase directly...');
          try {
            const { data: { user }, error } = await Promise.race([
              supabase.auth.getUser(),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Auth timeout')), 5000)
              )
            ]);
            
            if (user && !error) {
              currentUser = user;
              addDebugLog(`✅ Found user via direct Supabase check: ${user.email}`);
            } else {
              addDebugLog('ℹ️ No authenticated user found');
            }
          } catch (authError) {
            addDebugLog('Auth check failed', authError);
          }
        } else {
          addDebugLog(`✅ Valid user session confirmed: ${currentUser.email}`);
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

  // FIXED: Improved sign out function with cache clearing
  const signOut = async (): Promise<void> => {
    try {
      addDebugLog('👋 Signing out...');
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setSubscription(null);
      
      // Clear subscription cache
      clearSubscriptionCache();
      
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
      clearSubscriptionCache();
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

  // DEBUGGING: Ultra-simplified subscription check with timeout
  const debugSubscriptionStatus = async (): Promise<void> => {
    if (!user) {
      addDebugLog('❌ No user for subscription debug');
      return;
    }

    addDebugLog('🐛 DEBUGGING: Manual subscription status check');
    addDebugLog(`🐛 User ID: ${user.id}`);
    addDebugLog(`🐛 User Email: ${user.email}`);
    
    try {
      addDebugLog('🐛 Starting query with 5-second timeout...');
      
      // Create query with aggressive timeout
      const queryPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          addDebugLog('⏰ Query timed out after 5 seconds');
          reject(new Error('Query timeout'));
        }, 5000);
      });
      
      addDebugLog('🐛 Executing query...');
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      addDebugLog('🐛 Query completed, processing result...');
      
      const { data: allSubs, error } = result;
      
      if (error) {
        addDebugLog('❌ Query returned error', {
          message: error.message,
          code: error.code,
          details: error.details
        });
      } else {
        addDebugLog('✅ Query successful', {
          resultCount: allSubs?.length || 0
        });
        
        if (allSubs && allSubs.length > 0) {
          addDebugLog(`📋 Found ${allSubs.length} subscription(s):`);
          
          allSubs.forEach((sub, index) => {
            const isActive = sub.status === 'active' || sub.status === 'trialing';
            addDebugLog(`📄 Subscription ${index + 1}`, {
              id: sub.id,
              status: sub.status,
              plan_type: sub.plan_type,
              isActive: isActive
            });
          });
          
          // Find and set active subscription
          const activeSub = allSubs.find(sub => sub.status === 'active' || sub.status === 'trialing') || allSubs[0];
          
          addDebugLog('🔧 Setting subscription in context...', {
            id: activeSub.id,
            status: activeSub.status
          });
          
          setSubscription(activeSub);
          
          // Force re-calculation of hasActiveSubscription
          const newHasActive = activeSub.status === 'active' || activeSub.status === 'trialing';
          addDebugLog('🎯 Active status should be', {
            status: activeSub.status,
            result: newHasActive
          });
          
        } else {
          addDebugLog('ℹ️ No subscriptions found');
        }
      }
      
    } catch (debugError) {
      addDebugLog('❌ Debug failed', {
        message: debugError.message,
        name: debugError.name
      });
    }
    
    addDebugLog('🐛 Debug completed');
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