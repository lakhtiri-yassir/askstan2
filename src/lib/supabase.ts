import { createClient } from '@supabase/supabase-js';
import { Database, UserProfile, Subscription, ChatSession } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// User Profile Service
export const userService = {
  async createProfile(userId: string, email: string): Promise<UserProfile> {
    // Use the database function for safe profile creation
    const { data, error } = await supabase.rpc('create_user_profile', {
      user_id: userId,
      user_email: email
    });
    
    if (error) throw error;
    return data;
  },
  
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async verifyEmail(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ email_verified: true })
      .eq('id', userId);
    
    if (error) throw error;
  }
};

// Subscription Service
export const subscriptionService = {
  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  async createSubscription(subscriptionData: Database['public']['Tables']['subscriptions']['Insert']): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Chat Service
export const chatService = {
  async getSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  async createSession(userId: string, title?: string): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: title || 'New Conversation'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) throw error;
  }
};

// Email Service
export const emailService = {
  async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'email_verification',
          email,
          data: { verificationUrl }
        }
      });
      
      if (error) {
        console.warn('Email service error:', error);
        // Don't throw error - signup should still succeed even if email fails
      }
    } catch (error) {
      console.warn('Email service not available:', error);
      // Don't throw error - signup should still succeed
    }
  },

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'password_reset',
          email,
          data: { resetUrl }
        }
      });
      
      if (error) {
        console.warn('Email service error:', error);
      }
    } catch (error) {
      console.warn('Email service not available:', error);
      throw new Error('Failed to send password reset email. Please try again later.');
    }
  }
};