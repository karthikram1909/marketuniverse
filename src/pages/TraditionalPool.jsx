import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useWallet } from '../components/wallet/WalletContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, AlertTriangle, Home, TrendingUp, DollarSign, Award, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import DepositForm from '../components/pools/DepositForm';
import WithdrawalForm from '../components/dashboard/WithdrawalForm';
import PoolPerformance from '../components/pools/PoolPerformance';
import { calculateTimeBasedBalances } from '../components/pools/TimeBasedCalculations';
import Pagination from '../components/common/Pagination';

// Traditional Pool Configuration
const POOL_TYPE = 'traditional';

// Helper to clean wallet addresses (removes browser extension prefixes)
function cleanWalletAddress(address) {
    if (!address) return '';
    return address.replace(/^[a-z-]+:\/\//i, '').toLowerCase();
}

function TraditionalPool() {
    const { account } = useWallet();
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [depositHistoryPage, setDepositHistoryPage] = useState(1);
    const [withdrawalHistoryPage, setWithdrawalHistoryPage] = useState(1);
    const [tradeHistoryPage, setTradeHistoryPage] = useState(1);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    setUser({ ...user, ...profile });
                }
            } catch (error) {
                console.log('User not authenticated');
            }
        };
        loadUser();
    }, []);

    const { data: poolSettings } = useQuery({
        queryKey: ['poolSettings', POOL_TYPE],
        queryFn: async () => {
            const { data } = await supabase
                .from('pool_settings')
                .select('*')
                .eq('pool_type', POOL_TYPE);
            return data?.[0] || { deposits_locked: false, profit_share_rate: 0.20 };
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    const { data: userInvestment } = useQuery({
        queryKey: ['investors', POOL_TYPE, account],
        queryFn: async () => {
            if (!account) return null;
            const { data } = await supabase
                .from('pool_investors')
                .select('*')
                .eq('pool_type', POOL_TYPE)
                .eq('wallet_address', cleanWalletAddress(account));
            return data?.[0] || null;
        },
        enabled: !!account,
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    // Fetch ALL trades for this pool
    const { data: allTrades = [] } = useQuery({
        queryKey: ['trades', POOL_TYPE],
        queryFn: async () => {
            const { data } = await supabase
                .from('pool_trades')
                .select('*')
                .eq('pool_type', POOL_TYPE);
            return data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    // Fetch ALL investors for ownership calculation
    const { data: allInvestors = [] } = useQuery({
        queryKey: ['investors', POOL_TYPE],
        queryFn: async () => {
            const { data } = await supabase
                .from('pool_investors')
                .select('*')
                .eq('pool_type', POOL_TYPE);
            return data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    // Fetch ALL withdrawals (not just paid)
    const { data: allWithdrawals = [] } = useQuery({
        queryKey: ['withdrawals', POOL_TYPE],
        queryFn: async () => {
            const { data } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('pool_type', POOL_TYPE);
            return data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });


    const handleDepositSuccess = () => {
        // Refresh data after successful deposit
        // Invalidate ALL investor queries (both list and user-specific)
        queryClient.invalidateQueries({ queryKey: ['investors'] });
        queryClient.invalidateQueries({ queryKey: ['investors', POOL_TYPE, account] });
        queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
    };

    const handleWithdrawalSubmit = async (formData) => {
        const walletAddr = cleanWalletAddress(account);

        // Calculate penalty if early withdrawal
        const isEarly = userInvestment?.investment_end_date && new Date() < new Date(userInvestment.investment_end_date);
        const penaltyAmount = isEarly ? parseFloat(formData.amount) * 0.1 : 0;
        const netAmount = parseFloat(formData.amount) - penaltyAmount;

        await supabase.from('withdrawal_requests').insert({
            wallet_address: walletAddr,
            email: formData.email,
            payment_address: formData.payment_address,
            name_surname: formData.name_surname,
            amount: parseFloat(formData.amount),
            penalty_amount: penaltyAmount,
            net_amount: netAmount,
            pool_type: POOL_TYPE,
            status: 'pending',
            user_balance_at_request: userStats.totalBalance
        });

        // Create user and admin notifications
        try {
            await Promise.all([
                supabase.from('notifications').insert({
                    wallet_address: walletAddr,
                    email: formData.email,
                    type: 'traditional_withdrawal_request',
                    title: 'Traditional Pool Withdrawal Requested',
                    message: `Your withdrawal request for ${formData.amount} USDT has been submitted and is pending admin approval.`,
                    amount: parseFloat(formData.amount),
                    read: false,
                    is_admin: false
                }),
                supabase.from('notifications').insert({
                    wallet_address: walletAddr,
                    email: formData.email,
                    type: 'admin_traditional_withdrawal_request',
                    title: 'New Traditional Pool Withdrawal Request',
                    message: `${formData.name_surname} has requested a withdrawal of ${formData.amount} USDT from Traditional Pool.`,
                    amount: parseFloat(formData.amount),
                    read: false,
                    is_admin: true
                })
            ]);
        } catch (error) {
            console.warn('Failed to create withdrawal notifications:', error);
        }

        queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    // Calculate user's balance and ownership using time-based system
    const calculateUserStats = () => {
        if (!account || allInvestors.length === 0) return null;

        const profitShareRate = poolSettings?.profit_share_rate || 0.20;

        // Get time-based calculations
        const { userBalances } = calculateTimeBasedBalances({
            investors: allInvestors,
            trades: allTrades,
            withdrawals: allWithdrawals,
            profitShareRate
        });

        const wallet = cleanWalletAddress(account);
        const userData = userBalances[wallet];

        if (!userData) return null;

        // Use time-based accumulated values (already calculated correctly)
        return {
            totalBalance: userData.totalBalance,
            ownershipPercent: userData.ownershipPercent,
            grossPnl: userData.grossPnl,
            feesPaid: userData.feesPaid,
            profitSharePaid: userData.profitSharePaid,
            netPnl: userData.netPnl,
            deposits: userData.deposits,
            withdrawals: userData.withdrawals
        };
    };

    const userStats = calculateUserStats();

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Animated Background */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    background: [
                        'radial-gradient(circle at 20% 50%, rgba(245,201,106,0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 50%, rgba(245,158,11,0.12) 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 80%, rgba(217,119,6,0.12) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, rgba(245,201,106,0.15) 0%, transparent 50%)',
                    ]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating Orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

            <div className="relative z-10 px-4 sm:px-6 py-8 max-w-7xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex gap-2 mb-6">
                        <Link to={createPageUrl('Dashboard')}>
                            <Button className="bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Landing')}>
                            <Button className="bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all">
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="h-1 w-20 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-full" />
                                <h1 className="relative text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                                    <motion.div
                                        className="absolute inset-0"
                                        style={{
                                            background: 'linear-gradient(90deg, transparent 0%, rgba(245,201,106,0.6) 50%, transparent 100%)',
                                            height: '4px',
                                            filter: 'blur(2px)'
                                        }}
                                        animate={{
                                            x: ['-100%', '200%'],
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                            ease: "linear"
                                        }}
                                    />
                                    Traditional Pool
                                </h1>
                            </div>
                            <p className="text-gray-400 text-lg">Your Personal Dashboard</p>
                        </div>
                        {user?.role === 'admin' && (
                            <Link to={createPageUrl('TraditionalPoolAdmin')} className="self-start sm:self-auto">
                                <Button className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300 transition-all rounded-xl">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Admin View
                                </Button>
                            </Link>
                        )}
                    </div>
                </motion.div>

                {/* User Stats Card */}
                {userStats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-br from-yellow-500/5 via-black/40 to-yellow-600/5 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-50" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Your Pool Statistics</h2>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-green-500/10 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-5 h-5 text-green-400" />
                                        <span className="text-gray-400 text-sm">Total Balance</span>
                                    </div>
                                    <p className="text-white text-3xl font-bold">${userStats.totalBalance.toFixed(2)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="w-5 h-5 text-cyan-400" />
                                        <span className="text-gray-400 text-sm">Ownership %</span>
                                    </div>
                                    <p className="text-white text-3xl font-bold">{userStats.ownershipPercent.toFixed(2)}%</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-purple-400" />
                                        <span className="text-gray-400 text-sm">Net PNL</span>
                                    </div>
                                    <p className={`text-3xl font-bold ${userStats.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${userStats.netPnl.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-black/40 transition-all">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-400 text-sm">Gross PNL</span>
                                        <span className={`font-bold ${userStats.grossPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${userStats.grossPnl.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-black/40 transition-all">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-400 text-sm">Fees Paid</span>
                                        <span className="text-orange-400 font-bold">${userStats.feesPaid.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-black/40 transition-all">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-400 text-sm">Profit Share (20%)</span>
                                        <span className="text-yellow-400 font-bold">${userStats.profitSharePaid.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Pool Performance Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                            Pool Performance
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    </div>
                    <PoolPerformance
                        trades={allTrades}
                        investors={allInvestors}
                        withdrawals={allWithdrawals}
                        profitShareRate={poolSettings?.profit_share_rate || 0}
                    />
                </motion.div>

                {/* User's Deposit History */}
                {userInvestment && userInvestment.deposit_transactions && userInvestment.deposit_transactions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-br from-green-500/5 via-black/40 to-emerald-600/5 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Your Deposit History</h2>
                            </div>
                            {(() => {
                                const sortedDeposits = userInvestment.deposit_transactions
                                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                                const depositsPerPage = 10;
                                const totalPages = Math.ceil(sortedDeposits.length / depositsPerPage);
                                const paginatedDeposits = sortedDeposits.slice(
                                    (depositHistoryPage - 1) * depositsPerPage,
                                    depositHistoryPage * depositsPerPage
                                );

                                return (
                                    <>
                                        <div className="space-y-3 mb-6">
                                            {paginatedDeposits.map((deposit, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative bg-gradient-to-br from-green-500/10 via-black/20 to-transparent backdrop-blur-sm border border-green-500/30 hover:border-green-400/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                    <div className="relative z-10 flex justify-between items-start">
                                                        <div>
                                                            <div className="px-4 py-2 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl border border-green-500/30 inline-block">
                                                                <p className="text-green-400 font-bold text-2xl">${deposit.amount.toFixed(2)}</p>
                                                                <p className="text-green-300/60 text-xs">USDT</p>
                                                            </div>
                                                            <p className="text-gray-400 text-sm mt-2">
                                                                {new Date(deposit.date).toISOString().replace('T', ' ').slice(0, 16)} UTC
                                                            </p>
                                                            {deposit.duration_months && (
                                                                <p className="text-yellow-400 text-sm mt-1">
                                                                    Duration: {deposit.duration_months} months
                                                                </p>
                                                            )}
                                                        </div>
                                                        {deposit.tx_hash && (
                                                            <a
                                                                href={`https://bscscan.com/tx/${deposit.tx_hash}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                                View TX
                                                            </a>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        {totalPages > 1 && (
                                            <Pagination
                                                currentPage={depositHistoryPage}
                                                totalPages={totalPages}
                                                onPageChange={setDepositHistoryPage}
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {/* User's Withdrawal History */}
                {account && allWithdrawals.filter(w => cleanWalletAddress(w.wallet_address) === cleanWalletAddress(account)).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-br from-yellow-500/5 via-black/40 to-orange-600/5 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-xl">
                                    <Receipt className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Your Withdrawal History</h2>
                            </div>
                            {(() => {
                                const userWithdrawals = allWithdrawals
                                    .filter(w => cleanWalletAddress(w.wallet_address) === cleanWalletAddress(account))
                                    .sort((a, b) => {
                                        const dateA = new Date(a.created_date || a.created_at || 0);
                                        const dateB = new Date(b.created_date || b.created_at || 0);
                                        return dateB - dateA;
                                    });
                                const withdrawalsPerPage = 10;
                                const totalPages = Math.ceil(userWithdrawals.length / withdrawalsPerPage);
                                const paginatedWithdrawals = userWithdrawals.slice(
                                    (withdrawalHistoryPage - 1) * withdrawalsPerPage,
                                    withdrawalHistoryPage * withdrawalsPerPage
                                );

                                return (
                                    <>
                                        <div className="space-y-3 mb-6">
                                            {paginatedWithdrawals.map((withdrawal, idx) => (
                                                <motion.div
                                                    key={withdrawal.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative bg-gradient-to-br from-yellow-500/10 via-black/20 to-transparent backdrop-blur-sm border border-yellow-500/30 hover:border-yellow-400/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <div className="px-4 py-2 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl border border-yellow-500/30 inline-block">
                                                                    <p className="text-yellow-400 font-bold text-2xl">${withdrawal.amount.toFixed(2)}</p>
                                                                    <p className="text-yellow-300/60 text-xs">USDT</p>
                                                                </div>
                                                                <p className="text-gray-400 text-sm mt-2">
                                                                    {new Date(withdrawal.created_date || withdrawal.created_at || Date.now()).toISOString().replace('T', ' ').slice(0, 16)} UTC
                                                                </p>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm ${withdrawal.status === 'paid'
                                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                : withdrawal.status === 'pending'
                                                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                }`}>
                                                                {withdrawal.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-3 text-sm bg-black/20 rounded-xl p-4 border border-white/5">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-400">Requested Amount:</span>
                                                                    <span className="text-white font-medium">${withdrawal.amount.toFixed(2)}</span>
                                                                </div>

                                                                {withdrawal.penalty_amount > 0 && (
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-red-400 italic">Early Withdrawal Penalty (10%):</span>
                                                                        <span className="text-red-400 font-medium">-${withdrawal.penalty_amount.toFixed(2)}</span>
                                                                    </div>
                                                                )}

                                                                {withdrawal.penalty_amount > 0 && (
                                                                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                                                        <span className="text-yellow-400 font-bold uppercase tracking-wider text-[10px]">Net Received:</span>
                                                                        <span className="text-yellow-400 font-bold text-lg">${(withdrawal.net_amount || (withdrawal.amount - withdrawal.penalty_amount)).toFixed(2)}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="pt-2 border-t border-white/5">
                                                                <span className="text-gray-400 block mb-1">Payment Address:</span>
                                                                <span className="text-white/80 font-mono text-[10px] break-all bg-black/40 p-2 rounded border border-white/5 block">
                                                                    {withdrawal.payment_address}
                                                                </span>
                                                            </div>

                                                            {withdrawal.tx_hash && (
                                                                <div className="flex items-center gap-2 pt-1">
                                                                    <span className="text-gray-400 text-xs">TX Hash:</span>
                                                                    <a
                                                                        href={`https://bscscan.com/tx/${withdrawal.tx_hash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-yellow-400 hover:text-yellow-300 font-mono text-[10px] underline truncate transition-colors"
                                                                    >
                                                                        {withdrawal.tx_hash}
                                                                    </a>
                                                                </div>
                                                            )}

                                                            {withdrawal.paid_date && (
                                                                <div className="flex items-center gap-1 pt-1 opacity-60">
                                                                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    <span className="text-gray-400 text-[10px]">Paid:</span>
                                                                    <span className="text-green-400 text-[10px] ml-1">
                                                                        {new Date(withdrawal.paid_date).toISOString().replace('T', ' ').slice(0, 16)} UTC
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {withdrawal.admin_notes && (
                                                                <div className="bg-blue-500/5 border border-blue-500/20 p-2 rounded-lg mt-2">
                                                                    <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wide">Admin Note:</span>
                                                                    <p className="text-white/80 text-xs mt-0.5">{withdrawal.admin_notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        {totalPages > 1 && (
                                            <Pagination
                                                currentPage={withdrawalHistoryPage}
                                                totalPages={totalPages}
                                                onPageChange={setWithdrawalHistoryPage}
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {/* Trade History */}
                {allTrades.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-br from-cyan-500/5 via-black/40 to-purple-600/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 mb-8 overflow-x-auto"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Trade History</h2>
                                </div>
                                <span className="text-sm text-gray-400">Total: {allTrades.length} trades</span>
                            </div>
                            {(() => {
                                const sortedTrades = allTrades.sort((a, b) => new Date(b.date) - new Date(a.date));
                                const tradesPerPage = 10;
                                const totalPages = Math.ceil(sortedTrades.length / tradesPerPage);
                                const paginatedTrades = sortedTrades.slice(
                                    (tradeHistoryPage - 1) * tradesPerPage,
                                    tradeHistoryPage * tradesPerPage
                                );

                                return (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-white/10">
                                                        <th className="text-left text-gray-400 p-3">Date</th>
                                                        <th className="text-left text-gray-400 p-3">Pair</th>
                                                        <th className="text-left text-gray-400 p-3">Dir</th>
                                                        <th className="text-right text-gray-400 p-3">Margin</th>
                                                        <th className="text-right text-gray-400 p-3">Lev</th>
                                                        <th className="text-right text-gray-400 p-3">Size</th>
                                                        <th className="text-right text-gray-400 p-3">Fee</th>
                                                        <th className="text-right text-gray-400 p-3">Gross PnL</th>
                                                        <th className="text-right text-gray-400 p-3">Net PnL</th>
                                                        <th className="text-center text-gray-400 p-3">Result</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {paginatedTrades.map((trade) => {
                                                        const profitAfterFees = trade.pnl - trade.fee;
                                                        const profitShare = profitAfterFees > 0 ? profitAfterFees * (poolSettings?.profit_share_rate || 0.20) : 0;
                                                        const netPnl = profitAfterFees - profitShare;

                                                        return (
                                                            <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5">
                                                                <td className="p-3 text-white">
                                                                    {new Date(trade.date).toISOString().replace('T', ' ').slice(0, 16)} UTC
                                                                </td>
                                                                <td className="p-3 text-white">{trade.pair}</td>
                                                                <td className="p-3 text-white capitalize">{trade.direction}</td>
                                                                <td className="p-3 text-right text-white">${trade.margin.toFixed(2)}</td>
                                                                <td className="p-3 text-right text-white">{trade.leverage}x</td>
                                                                <td className="p-3 text-right text-white">${trade.size.toFixed(2)}</td>
                                                                <td className="p-3 text-right text-gray-400">${trade.fee.toFixed(2)}</td>
                                                                <td className={`p-3 text-right ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                    ${trade.pnl.toFixed(2)}
                                                                </td>
                                                                <td className={`p-3 text-right ${netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                    ${netPnl.toFixed(2)}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <span className={`px-2 py-1 rounded text-xs ${trade.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                        {trade.result.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {totalPages > 1 && (
                                            <Pagination
                                                currentPage={tradeHistoryPage}
                                                totalPages={totalPages}
                                                onPageChange={setTradeHistoryPage}
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {/* Pool Information Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/60 border border-yellow-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl mb-8"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-3">
                        <Shield className="w-7 h-7 text-yellow-400" />
                        How Traditional Pool Works
                    </h2>
                    <p className="text-yellow-400 text-base sm:text-lg mb-8">Understanding the mechanics and profit distribution</p>

                    <div className="space-y-6">
                        {/* Point 1 */}
                        <div className="border-l-4 border-cyan-500 pl-6">
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                1. Pool Concept
                            </h3>
                            <div className="text-gray-300 space-y-3">
                                <p>Professional traders manage collective funds using conservative longer-term strategies. Your ownership percentage determines your share of profits and losses.</p>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-cyan-400 font-semibold mb-2">Key Features:</p>
                                    <ul className="space-y-1 text-sm">
                                        <li>• Lock-in period: Choose 1, 3, 6, or 12 months</li>
                                        <li>• Conservative trading strategies</li>
                                        <li>• No minimum deposit required</li>
                                        <li>• 10% early withdrawal penalty (before lock-in ends)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Point 2 */}
                        <div className="border-l-4 border-green-500 pl-6">
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                2. Profit & Loss Distribution
                            </h3>
                            <div className="text-gray-300 space-y-3">
                                <p>Your balance is calculated using a time-based share system:</p>
                                <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                                    <p><span className="text-white font-semibold">Ownership % =</span> (Your Investment ÷ Total Pool Size) × 100</p>
                                    <p><span className="text-white font-semibold">Gross PnL =</span> Total trade profits/losses × Your ownership %</p>
                                    <p><span className="text-white font-semibold">Clean PnL =</span> Gross PnL − Trading Fees</p>
                                    <p><span className="text-white font-semibold">Manager Share =</span> 20% of positive Clean PnL only</p>
                                    <p><span className="text-white font-semibold">Your Net PnL =</span> Clean PnL − Manager Share</p>
                                    <p className="pt-2 border-t border-white/10"><span className="text-green-400 font-bold">Final Balance =</span> Deposits + Net PnL − Withdrawals</p>
                                </div>
                                <p className="text-yellow-400 text-sm">* You only profit from trades executed AFTER your deposit timestamp</p>
                            </div>
                        </div>

                        {/* Point 3 */}
                        <div className="border-l-4 border-yellow-500 pl-6">
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                3. Lock-In Period & Early Withdrawal Penalty
                            </h3>
                            <div className="text-gray-300 space-y-3">
                                <p>When depositing, you commit to an investment duration (1, 3, 6, or 12 months). Withdrawing before your lock-in period ends incurs a 10% penalty.</p>
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                    <p className="text-white font-semibold mb-2">Example (early withdrawal):</p>
                                    <ul className="space-y-1 text-sm">
                                        <li>• Your balance: <span className="text-white">$5,000</span></li>
                                        <li>• Withdraw before lock-in ends: <span className="text-white">$5,000</span></li>
                                        <li>• 10% penalty: <span className="text-red-400">-$500</span></li>
                                        <li>• You receive: <span className="text-yellow-400 font-bold">$4,500</span></li>
                                    </ul>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                    <p className="text-white font-semibold mb-2">Example (after lock-in expires):</p>
                                    <ul className="space-y-1 text-sm">
                                        <li>• Your balance: <span className="text-white">$5,000</span></li>
                                        <li>• Withdraw after lock-in ends: <span className="text-white">$5,000</span></li>
                                        <li>• Penalty: <span className="text-gray-400">$0 (no penalty)</span></li>
                                        <li>• You receive: <span className="text-green-400 font-bold">$5,000</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Point 4 */}
                        <div className="border-l-4 border-purple-500 pl-6">
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                4. Manager Profit Share (20%)
                            </h3>
                            <div className="text-gray-300 space-y-3">
                                <p>Managers earn 20% of positive Clean PnL only. No profit share is charged on losses.</p>
                                <div className="bg-white/5 rounded-lg p-4 text-sm space-y-3">
                                    <div>
                                        <p className="text-green-400 font-semibold mb-1">Winning trade:</p>
                                        <p>Trade +$1,000 → Fee -$10 → Clean PnL $990 → Manager gets $198 (20%) → You get $792</p>
                                    </div>
                                    <div className="pt-2 border-t border-white/10">
                                        <p className="text-red-400 font-semibold mb-1">Losing trade:</p>
                                        <p>Trade -$500 → Fee -$10 → Clean PnL -$510 → Manager gets $0 → You lose $510</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-1 gap-4 sm:gap-8 mb-8 w-full max-w-2xl mx-auto">
                    {poolSettings?.pool_address ? (
                        <DepositForm
                            poolAddress={poolSettings.pool_address}
                            poolType={POOL_TYPE}
                            depositsLocked={poolSettings?.deposits_locked || false}
                            onDepositSuccess={handleDepositSuccess}
                            userInvestment={userInvestment}
                        />
                    ) : poolSettings ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
                            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                            <h3 className="text-xl font-bold text-white mb-2">Pool Not Fully Configured</h3>
                            <p className="text-gray-400">The pool address has not been set by the administrator yet. Please check back later.</p>
                        </div>
                    ) : null}
                </div>

                {/* Withdrawal Form */}
                {userStats && account && (
                    <div className="w-full max-w-2xl mx-auto mb-8">
                        <WithdrawalForm
                            poolType={POOL_TYPE}
                            maxAmount={userStats.totalBalance}
                            onSubmit={handleWithdrawalSubmit}
                            isSubmitting={false}
                            cryptoType="USDT"
                            withdrawalsLocked={poolSettings?.withdrawals_locked || false}
                        />
                    </div>
                )}


                <div className="bg-[#1f2937]/50 border border-white/10 rounded-xl p-4 w-full">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-gray-400 text-sm">
                                <strong className="text-white">Risk Warning:</strong> Trading cryptocurrencies involves substantial risk of loss.
                                Past performance is not indicative of future results. Only invest capital you can afford to lose completely.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TraditionalPool;