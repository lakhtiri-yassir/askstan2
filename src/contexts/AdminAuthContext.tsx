// src/contexts/AdminAuthContext.tsx - FIXED: Handle missing admin_users table gracefully
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

      // FIXED: Handle case where admin_users table doesn't exist
      try {
        // Check if user is in admin_users table
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (error) {
          // If table doesn't exist or other error, treat as no admin access
          console.log('Admin table query failed (table may not exist):', error.message);
          setAdmin(null);
          return;
        }

        setAdmin(adminData || null);
      } catch (tableError) {
        console.log('Admin table access error:', tableError);
        setAdmin(null);
      }
    } catch (error) {
      console.log('Admin auth check error:', error);
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

    // FIXED: Proper auth state listener cleanup
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
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Check admin access after successful sign in
    await checkAdminAccess();
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