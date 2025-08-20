// src/contexts/AdminAuthContext.tsx - Updated for database integration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
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

  // Check if current session has admin access
  const checkAdminAccess = async () => {
    try {
      console.log("🔍 Checking admin access...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log("❌ No session found");
        setAdmin(null);
        return;
      }

      console.log("👤 Session found, verifying admin status for:", session.user.email);

      // Use the safe authentication function
      const { data: adminData, error } = await supabase
        .rpc('authenticate_admin', { user_email: session.user.email });

      if (error) {
        console.error("❌ Admin verification error:", error);
        setAdmin(null);
        return;
      }

      if (!adminData) {
        console.log("❌ User is not an admin");
        setAdmin(null);
        return;
      }

      console.log("✅ Admin access verified:", adminData.email);
      setAdmin(adminData);
    } catch (error) {
      console.error('❌ Error checking admin access:', error);
      setAdmin(null);
    }
  };

  // Initialize admin auth
  useEffect(() => {
    const initializeAdminAuth = async () => {
      await checkAdminAccess();
      setIsLoading(false);
    };

    initializeAdminAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setAdmin(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          await checkAdminAccess();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      console.log("🔐 Starting admin sign in for:", email);
      
      // Sign in with Supabase Auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error("❌ Admin auth error:", error);
        throw error;
      }

      if (!data.user) {
        console.error("❌ No user returned from admin sign in");
        throw new Error('Sign in failed');
      }

      console.log("✅ Admin auth successful, checking admin status...");

      // Check if user is an admin using the safe function
      const { data: adminData, error: adminError } = await supabase
        .rpc('authenticate_admin', { user_email: email.toLowerCase().trim() });

      if (adminError) {
        console.error("❌ Admin verification error:", adminError);
        // Sign out the user since they're not an admin
        await supabase.auth.signOut();
        throw new Error('Admin verification failed');
      }

      if (!adminData) {
        console.error("❌ No admin data returned");
        // Sign out the user since they're not an admin
        await supabase.auth.signOut();
        throw new Error('Invalid admin credentials or account is disabled');
      }

      console.log("✅ Admin verification successful:", adminData.email);
      setAdmin(adminData);
      
    } catch (error: any) {
      console.error('❌ Admin sign in failed:', error);
      throw new Error(error.message || 'Admin sign in failed');
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAdmin(null);
    } catch (error: any) {
      console.error('Admin sign out error:', error);
      throw new Error(error.message || 'Sign out failed');
    }
  };

  const value: AdminAuthContextType = {
    admin,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};