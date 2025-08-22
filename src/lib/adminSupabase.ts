// src/lib/adminSupabase.ts - Admin client with service role key to bypass RLS
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for admin access. Please check your .env file.');
}

// Create admin client with service role key to bypass RLS completely
export const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin service functions that bypass RLS
export const adminService = {
  // Get all users with their subscriptions (bypasses RLS)
  async getAllUsers() {
    console.log('🔍 Admin: Loading all users with service role...');
    
    try {
      // Get all users from user_profiles
      const { data: users, error: usersError } = await adminSupabase
        .from('user_profiles')
        .select(`
          id,
          email,
          display_name,
          email_verified,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('❌ Error loading users:', usersError);
        throw usersError;
      }

      console.log('✅ Loaded users:', users?.length || 0);

      // Get all subscriptions separately
      const { data: subscriptions, error: subsError } = await adminSupabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          plan_type,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (subsError) {
        console.error('❌ Error loading subscriptions:', subsError);
        // Don't throw here, just log the error and continue with empty subscriptions
        console.warn('Continuing without subscription data...');
      }

      console.log('✅ Loaded subscriptions:', subscriptions?.length || 0);

      // Combine users with their subscriptions
      const usersWithSubscriptions = users?.map(user => {
        // Find all subscriptions for this user
        const userSubscriptions = subscriptions?.filter(sub => sub.user_id === user.id) || [];
        
        // Get the most recent active/trialing subscription, or the most recent one
        let activeSubscription = userSubscriptions.find(sub => 
          sub.status === 'active' || sub.status === 'trialing'
        );
        
        if (!activeSubscription && userSubscriptions.length > 0) {
          activeSubscription = userSubscriptions.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
        }

        return {
          ...user,
          subscription: activeSubscription || null
        };
      }) || [];

      console.log('✅ Combined data:', usersWithSubscriptions.length);
      return usersWithSubscriptions;

    } catch (error) {
      console.error('❌ Admin service error:', error);
      throw error;
    }
  },

  // Grant subscription to user (bypasses RLS)
  async grantSubscription(userId: string, planType: 'monthly' | 'yearly' = 'monthly') {
    console.log('🎁 Admin: Granting subscription to user:', userId);
    
    try {
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
        console.error('❌ Error granting subscription:', error);
        throw error;
      }

      console.log('✅ Subscription granted successfully');
    } catch (error) {
      console.error('❌ Admin grant subscription error:', error);
      throw error;
    }
  },

  // Cancel user subscription (bypasses RLS)
  async cancelSubscription(userId: string) {
    console.log('🚫 Admin: Cancelling subscription for user:', userId);
    
    try {
      const { error } = await adminSupabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error cancelling subscription:', error);
        throw error;
      }

      console.log('✅ Subscription cancelled successfully');
    } catch (error) {
      console.error('❌ Admin cancel subscription error:', error);
      throw error;
    }
  },

  // Get admin statistics (bypasses RLS)
  async getStats() {
    console.log('📊 Admin: Loading statistics...');
    
    try {
      const users = await this.getAllUsers();
      
      const stats = {
        totalUsers: users.length,
        activeSubscriptions: users.filter(user => 
          user.subscription?.status === 'active' || user.subscription?.status === 'trialing'
        ).length,
        trialingUsers: users.filter(user => 
          user.subscription?.status === 'trialing'
        ).length,
        cancelledSubscriptions: users.filter(user => 
          user.subscription?.status === 'cancelled'
        ).length
      };

      console.log('✅ Stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Admin stats error:', error);
      throw error;
    }
  }
};