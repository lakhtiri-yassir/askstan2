// src/contexts/AdminAuthContext.tsx - SIMPLIFIED: Direct table access without functions
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

// Admin session storage keys
const ADMIN_SESSION_KEY = 'askstan_admin_session';
const ADMIN_SESSION_EXPIRY = 'askstan_admin_session_expiry';

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if admin session is valid by querying the table directly
  const validateAdminSession = async (adminId: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating admin session for ID:', adminId);
      
      // Query admin_users table directly using service role
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, full_name, is_super_admin, is_active')
        .eq('id', adminId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Session validation error:', error);
        return false;
      }

      if (data) {
        console.log('✅ Admin session valid:', data.email);
        setAdmin(data);
        return true;
      } else {
        console.log('❌ Admin session invalid - no data');
        return false;
      }
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return false;
    }
  };

  // Load admin session from localStorage
  const loadAdminSession = async (): Promise<void> => {
    try {
      const adminSession = localStorage.getItem(ADMIN_SESSION_KEY);
      const sessionExpiry = localStorage.getItem(ADMIN_SESSION_EXPIRY);

      if (!adminSession || !sessionExpiry) {
        console.log('ℹ️ No admin session found');
        setAdmin(null);
        return;
      }

      // Check if session is expired
      const expiryTime = parseInt(sessionExpiry);
      const currentTime = Date.now();

      if (currentTime > expiryTime) {
        console.log('⏰ Admin session expired');
        clearAdminSession();
        setAdmin(null);
        return;
      }

      // Validate session with database
      const adminData = JSON.parse(adminSession);
      const isValid = await validateAdminSession(adminData.id);

      if (!isValid) {
        console.log('❌ Stored admin session is invalid');
        clearAdminSession();
        setAdmin(null);
      }
    } catch (error) {
      console.error('❌ Error loading admin session:', error);
      clearAdminSession();
      setAdmin(null);
    }
  };

  // Clear admin session
  const clearAdminSession = (): void => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_EXPIRY);
  };

  // Save admin session
  const saveAdminSession = (adminData: AdminUser): void => {
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
    localStorage.setItem(ADMIN_SESSION_EXPIRY, expiryTime.toString());
  };

  // Initialize admin auth
  useEffect(() => {
    let mounted = true;

    const initAdmin = async () => {
      console.log('🚀 Initializing admin auth...');
      await loadAdminSession();
      if (mounted) {
        setIsLoading(false);
        console.log('✅ Admin auth initialized');
      }
    };

    initAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  // Admin sign in - direct table access
  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('🔐 Admin sign in attempt for:', email);
    
    try {
      // Query admin_users table directly
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, full_name, is_super_admin, is_active, password_hash')
        .eq('email', email.trim().toLowerCase())
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Admin query error:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Invalid credentials - admin not found');
        } else {
          throw new Error('Authentication failed: ' + error.message);
        }
      }

      if (!data) {
        throw new Error('Invalid credentials - no admin data');
      }

      // Check password (simple comparison for now)
      if (data.password_hash !== password) {
        throw new Error('Invalid credentials - wrong password');
      }

      console.log('✅ Admin authentication successful:', data.email);
      
      // Update last login
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      if (updateError) {
        console.warn('⚠️ Could not update last login:', updateError);
      }

      // Save session and set admin (excluding password)
      const adminData: AdminUser = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        is_super_admin: data.is_super_admin,
        is_active: data.is_active
      };
      
      saveAdminSession(adminData);
      setAdmin(adminData);

    } catch (error: any) {
      console.error('❌ Admin sign in error:', error);
      throw new Error(error.message || 'Sign in failed');
    }
  };

  // Admin sign out
  const signOut = async (): Promise<void> => {
    console.log('👋 Admin signing out...');
    
    try {
      // Clear local session
      clearAdminSession();
      setAdmin(null);
      
      console.log('✅ Admin signed out successfully');
    } catch (error) {
      console.error('❌ Admin sign out error:', error);
      // Even if there's an error, clear the local session
      clearAdminSession();
      setAdmin(null);
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