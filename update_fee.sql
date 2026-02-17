-- Run this in Supabase SQL Editor to update GAME SETTINGS

-- Update existing settings to 0.01
UPDATE public.game_settings 
SET entry_fee = 0.01 
WHERE game_type = 'dealornodeal';

-- Insert default if not exists (handling empty table case)
INSERT INTO public.game_settings (game_type, entry_fee, scatter_consecutive_wins)
SELECT 'dealornodeal', 0.01, 3
WHERE NOT EXISTS (SELECT 1 FROM public.game_settings WHERE game_type = 'dealornodeal');
