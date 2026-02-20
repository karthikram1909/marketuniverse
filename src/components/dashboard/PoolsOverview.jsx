import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, Users, DollarSign, Award, Target, ArrowUpRight, Receipt, BarChart3, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const poolInfo = {
    scalping: { name: 'Crypto Pool', gradient: 'from-red-500 to-pink-500' },
    traditional: { name: 'Traditional Pool', gradient: 'from-yellow-500 to-orange-500' },
    vip: { name: 'VIP Pool', gradient: 'from-cyan-500 to-blue-500' }
};

export default function PoolsOverview() {
    const [user, setUser] = React.useState(null);

    React.useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                    setUser({ ...user, ...profile });
                }
            } catch (error) {
                console.log('User not authenticated');
            }
        };
        loadUser();
    }, []);

    // Fetch all investors
    const { data: scalpingInvestors = [] } = useQuery({
        queryKey: ['allInvestors', 'scalping'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*').eq('pool_type', 'scalping');
            return data || [];
        },
        staleTime: 60000
    });
    const { data: traditionalInvestors = [] } = useQuery({
        queryKey: ['allInvestors', 'traditional'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*').eq('pool_type', 'traditional');
            return data || [];
        },
        staleTime: 60000
    });
    const { data: vipInvestors = [] } = useQuery({
        queryKey: ['allInvestors', 'vip'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*').eq('pool_type', 'vip');
            return data || [];
        },
        staleTime: 60000
    });

    // Fetch all profiles to get usernames
    const { data: allProfiles = [] } = useQuery({
        queryKey: ['allProfiles'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('id, username, wallet_address');
            return data || [];
        },
        staleTime: 60000
    });

    const profilesMap = React.useMemo(() => {
        const map = new Map();
        allProfiles.forEach(p => {
            if (p.id && p.username) map.set(p.id, p.username);
            if (p.wallet_address && p.username) map.set(p.wallet_address.toLowerCase(), p.username);
        });
        return map;
    }, [allProfiles]);

    // Fetch all trades
    const { data: scalpingTrades = [] } = useQuery({
        queryKey: ['allTrades', 'scalping'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*').eq('pool_type', 'scalping');
            return data || [];
        },
        staleTime: 60000
    });
    const { data: traditionalTrades = [] } = useQuery({
        queryKey: ['allTrades', 'traditional'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*').eq('pool_type', 'traditional');
            return data || [];
        },
        staleTime: 60000
    });
    const { data: vipTrades = [] } = useQuery({
        queryKey: ['allTrades', 'vip'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*').eq('pool_type', 'vip');
            return data || [];
        },
        staleTime: 60000
    });

    // Fetch pool settings
    const { data: scalpingSettings } = useQuery({
        queryKey: ['poolSettings', 'scalping'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', 'scalping');
            return data?.[0] || { profit_share_rate: 0 };
        },
        staleTime: 300000
    });
    const { data: traditionalSettings } = useQuery({
        queryKey: ['poolSettings', 'traditional'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', 'traditional');
            return data?.[0] || { profit_share_rate: 0.20 };
        },
        staleTime: 300000
    });
    const { data: vipSettings } = useQuery({
        queryKey: ['poolSettings', 'vip'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', 'vip');
            return data?.[0] || { profit_share_rate: 0.20 };
        },
        staleTime: 300000
    });

    // Fetch withdrawals
    const { data: scalpingWithdrawals = [] } = useQuery({
        queryKey: ['withdrawals', 'scalping'],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*').eq('pool_type', 'scalping');
            return data || [];
        },
        staleTime: 60000
    });
    const { data: traditionalWithdrawals = [] } = useQuery({
        queryKey: ['withdrawals', 'traditional'],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*').eq('pool_type', 'traditional');
            return data || [];
        },
        staleTime: 60000
    });
    const { data: vipWithdrawals = [] } = useQuery({
        queryKey: ['withdrawals', 'vip'],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*').eq('pool_type', 'vip');
            return data || [];
        },
        staleTime: 60000
    });

    // Fetch all staking contracts
    const { data: allStakingContracts = [] } = useQuery({
        queryKey: ['allStakingContracts'],
        queryFn: async () => {
            const { data } = await supabase.from('staking_contracts').select('*').eq('status', 'active');
            return data || [];
        },
        staleTime: 60000
    });

    // Calculate pool stats
    const calculatePoolStats = (investors, trades, settings, withdrawals) => {
        const totalInvested = investors.reduce((sum, inv) => sum + inv.invested_amount, 0);
        const grossPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
        const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);

        // Calculate profit share based on positive clean PnL
        const profitShareRate = settings?.profit_share_rate || 0;
        const profitShare = trades.reduce((sum, t) => {
            const cleanPnl = (t.pnl || 0) - (t.fee || 0);
            if (cleanPnl > 0) {
                return sum + (cleanPnl * profitShareRate);
            }
            return sum;
        }, 0);

        const netPnl = grossPnl - totalFees - profitShare;

        const totalPaidOut = withdrawals
            .filter(w => w.status === 'paid')
            .reduce((sum, w) => sum + w.amount, 0);

        const currentBalance = totalInvested + netPnl - totalPaidOut;

        const wins = trades.filter(t => t.result === 'win').length;
        const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

        return { totalInvested, grossPnl, profitShare, totalFees, netPnl, currentBalance, winRate, totalPaidOut };
    };

    const scalpingStats = calculatePoolStats(scalpingInvestors, scalpingTrades, scalpingSettings, scalpingWithdrawals);
    const traditionalStats = calculatePoolStats(traditionalInvestors, traditionalTrades, traditionalSettings, traditionalWithdrawals);
    const vipStats = calculatePoolStats(vipInvestors, vipTrades, vipSettings, vipWithdrawals);

    // Calculate staking totals
    const stakingTotals = allStakingContracts.reduce((acc, contract) => {
        const crypto = contract.crypto_type;
        if (!acc[crypto]) {
            acc[crypto] = 0;
        }
        acc[crypto] += contract.staked_amount;
        return acc;
    }, {});

    const pools = [
        { type: 'scalping', stats: scalpingStats },
        { type: 'traditional', stats: traditionalStats },
        { type: 'vip', stats: vipStats }
    ];

    return (
        <div className="space-y-6">
            {/* Pools Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-black/40 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 overflow-hidden"
                style={{
                    boxShadow: '0 8px 32px 0 rgba(220, 38, 38, 0.1)'
                }}
            >
                <motion.div
                    className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.h2
                    className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <motion.div
                        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg"
                        animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    >
                        <TrendingUp className="w-6 h-6 text-white" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-white via-red-400 to-white bg-clip-text text-transparent">
                        Pools Overview
                    </span>
                </motion.h2>

                <div className="grid md:grid-cols-3 gap-4 relative z-10">
                    {pools.map(({ type, stats }, idx) => (
                        <motion.div
                            key={type}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                                delay: idx * 0.15,
                                type: "spring",
                                stiffness: 100
                            }}
                            whileHover={{ scale: 1.03, y: -8 }}
                            className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all duration-300 overflow-hidden group"
                            style={{
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
                            }}
                        >
                            <motion.div
                                className={`absolute inset-0 bg-gradient-to-br ${poolInfo[type].gradient} opacity-0 group-hover:opacity-20`}
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0, 0.1, 0]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                            <motion.div
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${poolInfo[type].gradient} text-white text-sm font-bold mb-4 shadow-xl relative z-10`}
                                whileHover={{ scale: 1.05 }}
                                animate={{
                                    boxShadow: [
                                        '0 4px 20px rgba(255, 255, 255, 0.1)',
                                        '0 4px 30px rgba(255, 255, 255, 0.2)',
                                        '0 4px 20px rgba(255, 255, 255, 0.1)'
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {poolInfo[type].name}
                            </motion.div>

                            <div className="space-y-3">
                                <motion.div
                                    className="flex justify-between items-center"
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="text-gray-400 text-sm flex items-center gap-2">
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Users className="w-4 h-4 text-cyan-400" />
                                        </motion.div>
                                        Total Investment
                                    </span>
                                    <span className="text-white font-bold">${stats.totalInvested.toFixed(2)}</span>
                                </motion.div>

                                <motion.div
                                    className="flex justify-between items-center"
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="text-gray-400 text-sm flex items-center gap-2">
                                        <motion.div
                                            animate={{
                                                y: [0, -3, 0],
                                                rotate: [0, 10, 0]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <TrendingUp className="w-4 h-4 text-green-400" />
                                        </motion.div>
                                        Gross PNL
                                    </span>
                                    <span className={`font-bold ${stats.grossPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${stats.grossPnl.toFixed(2)}
                                    </span>
                                </motion.div>

                                <motion.div
                                    className="flex justify-between items-center"
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="text-gray-400 text-sm flex items-center gap-2">
                                        <motion.div
                                            animate={{ rotate: [0, 360] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Award className="w-4 h-4 text-yellow-400" />
                                        </motion.div>
                                        Profit Share
                                    </span>
                                    <span className="text-yellow-400 font-bold">${stats.profitShare.toFixed(2)}</span>
                                </motion.div>

                                <motion.div
                                    className="flex justify-between items-center"
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="text-gray-400 text-sm flex items-center gap-2">
                                        <motion.div
                                            animate={{ scale: [1, 1.15, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <Receipt className="w-4 h-4 text-orange-400" />
                                        </motion.div>
                                        Trading Fees
                                    </span>
                                    <span className="text-orange-400 font-bold">${stats.totalFees.toFixed(2)}</span>
                                </motion.div>

                                <motion.div
                                    className="flex justify-between items-center"
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="text-gray-400 text-sm flex items-center gap-2">
                                        <motion.div
                                            animate={{
                                                y: [0, -3, 0]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <TrendingUp className="w-4 h-4 text-cyan-400" />
                                        </motion.div>
                                        Net PNL
                                    </span>
                                    <span className={`font-bold ${stats.netPnl >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                        ${stats.netPnl.toFixed(2)}
                                    </span>
                                </motion.div>

                                <motion.div
                                    className="flex justify-between items-center pt-2 border-t border-white/10"
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="text-gray-400 text-sm flex items-center gap-2">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <DollarSign className="w-4 h-4 text-emerald-400" />
                                        </motion.div>
                                        Current Balance
                                    </span>
                                    <span className="text-cyan-400 font-bold">${stats.currentBalance.toFixed(2)}</span>
                                </motion.div>

                                <motion.div
                                    className="flex justify-between items-center"
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="text-gray-400 text-sm flex items-center gap-2">
                                        <motion.div
                                            animate={{
                                                x: [0, 3, 0],
                                                y: [0, -3, 0]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <ArrowUpRight className="w-4 h-4 text-orange-400" />
                                        </motion.div>
                                        Paid to Investors
                                    </span>
                                    <span className="text-orange-400 font-bold">${stats.totalPaidOut.toFixed(2)}</span>
                                </motion.div>

                                {type === 'traditional' && user && (() => {
                                    const userInvestment = traditionalInvestors.find(inv =>
                                        inv.wallet_address?.toLowerCase() === user.wallet_address?.toLowerCase()
                                    );
                                    return userInvestment?.duration_months && (
                                        <div className="pt-3 mt-3 border-t border-white/10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Your Investment Duration</span>
                                                <span className="text-[#f5c96a] font-bold">
                                                    {userInvestment.duration_months} Month{userInvestment.duration_months > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {userInvestment.investment_end_date && (
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-gray-400 text-xs">End Date</span>
                                                    <span className="text-gray-300 text-xs">
                                                        {new Date(userInvestment.investment_end_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            <Link to={createPageUrl(type === 'scalping' ? 'CryptoPool' : type === 'traditional' ? 'TraditionalPool' : 'VIPPool')} className="block mt-4 relative z-20">
                                <motion.button
                                    className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${poolInfo[type].gradient} text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg border-2 border-white/20`}
                                    whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(255, 255, 255, 0.2)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <BarChart3 className="w-5 h-5" />
                                    </motion.div>
                                    View My Stats
                                </motion.button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Staking Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 overflow-hidden"
                style={{
                    boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.1)'
                }}
            >
                <motion.div
                    className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, 50, 0]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.h2
                    className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <motion.div
                        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg"
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <DollarSign className="w-6 h-6 text-white" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                        Total Staking Amounts
                    </span>
                </motion.h2>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                    {['BTC', 'ETH', 'USDT', 'USDC', 'XRP'].map((crypto, idx) => (
                        <motion.div
                            key={crypto}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                delay: 0.4 + idx * 0.1,
                                type: "spring",
                                stiffness: 200
                            }}
                            whileHover={{ scale: 1.1, y: -5 }}
                            className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 text-center hover:border-purple-500/50 hover:shadow-2xl transition-all duration-300"
                            style={{
                                boxShadow: '0 4px 20px rgba(168, 85, 247, 0.1)'
                            }}
                        >
                            <motion.div
                                className="text-gray-400 text-sm mb-2 font-semibold"
                                animate={{
                                    opacity: [0.7, 1, 0.7]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {crypto}
                            </motion.div>
                            <div className="text-white font-bold text-xl">
                                {(stakingTotals[crypto] || 0).toFixed(4)}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="mt-6 text-center text-gray-400 text-sm bg-purple-500/10 rounded-xl py-3 border border-purple-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <span className="font-semibold text-purple-400">Total Active Contracts:</span> {allStakingContracts.length}
                </motion.div>
            </motion.div>
            {/* All Deposits */}
            {(() => {
                // Flatten deposit_transactions from all investors across all pools
                const allDeposits = [
                    ...scalpingInvestors,
                    ...traditionalInvestors,
                    ...vipInvestors
                ]
                    .flatMap(inv =>
                        (inv.deposit_transactions || []).map(tx => {
                            const username = profilesMap.get(inv.id) || profilesMap.get(inv.wallet_address?.toLowerCase());
                            return {
                                name: username || inv.investor_name || `User ${inv.wallet_address?.slice(0, 6)}`,
                                wallet: inv.wallet_address || '',
                                amount: tx.amount,
                                date: tx.date,
                                txHash: tx.tx_hash
                            };
                        })
                    )
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (allDeposits.length === 0) return null;

                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 overflow-hidden"
                        style={{ boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.08)' }}
                    >
                        {/* bg glow */}
                        <motion.div
                            className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 5, repeat: Infinity }}
                        />

                        {/* Header */}
                        <motion.h2
                            className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                <Receipt className="w-5 h-5 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
                                All Deposits
                            </span>
                            <span className="ml-auto text-sm font-normal text-green-400/70 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                                {allDeposits.length} total
                            </span>
                        </motion.h2>

                        {/* Deposit list */}
                        <div className="space-y-3 relative z-10 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                            {allDeposits.map((dep, idx) => {
                                const walletShort = dep.wallet
                                    ? `${dep.wallet.slice(0, 10)}...${dep.wallet.slice(-8)}`
                                    : '—';

                                const dateStr = dep.date
                                    ? new Date(dep.date).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
                                    : '—';

                                const bscUrl = dep.txHash
                                    ? `https://bscscan.com/tx/${dep.txHash}`
                                    : null;

                                const txShort = dep.txHash
                                    ? `View TX: ${dep.txHash.slice(0, 12)}...`
                                    : null;

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="bg-black/50 border border-green-500/10 hover:border-green-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-200 group"
                                    >
                                        {/* Left: name + wallet + TX */}
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="text-white font-semibold text-sm truncate">
                                                {dep.name}
                                            </span>
                                            <span className="text-gray-500 text-xs font-mono truncate">
                                                {walletShort}
                                            </span>
                                            {bscUrl && (
                                                <a
                                                    href={bscUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs transition-colors mt-0.5 w-fit"
                                                >
                                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                    {txShort}
                                                </a>
                                            )}
                                        </div>

                                        {/* Right: amount badge + date */}
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl px-4 py-2 text-center min-w-[100px]"
                                                style={{ boxShadow: '0 4px 15px rgba(34,197,94,0.25)' }}>
                                                <div className="text-white font-bold text-base leading-tight">
                                                    ${parseFloat(dep.amount || 0).toFixed(2)}
                                                </div>
                                                <div className="text-green-200/70 text-[10px] font-semibold tracking-wider uppercase">
                                                    USDT
                                                </div>
                                            </div>
                                            <span className="text-gray-500 text-[11px]">
                                                {dateStr}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            })()}
        </div>
    );
}