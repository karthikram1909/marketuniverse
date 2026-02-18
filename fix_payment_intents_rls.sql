-- Allow anon (backend worker) to read and update payment_intents
DROP POLICY IF EXISTS "Users can view their own payment intents" ON public.payment_intents;
DROP POLICY IF EXISTS "Users can create their own payment intents" ON public.payment_intents;

-- Enable full access for everyone (simplest for this dev setup with anon key backend)
CREATE POLICY "Enable full access for all" ON public.payment_intents FOR ALL USING (true) WITH CHECK (true);
