
-- Add metadata column to payment_intents for storing context (pool_type, duration, etc.)
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Function to finalize a pool deposit after payment confirmation
CREATE OR REPLACE FUNCTION finalize_verified_pool_deposit(
    p_intent_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_intent RECORD;
    v_pool_type TEXT;
    v_duration_months INTEGER;
    v_amount NUMERIC;
    v_wallet_address TEXT;
    v_investor_id UUID;
    v_tx_hash TEXT;
BEGIN
    -- 1. Fetch the confirmed payment intent
    SELECT * INTO v_intent
    FROM payment_intents
    WHERE id = p_intent_id;

    IF v_intent IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Payment intent not found');
    END IF;

    -- 2. Verify Status
    IF v_intent.status != 'CONFIRMED' THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Payment not confirmed yet. Current status: ' || v_intent.status);
    END IF;

    -- 3. Check Idempotency (if already processed)
    -- We'll use a flag in metadata OR check if status is 'COMPLETED' (app-level completion)
    -- Let's use metadata->>'processed'
    IF (v_intent.metadata->>'processed')::BOOLEAN IS TRUE THEN
        RETURN jsonb_build_object('status', 'success', 'message', 'Deposit already processed');
    END IF;

    -- 4. Extract Details
    v_pool_type := v_intent.metadata->>'pool_type';
    v_duration_months := (v_intent.metadata->>'duration_months')::INTEGER;
    v_amount := v_intent.expected_amount;
    v_wallet_address := v_intent.expected_from_address; -- or user_id mapping
    v_tx_hash := v_intent.tx_hash;

    IF v_pool_type IS NULL THEN
         RETURN jsonb_build_object('status', 'error', 'message', 'Invalid payment intent: missing pool_type in metadata');
    END IF;

    -- 5. Upsert into pool_investors (Logic from original confirm_bsc_deposit)
    
    -- Check if investor exists
    SELECT id INTO v_investor_id
    FROM pool_investors
    WHERE wallet_address = v_wallet_address AND pool_type = v_pool_type;

    IF v_investor_id IS NULL THEN
        -- Create new investor
        INSERT INTO pool_investors (
            pool_type,
            wallet_address,
            invested_amount,
            duration_months,
            investment_end_date,
            deposit_transactions,
            created_at,
            updated_at
        ) VALUES (
            v_pool_type,
            v_wallet_address,
            v_amount,
            v_duration_months,
            CASE 
                WHEN v_duration_months IS NOT NULL THEN NOW() + (v_duration_months || ' months')::INTERVAL 
                ELSE NULL 
            END,
            jsonb_build_array(jsonb_build_object(
                'tx_hash', v_tx_hash,
                'amount', v_amount,
                'date', NOW(),
                'intent_id', p_intent_id
            )),
            NOW(),
            NOW()
        );
    ELSE
        -- Update existing investor
        UPDATE pool_investors
        SET invested_amount = invested_amount + v_amount,
            deposit_transactions = deposit_transactions || jsonb_build_object(
                'tx_hash', v_tx_hash,
                'amount', v_amount,
                'date', NOW(),
                'intent_id', p_intent_id
            ),
            updated_at = NOW()
        WHERE id = v_investor_id;
    END IF;

    -- 6. Mark Intent as Processed
    -- We can use a dedicated status 'COMPLETED' or just metadata flag.
    -- Let's use metadata flag to keep 'CONFIRMED' visible for debugging, or status 'COMPLETED' is cleaner.
    -- The monitor only cares about PENDING/CONFIRMING. So changing to COMPLETED is safe and good.
    
    UPDATE payment_intents
    SET status = 'COMPLETED',
        metadata = metadata || '{"processed": true}'::jsonb,
        updated_at = NOW()
    WHERE id = p_intent_id;

    RETURN jsonb_build_object('status', 'success', 'message', 'Pool deposit finalized successfully');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
