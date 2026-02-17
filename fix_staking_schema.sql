-- Align Staking and Analytics tables with current codebase

-- Update visits table
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS is_new_visitor BOOLEAN DEFAULT false;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Update page_views table
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS visitor_id TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS page_name TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS time_spent INTEGER;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP WITH TIME ZONE;

-- Correct staking_contracts table
ALTER TABLE public.staking_contracts ADD COLUMN IF NOT EXISTS crypto_type TEXT DEFAULT 'USDT';
ALTER TABLE public.staking_contracts ADD COLUMN IF NOT EXISTS staked_amount NUMERIC DEFAULT 0;
ALTER TABLE public.staking_contracts ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 3;
ALTER TABLE public.staking_contracts ADD COLUMN IF NOT EXISTS apy_rate NUMERIC DEFAULT 0;
ALTER TABLE public.staking_contracts ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0;
ALTER TABLE public.staking_contracts ADD COLUMN IF NOT EXISTS last_update TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.staking_contracts ADD COLUMN IF NOT EXISTS tx_hash TEXT;
ALTER TABLE public.staking_contracts ADD COLUMN IF NOT EXISTS cancelled_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.staking_contracts ADD COLUMN IF NOT EXISTS penalty_paid NUMERIC DEFAULT 0;

-- Ensure pool_settings has staking indicators
ALTER TABLE public.pool_settings ADD COLUMN IF NOT EXISTS deposits_locked BOOLEAN DEFAULT false;
ALTER TABLE public.pool_settings ADD COLUMN IF NOT EXISTS withdrawals_locked BOOLEAN DEFAULT false;

-- Fix traditional pool settings if needed
-- (Not strictly staking but helps overall stability)
ALTER TABLE public.pool_settings ADD COLUMN IF NOT EXISTS pool_address TEXT;
