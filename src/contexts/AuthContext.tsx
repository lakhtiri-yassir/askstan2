// src/contexts/AuthContext.tsx - FIXED: Decouple auth from subscription loading
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
  subscriptionLoading: boolean;
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
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Add debug log function with enhanced error handling
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    let logEntry = `[${timestamp}] ${message}`;
    
    if (data) {
      try {
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

  // FIXED: Load subscription data separately from user authentication
  const loadSubscriptionData = async (authUser: User): Promise<void> => {
    if (subscriptionLoading) {
      addDebugLog('⏸️ Subscription loading already in progress, skipping');
      return;
    }

    try {
      setSubscriptionLoading(true);
      addDebugLog(`🔍 Loading subscription for user: ${authUser.id}`);
      
      // Add reasonable timeout for subscription loading
      const subscriptionPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => {
          addDebugLog('⏰ Subscription query timeout after 5 seconds');
          reject(new Error('Subscription query timeout'));
        }, 5000)
      );

      const result = await Promise.race([
        subscriptionPromise,
        timeoutPromise
      ]);

      const { data: subscriptions, error } = result;
      
      if (error) {
        addDebugLog('❌ Subscription query error', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setSubscription(null);
      } else if (subscriptions && subscriptions.length > 0) {
        addDebugLog(`📋 Found ${subscriptions.length} subscription(s)`);
        
        // Find active or trialing subscription first
        let activeSubscription = subscriptions.find(sub => 
          sub.status === 'active' || sub.status === 'trialing'
        );
        
        // If no active/trialing found, use the most recent one
        if (!activeSubscription && subscriptions.length > 0) {
          activeSubscription = subscriptions[0];
          addDebugLog('⚠️ No active/trialing subscription, using most recent', {
            status: activeSubscription.status
          });
        }
        
        if (activeSubscription) {
          addDebugLog(`✅ Selected subscription`, {
            id: activeSubscription.id,
            status: activeSubscription.status,
            plan_type: activeSubscription.plan_type
          });
          setSubscription(activeSubscription);
        }
      } else {
        addDebugLog('ℹ️ No subscriptions found (empty result)');
        setSubscription(null);
      }
      
    } catch (subError) {
      addDebugLog('❌ Subscription loading failed', {
        message: subError.message,
        name: subError.name
      });
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // FIXED: Load user profile (simplified - no subscription dependency)
  const loadUserProfile = async (authUser: User): Promise<void> => {
    try {
      addDebugLog(`👤 Loading profile for: ${authUser.email}`);
      
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
      addDebugLog('✅ User profile loaded');
      
    } catch (error) {
      addDebugLog('❌ Error loading user profile', error);
    }
  };

  // FIXED: Initialize authentication - complete quickly without waiting for subscription
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        addDebugLog('🚀 Initializing authentication...');
        setLoading(true);
        
        // Try to get user from storage first (fastest)
        let currentUser = getUserFromStorage();
        
        if (!currentUser) {
          // Fallback to Supabase auth with timeout
          addDebugLog('🔍 No user in storage, checking Supabase auth...');
          try {
            const { data: { user }, error } = await Promise.race([
              supabase.auth.getUser(),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Auth timeout')), 3000)
              )
            ]);
            
            if (user && !error) {
              currentUser = user;
              addDebugLog(`✅ Found user via Supabase: ${user.email}`);
            } else {
              addDebugLog('ℹ️ No authenticated user found');
            }
          } catch (authError) {
            addDebugLog('⚠️ Auth check failed - continuing without user', authError);
          }
        } else {
          addDebugLog(`✅ Found user in storage: ${currentUser.email}`);
        }
        
        if (mounted) {
          if (currentUser) {
            setUser(currentUser);
            // Load profile immediately (fast)
            await loadUserProfile(currentUser);
            // Load subscription data in background (don't wait)
            loadSubscriptionData(currentUser).catch(error => {
              addDebugLog('⚠️ Background subscription loading failed', error);
            });
          }
          
          // CRITICAL FIX: Always complete initialization quickly
          setLoading(false);
          setInitialized(true);
          addDebugLog('🎯 Auth initialization complete');
        }
        
      } catch (error) {
        addDebugLog('❌ Auth initialization error', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  // Listen for auth state changes
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
            break;
            
          case 'SIGNED_IN':
            if (session?.user) {
              addDebugLog(`🔑 User signed in: ${session.user.email}`);
              setUser(session.user);
              await loadUserProfile(session.user);
              // Load subscription in background
              loadSubscriptionData(session.user).catch(error => {
                addDebugLog('⚠️ Background subscription loading failed after sign in', error);
              });
            }
            break;
            
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              addDebugLog(`🔄 Token refreshed: ${session.user.email}`);
              // Update user if it changed
              if (!user || user.id !== session.user.id) {
                setUser(session.user);
                await loadUserProfile(session.user);
                loadSubscriptionData(session.user).catch(error => {
                  addDebugLog('⚠️ Background subscription loading failed after refresh', error);
                });
              }
            }
            break;
        }
      }
    );

    return () => authSub.unsubscribe();
  }, [initialized, user]);

  // FIXED: Simple sign in function
  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
    
    // Auth state change will handle the rest
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      addDebugLog('👋 Signing out...');
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setSubscription(null);
      
      // Sign out from Supabase
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
  };

  // Refresh subscription data manually
  const refreshSubscription = async (): Promise<void> => {
    if (user) {
      addDebugLog('🔄 Manual subscription refresh requested');
      await loadSubscriptionData(user);
    }
  };

  // Enhanced manual subscription check function
  const debugSubscriptionStatus = async (): Promise<void> => {
    if (!user) {
      addDebugLog('❌ No user for subscription debug');
      return;
    }

    addDebugLog('🐛 DEBUGGING: Manual subscription status check');
    await loadSubscriptionData(user);
  };

  const contextValue = {
    user,
    profile,
    subscription,
    hasActiveSubscription,
    loading,
    initialized,
    subscriptionLoading,
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