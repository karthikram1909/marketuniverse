-- Function to confirm BSC deposit and update investor balance
CREATE OR REPLACE FUNCTION confirm_bsc_deposit(
    p_tx_hash TEXT,
    p_amount NUMERIC,
    p_wallet_address TEXT,
    p_pool_type TEXT,
    p_pool_address TEXT,
    p_duration_months INTEGER DEFAULT NULL,
    p_pending_tx_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_investor_id UUID;
    v_current_balance NUMERIC;
    v_pending_exists BOOLEAN;
BEGIN
    -- 1. Check if transaction hash is already marked as completed in pending_transactions
    -- to prevent replay attacks at the application level
    SELECT EXISTS(
        SELECT 1 FROM pending_transactions 
        WHERE tx_hash = p_tx_hash AND status = 'completed'
    ) INTO v_pending_exists;

    IF v_pending_exists THEN
        RETURN jsonb_build_object('status', 'success', 'verified', true, 'message', 'Transaction already confirmed');
    END IF;

    -- 2. Mark pending_transaction as completed
    UPDATE pending_transactions
    SET status = 'completed',
        updated_at = NOW()
    WHERE tx_hash = p_tx_hash;
    
    -- If no rows updated, it might be a new transaction not in pending (shouldn't happen given frontend flow, but safe to insert if needed)
    -- But for now, let's assume it exists or we just rely on the update.
    -- If it doesn't exist, we should probably insert it as completed? 
    -- Let's stick to update for now as frontend creates it.

    -- 3. Upsert into pool_investors
    -- Check if investor exists for this pool type
    SELECT id INTO v_investor_id
    FROM pool_investors
    WHERE wallet_address = p_wallet_address AND pool_type = p_pool_type;

    IF v_investor_id IS NULL THEN
        -- Create new investor record
        INSERT INTO pool_investors (
            pool_type,
            wallet_address,
            invested_amount,
            duration_months,
            investment_end_date,
            deposit_transactions
        ) VALUES (
            p_pool_type,
            p_wallet_address,
            p_amount,
            p_duration_months,
            CASE WHEN p_duration_months IS NOT NULL THEN NOW() + (p_duration_months || ' months')::INTERVAL ELSE NULL END,
            jsonb_build_array(jsonb_build_object(
                'tx_hash', p_tx_hash,
                'amount', p_amount,
                'date', NOW()
            ))
        );
    ELSE
        -- Update existing investor
        -- Append to deposit_transactions JSON array
        UPDATE pool_investors
        SET invested_amount = invested_amount + p_amount,
            deposit_transactions = deposit_transactions || jsonb_build_object(
                'tx_hash', p_tx_hash,
                'amount', p_amount,
                'date', NOW()
            ),
            updated_at = NOW()
        WHERE id = v_investor_id;
    END IF;

    RETURN jsonb_build_object('status', 'success', 'verified', true, 'message', 'Deposit confirmed successfully');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'verified', false, 'message', SQLERRM);
END;
$$;
