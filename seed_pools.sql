-- Seed 'scalping' and 'vip' pools with initial settings and a dummy investor to enable Trade Splitter

-- 1. Ensure Pool Settings exist
INSERT INTO public.pool_settings (pool_type, pool_address, profit_share_rate, deposits_locked, withdrawals_locked)
VALUES 
    ('scalping', '0xScalpingPoolAddress123', 0.30, false, false),
    ('vip', '0xVipPoolAddress456', 0.25, false, false)
ON CONFLICT DO NOTHING; -- Assuming there might be a constraint, or we just rely on ID. 
-- Actually pool_settings PK is ID. We should check emptiness or just insert if not exists by type.
-- Let's use written logic to avoid duplicates if specific columns aren't unique constraints.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.pool_settings WHERE pool_type = 'scalping') THEN
        INSERT INTO public.pool_settings (pool_type, pool_address, profit_share_rate)
        VALUES ('scalping', '0xScalpingPoolAddress123', 0.30);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.pool_settings WHERE pool_type = 'vip') THEN
        INSERT INTO public.pool_settings (pool_type, pool_address, profit_share_rate)
        VALUES ('vip', '0xVipPoolAddress456', 0.25);
    END IF;
END $$;


-- 2. Add Dummy Investors (if no investors exist for these pools to avoid skewing real data)
-- We'll add them only if the pool total balance is currently 0.

DO $$
DECLARE
    v_scalping_balance NUMERIC;
    v_vip_balance NUMERIC;
BEGIN
    -- Check Scalping Pool
    SELECT COALESCE(SUM(invested_amount), 0) INTO v_scalping_balance
    FROM public.pool_investors WHERE pool_type = 'scalping';

    IF v_scalping_balance = 0 THEN
        INSERT INTO public.pool_investors (pool_type, wallet_address, investor_name, invested_amount)
        VALUES ('scalping', '0xseedinvestor1', 'Seed Investor (Crypto)', 5000);
    END IF;

    -- Check VIP Pool
    SELECT COALESCE(SUM(invested_amount), 0) INTO v_vip_balance
    FROM public.pool_investors WHERE pool_type = 'vip';

    IF v_vip_balance = 0 THEN
        INSERT INTO public.pool_investors (pool_type, wallet_address, investor_name, invested_amount)
        VALUES ('vip', '0xseedinvestor2', 'Seed Investor (VIP)', 10000);
    END IF;
END $$;
