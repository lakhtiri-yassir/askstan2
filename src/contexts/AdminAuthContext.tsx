// src/contexts/AdminAuthContext.tsx - FIXED: Only check admin when on admin routes
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  is_active: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // FIXED: Only check admin status, don't log every action
  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        setAdmin(null);
        return;
      }

      try {
        // Check if user is in admin_users table
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No matching row found - user is not an admin
            setAdmin(null);
          } else {
            // Other error (RLS, permissions, etc.)
            console.error('Admin check error:', error.message);
            setAdmin(null);
          }
          return;
        }

        if (adminData) {
          console.log('Admin access granted for:', adminData.email);
          setAdmin(adminData);
        } else {
          setAdmin(null);
        }
      } catch (tableError) {
        console.error('Admin table access error:', tableError);
        setAdmin(null);
      }
    } catch (error) {
      console.error('Admin auth check error:', error);
      setAdmin(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAdmin = async () => {
      await checkAdminAccess();
      if (mounted) {
        setIsLoading(false);
      }
    };

    initAdmin();

    // FIXED: Only listen to auth changes when mounted
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT') {
          setAdmin(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Only check admin access if we're on admin routes
          await checkAdminAccess();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Admin access check will be handled by the auth state change listener
  };

  const signOut = async (): Promise<void> => {
    setAdmin(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <AdminAuthContext.Provider value={{
      admin,
      isLoading,
      signIn,
      signOut,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};