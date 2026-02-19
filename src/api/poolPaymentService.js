
import { supabase } from '@/lib/supabaseClient';

export const poolPaymentService = {
    // 1. Create Payment Intent
    createPaymentIntent: async ({ amount, poolType, userAddress, poolAddress, durationMonths }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('payment_intents')
            .insert({
                user_id: user.id,
                order_id: `POOL-${poolType}-${Date.now()}`,
                expected_amount: amount,
                expected_from_address: userAddress,
                expected_to_address: poolAddress,
                status: 'PENDING',
                target_confirmations: 12, // Required for pool payments
                metadata: {
                    pool_type: poolType,
                    duration_months: durationMonths,
                    pool_address: poolAddress,
                    created_at: new Date().toISOString()
                }
            })
            .select() // Return the created intent
            .single();

        if (error) throw error;
        return data;
    },

    // 2. Update with Transaction Hash
    updateTxHash: async (intentId, txHash) => {
        const { error } = await supabase
            .from('payment_intents')
            .update({
                tx_hash: txHash,
                status: 'PENDING', // Ensure status is PENDING to trigger monitor
                updated_at: new Date()
            })
            .eq('id', intentId);

        if (error) throw error;
    },

    // 3. Check Status (Polling)
    checkPaymentStatus: async (intentId) => {
        const { data, error } = await supabase
            .from('payment_intents')
            .select('status, confirmations, tx_hash, target_confirmations')
            .eq('id', intentId)
            .single();

        if (error) throw error;
        return data; // returns { status, confirmations, tx_hash }
    },

    // 3.5 Get Active Intent (Recovery)
    getActiveIntent: async (userId, poolType) => {
        // Fetch the most recent PENDING/CONFIRMING intent for this pool
        const { data, error } = await supabase
            .from('payment_intents')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'PENDING') // Or CONFIRMING. Let's just monitor all active.
            .or('status.eq.PENDING,status.eq.CONFIRMING')
            .contains('metadata', { pool_type: poolType })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) console.warn('Error checking active intent:', error);
        return data;
    },

    // 4. Finalize Deposit
    finalizeDeposit: async (intentId) => {
        const { data, error } = await supabase.rpc('finalize_verified_pool_deposit', {
            p_intent_id: intentId
        });

        if (error) throw error;
        return data; // returns { status: 'success/error', message }
    }
};
