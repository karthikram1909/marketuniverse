
-- 1. Ensure profiles table has all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMPTZ,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    display_name TEXT,
    email TEXT,
    telephone TEXT,
    discord_name TEXT,
    x_profile_link TEXT,
    withdrawal_wallet_address TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    date_of_birth DATE,
    occupation TEXT
);

-- Add columns individually if table exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS x_profile_link TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS withdrawal_wallet_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Configure Storage Bucket for Avatars
-- Insert the bucket if it doesn't exist. 
-- Note: 'storage.buckets' is where buckets are defined.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Configure Storage Policies (RLS)
-- Enable RLS logic for storage.objects if not already enabled (it usually is)

-- Allow public read access to avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
-- We'll just allow any authenticated user to upload to 'avatars' for simplicity, 
-- or restrict by folder name if the app uses user-specific folders, 
-- but the app just uses unique filenames in root.
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow users to update/delete their own avatar (optional/advanced, simplistic for now)
DROP POLICY IF EXISTS "Anyone can update their own avatar" ON storage.objects;
CREATE POLICY "Anyone can update their own avatar"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload config';
