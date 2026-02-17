-- Safely update withdrawal_requests schema to support frontend expectations and payment tracking
DO $$ 
BEGIN
    -- Add created_date if it doesn't exist (copy from created_at if possible)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawal_requests' AND column_name='created_date') THEN
        ALTER TABLE public.withdrawal_requests ADD COLUMN created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
        
        -- Backfill created_date from created_at for existing records
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawal_requests' AND column_name='created_at') THEN
            UPDATE public.withdrawal_requests SET created_date = created_at WHERE created_date IS NULL;
        END IF;
    END IF;

    -- Add tx_hash for payment tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawal_requests' AND column_name='tx_hash') THEN
        ALTER TABLE public.withdrawal_requests ADD COLUMN tx_hash TEXT;
    END IF;

    -- Add penalty_amount for early withdrawal tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawal_requests' AND column_name='penalty_amount') THEN
        ALTER TABLE public.withdrawal_requests ADD COLUMN penalty_amount NUMERIC DEFAULT 0;
    END IF;

    -- Add net_amount for final payment amount tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdrawal_requests' AND column_name='net_amount') THEN
        ALTER TABLE public.withdrawal_requests ADD COLUMN net_amount NUMERIC;
    END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN public.withdrawal_requests.tx_hash IS 'The blockchain transaction hash for the payout';
COMMENT ON COLUMN public.withdrawal_requests.penalty_amount IS 'The 10% early withdrawal penalty for Traditional Pool';
COMMENT ON COLUMN public.withdrawal_requests.net_amount IS 'The final amount to be paid after penalties';
COMMENT ON COLUMN public.withdrawal_requests.created_date IS 'Duplicate of created_at for frontend compatibility';
