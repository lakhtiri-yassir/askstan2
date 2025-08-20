// src/contexts/AdminAuthContext.tsx - PRODUCTION READY: Simple and reliable
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        setAdmin(null);
        return;
      }

      // Check if user is in admin_users table
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', session.user.email)
        .eq('is_active', true)
        .single();

      setAdmin(adminData || null);
    } catch (error) {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT') {
          setAdmin(null);
        } else if (event === 'SIGNED_IN') {
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
    // First sign in with Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('is_active', true)
      .single();

    if (adminError || !adminData) {
      // Sign out if not an admin
      await supabase.auth.signOut();
      throw new Error('Invalid admin credentials');
    }

    setAdmin(adminData);
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setAdmin(null);
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