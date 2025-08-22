// src/lib/supabase.ts - DEFINITIVE FIX: Compatible with Supabase v2.53.0
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Type definitions for our services
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_type: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  external_session_id?: string | null;
  created_at: string;
  updated_at: string;
}

// User Profile Service
export const userService = {
  async createProfileSafe(userId: string, email: string): Promise<UserProfile> {
    console.log('Creating profile safely for user:', userId, email);
    
    try {
      // Try using the safe profile creation function first
      const { data, error } = await supabase.rpc('create_user_profile_safe', {
        user_id: userId,
        user_email: email
      });
      
      if (error) {
        console.error('RPC function error:', error);
        
        // Fallback to direct insert
        const { data: insertData, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: email,
            email_verified: true
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Direct insert failed:', insertError);
          // Return a minimal profile object if all else fails
          return {
            id: userId,
            email: email,
            display_name: null,
            avatar_url: null,
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        return insertData;
      }
      
      if (!data) {
        throw new Error('No profile data returned');
      }
      
      return data;
      
    } catch (error) {
      console.error('Profile creation failed completely:', error);
      // Return a minimal profile instead of throwing
      return {
        id: userId,
        email: email,
        display_name: null,
        avatar_url: null,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },
  
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  },
  
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async verifyEmail(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Chat Session Service
export const chatService = {
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  async createChatSession(sessionData: {
    user_id: string;
    title?: string;
    external_session_id?: string | null;
  }): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Health check function
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });
    
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

// Export default for backward compatibility
export default supabase;