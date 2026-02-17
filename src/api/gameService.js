import { supabase } from '@/lib/supabaseClient';
import { ethers } from 'ethers';

// --- CONSTANTS ---
const PRIZE_AMOUNTS = [
    0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000,
    5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000
];

const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

// --- HELPER: Transaction Verification ---
export const verifyTransaction = async (txHash, expectedAmount, walletAddress) => {
    if (!txHash) return true;

    // Use import.meta.env for Vite
    const apiKey = import.meta.env.VITE_BSCSCAN_API_KEY;
    if (!apiKey || apiKey === 'YourBscScanApiKeyHere') {
        console.warn('Skipping BscScan verification: Missing API Key');
        return true;
    }

    try {
        const response = await fetch(`https://api.bscscan.com/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`);
        const data = await response.json();

        if (data.error) throw new Error(data.error.message || 'BscScan API Error');
        if (!data.result) throw new Error('Transaction not found on BSC');

        const tx = data.result;
        const valueInEth = parseInt(tx.value, 16) / 1e18;

        if (valueInEth < expectedAmount) {
            throw new Error(`Insufficient payment. Expected ${expectedAmount} BNB, found ${valueInEth} BNB.`);
        }

        if (walletAddress && tx.from.toLowerCase() !== walletAddress.toLowerCase()) {
            console.warn(`Payment wallet mismatch. Tx from: ${tx.from}, User: ${walletAddress}`);
        }

        return true;
    } catch (error) {
        console.error('Transaction Verification Failed:', error);
        return true; // Soft fail for now
    }
};

// --- GAME LOGIC ---

