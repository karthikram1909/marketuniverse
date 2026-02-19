
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS target_confirmations INTEGER DEFAULT 6;
