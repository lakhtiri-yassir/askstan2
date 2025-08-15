// src/contexts/AdminAuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  validateSession: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (sessionToken) {
        try {
          const { data, error } = await supabase.rpc('admin_validate_session', {
            session_token: sessionToken
          });

          if (error) throw error;

          if (data && data.length > 0) {
            const adminData = data[0];
            setAdmin({
              id: adminData.admin_id,
              email: adminData.email,
              full_name: adminData.full_name,
              is_super_admin: adminData.is_super_admin
            });
          } else {
            localStorage.removeItem('admin_session_token');
          }
        } catch (error) {
          console.error('Session validation error:', error);
          localStorage.removeItem('admin_session_token');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc('admin_authenticate', {
        admin_email: email,
        admin_password: password
      });

      if (error) {
        throw new Error(error.message || 'Authentication failed');
      }

      if (!data || data.length === 0) {
        throw new Error('Invalid credentials');
      }

      const authResult = data[0];
      
      // Store session token
      localStorage.setItem('admin_session_token', authResult.session_token);
      
      // Set admin user
      setAdmin({
        id: authResult.admin_id,
        email: email,
        full_name: authResult.full_name,
        is_super_admin: authResult.is_super_admin
      });

    } catch (error) {
      console.error('Admin sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('admin_session_token');
    setAdmin(null);
  };

  const validateSession = async (): Promise<boolean> => {
    const sessionToken = localStorage.getItem('admin_session_token');
    if (!sessionToken) return false;

    try {
      const { data, error } = await supabase.rpc('admin_validate_session', {
        session_token: sessionToken
      });

      if (error || !data || data.length === 0) {
        signOut();
        return false;
      }

      return true;
    } catch (error) {
      signOut();
      return false;
    }
  };

  const value = {
    admin,
    isLoading,
    signIn,
    signOut,
    validateSession
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};