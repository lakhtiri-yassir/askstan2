// src/contexts/AuthContext.tsx - COMPLETE: With password reset functionality
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
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
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
      } catch (e) {
        logEntry += `\nData: [Unable to stringify: ${e}]`;
      }
    }
    
    setDebugLogs(prev => [...prev.slice(-19), logEntry]); // Keep last 20 logs
    console.log(logEntry);
  };

  // Computed subscription status
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

  // Load user profile
  const loadUserProfile = async (currentUser: User): Promise<void> => {
    try {
      addDebugLog(`📋 Loading profile for: ${currentUser.email}`);
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        addDebugLog('⚠️ Profile not found, creating...', profileError);
        
        // Try to create profile using the safe function
        try {
          const { data: newProfile, error: createError } = await supabase
            .rpc('create_user_profile_safe', {
              user_id: currentUser.id,
              user_email: currentUser.email || ''
            });

          if (createError) {
            addDebugLog('❌ Failed to create profile', createError);
            throw createError;
          }

          if (newProfile) {
            setProfile(newProfile);
            addDebugLog('✅ Profile created successfully');
          }
        } catch (createError) {
          addDebugLog('❌ Profile creation failed', createError);
          // Set minimal profile from auth data
          const fallbackProfile: UserProfile = {
            id: currentUser.id,
            email: currentUser.email || '',
            display_name: currentUser.user_metadata?.full_name || null,
            avatar_url: null,
            email_verified: currentUser.email_confirmed_at ? true : false,
            created_at: currentUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(fallbackProfile);
          addDebugLog('✅ Using fallback profile');
        }
      } else {
        setProfile(profileData);
        addDebugLog('✅ Profile loaded successfully');
      }
    } catch (error) {
      addDebugLog('❌ Profile loading error', error);
    }
  };

  // Load subscription data
  const loadSubscriptionData = async (currentUser: User): Promise<void> => {
    try {
      setSubscriptionLoading(true);
      addDebugLog(`💳 Loading subscription for: ${currentUser.email}`);
      
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        addDebugLog('⚠️ Subscription query error', subError);
        setSubscription(null);
      } else if (subData) {
        setSubscription(subData);
        addDebugLog('✅ Active subscription found', { 
          status: subData.status, 
          plan: subData.plan_type,
          expires: subData.current_period_end 
        });
      } else {
        setSubscription(null);
        addDebugLog('ℹ️ No active subscription found');
      }
    } catch (error) {
      addDebugLog('❌ Subscription loading error', error);
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Initialize auth state - CRITICAL: Run only once
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        addDebugLog('🚀 Initializing auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          addDebugLog('❌ Session error', error);
          return;
        }

        const currentUser = session?.user || null;
        
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

  // NEW: Forgot password function - uses custom reset system
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      addDebugLog('📧 Requesting password reset', { email: email.trim().toLowerCase() });
      
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email: email.trim().toLowerCase() }
      });

      if (error) {
        addDebugLog('❌ Password reset request failed', error);
        throw new Error(error.message || 'Failed to send reset email');
      }

      addDebugLog('✅ Password reset email sent successfully');
    } catch (error: any) {
      addDebugLog('❌ Forgot password error', error);
      throw new Error(error.message || 'Failed to send reset email. Please try again.');
    }
  };

  // NEW: Reset password function - uses custom reset system  
  const resetPassword = async (token: string, password: string): Promise<void> => {
    try {
      addDebugLog('🔒 Resetting password with token');
      
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { token, password }
      });

      if (error) {
        addDebugLog('❌ Password reset failed', error);
        throw new Error(error.message || 'Failed to reset password');
      }

      addDebugLog('✅ Password reset successful');
    } catch (error: any) {
      addDebugLog('❌ Reset password error', error);
      throw new Error(error.message || 'Failed to reset password. The link may be expired or invalid.');
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
    forgotPassword,
    resetPassword,
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