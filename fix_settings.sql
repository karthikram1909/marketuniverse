-- Enable RLS for Game Settings
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to game settings
CREATE POLICY "Public Read Game Settings" ON public.game_settings FOR SELECT USING (true);

-- Ensure the wallet address is set
UPDATE public.game_settings 
SET game_wallet_address = '0x508D61ad3f1559679BfAe3942508B4cf7767935A' 
WHERE game_type = 'dealornodeal';
