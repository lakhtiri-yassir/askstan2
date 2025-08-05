import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, userService, subscriptionService, emailService } from '../lib/supabase';
import { UserProfile, Subscription } from '../types/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  confirmEmail: (token: string) => Promise<void>;
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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserData(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
        authSubscription.unsubscribe();
      }
      // Cleanup state to prevent memory leaks
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSession(null);
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load user profile
      const userProfile = await userService.getProfile(userId);
      setProfile(userProfile);

      // Load subscription
      const userSubscription = await subscriptionService.getSubscription(userId);
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Create auth user without any triggers
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // Remove emailRedirectTo to avoid trigger issues
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile manually after successful auth signup
        try {
          // Wait a moment for auth user to be fully created
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const profile = await userService.createProfileSafe(data.user.id, email);
          setProfile(profile);
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          // Don't throw - signup should succeed even if profile creation fails
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Please enter a valid email address.');
      } else if (error.message?.includes('Password')) {
        throw new Error('Password must be at least 6 characters long.');
      } else {
        throw new Error('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        await loadUserData(data.user.id);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Clear state immediately for better UX
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing out:', error);
      // Even if signOut fails, clear local state
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSession(null);
    } finally {
      // Force page reload to ensure clean state
      window.location.href = '/';
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      // Send custom email via our edge function
      const resetUrl = `${window.location.origin}/reset-password?token=placeholder`;
      await emailService.sendPasswordResetEmail(email, resetUrl);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  };

  const resetPassword = async (token: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  const confirmEmail = async (token: string): Promise<void> => {
    setLoading(true);
    try {
      if (user) {
        await userService.verifyEmail(user.id);
        
        // Refresh user profile
        const updatedProfile = await userService.getProfile(user.id);
        setProfile(updatedProfile);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to confirm email');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const updatedProfile = await userService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const refreshSubscription = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const userSubscription = await subscriptionService.getSubscription(user.id);
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    subscription,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    confirmEmail,
    updateProfile,
    refreshSubscription
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};