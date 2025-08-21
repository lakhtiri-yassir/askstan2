// src/contexts/AuthContext.tsx - COMPREHENSIVE FIX: Remove problematic redirect logic
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
  const [initialized, setInitialized] = useState(false);

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
      console.log(`🔄 Loading data for: ${authUser.email}`);
      
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
      
      // Try to load subscription data with timeout
      try {
        console.log(`🔍 Loading subscription for user: ${authUser.id}`);
        
        const { data: subscriptions, error } = await Promise.race([
          supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .limit(1),
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Subscription query timeout')), 5000)
          )
        ]);
        
        if (error) {
          console.warn('Subscription query error:', error.message);
          setSubscription(null);
        } else if (subscriptions && subscriptions.length > 0) {
          const sub = subscriptions[0];
          console.log(`✅ Found subscription: ${sub.status} - ${sub.plan_type}`);
          setSubscription(sub);
        } else {
          console.log('ℹ️ No subscription found');
          setSubscription(null);
        }
        
      } catch (subError) {
        console.warn('Subscription loading failed:', subError);
        setSubscription(null);
      }
      
      console.log('✅ User data loading complete');
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setSubscription(null);
    }
  };

  // REMOVED: handleAutoRedirect function that was causing infinite loops
  // This logic is now handled properly in individual components using React Router

  // Initialize authentication
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        console.log('🚀 Initializing authentication...');
        setLoading(true);
        
        // Try to get user from storage first (fastest)
        let currentUser = getUserFromStorage();
        
        if (!currentUser) {
          // Fallback to Supabase auth
          console.log('🔍 No user in storage, checking Supabase auth...');
          try {
            const { data: { user }, error } = await Promise.race([
              supabase.auth.getUser(),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Auth timeout')), 5000)
              )
            ]);
            
            if (user && !error) {
              currentUser = user;
              console.log(`✅ Found user via Supabase: ${user.email}`);
            } else {
              console.log('ℹ️ No authenticated user found');
            }
          } catch (authError) {
            console.warn('Auth check failed:', authError);
          }
        } else {
          console.log(`✅ Found user in storage: ${currentUser.email}`);
        }
        
        if (mounted) {
          if (currentUser) {
            setUser(currentUser);
            await loadUserData(currentUser);
          }
          
          setLoading(false);
          setInitialized(true);
          console.log('🎯 Auth initialization complete');
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
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

  // FIXED: Listen for auth state changes without triggering redirects
  useEffect(() => {
    if (!initialized) return;

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔔 Auth event: ${event}`);
        
        switch (event) {
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            setUser(null);
            setProfile(null);
            setSubscription(null);
            // Note: Redirect is handled by individual components, not here
            break;
            
          case 'SIGNED_IN':
            if (session?.user) {
              console.log(`🔑 User signed in: ${session.user.email}`);
              setUser(session.user);
              setLoading(true);
              await loadUserData(session.user);
              setLoading(false);
            }
            break;
            
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              console.log(`🔄 Token refreshed: ${session.user.email}`);
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
      console.log('👋 Signing out...');
      
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
      
      console.log('✅ Sign out complete');
      
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
      setLoading(true);
      await loadUserData(user);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      subscription,
      hasActiveSubscription,
      loading,
      initialized,
      signIn,
      signOut,
      signUp,
      refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
};