-- Run this in Supabase SQL Editor to update your existing tables

-- 1. Add missing columns to profiles (if they don't exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS telephone text,
ADD COLUMN IF NOT EXISTS discord_name text,
ADD COLUMN IF NOT EXISTS x_profile_link text,
ADD COLUMN IF NOT EXISTS withdrawal_wallet_address text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS occupation text;

-- 2. Add tx_hash to deal_or_no_deal_games
ALTER TABLE public.deal_or_no_deal_games 
ADD COLUMN IF NOT EXISTS tx_hash text;

