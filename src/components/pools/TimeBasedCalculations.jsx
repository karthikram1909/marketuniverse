/**
 * Time-Based Share Calculation System
 * 
 * This system ensures users only get ownership of profits generated AFTER their deposits.
 * It uses a share-based model similar to mutual funds:
 * - Each deposit buys "shares" at current NAV (Net Asset Value)
 * - Each trade's PNL is distributed based on shares at trade time
 * - Each withdrawal removes shares based on current NAV
 */

// Helper to clean wallet addresses (removes Firefox/browser prefixes)
function cleanWalletAddress(address) {
    if (!address) return '';
    // Remove any protocol prefix (mxc-extension://, chrome-extension://, etc.)
    const cleaned = address.replace(/^[a-z-]+:\/\//i, '');
    return cleaned.toLowerCase();
}

export function calculateTimeBasedBalances({
    investors = [],
    trades = [],
    withdrawals = [],
    profitShareRate = 0,
    isAdmin = false
}) {
    // Collect all events with timestamps
    const events = [];

    // Add deposit events
    investors.forEach(investor => {
        (investor.deposit_transactions || []).forEach(deposit => {
            events.push({
                type: 'deposit',
                date: new Date(deposit.date),
                wallet_address: cleanWalletAddress(investor.wallet_address),
                amount: deposit.amount,
                investor
            });
        });
    });

    // Add withdrawal events (only paid/pending - they affect pool value)
    withdrawals.forEach(withdrawal => {
        // Only process paid withdrawals in the events loop
        if (withdrawal.status === 'paid') {
            events.push({
                type: 'withdrawal',
                date: new Date(withdrawal.paid_date || withdrawal.created_date || withdrawal.created_at || Date.now()),
                wallet_address: cleanWalletAddress(withdrawal.wallet_address),
                amount: withdrawal.amount,
                status: withdrawal.status,
                withdrawal
            });
        }
    });

    // Add trade events
    trades.forEach(trade => {
        events.push({
            type: 'trade',
            date: new Date(trade.date),
            pnl: trade.pnl,
            fee: trade.fee,
            trade
        });
    });

    // Sort events chronologically
    events.sort((a, b) => a.date - b.date);

    // Initialize tracking
    const userShares = {}; // wallet_address -> shares
    let totalShares = 0;
    let totalPoolValue = 0; // Deposits - Withdrawals + Net PNL
    const userPnlAccumulated = {}; // wallet_address -> accumulated PNL
    const userGrossPnlAccumulated = {}; // wallet_address -> accumulated Gross PNL
    const userFeesAccumulated = {}; // wallet_address -> accumulated Fees
    const userProfitShareAccumulated = {}; // wallet_address -> accumulated Profit Share

    // Process each event chronologically
    if (isAdmin) console.log('Total events to process:', events.length);
    events.forEach((event, idx) => {
        if (isAdmin) console.log(`Event ${idx}:`, event.type, event.wallet_address || 'trade', event.date);
        if (event.type === 'deposit') {
            const wallet = event.wallet_address;

            // Calculate NAV (Net Asset Value per share)
            const nav = totalShares > 0 ? totalPoolValue / totalShares : 1;

            // Calculate shares to give
            const newShares = event.amount / nav;

            // Add shares to user
            userShares[wallet] = (userShares[wallet] || 0) + newShares;
            totalShares += newShares;

            // Increase pool value
            totalPoolValue += event.amount;

            // Initialize PNL tracking for new users
            if (!userPnlAccumulated[wallet]) {
                userPnlAccumulated[wallet] = 0;
                userGrossPnlAccumulated[wallet] = 0;
                userFeesAccumulated[wallet] = 0;
                userProfitShareAccumulated[wallet] = 0;
            }
        }
        else if (event.type === 'withdrawal') {
            const wallet = event.wallet_address;

            // Withdrawal reduces pool value
            totalPoolValue -= event.amount;

            // Calculate NAV after trade profits but before withdrawal
            const nav = totalShares > 0 ? (totalPoolValue + event.amount) / totalShares : 1;

            // Calculate shares to remove
            const sharesToRemove = event.amount / nav;

            // Remove shares from user (but not below 0)
            if (userShares[wallet]) {
                userShares[wallet] = Math.max(0, userShares[wallet] - sharesToRemove);
                totalShares = Math.max(0, totalShares - sharesToRemove);
            }
        }
        else if (event.type === 'trade') {
            // Calculate net PNL from this trade
            const grossPnl = event.pnl;
            const fee = event.fee;
            const profitAfterFees = grossPnl - fee;
            const profitShare = profitAfterFees > 0 ? profitAfterFees * profitShareRate : 0;
            const netPnl = profitAfterFees - profitShare;

            // Distribute PNL to all shareholders proportionally
            if (totalShares > 0) {
                Object.keys(userShares).forEach(wallet => {
                    const userOwnership = userShares[wallet] / totalShares;
                    const userNetPnl = netPnl * userOwnership;
                    const userGrossPnl = grossPnl * userOwnership;
                    const userFee = fee * userOwnership;
                    const userProfitShare = profitShare * userOwnership;

                    userPnlAccumulated[wallet] = (userPnlAccumulated[wallet] || 0) + userNetPnl;
                    userGrossPnlAccumulated[wallet] = (userGrossPnlAccumulated[wallet] || 0) + userGrossPnl;
                    userFeesAccumulated[wallet] = (userFeesAccumulated[wallet] || 0) + userFee;
                    userProfitShareAccumulated[wallet] = (userProfitShareAccumulated[wallet] || 0) + userProfitShare;
                });
            }

            // Update pool value
            totalPoolValue += netPnl;
        }
    });

    // Calculate final balances for each user
    const userBalances = {};
    if (isAdmin) console.log('Final userShares:', userShares);
    if (isAdmin) console.log('Final userPnlAccumulated:', userPnlAccumulated);
    const allWallets = new Set([
        ...Object.keys(userShares),
        ...Object.keys(userPnlAccumulated)
    ]);
    if (isAdmin) console.log('All wallets found:', Array.from(allWallets));

    allWallets.forEach(wallet => {
        const shares = userShares[wallet] || 0;
        const ownership = totalShares > 0 ? shares / totalShares : 0;
        const pnlAccumulated = userPnlAccumulated[wallet] || 0;
        const grossPnlAccumulated = userGrossPnlAccumulated[wallet] || 0;
        const feesAccumulated = userFeesAccumulated[wallet] || 0;
        const profitShareAccumulated = userProfitShareAccumulated[wallet] || 0;

        // Calculate deposits from deposit_transactions (not invested_amount)
        const userDeposits = investors
            .filter(inv => cleanWalletAddress(inv.wallet_address) === wallet)
            .reduce((sum, inv) => {
                const txSum = (inv.deposit_transactions || []).reduce((s, tx) => s + tx.amount, 0);
                return sum + txSum;
            }, 0);

        const userWithdrawals = withdrawals
            .filter(w => cleanWalletAddress(w.wallet_address) === wallet && w.status === 'paid')
            .reduce((sum, w) => sum + w.amount, 0);

        // Total Balance = Deposits - Withdrawals + Accumulated PNL
        const totalBalance = userDeposits - userWithdrawals + pnlAccumulated;

        const balanceData = {
            totalBalance,
            ownershipPercent: ownership * 100,
            deposits: userDeposits,
            withdrawals: userWithdrawals,
            netPnl: pnlAccumulated,
            grossPnl: grossPnlAccumulated,
            feesPaid: feesAccumulated,
            profitSharePaid: profitShareAccumulated,
            shares: shares
        };

        if (isAdmin) console.log(`Setting userBalances[${wallet}] =`, balanceData);
        userBalances[wallet] = balanceData;
    });

    if (isAdmin) console.log('Final userBalances object:', userBalances);

    return {
        userBalances,
        totalPoolValue,
        totalShares
    };
}

/**
 * Calculate pool-wide metrics (for admin view)
 */
export function calculatePoolMetrics({ trades = [], investors = [], withdrawals = [], profitShareRate = 0 }) {
    const grossPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const tradingFees = trades.reduce((sum, t) => sum + (t.fee || 0), 0);
    const profitAfterFees = grossPnl - tradingFees;
    const profitShare = profitAfterFees > 0 ? profitAfterFees * profitShareRate : 0;
    const netPnl = profitAfterFees - profitShare;

    const totalDeposits = investors.reduce((sum, inv) => sum + (inv.invested_amount || 0), 0);
    const totalWithdrawals = withdrawals.filter(w => w.status === 'paid').reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalBalance = totalDeposits - totalWithdrawals + netPnl;

    return {
        grossPnl,
        tradingFees,
        profitShare,
        netPnl,
        totalDeposits,
        totalWithdrawals,
        totalBalance
    };
}