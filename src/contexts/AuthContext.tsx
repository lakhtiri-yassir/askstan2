// src/contexts/AuthContext.tsx - Simplified and More Robust Version
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

  // Load user profile
  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('📊 Loading user profile for:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('📝 Creating user profile...');
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: newProfile, error: createError } = await supabase.rpc(
            'create_user_profile_safe',
            {
              user_id: userData.user.id,
              user_email: userData.user.email || ''
            }
          );

          if (createError) {
            console.error('Error creating profile:', createError);
            return null;
          }
          console.log('✅ User profile created');
          return newProfile;
        }
      } else if (error) {
        console.error('Error loading profile:', error);
        return null;
      } else {
        console.log('✅ User profile loaded');
        return data;
      }
    } catch (error) {
      console.error('❌ Error in loadUserProfile:', error);
      return null;
    }
    return null;
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
        console.error('Subscription query error:', error);
        return null;
      }

      const subscription = data && data.length > 0 ? data[0] : null;
      console.log('✅ Subscription status loaded:', subscription?.status || 'none');
      return subscription;
    } catch (error) {
      console.error('❌ Error in loadSubscriptionStatus:', error);
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
    }
  };

  // Initial session check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 Checking initial auth session...');
        setIsLoading(true);
        
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
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setSubscriptionStatus(null);
          setIsLoading(false);
        } else if (session?.user) {
          setUser(session.user);
          await initializeUserData(session.user);
          setIsLoading(false);
        } else {
          setUser(null);
          setProfile(null);
          setSubscriptionStatus(null);
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

      console.log('✅ Sign up and auto-login successful');
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
      
      // The auth state change listener will handle loading user data
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

      // The auth state change listener will handle clearing state
      console.log('✅ Sign out successful');
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