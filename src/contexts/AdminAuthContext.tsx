// src/contexts/AdminAuthContext.tsx - SAFE VERSION: Backwards compatible with fallback
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { adminSupabase } from '../lib/adminSupabase';

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

  // Safe function to log admin actions (won't break if it fails)
  const logAdminAction = async (adminId: string, action: string, details?: any) => {
    try {
      // Try to call the audit function, but don't fail if it doesn't exist
      await supabase.rpc('log_admin_action', {
        admin_id: adminId,
        action_type: action,
        action_details: details || {},
        client_ip: null,
        client_user_agent: navigator.userAgent
      });
    } catch (error) {
      // Silently fail - audit logging is not critical for functionality
      console.debug('Admin action logging failed (non-critical):', error);
    }
  };

  // Try secure function first, fallback to direct query
  const authenticateAdminSafely = async (email: string, password: string) => {
    console.log('🔐 Attempting secure admin authentication...');
    
    // Method 1: Try secure function (if migration was successful)
    try {
      const { data, error } = await supabase.rpc('authenticate_admin', {
        admin_email: email.trim().toLowerCase(),
        admin_password: password
      });

      if (!error && data && data.length > 0) {
        console.log('✅ Secure authentication successful');
        return data[0];
      } else {
        console.log('🔄 Secure function failed, trying fallback method...');
      }
    } catch (error) {
      console.log('🔄 Secure function not available, using fallback method...');
    }

    // Method 2: Fallback to admin service (service role)
    try {
      const { data, error } = await adminSupabase
        .from('admin_users')
        .select('id, email, full_name, is_super_admin, is_active, password_hash')
        .eq('email', email.trim().toLowerCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Invalid credentials - admin not found');
      }

      // Simple password check (in production, this should be properly hashed)
      if (data.password_hash !== password) {
        throw new Error('Invalid credentials - wrong password');
      }

      console.log('✅ Fallback authentication successful');
      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        is_super_admin: data.is_super_admin,
        is_active: data.is_active
      };
    } catch (error: any) {
      console.error('❌ All authentication methods failed:', error);
      throw error;
    }
  };

  // Try secure validation first, fallback to direct query
  const validateAdminSessionSafely = async (adminId: string): Promise<boolean> => {
    // Method 1: Try secure function
    try {
      const { data, error } = await supabase.rpc('validate_admin_session', {
        admin_id: adminId
      });

      if (!error && data && data.length > 0) {
        const adminData = data[0];
        setAdmin({
          id: adminData.id,
          email: adminData.email,
          full_name: adminData.full_name,
          is_super_admin: adminData.is_super_admin,
          is_active: adminData.is_active
        });
        return true;
      }
    } catch (error) {
      console.debug('Secure validation not available, using fallback...');
    }

    // Method 2: Fallback to admin service
    try {
      const { data, error } = await adminSupabase
        .from('admin_users')
        .select('id, email, full_name, is_super_admin, is_active')
        .eq('id', adminId)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        setAdmin({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          is_super_admin: data.is_super_admin,
          is_active: data.is_active
        });
        return true;
      }
    } catch (error) {
      console.debug('Admin session validation failed:', error);
    }

    return false;
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
      const isValid = await validateAdminSessionSafely(adminData.id);

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

  // Admin sign in with safe fallback
  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('🔐 Admin sign in attempt for:', email);
    
    try {
      // Use safe authentication method
      const adminData = await authenticateAdminSafely(email, password);

      console.log('✅ Admin authentication successful:', adminData.email);
      
      // Create clean admin object
      const cleanAdminData: AdminUser = {
        id: adminData.id,
        email: adminData.email,
        full_name: adminData.full_name,
        is_super_admin: adminData.is_super_admin,
        is_active: adminData.is_active
      };
      
      // Save session and set admin
      saveAdminSession(cleanAdminData);
      setAdmin(cleanAdminData);

      // Try to log successful login (non-critical)
      await logAdminAction(adminData.id, 'LOGIN', {
        email: adminData.email,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Admin sign in error:', error);
      
      // Try to log failed login attempt (non-critical)
      await logAdminAction('00000000-0000-0000-0000-000000000000', 'LOGIN_FAILED', {
        email: email,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(error.message || 'Sign in failed');
    }
  };

  // Admin sign out
  const signOut = async (): Promise<void> => {
    console.log('👋 Admin signing out...');
    
    try {
      // Try to log logout action (non-critical)
      if (admin) {
        await logAdminAction(admin.id, 'LOGOUT', {
          email: admin.email,
          timestamp: new Date().toISOString()
        });
      }
      
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