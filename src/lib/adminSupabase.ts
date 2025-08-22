// src/lib/adminSupabase.ts - Admin client with service role key
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for admin access. Please check your .env file.');
}

// Create admin client with service role key to bypass RLS
export const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin-specific type for user management
export interface AdminUserView {
  id: string;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  subscriptions: {
    id: string;
    plan_type: string;
    status: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
    created_at: string;
  }[];
}

// Admin service functions
export const adminService = {
  // Get all users with their subscriptions
  async getAllUsers(): Promise<AdminUserView[]> {
    console.log('🔍 Admin: Loading all users...');
    
    const { data, error } = await adminSupabase
      .from('user_profiles')
      .select(`
        id,
        email,
        display_name,
        email_verified,
        created_at,
        updated_at,
        subscriptions!inner (
          id,
          plan_type,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Admin: Error loading users:', error);
      throw error;
    }

    console.log('✅ Admin: Loaded', data?.length || 0, 'users');
    return data || [];
  },

  // Grant subscription to user
  async grantSubscription(userId: string, planType: 'monthly' | 'yearly' = 'monthly'): Promise<void> {
    console.log('🎁 Admin: Granting subscription to user:', userId);
    
    const { error } = await adminSupabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + (planType === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Admin: Error granting subscription:', error);
      throw error;
    }

    console.log('✅ Admin: Subscription granted successfully');
  },

  // Cancel user subscription
  async cancelSubscription(userId: string): Promise<void> {
    console.log('🚫 Admin: Cancelling subscription for user:', userId);
    
    const { error } = await adminSupabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Admin: Error cancelling subscription:', error);
      throw error;
    }

    console.log('✅ Admin: Subscription cancelled successfully');
  },

  // Get admin statistics
  async getStats() {
    console.log('📊 Admin: Loading statistics...');
    
    const { data: users, error: usersError } = await adminSupabase
      .from('user_profiles')
      .select(`
        id,
        subscriptions (
          status
        )
      `);

    if (usersError) {
      console.error('❌ Admin: Error loading stats:', usersError);
      throw usersError;
    }

    const totalUsers = users?.length || 0;
    let activeSubscriptions = 0;
    let trialingUsers = 0;
    let cancelledSubscriptions = 0;

    users?.forEach(user => {
      if (user.subscriptions && user.subscriptions.length > 0) {
        const sub = user.subscriptions[0]; // Most recent subscription
        if (sub.status === 'active') activeSubscriptions++;
        else if (sub.status === 'trialing') trialingUsers++;
        else if (sub.status === 'cancelled') cancelledSubscriptions++;
      }
    });

    const stats = {
      totalUsers,
      activeSubscriptions,
      trialingUsers,
      cancelledSubscriptions
    };

    console.log('✅ Admin: Stats loaded:', stats);
    return stats;
  }
};