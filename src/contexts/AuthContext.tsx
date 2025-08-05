import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, userService, subscriptionService } from '../lib/supabase';
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
  resetPassword: (email: string) => Promise<void>;
  hasActiveSubscription: boolean;
  isEmailVerified: boolean;
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

  const hasActiveSubscription = subscription?.status === 'active';
  // For now, consider all users as verified since we're disabling email confirmation
  const isEmailVerified = true; // Changed from: profile?.email_verified ?? false;

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await loadUserData(initialSession.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Session initialization error:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.id);
        
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
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load user profile
      const userProfile = await userService.getProfile(userId);
      
      // If no profile exists, create one
      if (!userProfile && user?.email) {
        console.log('No profile found, creating one...');
        const newProfile = await userService.createProfileMinimal(userId, user.email);
        setProfile(newProfile);
      } else {
        setProfile(userProfile);
      }

      // Load subscription if profile exists
      if (userProfile) {
        const userSubscription = await subscriptionService.getSubscription(userId);
        setSubscription(userSubscription);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('Starting signup process (no email confirmation)...');
      
      // Create auth user WITHOUT email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          // Disable email confirmation for now
          emailRedirectTo: undefined,
          data: {
            email_confirm: false
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        
        // Handle specific email-related errors
        if (authError.message?.includes('email') && authError.message?.includes('confirmation')) {
          throw new Error('Email confirmation is temporarily disabled. Please contact support if you need help.');
        }
        
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Signup failed - no user returned');
      }

      console.log('Auth user created:', authData.user.id);

      // Create user profile
      try {
        console.log('Creating user profile...');
        const profile = await userService.createProfileMinimal(authData.user.id, email.trim().toLowerCase());
        console.log('Profile created:', profile);
        setProfile(profile);
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here - the auth signup succeeded
      }

      console.log('Signup completed successfully (no email confirmation required)');
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Provide user-friendly error messages
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (error.message?.includes('Invalid email') || error.message?.includes('invalid email')) {
        throw new Error('Please enter a valid email address.');  
      } else if (error.message?.includes('Password') || error.message?.includes('password')) {
        throw new Error('Password must be at least 6 characters long.');
      } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        throw new Error('Too many signup attempts. Please wait a moment and try again.');
      } else if (error.message?.includes('email') || error.message?.includes('confirmation')) {
        throw new Error('Account created successfully! Email confirmation is temporarily disabled, so you can sign in immediately.');
      } else {
        throw new Error(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) throw error;

      // Profile will be loaded automatically via the auth state change listener
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        // Since we disabled email confirmation, this shouldn't happen
        throw new Error('Account found but not accessible. Please try signing up again.');
      } else {
        throw new Error(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear state
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setSession(null);
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        // If password reset email fails, provide alternative
        throw new Error('Password reset email is temporarily unavailable. Please contact support for assistance.');
      }
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Password reset is temporarily unavailable. Please contact support.');
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
    resetPassword,
    hasActiveSubscription,
    isEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};