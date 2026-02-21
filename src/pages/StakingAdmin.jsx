import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, TrendingUp, Users, DollarSign, Clock, CheckCircle2, Filter, Download, Upload, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WithdrawalManagement from '../components/admin/WithdrawalManagement';

const STAKING_PLANS = [
    { months: 3, apy: 0.06, penaltyRate: 0.30, label: '3 Months', apyDisplay: '6% APY', periodReturn: '~1.45%' },
    { months: 6, apy: 0.07, penaltyRate: 0.40, label: '6 Months', apyDisplay: '7% APY', periodReturn: '~3.4%' },
    { months: 12, apy: 0.08, penaltyRate: 0.50, label: '12 Months', apyDisplay: '8% APY', periodReturn: '8%' }
];

const CRYPTO_TYPES = ['BTC', 'ETH', 'USDT', 'USDC', 'XRP'];
const DURATIONS = [3, 6, 12];

export default function StakingAdmin() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [companyWalletInput, setCompanyWalletInput] = useState('');
    const [depositFilter, setDepositFilter] = useState({ crypto: 'all', duration: 'all' });
    const [withdrawalFilter, setWithdrawalFilter] = useState({ crypto: 'all', duration: 'all' });

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    alert('Access denied. Please login.');
                    navigate(createPageUrl('Home'));
                    return;
                }

                const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
                if (profile?.role !== 'admin') {
                    alert('Access denied. Admin only.');
                    navigate(createPageUrl('Home'));
                    return;
                }

                setUser({ ...authUser, ...profile });
            } catch (error) {
                alert('Access denied. Please login.');
                navigate(createPageUrl('Home'));
            } finally {
                setIsChecking(false);
            }
        };

        checkAdmin();
    }, [navigate]);

    // Fetch staking settings
    const { data: settings } = useQuery({
        queryKey: ['stakingSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', 'staking').maybeSingle();
            return data || null;
        }
    });

    // Fetch all staking contracts
    const { data: contracts = [] } = useQuery({
        queryKey: ['allStakingContracts'],
        queryFn: async () => {
            const { data } = await supabase.from('staking_contracts').select('*').order('start_date', { ascending: false });
            return data || [];
        }
    });

    // Fetch staking withdrawals
    const { data: stakingWithdrawals = [] } = useQuery({
        queryKey: ['stakingWithdrawals'],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*').eq('pool_type', 'staking');
            return data || [];
        },
        refetchInterval: 30000
    });

    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (newWallet) => {
            if (settings?.id) {
                const { data, error } = await supabase.from('pool_settings').update({
                    pool_address: newWallet
                }).eq('id', settings.id).select().single();
                if (error) throw error;
                return data;
            } else {
                const { data, error } = await supabase.from('pool_settings').insert({
                    pool_type: 'staking',
                    pool_address: newWallet
                }).select().single();
                if (error) throw error;
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stakingSettings'] });
            setCompanyWalletInput('');
        }
    });

    const isSettingsUpdating = updateSettingsMutation.isPending;

    // Update contract mutation
    const updateContractMutation = useMutation({
        mutationFn: async (contract) => {
            const now = new Date();
            // @ts-ignore
            const startDate = new Date(contract.start_date);
            // @ts-ignore
            const endDate = new Date(contract.end_date);

            // @ts-ignore
            const daysSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            // @ts-ignore
            const dailyRate = Math.pow(1 + (contract.apy_rate || contract.apy || 0), 1 / 365) - 1;

            // @ts-ignore
            const currentValue = contract.staked_amount * Math.pow(1 + dailyRate, daysSinceStart);
            // @ts-ignore
            const totalEarned = currentValue - contract.staked_amount;

            const status = now >= endDate ? 'completed' : 'active';

            const { data, error } = await supabase.from('staking_contracts').update({
                current_value: currentValue,
                total_earned: totalEarned,
                last_update: now.toISOString(),
                status: status
                // @ts-ignore
            }).eq('id', contract.id).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allStakingContracts'] });
        }
    });

    // Cancel contract mutation
    const cancelContractMutation = useMutation({
        mutationFn: async (contract) => {
            const now = new Date();
            // @ts-ignore
            const startDate = new Date(contract.start_date);
            // @ts-ignore
            const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            // @ts-ignore
            const plan = STAKING_PLANS.find(p => p.months === contract.duration_months);

            if (!plan) throw new Error('Plan not found');

            let penalty;
            if (daysSinceStart <= 7) {
                // @ts-ignore
                penalty = contract.staked_amount * plan.penaltyRate;
            } else if (daysSinceStart <= 28) {
                // @ts-ignore
                penalty = (contract.staked_amount + (contract.total_earned || 0)) * plan.penaltyRate;
            } else {
                // @ts-ignore
                penalty = (contract.total_earned || 0) * plan.penaltyRate;
            }

            // @ts-ignore
            const finalValue = contract.staked_amount + (contract.total_earned || 0) - penalty;

            const { data, error } = await supabase.from('staking_contracts').update({
                status: 'cancelled',
                cancelled_date: now.toISOString(),
                penalty_paid: penalty,
                current_value: finalValue,
                // @ts-ignore
                total_earned: contract.total_earned
                // @ts-ignore
            }).eq('id', contract.id).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allStakingContracts'] });
        }
    });

    // Calculate aggregate stats
    const calculateStats = () => {
        const activeContracts = contracts.filter(c => c.status === 'active');
        const totalStaked = contracts.reduce((sum, c) => sum + c.staked_amount, 0);
        const totalEarned = contracts.reduce((sum, c) => sum + c.total_earned, 0);
        const totalCurrentValue = contracts.reduce((sum, c) => sum + c.current_value, 0);

        const uniqueUsers = new Set(contracts.map(c => c.wallet_address)).size;

        return {
            totalContracts: contracts.length,
            activeContracts: activeContracts.length,
            totalStaked,
            totalEarned,
            totalCurrentValue,
            uniqueUsers
        };
    };

    const stats = calculateStats();

    // Filter deposits
    const filteredDeposits = contracts.filter(c => {
        const cryptoMatch = depositFilter.crypto === 'all' || c.crypto_type === depositFilter.crypto;
        const durationMatch = depositFilter.duration === 'all' || c.duration_months === parseInt(depositFilter.duration);
        return cryptoMatch && durationMatch;
    });

    // Filter withdrawals
    const filteredWithdrawals = stakingWithdrawals.filter(w => {
        const cryptoMatch = withdrawalFilter.crypto === 'all' || w.crypto_type === withdrawalFilter.crypto;
        // Match duration from withdrawal to contract if possible
        const durationMatch = withdrawalFilter.duration === 'all' || true; // Could enhance this by checking contract
        return cryptoMatch && durationMatch;
    });

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
                <div className="text-white text-xl">Checking access...</div>
            </div>
        );
    }

    if (!user) return null;

    const getDailyEarnings = (contract) => {
        // Daily compounding rate: (1 + APY)^(1/365) - 1
        const dailyRate = Math.pow(1 + contract.apy_rate, 1 / 365) - 1;
        return contract.current_value * dailyRate;
    };

    const getTimeRemaining = (endDate) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return 'Completed';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${days}d ${hours}h ${minutes}m`;
    };

    const handleUpdateContract = async (contract) => {
        await updateContractMutation.mutateAsync(contract);
    };

    const handleCancelContract = async (contract) => {
        const now = new Date();
        const startDate = new Date(contract.start_date);
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const plan = STAKING_PLANS.find(p => p.months === contract.duration_months);

        let penalty;
        if (daysSinceStart <= 7) {
            penalty = contract.staked_amount * plan.penaltyRate;
        } else if (daysSinceStart <= 28) {
            penalty = (contract.staked_amount + contract.total_earned) * plan.penaltyRate;
        } else {
            penalty = contract.total_earned * plan.penaltyRate;
        }

        const returnAmount = contract.staked_amount + contract.total_earned - penalty;

        if (window.confirm(
            `Cancel contract for ${contract.wallet_address}?\n\n` +
            `Days since start: ${daysSinceStart}\n` +
            `Penalty: ${penalty.toFixed(6)} ${contract.crypto_type}\n` +
            `User will receive: ${returnAmount.toFixed(6)} ${contract.crypto_type}`
        )) {
            await cancelContractMutation.mutateAsync(contract);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1a] px-6 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to={createPageUrl('Landing')} className="hover:opacity-80 transition-opacity">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-2"
                            >
                                <img
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/db7c6aec3_image.png"
                                    alt="MarketsUniverse Logo"
                                    className="w-10 h-10 object-contain"
                                />
                                <span className="text-lg font-bold bg-gradient-to-r from-gray-400 via-red-500 to-gray-400 bg-clip-text text-transparent">
                                    MarketsUniverse
                                </span>
                            </motion.div>
                        </Link>
                        <div className="h-6 w-px bg-white/20" />
                        <Link to={createPageUrl('Staking')}>
                            <Button variant="ghost" className="text-gray-400 hover:text-white rounded-xl">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                User View
                            </Button>
                        </Link>
                        <Link to={createPageUrl('GeneralAdmin')}>
                            <Button variant="ghost" className="text-gray-400 hover:text-white rounded-xl">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Admin Hub
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Staking Admin</h1>
                    <p className="text-gray-400">Monitor all staking contracts and settings</p>
                </div>

                {/* Company Wallet Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6 mb-8"
                >
                    <h3 className="text-xl font-bold text-white mb-4">Staking Settings</h3>

                    {/* Lock/Unlock Toggles */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                        <div>
                            <p className="text-white font-semibold mb-1">New Deposits Status</p>
                            <p className="text-sm text-gray-400">
                                {settings?.deposits_locked ? 'New staking contracts are locked' : 'New staking contracts are open'}
                            </p>
                        </div>
                        <Button
                            onClick={async () => {
                                if (settings?.id) {
                                    await supabase.from('pool_settings').update({
                                        deposits_locked: !settings.deposits_locked
                                    }).eq('id', settings.id);
                                    queryClient.invalidateQueries({ queryKey: ['stakingSettings'] });
                                } else {
                                    alert('Please set company wallet address first');
                                }
                            }}
                            className={settings?.deposits_locked
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90'
                                : 'bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90'
                            }
                        >
                            {settings?.deposits_locked ? '🔓 Unlock Deposits' : '🔒 Lock Deposits'}
                        </Button>
                    </div>

                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                        <div>
                            <p className="text-white font-semibold mb-1">Withdrawals Status</p>
                            <p className="text-sm text-gray-400">
                                {settings?.withdrawals_locked ? 'Staking withdrawals are locked' : 'Staking withdrawals are open'}
                            </p>
                        </div>
                        <Button
                            onClick={async () => {
                                if (settings?.id) {
                                    await supabase.from('pool_settings').update({
                                        withdrawals_locked: !settings.withdrawals_locked
                                    }).eq('id', settings.id);
                                    queryClient.invalidateQueries({ queryKey: ['stakingSettings'] });
                                } else {
                                    alert('Please set company wallet address first');
                                }
                            }}
                            className={settings?.withdrawals_locked
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90'
                                : 'bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90'
                            }
                        >
                            {settings?.withdrawals_locked ? '🔓 Unlock Withdrawals' : '🔒 Lock Withdrawals'}
                        </Button>
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="text-sm text-gray-400 mb-2 block">
                                Current Wallet: {settings?.pool_address || 'Not set'}
                            </label>
                            <Input
                                type="text"
                                placeholder="New company wallet address"
                                value={companyWalletInput}
                                onChange={(e) => setCompanyWalletInput(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <Button
                            onClick={() => {
                                if (companyWalletInput) {
                                    updateSettingsMutation.mutate(companyWalletInput);
                                } else {
                                    alert('Please enter a valid wallet address');
                                }
                            }}
                            disabled={isSettingsUpdating || !companyWalletInput}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white border-0 rounded-xl"
                        >
                            {isSettingsUpdating ? 'Updating...' : 'Update Wallet'}
                        </Button>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {[
                        { label: 'Total Contracts', value: stats.totalContracts, icon: Clock, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
                        { label: 'Active', value: stats.activeContracts, icon: CheckCircle2, color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
                        { label: 'Unique Users', value: stats.uniqueUsers, icon: Users, color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
                        { label: 'Total Staked', value: `$${stats.totalStaked.toFixed(2)}`, icon: DollarSign, color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' },
                        { label: 'Total Earned', value: `$${stats.totalEarned.toFixed(2)}`, icon: TrendingUp, color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
                        { label: 'Current Value', value: `$${stats.totalCurrentValue.toFixed(2)}`, icon: DollarSign, color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`bg-gradient-to-br ${stat.color} border rounded-xl p-4`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <stat.icon className="w-5 h-5 text-white/70" />
                            </div>
                            <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                            <p className="text-white text-xl font-bold">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Withdrawal Requests */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <WithdrawalManagement poolType="staking" />
                </motion.div>

                {/* Deposits Tracking */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Download className="w-6 h-6 text-green-400" />
                            Deposits Tracking ({filteredDeposits.length})
                        </h3>
                        <div className="flex items-center gap-3">
                            <Select value={depositFilter.crypto} onValueChange={(val) => setDepositFilter({ ...depositFilter, crypto: val })}>
                                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Coins</SelectItem>
                                    {CRYPTO_TYPES.map(crypto => (
                                        <SelectItem key={crypto} value={crypto}>{crypto}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={depositFilter.duration} onValueChange={(val) => setDepositFilter({ ...depositFilter, duration: val })}>
                                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Durations</SelectItem>
                                    {DURATIONS.map(dur => (
                                        <SelectItem key={dur} value={dur.toString()}>{dur} months</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left text-gray-400 p-3">Date</th>
                                    <th className="text-left text-gray-400 p-3">User</th>
                                    <th className="text-center text-gray-400 p-3">Crypto</th>
                                    <th className="text-right text-gray-400 p-3">Amount</th>
                                    <th className="text-center text-gray-400 p-3">Duration</th>
                                    <th className="text-right text-gray-400 p-3">APY</th>
                                    <th className="text-left text-gray-400 p-3">TX Hash</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDeposits.map(contract => {
                                    const plan = STAKING_PLANS.find(p => p.months === contract.duration_months);
                                    return (
                                        <tr key={contract.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-3 text-gray-400 text-xs">
                                                {new Date(contract.start_date).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-white font-mono text-xs">
                                                {contract.wallet_address.slice(0, 6)}...{contract.wallet_address.slice(-4)}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">
                                                    {contract.crypto_type}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right text-white font-bold">
                                                {contract.staked_amount.toFixed(6)}
                                            </td>
                                            <td className="p-3 text-center text-white">
                                                {contract.duration_months}m
                                            </td>
                                            <td className="p-3 text-right text-green-400">
                                                {(plan?.apy * 100).toFixed(2)}%
                                            </td>
                                            <td className="p-3 text-cyan-400 font-mono text-xs">
                                                {contract.tx_hash ? (
                                                    <a
                                                        href={`https://bscscan.com/tx/${contract.tx_hash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline"
                                                    >
                                                        {contract.tx_hash.slice(0, 6)}...{contract.tx_hash.slice(-4)}
                                                    </a>
                                                ) : 'N/A'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredDeposits.length === 0 && (
                            <p className="text-center text-gray-400 py-8">No deposits match the selected filters</p>
                        )}
                    </div>
                </motion.div>

                {/* Withdrawals Tracking */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Upload className="w-6 h-6 text-orange-400" />
                            Withdrawals Tracking ({filteredWithdrawals.length})
                        </h3>
                        <div className="flex items-center gap-3">
                            <Select value={withdrawalFilter.crypto} onValueChange={(val) => setWithdrawalFilter({ ...withdrawalFilter, crypto: val })}>
                                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Coins</SelectItem>
                                    {CRYPTO_TYPES.map(crypto => (
                                        <SelectItem key={crypto} value={crypto}>{crypto}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left text-gray-400 p-3">Date</th>
                                    <th className="text-left text-gray-400 p-3">User</th>
                                    <th className="text-center text-gray-400 p-3">Crypto</th>
                                    <th className="text-right text-gray-400 p-3">Amount</th>
                                    <th className="text-center text-gray-400 p-3">Status</th>
                                    <th className="text-left text-gray-400 p-3">Payment Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWithdrawals.map(withdrawal => (
                                    <tr key={withdrawal.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-3 text-gray-400 text-xs">
                                            {new Date(withdrawal.created_date).toLocaleString()}
                                        </td>
                                        <td className="p-3">
                                            <div className="text-white font-bold text-sm">{withdrawal.name_surname}</div>
                                            <div className="text-gray-400 text-xs font-mono">
                                                {withdrawal.wallet_address.slice(0, 6)}...{withdrawal.wallet_address.slice(-4)}
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-bold">
                                                {withdrawal.crypto_type || 'USDT'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-orange-400 font-bold">
                                            {withdrawal.amount.toFixed(6)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${withdrawal.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                                withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {withdrawal.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-3 text-cyan-400 font-mono text-xs">
                                            {withdrawal.payment_address.slice(0, 10)}...{withdrawal.payment_address.slice(-8)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredWithdrawals.length === 0 && (
                            <p className="text-center text-gray-400 py-8">No withdrawals match the selected filters</p>
                        )}
                    </div>
                </motion.div>

                {/* Contracts Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6 overflow-x-auto"
                >
                    <h3 className="text-xl font-bold text-white mb-4">All Staking Contracts</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left text-gray-400 p-3">User</th>
                                <th className="text-left text-gray-400 p-3">Crypto</th>
                                <th className="text-right text-gray-400 p-3">Staked</th>
                                <th className="text-right text-gray-400 p-3">Current Value</th>
                                <th className="text-right text-gray-400 p-3">Total Earned</th>
                                <th className="text-right text-gray-400 p-3">Daily Earnings</th>
                                <th className="text-center text-gray-400 p-3">Duration</th>
                                <th className="text-center text-gray-400 p-3">Time Left</th>
                                <th className="text-center text-gray-400 p-3">Status</th>
                                <th className="text-center text-gray-400 p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((contract) => {
                                const dailyEarnings = getDailyEarnings(contract);
                                const plan = STAKING_PLANS.find(p => p.months === contract.duration_months);

                                return (
                                    <tr key={contract.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-3 text-white">
                                            {contract.wallet_address.slice(0, 6)}...{contract.wallet_address.slice(-4)}
                                        </td>
                                        <td className="p-3 text-white font-bold">{contract.crypto_type}</td>
                                        <td className="p-3 text-right text-white">
                                            {contract.staked_amount.toFixed(6)}
                                        </td>
                                        <td className="p-3 text-right text-white font-bold">
                                            {contract.current_value.toFixed(6)}
                                        </td>
                                        <td className="p-3 text-right text-green-400">
                                            +{Math.abs(contract.total_earned).toFixed(6)}
                                        </td>
                                        <td className="p-3 text-right text-blue-400">
                                            {contract.status === 'active' ? `+${Math.abs(dailyEarnings).toFixed(6)}` : '-'}
                                        </td>
                                        <td className="p-3 text-center text-white">
                                            {plan?.months}m
                                        </td>
                                        <td className="p-3 text-center text-white">
                                            {getTimeRemaining(contract.end_date)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs ${contract.status === 'active'
                                                ? 'bg-green-500/20 text-green-400'
                                                : contract.status === 'completed'
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {contract.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                {contract.status === 'active' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleUpdateContract(contract)}
                                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                                        >
                                                            Update
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleCancelContract(contract)}
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {contracts.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No staking contracts yet</p>
                    )}
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mt-8"
                >
                    <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Danger Zone</h3>
                    <p className="text-gray-300 text-sm mb-4">
                        Delete all staking contracts and withdrawal requests. This action cannot be undone!
                    </p>
                    <Button
                        onClick={async () => {
                            if (window.confirm('⚠️ WARNING: This will permanently delete ALL staking contracts and withdrawal requests. Are you absolutely sure?')) {
                                if (window.confirm('This is your FINAL confirmation. Type "DELETE" in the next prompt to proceed.')) {
                                    const confirmation = window.prompt('Type "DELETE" to confirm:');
                                    if (confirmation === 'DELETE') {
                                        try {
                                            // Delete all staking contracts
                                            const { error: contractError } = await supabase.from('staking_contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                                            if (contractError) throw contractError;

                                            // Delete all staking withdrawals
                                            const { error: withdrawalError } = await supabase.from('withdrawal_requests').delete().eq('pool_type', 'staking');
                                            if (withdrawalError) throw withdrawalError;

                                            queryClient.invalidateQueries();
                                            alert('✅ All staking data has been deleted');
                                        } catch (error) {
                                            alert('❌ Error deleting data: ' + error.message);
                                        }
                                    }
                                }
                            }
                        }}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl"
                    >
                        🗑️ Reset All Staking Data
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}