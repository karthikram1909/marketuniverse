-- Update the USDT Contract Address to the correct BEP-20 USDT address
-- The user likely entered their own wallet address by mistake

UPDATE public.pool_settings
SET usdt_contract = '0x55d398326f99059fF775485246999027B3197955',
    -- Also ensure pool_address is set if it was missing (using the one from the screenshot as the intended pool wallet)
    pool_address = COALESCE(pool_address, '0x508D61ad3f1559679BfAe3942508B4cf7767935A')
WHERE pool_type = 'traditional';
