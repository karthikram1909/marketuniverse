-- Update the pool addresses for Scalping and VIP pools to a VALID BSC wallet address
-- The previous '0xScalpingPoolAddress123' was just a placeholder and causes "Invalid Address" errors in the crypto library.

UPDATE public.pool_settings
SET pool_address = '0x508D61ad3f1559679BfAe3942508B4cf7767935A'
WHERE pool_type IN ('scalping', 'vip');
