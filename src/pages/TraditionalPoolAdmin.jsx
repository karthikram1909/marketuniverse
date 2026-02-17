import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Edit2, TrendingUp, DollarSign, Users, Settings, Home, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Pagination from '../components/common/Pagination';
import WithdrawalManagement from '../components/admin/WithdrawalManagement';
import PaymentHistory from '../components/admin/PaymentHistory';
import PoolPerformance from '../components/pools/PoolPerformance';
import { calculateTimeBasedBalances, calculatePoolMetrics } from '../components/pools/TimeBasedCalculations';
import ConfirmResetModal from '../components/common/ConfirmResetModal';
import SuccessModal from '../components/admin/SuccessModal';

const POOL_TYPE = 'traditional';

export default function TraditionalPoolAdmin() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [investorPage, setInvestorPage] = useState(1);
    const [allDepositsPage, setAllDepositsPage] = useState(1);
    const [depositPage, setDepositPage] = useState(1);
    const [investorSortField, setInvestorSortField] = useState('ownership');
    const [investorSortDirection, setInvestorSortDirection] = useState('desc');
    const [withdrawalPage, setWithdrawalPage] = useState(1);
    const [tradePage, setTradePage] = useState(1);
    const tradesPerPage = 10;
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [tradeForm, setTradeForm] = useState({
        date: new Date().toISOString().slice(0, 16),
        pair: '',
        direction: 'long',
        margin: '',
        leverage: '',
        size: '',
        fee: '',
        pnl: '',
        result: 'win'
    });
    const [editingTrade, setEditingTrade] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showSettingsSavedModal, setShowSettingsSavedModal] = useState(false);
    const [poolSettingsForm, setPoolSettingsForm] = useState({
        profit_share_rate: '',
        deposits_locked: false,
        withdrawals_locked: false,
        usdt_contract: '',
        pool_address: ''
    });



    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) throw new Error('Not authenticated');

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile?.role !== 'admin') {
                    alert('Access denied. Admin only.');
                    navigate(createPageUrl('Home'));
                    return;
                }

                setUser({ ...user, ...profile });
                setIsAdmin(true);
            } catch (error) {
                alert('Access denied. Please login.');
                navigate(createPageUrl('Home'));
            } finally {
                setIsChecking(false);
            }
        };

        checkAdmin();
    }, [navigate]);

    const { data: allTrades = [] } = useQuery({
        queryKey: ['allTrades', POOL_TYPE],
        queryFn: async () => {
            const { data } = await supabase
                .from('pool_trades')
                .select('*')
                .eq('pool_type', POOL_TYPE);
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    const { data: withdrawals = [] } = useQuery({
        queryKey: ['withdrawals', POOL_TYPE],
        queryFn: async () => {
            const { data } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('pool_type', POOL_TYPE);
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    const { data: poolSettings } = useQuery({
        queryKey: ['poolSettings', POOL_TYPE],
        queryFn: async () => {
            const { data } = await supabase
                .from('pool_settings')
                .select('*')
                .eq('pool_type', POOL_TYPE);
            return data?.[0] || null;
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    const { data: allInvestors = [] } = useQuery({
        queryKey: ['investors', POOL_TYPE],
        queryFn: async () => {
            const { data } = await supabase
                .from('pool_investors')
                .select('*')
                .eq('pool_type', POOL_TYPE);
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    useEffect(() => {
        if (poolSettings) {
            setPoolSettingsForm({
                profit_share_rate: (poolSettings.profit_share_rate * 100).toString(),
                deposits_locked: poolSettings.deposits_locked || false,
                withdrawals_locked: poolSettings.withdrawals_locked || false,
                usdt_contract: poolSettings.usdt_contract || '',
                pool_address: poolSettings.pool_address || ''
            });
        }
    }, [poolSettings]);


    const createTradeMutation = useMutation({
        mutationFn: async (vars) => {
            const tradeData = vars;
            const { data: trade, error } = await supabase.from('pool_trades').insert({
                pool_type: POOL_TYPE,
                ...tradeData,
                date: tradeData.date + ':00.000Z'
            }).select().single();

            if (error) throw error;

            // Notify all investors and admin
            const { data: investors } = await supabase.from('pool_investors').select('*').eq('pool_type', POOL_TYPE);

            // User notifications for all investors
            if (investors && investors.length > 0) {
                const notifications = investors.map(investor =>
                    supabase.from('notifications').insert({
                        wallet_address: investor.wallet_address,
                        type: 'traditional_deposit',
                        title: 'New Traditional Pool Trade',
                        message: `New ${tradeData.result} trade: ${tradeData.pair} ${tradeData.direction} - PnL: $${parseFloat(tradeData.pnl).toFixed(2)}`,
                        amount: parseFloat(tradeData.pnl),
                        read: false,
                        is_admin: false
                    })
                );

                // Admin notification
                notifications.push(
                    supabase.from('notifications').insert({
                        type: 'admin_traditional_deposit',
                        title: 'Trade Added to Traditional Pool',
                        message: `Trade added: ${tradeData.pair} ${tradeData.direction} - PnL: $${parseFloat(tradeData.pnl).toFixed(2)}`,
                        amount: parseFloat(tradeForm.pnl),
                        read: false,
                        is_admin: true
                    })
                );

                await Promise.all(notifications);
            } else {
                // Just admin notification if no investors
                await supabase.from('notifications').insert({
                    type: 'admin_traditional_deposit',
                    title: 'Trade Added to Traditional Pool',
                    message: `Trade added: ${tradeData.pair} ${tradeData.direction} - PnL: $${parseFloat(tradeData.pnl).toFixed(2)}`,
                    amount: parseFloat(tradeData.pnl),
                    read: false,
                    is_admin: true
                });
            }

            return trade;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allTrades'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
            setTradeForm({
                date: new Date().toISOString().slice(0, 16),
                pair: '',
                direction: 'long',
                margin: '',
                leverage: '',
                size: '',
                fee: '',
                pnl: '',
                result: 'win'
            });
            setEditingTrade(null);
        }
    });

    const updateTradeMutation = useMutation({
        mutationFn: async (vars) => {
            const { id, tradeData } = vars;
            const { data, error } = await supabase.from('pool_trades').update({
                ...tradeData,
                date: tradeData.date + ':00.000Z'
            }).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allTrades'] });
            setTradeForm({
                date: new Date().toISOString().slice(0, 16),
                pair: '',
                direction: 'long',
                margin: '',
                leverage: '',
                size: '',
                fee: '',
                pnl: '',
                result: 'win'
            });
            setEditingTrade(null);
        }
    });

    const deleteTradeMutation = useMutation({
        mutationFn: async (tradeId) => {
            const { error } = await supabase.from('pool_trades').delete().eq('id', tradeId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allTrades'] });
        }
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (settings) => {
            if (poolSettings) {
                const { data, error } = await supabase.from('pool_settings').update(settings).eq('id', poolSettings.id).select().single();
                if (error) throw error;
                return data;
            } else {
                const { data, error } = await supabase.from('pool_settings').insert({
                    pool_type: POOL_TYPE,
                    ...settings
                }).select().single();
                if (error) throw error;
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['poolSettings'] });
        }
    });

    const createPoolSettingsMutation = useMutation({
        mutationFn: async (data) => {
            const { data: result, error } = await supabase.from('pool_settings').insert({
                pool_type: POOL_TYPE,
                profit_share_rate: 0.20,
                deposits_locked: false,
                withdrawals_locked: false,
                ...data
            }).select().single();
            if (error) throw error;
            return result;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['poolSettings'] })
    });

    const resetPoolMutation = useMutation({
        mutationFn: async () => {
            await supabase.from('pool_trades').delete().eq('pool_type', POOL_TYPE);
            await supabase.from('pool_investors').delete().eq('pool_type', POOL_TYPE);
            await supabase.from('withdrawal_requests').delete().eq('pool_type', POOL_TYPE);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allTrades'] });
            queryClient.invalidateQueries({ queryKey: ['investors'] });
            queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
            setShowResetModal(false);
            setShowSuccessModal(true);
        }
    });

    useEffect(() => {
        const margin = parseFloat(tradeForm.margin);
        const leverage = parseFloat(tradeForm.leverage);
        if (!isNaN(margin) && !isNaN(leverage) && margin > 0 && leverage > 0) {
            setTradeForm(prev => ({ ...prev, size: (margin * leverage).toString() }));
        }
    }, [tradeForm.margin, tradeForm.leverage]);

    if (isChecking || !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    const handleAddTrade = () => {
        const tradeData = {
            date: tradeForm.date,
            pair: tradeForm.pair,
            direction: tradeForm.direction,
            margin: parseFloat(tradeForm.margin) || 0,
            leverage: parseFloat(tradeForm.leverage) || 1,
            size: parseFloat(tradeForm.size) || 0,
            fee: parseFloat(tradeForm.fee) || 0,
            pnl: parseFloat(tradeForm.pnl) || 0,
            result: tradeForm.result
        };

        if (editingTrade) {
            updateTradeMutation.mutate({ id: editingTrade.id, tradeData });
        } else {
            createTradeMutation.mutate(tradeData);
        }
    };

    const handleEditTrade = (trade) => {
        setEditingTrade(trade);
        const utcDateStr = new Date(trade.date).toISOString().slice(0, 16);
        setTradeForm({
            date: utcDateStr,
            pair: trade.pair,
            direction: trade.direction,
            margin: trade.margin.toString(),
            leverage: trade.leverage.toString(),
            size: trade.size.toString(),
            fee: trade.fee.toString(),
            pnl: trade.pnl.toString(),
            result: trade.result
        });
        setTimeout(() => window.scrollTo({ top: 300, behavior: 'smooth' }), 100);
    };

    const handleUpdateSettings = () => {
        const rate = parseFloat(poolSettingsForm.profit_share_rate);
        if (isNaN(rate)) {
            alert("Please enter a valid profit share rate");
            return;
        }

        updateSettingsMutation.mutate({
            profit_share_rate: rate / 100,
            deposits_locked: poolSettingsForm.deposits_locked,
            withdrawals_locked: poolSettingsForm.withdrawals_locked,
            usdt_contract: poolSettingsForm.usdt_contract,
            pool_address: poolSettingsForm.pool_address
        }, {
            onSuccess: () => {
                setShowSettingsSavedModal(true);
            }
        });
    };

    const poolMetrics = calculatePoolMetrics({
        trades: allTrades,
        investors: allInvestors,
        withdrawals,
        profitShareRate: poolSettings?.profit_share_rate || 0
    });

    const handleCancelEdit = () => {
        setEditingTrade(null);
        setTradeForm({
            date: new Date().toISOString().slice(0, 16),
            pair: '',
            direction: 'long',
            margin: '',
            leverage: '',
            size: '',
            fee: '',
            pnl: '',
            result: 'win'
        });
    };

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
                    <div className="flex items-center gap-4 mb-6">
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
                        <Link to={createPageUrl('TraditionalPool')}>
                            <Button className="bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all rounded-xl">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                User View
                            </Button>
                        </Link>
                        <Link to={createPageUrl('GeneralAdmin')}>
                            <Button className="bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all rounded-xl">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Admin Hub
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                        <div className="h-1 w-20 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-full" />
                        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                            Traditional Pool Admin
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">Pool Management Dashboard</p>
                </motion.div>

                {/* Pool Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
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
                        withdrawals={withdrawals}
                        profitShareRate={poolSettings?.profit_share_rate || 0}
                    />
                </motion.div>

                {/* Initialize Pool - Only shown if no settings */}
                {!poolSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-br from-yellow-500/5 via-black/40 to-orange-600/5 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-8 mb-8 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-50" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10 text-center">
                            <div className="inline-block p-4 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl mb-6">
                                <AlertTriangle className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">Traditional Pool Not Initialized</h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                You need to initialize the pool settings with a pool address before users can deposit or withdraw.
                            </p>
                            <div className="max-w-md mx-auto mb-6">
                                <label className="text-sm text-gray-400 mb-2 block text-left">Pool Wallet Address (BEP-20)</label>
                                <Input
                                    id="pool-address-input"
                                    placeholder="0x..."
                                    className="bg-white/5 border-white/10 text-white mb-4"
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    const address = document.getElementById('pool-address-input').value;
                                    if (!address || address.length < 10) {
                                        alert('Please enter a valid wallet address');
                                        return;
                                    }
                                    createPoolSettingsMutation.mutate({ pool_address: address });
                                }}
                                disabled={createPoolSettingsMutation.isPending}
                                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:opacity-90 text-white border-0 rounded-xl px-8 py-6 text-lg font-bold"
                            >
                                {createPoolSettingsMutation.isPending ? 'Initializing...' : '🚀 Initialize Traditional Pool'}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Pool Settings */}
                {poolSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-br from-yellow-500/5 via-black/40 to-yellow-600/5 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
                                    <Settings className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Pool Settings</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 mb-4">
                                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                                    <label className="block text-gray-400 text-sm mb-2">Pool Wallet Address (BEP-20)</label>
                                    <Input
                                        type="text"
                                        value={poolSettingsForm.pool_address}
                                        onChange={(e) => setPoolSettingsForm({ ...poolSettingsForm, pool_address: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white font-mono text-sm"
                                        placeholder="0x..."
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Users will deposit to this address</p>
                                </div>
                                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                                    <label className="block text-gray-400 text-sm mb-2">Profit Share Rate (%)</label>
                                    <Input
                                        type="number"
                                        value={poolSettingsForm.profit_share_rate}
                                        onChange={(e) => setPoolSettingsForm({ ...poolSettingsForm, profit_share_rate: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                        placeholder="20"
                                    />
                                </div>
                                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-5 md:col-span-2">
                                    <label className="block text-gray-400 text-sm mb-2">USDT Contract Address (BEP-20)</label>
                                    <Input
                                        type="text"
                                        value={poolSettingsForm.usdt_contract}
                                        onChange={(e) => setPoolSettingsForm({ ...poolSettingsForm, usdt_contract: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white font-mono text-sm"
                                        placeholder="0x..."
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Contract address for the stablecoin (USDT)</p>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={poolSettingsForm.deposits_locked}
                                        onChange={(e) => setPoolSettingsForm({ ...poolSettingsForm, deposits_locked: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                    <label className="text-white">Lock Deposits</label>
                                </div>
                                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={poolSettingsForm.withdrawals_locked}
                                        onChange={(e) => setPoolSettingsForm({ ...poolSettingsForm, withdrawals_locked: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                    <label className="text-white">Lock Withdrawals</label>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleUpdateSettings}
                                    disabled={updateSettingsMutation.isPending}
                                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:opacity-90 text-white border-0 rounded-xl"
                                >
                                    {updateSettingsMutation.isPending ? 'Updating...' : 'Update Settings'}
                                </Button>
                                <Button
                                    onClick={() => setShowResetModal(true)}
                                    variant="destructive"
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 border-0 rounded-xl"
                                >
                                    Reset Pool Database
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Deposits Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-green-500/5 via-black/40 to-emerald-600/5 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-50" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Investor Overview</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left text-gray-400 p-3">Investor</th>
                                        <th className="text-left text-gray-400 p-3">Wallet</th>
                                        <th className="text-right text-gray-400 p-3">
                                            <button
                                                onClick={() => {
                                                    if (investorSortField === 'balance') {
                                                        setInvestorSortDirection(investorSortDirection === 'desc' ? 'asc' : 'desc');
                                                    } else {
                                                        setInvestorSortField('balance');
                                                        setInvestorSortDirection('desc');
                                                    }
                                                }}
                                                className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                                            >
                                                Total Balance
                                                {investorSortField === 'balance' ? (
                                                    investorSortDirection === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="text-right text-gray-400 p-3">
                                            <button
                                                onClick={() => {
                                                    if (investorSortField === 'ownership') {
                                                        setInvestorSortDirection(investorSortDirection === 'desc' ? 'asc' : 'desc');
                                                    } else {
                                                        setInvestorSortField('ownership');
                                                        setInvestorSortDirection('desc');
                                                    }
                                                }}
                                                className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                                            >
                                                Ownership
                                                {investorSortField === 'ownership' ? (
                                                    investorSortDirection === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="text-right text-gray-400 p-3">Net PNL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const { userBalances } = calculateTimeBasedBalances({
                                            investors: allInvestors,
                                            trades: allTrades,
                                            withdrawals,
                                            profitShareRate: poolSettings?.profit_share_rate || 0
                                        });

                                        let investorEntries = Object.entries(userBalances);

                                        // Sort investors
                                        investorEntries.sort((a, b) => {
                                            const [walletA, dataA] = a;
                                            const [walletB, dataB] = b;

                                            let comparison = 0;
                                            if (investorSortField === 'balance') {
                                                comparison = dataB.totalBalance - dataA.totalBalance;
                                            } else if (investorSortField === 'ownership') {
                                                comparison = dataB.ownershipPercent - dataA.ownershipPercent;
                                            }

                                            return investorSortDirection === 'desc' ? comparison : -comparison;
                                        });

                                        const investorsPerPage = 10;
                                        const paginatedInvestors = investorEntries.slice(
                                            (investorPage - 1) * investorsPerPage,
                                            investorPage * investorsPerPage
                                        );

                                        const rows = paginatedInvestors.map(([wallet, data]) => {
                                            const investor = allInvestors.find(inv => inv.wallet_address.toLowerCase() === wallet);
                                            return (
                                                <tr key={wallet} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="p-3 text-white">{investor?.investor_name || 'Unknown'}</td>
                                                    <td className="p-3 text-gray-400 font-mono text-xs">{wallet.slice(0, 6)}...{wallet.slice(-4)}</td>
                                                    <td className="p-3 text-right text-white font-bold">${data.totalBalance.toFixed(2)}</td>
                                                    <td className="p-3 text-right text-cyan-400">{data.ownershipPercent.toFixed(2)}%</td>
                                                    <td className={`p-3 text-right font-bold ${data.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        ${data.netPnl.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        });

                                        // Calculate totals
                                        const totalOwnership = investorEntries.reduce((sum, [_, data]) => sum + data.ownershipPercent, 0);
                                        const totalBalance = investorEntries.reduce((sum, [_, data]) => sum + data.totalBalance, 0);
                                        const totalNetPnl = investorEntries.reduce((sum, [_, data]) => sum + data.netPnl, 0);

                                        return [
                                            ...rows,
                                            <tr key="totals" className="border-t-2 border-yellow-500/30 bg-yellow-500/5">
                                                <td className="p-3 text-yellow-400 font-bold" colSpan="2">TOTALS</td>
                                                <td className="p-3 text-right text-yellow-400 font-bold">${totalBalance.toFixed(2)}</td>
                                                <td className="p-3 text-right text-yellow-400 font-bold">{totalOwnership.toFixed(2)}%</td>
                                                <td className={`p-3 text-right font-bold ${totalNetPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    ${totalNetPnl.toFixed(2)}
                                                </td>
                                            </tr>
                                        ];
                                    })()}
                                </tbody>
                            </table>
                        </div>
                        {(() => {
                            const { userBalances } = calculateTimeBasedBalances({
                                investors: allInvestors,
                                trades: allTrades,
                                withdrawals,
                                profitShareRate: poolSettings?.profit_share_rate || 0
                            });
                            const investorEntries = Object.entries(userBalances);
                            const investorsPerPage = 10;
                            const totalInvestorPages = Math.ceil(investorEntries.length / investorsPerPage);

                            return totalInvestorPages > 1 ? (
                                <Pagination
                                    currentPage={investorPage}
                                    totalPages={totalInvestorPages}
                                    onPageChange={setInvestorPage}
                                />
                            ) : null;
                        })()}
                    </div>
                </motion.div>

                {/* All Deposits */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-green-500/5 via-black/40 to-emerald-600/5 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-50" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">All Deposits</h3>
                        </div>
                        {(() => {
                            const allDeposits = allInvestors.flatMap(investor =>
                                (investor.deposit_transactions || []).map((deposit, idx) => ({
                                    ...deposit,
                                    investor_name: investor.investor_name,
                                    wallet_address: investor.wallet_address,
                                    id: `${investor.id}-${idx}`
                                }))
                            ).sort((a, b) => new Date(b.date) - new Date(a.date));

                            const depositsPerPage = 10;
                            const totalDepositPages = Math.ceil(allDeposits.length / depositsPerPage);
                            const paginatedDeposits = allDeposits.slice(
                                (allDepositsPage - 1) * depositsPerPage,
                                allDepositsPage * depositsPerPage
                            );

                            return (
                                <>
                                    <div className="space-y-3 mb-6">
                                        {paginatedDeposits.map((deposit, idx) => (
                                            <motion.div
                                                key={deposit.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group relative bg-gradient-to-br from-green-500/10 via-black/20 to-transparent backdrop-blur-sm border border-green-500/30 hover:border-green-400/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                <div className="relative z-10 flex justify-between items-start">
                                                    <div>
                                                        <p className="text-white font-bold text-lg mb-1">{deposit.investor_name}</p>
                                                        <p className="text-gray-400 text-sm font-mono bg-black/30 px-2 py-1 rounded inline-block">
                                                            {deposit.wallet_address.slice(0, 10)}...{deposit.wallet_address.slice(-8)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="px-4 py-2 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl border border-green-500/30">
                                                            <p className="text-green-400 font-bold text-2xl">${deposit.amount.toFixed(2)}</p>
                                                            <p className="text-green-300/60 text-xs">USDT</p>
                                                        </div>
                                                        <p className="text-gray-400 text-xs mt-2">
                                                            {new Date(deposit.date).toISOString().replace('T', ' ').slice(0, 16)} UTC
                                                        </p>
                                                    </div>
                                                </div>
                                                {deposit.tx_hash && (
                                                    <a
                                                        href={`https://bscscan.com/tx/${deposit.tx_hash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-cyan-400 text-xs hover:text-cyan-300 mt-3 transition-colors"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        View TX: {deposit.tx_hash.slice(0, 10)}...
                                                    </a>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                    {totalDepositPages > 1 && (
                                        <Pagination
                                            currentPage={allDepositsPage}
                                            totalPages={totalDepositPages}
                                            onPageChange={setAllDepositsPage}
                                        />
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </motion.div>

                {/* Add Trade Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-yellow-500/5 via-black/40 to-amber-600/5 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-50" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                {editingTrade ? 'Edit Trade' : 'Add New Trade'}
                            </h3>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <Input
                                    type="datetime-local"
                                    value={tradeForm.date}
                                    onChange={(e) => setTradeForm({ ...tradeForm, date: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                                <span className="text-xs text-gray-400 ml-1">UTC Timezone</span>
                            </div>
                            <Input
                                placeholder="Pair (e.g., BTC/USDT)"
                                value={tradeForm.pair}
                                onChange={(e) => setTradeForm({ ...tradeForm, pair: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <select
                                value={tradeForm.direction}
                                onChange={(e) => setTradeForm({ ...tradeForm, direction: e.target.value })}
                                className="bg-white/5 border border-white/10 text-white rounded-md px-3 h-10"
                            >
                                <option value="long" className="bg-gray-800 text-white">Long</option>
                                <option value="short" className="bg-gray-800 text-white">Short</option>
                            </select>
                            <Input
                                type="number"
                                placeholder="Margin"
                                value={tradeForm.margin}
                                onChange={(e) => setTradeForm({ ...tradeForm, margin: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="grid md:grid-cols-5 gap-4 mb-4">
                            <Input
                                type="number"
                                placeholder="Leverage"
                                value={tradeForm.leverage}
                                onChange={(e) => setTradeForm({ ...tradeForm, leverage: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                                type="number"
                                placeholder="Size"
                                value={tradeForm.size}
                                onChange={(e) => setTradeForm({ ...tradeForm, size: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                                type="number"
                                placeholder="Fee"
                                value={tradeForm.fee}
                                onChange={(e) => setTradeForm({ ...tradeForm, fee: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                                type="number"
                                placeholder="PnL"
                                value={tradeForm.pnl}
                                onChange={(e) => setTradeForm({ ...tradeForm, pnl: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <select
                                value={tradeForm.result}
                                onChange={(e) => setTradeForm({ ...tradeForm, result: e.target.value })}
                                className="bg-white/5 border border-white/10 text-white rounded-md px-3 h-10"
                            >
                                <option value="win" className="bg-gray-800 text-white">Win</option>
                                <option value="lose" className="bg-gray-800 text-white">Lose</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleAddTrade}
                                disabled={createTradeMutation.isPending || updateTradeMutation.isPending}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {editingTrade
                                    ? (updateTradeMutation.isPending ? 'Updating...' : 'Update Trade')
                                    : (createTradeMutation.isPending ? 'Adding...' : 'Add Trade')}
                            </Button>
                            {editingTrade && (
                                <Button
                                    onClick={handleCancelEdit}
                                    variant="outline"
                                    className="border-white/10 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Trades Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative bg-gradient-to-br from-amber-500/5 via-black/40 to-orange-600/5 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-50" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Trade History</h3>
                            <span className="text-sm text-gray-400">Total: {allTrades.length} trades</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-gray-400">Date</th>
                                        <th className="text-left py-3 px-4 text-gray-400">Pair</th>
                                        <th className="text-left py-3 px-4 text-gray-400">Direction</th>
                                        <th className="text-left py-3 px-4 text-gray-400">Margin</th>
                                        <th className="text-left py-3 px-4 text-gray-400">Leverage</th>
                                        <th className="text-left py-3 px-4 text-gray-400">Size</th>
                                        <th className="text-left py-3 px-4 text-gray-400">Fee</th>
                                        <th className="text-left py-3 px-4 text-gray-400">PnL</th>
                                        <th className="text-left py-3 px-4 text-gray-400">Result</th>
                                        <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTrades
                                        .slice()
                                        .reverse()
                                        .slice((currentPage - 1) * tradesPerPage, currentPage * tradesPerPage)
                                        .map((trade) => (
                                            <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-3 px-4 text-white">{new Date(trade.date).toISOString().replace('T', ' ').slice(0, 16)}</td>
                                                <td className="py-3 px-4 text-white">{trade.pair}</td>
                                                <td className="py-3 px-4 text-white capitalize">{trade.direction}</td>
                                                <td className="py-3 px-4 text-white">${trade.margin.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-white">{trade.leverage}x</td>
                                                <td className="py-3 px-4 text-white">${trade.size.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-red-400">${trade.fee.toFixed(2)}</td>
                                                <td className={`py-3 px-4 ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    ${trade.pnl.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs ${trade.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {trade.result.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEditTrade(trade)}
                                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => deleteTradeMutation.mutate(trade.id)}
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(allTrades.length / tradesPerPage)}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </motion.div>

                {/* Withdrawal Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                            Withdrawal Requests
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    </div>
                    <WithdrawalManagement poolType={POOL_TYPE} />
                </motion.div>

                {/* Payment History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <PaymentHistory withdrawals={withdrawals} />
                </motion.div>

                <ConfirmResetModal
                    isOpen={showResetModal}
                    onClose={() => setShowResetModal(false)}
                    onConfirm={() => resetPoolMutation.mutate()}
                    loading={resetPoolMutation.isPending}
                />

                <SuccessModal
                    isOpen={showSuccessModal}
                    onClose={() => setShowSuccessModal(false)}
                    title="Success!"
                    message="Traditional Pool database has been reset successfully!"
                />

                {/* Settings Saved Modal */}
                <SuccessModal
                    isOpen={showSettingsSavedModal}
                    onClose={() => setShowSettingsSavedModal(false)}
                    title="Settings Saved!"
                    message="Pool settings have been updated successfully."
                />
            </div>
        </div>
    );
}