-- Create Payment Intents table for Crypto Confirmation Flow
CREATE TABLE IF NOT EXISTS public.payment_intents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id TEXT,
    expected_from_address TEXT,
    expected_to_address TEXT,
    expected_amount NUMERIC,
    status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMING, CONFIRMED, FAILED
    tx_hash TEXT UNIQUE,
    tx_block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to create (for demo purposes, otherwise restrict to auth users)
CREATE POLICY "Enable insert for authenticated users only" ON public.payment_intents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable read for users based on user_id" ON public.payment_intents FOR SELECT USING (auth.uid() = id); -- Wait, there is no user_id column. 

-- Let's add user_id to track who owns the payment
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.payment_intents;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.payment_intents;

CREATE POLICY "Users can create their own payment intents" ON public.payment_intents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own payment intents" ON public.payment_intents FOR SELECT USING (auth.uid() = user_id);
-- Service role (worker) can do everything by default.

-- Index for polling
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_addresses ON public.payment_intents(expected_to_address, expected_from_address);
