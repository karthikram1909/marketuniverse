-- Add missing columns to pool_settings table if they don't exist

DO $$
BEGIN
    -- Check and add pool_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pool_settings' AND column_name = 'pool_address') THEN
        ALTER TABLE public.pool_settings ADD COLUMN pool_address TEXT;
    END IF;

    -- Check and add usdt_contract
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pool_settings' AND column_name = 'usdt_contract') THEN
        ALTER TABLE public.pool_settings ADD COLUMN usdt_contract TEXT;
    END IF;

    -- Check and add profit_share_rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pool_settings' AND column_name = 'profit_share_rate') THEN
        ALTER TABLE public.pool_settings ADD COLUMN profit_share_rate NUMERIC DEFAULT 0.20;
    END IF;

    -- Check and add deposits_locked
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pool_settings' AND column_name = 'deposits_locked') THEN
        ALTER TABLE public.pool_settings ADD COLUMN deposits_locked BOOLEAN DEFAULT false;
    END IF;

    -- Check and add withdrawals_locked
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pool_settings' AND column_name = 'withdrawals_locked') THEN
        ALTER TABLE public.pool_settings ADD COLUMN withdrawals_locked BOOLEAN DEFAULT false;
    END IF;

END $$;
