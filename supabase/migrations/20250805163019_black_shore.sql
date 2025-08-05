/*
  # Initial AskStan! Database Schema

  1. New Tables
    - `user_profiles` - Extended user profile data
    - `subscriptions` - Stripe subscription management
    - `chat_sessions` - Chat session tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create updated_at triggers

  3. Functions
    - Auto-update timestamps
    - User profile creation trigger
*/

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table (for tracking user sessions, even with external chatbot)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  external_session_id TEXT, -- To track sessions with external chatbot if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions FOR ALL USING (user_id = auth.uid());

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, email_verified)
  VALUES (NEW.id, NEW.email, NEW.email_confirmed_at IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();