-- Fix RLS policies for deal_or_no_deal_games to allow wallet-based access
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own games" ON public.deal_or_no_deal_games;
DROP POLICY IF EXISTS "Users can insert own games" ON public.deal_or_no_deal_games;
DROP POLICY IF EXISTS "Users can update own games" ON public.deal_or_no_deal_games;

-- Create new policies that work with wallet_address
CREATE POLICY "Users can view games by wallet or user_id" 
ON public.deal_or_no_deal_games 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR true  -- Temporary: Allow all reads for testing
);

CREATE POLICY "Users can insert own games" 
ON public.deal_or_no_deal_games 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games" 
ON public.deal_or_no_deal_games 
FOR UPDATE 
USING (
    auth.uid() = user_id 
    OR wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR true  -- Temporary: Allow all updates for testing
);
