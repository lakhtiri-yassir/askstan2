// src/contexts/AuthContext.tsx - Fixed Version Without Profile Creation Issues
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, Subscription } from '../types/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscriptionStatus: Subscription | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile - simplified without RPC calls
  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('📊 Loading user profile for:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile not found or error:', error.message);
        return null;
      }

      console.log('✅ User profile loaded');
      return data;
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      return null;
    }
  };

  // Load subscription status
  const loadSubscriptionStatus = async (userId: string): Promise<Subscription | null> => {
    try {
      console.log('💳 Loading subscription status for:', userId);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('Subscription query error:', error.message);
        return null;
      }

      const subscription = data && data.length > 0 ? data[0] : null;
      console.log('✅ Subscription status loaded:', subscription?.status || 'none');
      return subscription;
    } catch (error) {
      console.error('❌ Error loading subscription:', error);
      return null;
    }
  };

  // Refresh subscription status
  const refreshSubscription = async () => {
    if (!user) return;
    
    try {
      const subscription = await loadSubscriptionStatus(user.id);
      setSubscriptionStatus(subscription);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  // Initialize user data
  const initializeUserData = async (currentUser: User) => {
    try {
      console.log('🔄 Initializing user data for:', currentUser.email);
      
      const [userProfile, subscription] = await Promise.all([
        loadUserProfile(currentUser.id),
        loadSubscriptionStatus(currentUser.id)
      ]);

      setProfile(userProfile);
      setSubscriptionStatus(subscription);
      
      console.log('✅ User data initialized:', {
        profile: !!userProfile,
        subscription: subscription?.status || 'none'
      });
    } catch (error) {
      console.error('❌ Error initializing user data:', error);
      // Don't throw, just set to null
      setProfile(null);
      setSubscriptionStatus(null);
    }
  };

  // Initial session check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 Checking initial auth session...');
        
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          setUser(null);
          setProfile(null);
          setSubscriptionStatus(null);
        } else if (currentUser) {
          console.log('👤 User found:', currentUser.email);
          setUser(currentUser);
          await initializeUserData(currentUser);
        } else {
          console.log('👤 No user session found');
          setUser(null);
          setProfile(null);
          setSubscriptionStatus(null);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        // Don't throw, just clear state
        setUser(null);
        setProfile(null);
        setSubscriptionStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        try {
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            setSubscriptionStatus(null);
          } else if (session?.user) {
            setUser(session.user);
            await initializeUserData(session.user);
          } else {
            setUser(null);
            setProfile(null);
            setSubscriptionStatus(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // Don't let auth errors break the app
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('📝 Starting sign up for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        console.log('✅ Sign up successful, email confirmation required');
        throw new Error('Please check your email and click the confirmation link to complete your registration.');
      }

      console.log('✅ Sign up successful');
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Starting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed');

      console.log('✅ Sign in successful');
      // The auth state change listener will handle the rest
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('👋 Signing out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('✅ Sign out successful');
      // The auth state change listener will handle clearing state
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    subscriptionStatus,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};