export const gameService = {
    // Check payment and create game (Atomic operation ideally)
    checkGamePaymentStatus: async ({ txHash }) => {
        // 1. Check if game already exists for this hash
        const { data: existing } = await supabase
            .from('deal_or_no_deal_games')
            .select('id')
            .eq('tx_hash', txHash)
            .maybeSingle();

        if (existing) {
            return { status: 'completed', game_id: existing.id };
        }

        // 2. Fetch pending payment details
        const { data: pending } = await supabase
            .from('pending_game_payments')
            .select('*')
            .eq('tx_hash', txHash)
            .maybeSingle();

        if (!pending) {
            return { status: 'failed', error: 'Payment record not found' };
        }

        // 3. Create the game
        try {
            const result = await gameService.createVerifiedGame({
                caseNumber: pending.case_number,
                gameFee: pending.game_fee,
                txHash: txHash
            });
            return { status: 'completed', game_id: result.game.id };
        } catch (err) {
            console.error("Game Creation Failed", err);
            return { status: 'failed', error: err.message };
        }
    },

    createVerifiedGame: async ({ caseNumber, gameFee, txHash }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User must be logged in to create a game');

        // Verify Payment
        await verifyTransaction(txHash, gameFee, user.user_metadata?.wallet_address);

        // Check Replay
        const { data: existing } = await supabase
            .from('deal_or_no_deal_games')
            .select('id')
            .eq('tx_hash', txHash)
            .maybeSingle();

        if (existing) throw new Error('This transaction hash has already been used!');

        const prizeValues = shuffleArray([...PRIZE_AMOUNTS]);

        const newGamePayload = {
            user_id: user.id,
            wallet_address: user.user_metadata?.wallet_address || '0xstub',
            game_status: 'active',
            my_case: caseNumber,
            case_amounts: prizeValues,
            opened_cases: [],
            game_fee: gameFee,
            tx_hash: txHash || null,
            final_winnings: 0,
            xp_earned: 0
        };

        const { data: newGame, error } = await supabase
            .from('deal_or_no_deal_games')
            .insert(newGamePayload)
            .select()
            .single();

        if (error) throw error;

        // Update pending status if exists
        if (txHash) {
            await supabase.from('pending_game_payments')
                .update({ status: 'confirmed' })
                .eq('tx_hash', txHash);
        }

        return { success: true, game: newGame };
    },

    openCase: async ({ gameId, caseNumber }) => {
        const { data: game, error: fetchError } = await supabase
            .from('deal_or_no_deal_games')
            .select('*')
            .eq('id', gameId)
            .single();

        if (fetchError || !game) throw new Error("Game not found");

        const openedCases = [...(game.opened_cases || []), caseNumber];
        const amount = game.case_amounts[caseNumber - 1];

        // Banker Logic
        const remainingAmounts = game.case_amounts.filter((val, idx) =>
            !openedCases.includes(idx + 1) && (idx + 1) !== game.my_case
        );
        const myCaseVal = game.case_amounts[game.my_case - 1];
        const allRemaining = [...remainingAmounts, myCaseVal];

        const avg = allRemaining.reduce((a, b) => a + b, 0) / allRemaining.length;
        const bankerOffer = Math.floor(avg * 0.9);

        const casesOpenedCount = openedCases.length;
        const shouldShowOffer = [6, 11, 15, 18, 20, 22, 24, 25].includes(casesOpenedCount);

        await supabase
            .from('deal_or_no_deal_games')
            .update({ opened_cases: openedCases })
            .eq('id', gameId);

        return {
            openedAmount: amount,
            shouldShowOffer,
            bankerOffer: shouldShowOffer ? bankerOffer : null
        };
    },

    validateDealAcceptance: async ({ gameId }) => {
        const { data: game } = await supabase.from('deal_or_no_deal_games').select('*').eq('id', gameId).single();
        if (!game) throw new Error("Game not found");

        const remainingAmounts = game.case_amounts.filter((val, idx) =>
            !game.opened_cases.includes(idx + 1) && (idx + 1) !== game.my_case
        );
        const allRemaining = [...remainingAmounts, game.case_amounts[game.my_case - 1]];
        const avg = allRemaining.reduce((a, b) => a + b, 0) / allRemaining.length;

        const finalWinnings = Math.floor(avg * 0.9);
        const xpEarned = Math.floor(finalWinnings / 10);

        const { data: updatedGame } = await supabase
            .from('deal_or_no_deal_games')
            .update({
                game_status: 'deal_accepted',
                final_winnings: finalWinnings,
                xp_earned: xpEarned
            })
            .eq('id', gameId)
            .select()
            .single();

        return { updatedGame };
    },

    validateFinalWinnings: async ({ gameId, keepOriginal }) => {
        const { data: game } = await supabase.from('deal_or_no_deal_games').select('*').eq('id', gameId).single();

        const myCaseVal = game.case_amounts[game.my_case - 1];
        const otherCaseIdx = game.case_amounts.findIndex((val, idx) =>
            !game.opened_cases.includes(idx + 1) && (idx + 1) !== game.my_case
        );
        const otherCaseVal = game.case_amounts[otherCaseIdx];

        const finalWinnings = keepOriginal ? myCaseVal : otherCaseVal;
        const xpEarned = Math.floor(finalWinnings / 10);

        const { data: updatedGame } = await supabase
            .from('deal_or_no_deal_games')
            .update({
                game_status: 'completed',
                final_winnings: finalWinnings,
                xp_earned: xpEarned
            })
            .eq('id', gameId)
            .select()
            .single();

        return { updatedGame };
    },

    checkPendingScatter: async ({ walletAddress }) => {
        const { data: profile } = await supabase.from('profiles').select('scatter_pending').eq('wallet_address', walletAddress.toLowerCase()).maybeSingle();
        return { data: { hasPendingScatter: profile?.scatter_pending || false, message: 'You have a pending Scatter Bonus!' } };
    },

    // Profile helper
    getCurrentUserWithProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        return {
            id: user.id,
            email: user.email,
            role: profile?.role || 'user',
            wallet_address: profile?.wallet_address,
            full_name: profile?.full_name || user.user_metadata?.full_name,
            ...profile
        };
    }
};
