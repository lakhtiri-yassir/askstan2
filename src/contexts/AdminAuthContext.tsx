// src/contexts/AdminAuthContext.tsx - FIXED: Proper admin authentication with error handling
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

  // FIXED: Enhanced admin access check with proper error handling
  const checkAdminAccess = async () => {
    try {
      console.log('🔍 Checking admin access...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        setAdmin(null);
        return;
      }
      
      if (!session?.user?.email) {
        console.log('ℹ️ No session or email found');
        setAdmin(null);
        return;
      }

      console.log('🔍 Checking admin status for:', session.user.email);

      try {
        // First try the direct query
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (adminError) {
          console.log('⚠️ Admin query error:', adminError.message, 'Code:', adminError.code);
          
          if (adminError.code === 'PGRST116') {
            // No matching row found - user is not an admin
            console.log('ℹ️ User is not an admin');
            setAdmin(null);
          } else if (adminError.code === '42501') {
            // Permission denied - try alternative approach
            console.log('🔧 Permission denied, trying function approach...');
            
            try {
              const { data: functionResult, error: functionError } = await supabase
                .rpc('verify_admin_access', { admin_email: session.user.email });
              
              if (functionError) {
                console.error('❌ Function call error:', functionError);
                setAdmin(null);
              } else if (functionResult) {
                console.log('✅ Admin access granted via function:', functionResult.email);
                setAdmin(functionResult);
              } else {
                console.log('ℹ️ No admin access via function');
                setAdmin(null);
              }
            } catch (funcError) {
              console.error('❌ Function execution error:', funcError);
              setAdmin(null);
            }
          } else {
            // Other error (table doesn't exist, network error, etc.)
            console.error('❌ Database error:', adminError);
            setAdmin(null);
          }
          return;
        }

        if (adminData) {
          console.log('✅ Admin access granted:', adminData.email);
          setAdmin(adminData);
        } else {
          console.log('ℹ️ No admin data returned');
          setAdmin(null);
        }
        
      } catch (tableError) {
        console.error('❌ Admin table access error:', tableError);
        setAdmin(null);
      }
    } catch (error) {
      console.error('❌ Admin auth check error:', error);
      setAdmin(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAdmin = async () => {
      console.log('🚀 Initializing admin auth...');
      await checkAdminAccess();
      if (mounted) {
        setIsLoading(false);
        console.log('✅ Admin auth initialized');
      }
    };

    initAdmin();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Admin auth state change:', event);
        
        if (event === 'SIGNED_OUT') {
          console.log('👋 Admin signed out');
          setAdmin(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('👋 Admin sign in detected, checking access...');
          await checkAdminAccess();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      console.log('🧹 Admin auth cleanup completed');
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('🔐 Admin sign in attempt for:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error('❌ Admin sign in error:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Admin authentication successful, checking admin access...');
    // Admin access check will be handled by the auth state change listener
  };

  const signOut = async (): Promise<void> => {
    console.log('👋 Admin signing out...');
    setAdmin(null);
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Admin sign out error:', error.message);
      throw new Error(error.message);
    }
    
    console.log('✅ Admin signed out successfully');
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