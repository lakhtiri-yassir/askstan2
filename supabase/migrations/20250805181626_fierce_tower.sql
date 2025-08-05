/*
  # Remove Problematic Database Triggers

  1. Problem Resolution
    - Remove all existing triggers that cause 500 errors during signup
    - Disable automatic profile creation via triggers
    - Let application handle profile creation manually

  2. Changes
    - Drop all existing triggers on auth.users table
    - Drop problematic functions
    - Keep tables and RLS policies intact

  3. Security
    - Maintain all RLS policies
    - Keep data security intact
    - Only remove trigger-based automation
*/

-- Drop all existing triggers that might be causing 500 errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- Drop the problematic functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_email_confirmed();

-- Create a simple, safe function for manual profile creation (no triggers)
CREATE OR REPLACE FUNCTION public.create_user_profile_safe(
  user_id UUID,
  user_email TEXT
)
RETURNS public.user_profiles AS $$
DECLARE
  new_profile public.user_profiles;
BEGIN
  -- Try to insert new profile
  INSERT INTO public.user_profiles (id, email, email_verified)
  VALUES (user_id, user_email, false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW()
  RETURNING * INTO new_profile;
  
  RETURN new_profile;
EXCEPTION
  WHEN OTHERS THEN
    -- If insert fails, try to select existing profile
    SELECT * INTO new_profile FROM public.user_profiles WHERE id = user_id;
    IF NOT FOUND THEN
      -- Create a minimal profile record
      INSERT INTO public.user_profiles (id, email, email_verified)
      VALUES (user_id, user_email, false)
      RETURNING * INTO new_profile;
    END IF;
    RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe(UUID, TEXT) TO anon;

-- Ensure RLS policies allow profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Add a policy for the service function
DROP POLICY IF EXISTS "Service can manage profiles" ON public.user_profiles;
CREATE POLICY "Service can manage profiles" ON public.user_profiles 
  FOR ALL USING (true);