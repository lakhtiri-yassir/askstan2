import { createClient } from '@supabase/supabase-js';
import { Database, UserProfile, Subscription, ChatSession } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// User Profile Service
export const userService = {
  async createProfileManual(userId: string, email: string): Promise<UserProfile> {
    console.log('Creating profile manually for user:', userId, email);
    
    try {
      // Use the manual profile creation function
      const { data, error } = await supabase.rpc('create_user_profile_manual', {
        user_id: userId,
        user_email: email
      });
      
      if (error) {
        console.error('RPC function error, trying direct insert:', error);
        
        // Fallback to direct insert
        const { data: insertData, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: email,
            email_verified: true  // Skip email verification
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Direct insert also failed:', insertError);
          throw insertError;
        }
        
        return insertData;
      }
      
      if (!data) {
        throw new Error('No profile data returned');
      }
      
      return data;
      
    } catch (error) {
      console.error('Profile creation failed completely:', error);
      throw new Error(`Failed to create user profile: ${error}`);
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
  
  async createChatSession(sessionData: Database['public']['Tables']['chat_sessions']['Insert']): Promise<ChatSession> {
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