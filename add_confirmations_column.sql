-- Add confirmations column to payment_intents
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS confirmations INTEGER DEFAULT 0;
