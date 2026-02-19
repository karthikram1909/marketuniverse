
-- Ensure profiles table exists and has all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMPTZ,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    
    -- Add columns used by UserProfileForm
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

-- Add columns if table exists but columns are missing
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING ( true );

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING ( auth.uid() = id );

-- Fix for "400 Bad Request" if attempting to update non-existent email column or similar
-- The UserProfileForm sends 'email' in the upsert payload. Ensure it exists.
-- (Added above)

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
