import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  isEmailConfirmed: boolean;
  subscriptionStatus: 'none' | 'active' | 'expired';
  subscriptionPlan: 'monthly' | 'yearly' | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  confirmEmail: (token: string) => Promise<void>;
  updateSubscription: (plan: 'monthly' | 'yearly') => void;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const savedUser = localStorage.getItem('askstan_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('askstan_user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate sending confirmation email
      console.log('Confirmation email sent to:', email);
      
      // Create user but mark as unconfirmed
      const newUser: User = {
        id: Date.now().toString(),
        email,
        isEmailConfirmed: false,
        subscriptionStatus: 'none',
        subscriptionPlan: null
      };
      
      setUser(newUser);
      localStorage.setItem('askstan_user', JSON.stringify(newUser));
    } catch (error) {
      throw new Error('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate different user states for demo
      const isExistingUser = email.includes('demo') || email.includes('test');
      
      const user: User = {
        id: Date.now().toString(),
        email,
        isEmailConfirmed: true,
        subscriptionStatus: isExistingUser ? 'active' : 'none',
        subscriptionPlan: isExistingUser ? 'monthly' : null
      };
      
      setUser(user);
      localStorage.setItem('askstan_user', JSON.stringify(user));
    } catch (error) {
      throw new Error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('askstan_user');
  };

  const forgotPassword = async (email: string): Promise<void> => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Password reset email sent to:', email);
  };

  const resetPassword = async (token: string, password: string): Promise<void> => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Password reset successfully');
  };

  const confirmEmail = async (token: string): Promise<void> => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        const updatedUser = { ...user, isEmailConfirmed: true };
        setUser(updatedUser);
        localStorage.setItem('askstan_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      throw new Error('Failed to confirm email');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = (plan: 'monthly' | 'yearly') => {
    if (user) {
      const updatedUser = {
        ...user,
        subscriptionStatus: 'active' as const,
        subscriptionPlan: plan
      };
      setUser(updatedUser);
      localStorage.setItem('askstan_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    confirmEmail,
    updateSubscription
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};