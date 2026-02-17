-- Run this in Supabase SQL Editor to update GAME WALLET ADDRESS

-- Update existing settings
UPDATE public.game_settings 
SET game_wallet_address = '0x508D61ad3f1559679BfAe3942508B4cf7767935A' 
WHERE game_type = 'dealornodeal';

-- Insert default if not exists (handling empty table case)
INSERT INTO public.game_settings (game_type, entry_fee, scatter_consecutive_wins, game_wallet_address)
SELECT 'dealornodeal', 0.01, 3, '0x508D61ad3f1559679BfAe3942508B4cf7767935A'
WHERE NOT EXISTS (SELECT 1 FROM public.game_settings WHERE game_type = 'dealornodeal');
