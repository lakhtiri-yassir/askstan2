/*
  # AskStan! Database Schema Setup

  1. New Tables
    - `user_profiles` - Extended user profile data beyond Supabase auth
      - `id` (uuid, references auth.users)
      - `email` (text, not null)
      - `display_name` (text, optional)
      - `avatar_url` (text, optional)
      - `email_verified` (boolean, default false)
      - `created_at` (timestamptz, auto)
      - `updated_at` (timestamptz, auto)

    - `subscriptions` - Stripe subscription management
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `stripe_customer_id` (text, optional)
      - `stripe_subscription_id` (text, unique)
      - `plan_type` (text, monthly/yearly)
      - `status` (text, active/cancelled/expired/past_due/trialing)
      - `current_period_start` (timestamptz, optional)
      - `current_period_end` (timestamptz, optional)
      - `cancel_at_period_end` (boolean, default false)
      - `created_at` (timestamptz, auto)
      - `updated_at` (timestamptz, auto)

    - `chat_sessions` - Chat session tracking for analytics
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `title` (text, default 'New Conversation')
      - `external_session_id` (text, optional for external chatbot tracking)
      - `created_at` (timestamptz, auto)
      - `updated_at` (timestamptz, auto)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Users can only view/modify their own records

  3. Functions & Triggers
    - Auto-update timestamps on record changes
    - Auto-create user profile when auth user is created
*/

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table for Stripe integration
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

-- Create chat_sessions table for tracking user interactions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  external_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscription" ON public.subscriptions 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscription" ON public.subscriptions 
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for chat_sessions
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions 
  FOR ALL USING (user_id = auth.uid());

-- Create function for updating updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON public.chat_sessions 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, email_verified)
  VALUES (NEW.id, NEW.email, NEW.email_confirmed_at IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at DESC);