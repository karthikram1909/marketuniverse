import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Edit2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Pagination from '../components/common/Pagination';
import WithdrawalManagement from '../components/admin/WithdrawalManagement';
import PaymentHistory from '../components/admin/PaymentHistory';
import PoolPerformance from '../components/pools/PoolPerformance';
import { calculateTimeBasedBalances } from '../components/pools/TimeBasedCalculations';
import SuccessModal from '../components/admin/SuccessModal';
import { Users } from 'lucide-react';
import TradeSplitter from '../components/admin/TradeSplitter';

const POOL_TYPE = 'scalping';

export default function CryptoPoolAdmin() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editingTrade, setEditingTrade] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [investorPage, setInvestorPage] = useState(1);
    const [allDepositsPage, setAllDepositsPage] = useState(1);
    const tradesPerPage = 10;
    const [investorSortField, setInvestorSortField] = useState('ownership');
    const [investorSortDirection, setInvestorSortDirection] = useState('desc');
    const [depositPage, setDepositPage] = useState(1);
    const [withdrawalPage, setWithdrawalPage] = useState(1);
    const [tradePage, setTradePage] = useState(1);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showSettingsSavedModal, setShowSettingsSavedModal] = useState(false);
    const [newTrade, setNewTrade] = useState({
        date: '',
        pair: '',
        direction: 'long',
        margin: '',
        leverage: '',
        size: '',
        fee: '',
        pnl: '',
        result: 'win'
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

    const { data: trades = [] } = useQuery({
        queryKey: ['trades', POOL_TYPE],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*').eq('pool_type', POOL_TYPE);
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
            const { data } = await supabase.from('withdrawal_requests').select('*').eq('pool_type', POOL_TYPE);
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
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', POOL_TYPE);
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
            const { data } = await supabase.from('pool_investors').select('*').eq('pool_type', POOL_TYPE);
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    const { data: allPoolsInvestors = [] } = useQuery({
        queryKey: ['allPoolsInvestors'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch all profiles to get usernames
    const { data: allProfiles = [] } = useQuery({
        queryKey: ['allProfiles'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('id, username, wallet_address');
            return data || [];
        },
        enabled: isAdmin,
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

    const { data: allPoolsTrades = [] } = useQuery({
        queryKey: ['allPoolsTrades'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    const { data: allPoolsWithdrawals = [] } = useQuery({
        queryKey: ['allPoolsWithdrawals'],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    const { data: allPoolsSettings = [] } = useQuery({
        queryKey: ['allPoolsSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    const createTradeMutation = useMutation({
        mutationFn: async (tradeData) => {
            const { data: trade, error } = await supabase.from('pool_trades').insert({
                pool_type: POOL_TYPE,
                ...tradeData,
                date: new Date(tradeData.date).toISOString(),
                margin: parseFloat(tradeData.margin),
                leverage: parseFloat(tradeData.leverage),
                size: parseFloat(tradeData.size),
                fee: parseFloat(tradeData.fee),
                pnl: parseFloat(tradeData.pnl)
            }).select().single();

            if (error) throw error;

            // Notify all investors and admin
            const { data: investors } = await supabase.from('pool_investors').select('wallet_address').eq('pool_type', POOL_TYPE);

            const notifications = [];

            // User notifications for all investors
            if (investors) {
                investors.forEach(investor => {
                    notifications.push({
                        wallet_address: investor.wallet_address,
                        type: 'crypto_deposit',
                        title: 'New Crypto Pool Trade',
                        message: `New ${tradeData.result} trade: ${tradeData.pair} ${tradeData.direction} - PnL: $${parseFloat(tradeData.pnl).toFixed(2)}`,
                        amount: parseFloat(tradeData.pnl),
                        read: false,
                        is_admin: false,
                        created_at: new Date().toISOString()
                    });
                });
            }

            // Admin notification
            notifications.push({
                type: 'admin_crypto_deposit',
                title: 'Trade Added to Crypto Pool',
                message: `Trade added: ${tradeData.pair} ${tradeData.direction} - PnL: $${parseFloat(tradeData.pnl).toFixed(2)}`,
                amount: parseFloat(tradeData.pnl),
                read: false,
                is_admin: true,
                created_at: new Date().toISOString()
            });

            if (notifications.length > 0) {
                const { error: notifyError } = await supabase.from('notifications').insert(notifications);
                if (notifyError) console.error('Error creating notifications:', notifyError);
            }

            return trade;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
            setNewTrade({
                date: '',
                pair: '',
                direction: 'long',
                margin: '',
                leverage: '',
                size: '',
                fee: '',
                pnl: '',
                result: 'win'
            });
        }
    });

    const deleteTradeMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('pool_trades').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trades'] })
    });

    const updateTradeMutation = useMutation({
        mutationFn: async ({ id, tradeData }) => {
            const { error } = await supabase.from('pool_trades').update(tradeData).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades'] });
            setEditingTrade(null);
            setNewTrade({
                date: '',
                pair: '',
                direction: 'long',
                margin: '',
                leverage: '',
                size: '',
                fee: '',
                pnl: '',
                result: 'win'
            });
        }
    });

    const updatePoolSettingsMutation = useMutation({
        mutationFn: async (data) => {
            const { error } = await supabase.from('pool_settings').update(data).eq('id', poolSettings.id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['poolSettings'] })
    });

    const createPoolSettingsMutation = useMutation({
        mutationFn: async (data) => {
            const { error } = await supabase.from('pool_settings').insert({
                pool_type: POOL_TYPE,
                profit_share_rate: 0.20,
                deposits_locked: false,
                withdrawals_locked: false,
                ...data
            });
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['poolSettings'] })
    });

    const resetPoolMutation = useMutation({
        mutationFn: async () => {
            // Delete all trades
            await supabase.from('pool_trades').delete().eq('pool_type', POOL_TYPE);

            // Delete all investors
            await supabase.from('pool_investors').delete().eq('pool_type', POOL_TYPE);

            // Delete all withdrawal requests
            await supabase.from('withdrawal_requests').delete().eq('pool_type', POOL_TYPE);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades'] });
            queryClient.invalidateQueries({ queryKey: ['investors'] });
            queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
            setShowResetModal(false);
            setShowSuccessModal(true);
        }
    });

    useEffect(() => {
        const margin = parseFloat(newTrade.margin);
        const leverage = parseFloat(newTrade.leverage);
        if (!isNaN(margin) && !isNaN(leverage) && margin > 0 && leverage > 0) {
            setNewTrade(prev => ({ ...prev, size: (margin * leverage).toString() }));
        }
    }, [newTrade.margin, newTrade.leverage]);

    if (isChecking || !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    const handleAddTrade = () => {
        if (!newTrade.date || !newTrade.pair || !newTrade.margin) {
            alert('Please fill in required fields');
            return;
        }
        if (editingTrade) {
            updateTradeMutation.mutate({
                id: editingTrade.id,
                tradeData: {
                    pool_type: POOL_TYPE,
                    date: new Date(newTrade.date).toISOString(),
                    pair: newTrade.pair,
                    direction: newTrade.direction,
                    margin: parseFloat(newTrade.margin),
                    leverage: parseFloat(newTrade.leverage),
                    size: parseFloat(newTrade.size),
                    fee: parseFloat(newTrade.fee),
                    pnl: parseFloat(newTrade.pnl),
                    result: newTrade.result
                }
            });
        } else {
            createTradeMutation.mutate(newTrade);
        }
    };

    const handleEditTrade = (trade) => {
        setEditingTrade(trade);
        const utcDateStr = new Date(trade.date).toISOString().slice(0, 16);
        setNewTrade({
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

    const handleCancelEdit = () => {
        setEditingTrade(null);
        setNewTrade({
            date: '',
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
                        'radial-gradient(circle at 20% 50%, rgba(6,182,212,0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 50%, rgba(168,85,247,0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 80%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, rgba(6,182,212,0.15) 0%, transparent 50%)',
                    ]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating Orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

            <div className="relative z-10 px-6 py-8 max-w-7xl mx-auto">
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
                        <Link to={createPageUrl('CryptoPool')}>
                            <Button className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all rounded-xl">
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
                        <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500 rounded-full" />
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
                            Crypto Pool Admin
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">Manage trades, withdrawals, and pool settings</p>
                </motion.div>

                {/* Pool Performance Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            Pool Performance
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                    </div>
                    <PoolPerformance
                        trades={trades}
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
                            <h3 className="text-3xl font-bold text-white mb-4">Crypto Pool Not Initialized</h3>
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
                                {createPoolSettingsMutation.isPending ? 'Initializing...' : '🚀 Initialize Crypto Pool'}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Trade Splitter */}
                {poolSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <TradeSplitter
                            cryptoPoolBalance={(() => {
                                const cryptoInvestors = allPoolsInvestors.filter(inv => inv.pool_type === 'scalping');
                                const cryptoTrades = allPoolsTrades.filter(t => t.pool_type === 'scalping');
                                const cryptoWithdrawals = allPoolsWithdrawals.filter(w => w.pool_type === 'scalping' && w.status === 'paid');
                                const cryptoSettings = allPoolsSettings.find(s => s.pool_type === 'scalping');
                                const { totalPoolValue } = calculateTimeBasedBalances({
                                    investors: cryptoInvestors,
                                    trades: cryptoTrades,
                                    withdrawals: cryptoWithdrawals,
                                    profitShareRate: cryptoSettings?.profit_share_rate || 0,
                                    isAdmin: true
                                });
                                return totalPoolValue;
                            })()}
                            vipPoolBalance={(() => {
                                const vipInvestors = allPoolsInvestors.filter(inv => inv.pool_type === 'vip');
                                const vipTrades = allPoolsTrades.filter(t => t.pool_type === 'vip');
                                const vipWithdrawals = allPoolsWithdrawals.filter(w => w.pool_type === 'vip' && w.status === 'paid');
                                const vipSettings = allPoolsSettings.find(s => s.pool_type === 'vip');
                                const { totalPoolValue } = calculateTimeBasedBalances({
                                    investors: vipInvestors,
                                    trades: vipTrades,
                                    withdrawals: vipWithdrawals,
                                    profitShareRate: vipSettings?.profit_share_rate || 0,
                                    isAdmin: true
                                });
                                return totalPoolValue;
                            })()}
                        />
                    </motion.div>
                )}

                {/* Pool Settings */}
                {poolSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-br from-purple-500/5 via-black/40 to-pink-600/5 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-50" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Pool Settings</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-sm text-gray-400 mb-2 block">Pool Wallet Address (BEP-20)</label>
                                    <Input
                                        type="text"
                                        defaultValue={poolSettings.pool_address}
                                        onBlur={(e) => {
                                            if (e.target.value && e.target.value !== poolSettings.pool_address) {
                                                updatePoolSettingsMutation.mutate({ pool_address: e.target.value });
                                            }
                                        }}
                                        className="bg-white/5 border-white/10 text-white font-mono text-sm"
                                        placeholder="0x..."
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Users will deposit to this address</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-2 block">Profit Share Rate (%)</label>
                                    <Input
                                        type="number"
                                        step="1"
                                        value={(poolSettings.profit_share_rate * 100).toFixed(0)}
                                        onChange={(e) => {
                                            const rate = parseFloat(e.target.value) / 100;
                                            updatePoolSettingsMutation.mutate({ profit_share_rate: rate });
                                        }}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={poolSettings.deposits_locked}
                                        onChange={(e) => updatePoolSettingsMutation.mutate({ deposits_locked: e.target.checked })}
                                        className="w-5 h-5 rounded bg-white/10 border-white/20"
                                    />
                                    <span className="text-white font-medium">Lock Deposits</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={poolSettings.withdrawals_locked}
                                        onChange={(e) => updatePoolSettingsMutation.mutate({ withdrawals_locked: e.target.checked })}
                                        className="w-5 h-5 rounded bg-white/10 border-white/20"
                                    />
                                    <span className="text-white font-medium">Lock Withdrawals</span>
                                </label>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setShowSettingsSavedModal(true);
                                    }}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl"
                                >
                                    Update Settings
                                </Button>
                                <Button
                                    onClick={() => setShowResetModal(true)}
                                    variant="outline"
                                    className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Reset Pool Database
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Investor Overview */}
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
                                            trades: trades,
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
                                                    <td className="p-3 text-white">
                                                        {profilesMap.get(investor.id) || profilesMap.get(investor.wallet_address?.toLowerCase()) || investor.investor_name || 'Unknown'}
                                                    </td>
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
                                            <tr key="totals" className="border-t-2 border-cyan-500/30 bg-cyan-500/5">
                                                <td className="p-3 text-cyan-400 font-bold" colSpan="2">TOTALS</td>
                                                <td className="p-3 text-right text-cyan-400 font-bold">${totalBalance.toFixed(2)}</td>
                                                <td className="p-3 text-right text-cyan-400 font-bold">{totalOwnership.toFixed(2)}%</td>
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
                                trades: trades,
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
                                (investor.deposit_transactions || []).map((deposit, idx) => {
                                    const username = profilesMap.get(investor.id) || profilesMap.get(investor.wallet_address?.toLowerCase());
                                    return {
                                        ...deposit,
                                        investor_name: username || investor.investor_name,
                                        wallet_address: investor.wallet_address,
                                        id: `${investor.id}-${idx}`
                                    };
                                })
                            ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                                                        <p className="text-white font-bold text-lg mb-1">
                                                            {deposit.investor_name || `User ${deposit.wallet_address?.slice(0, 6)}`}
                                                        </p>
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
                    className="relative bg-gradient-to-br from-cyan-500/5 via-black/40 to-blue-600/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 mb-8 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-50" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                {editingTrade ? 'Edit Trade' : 'Add New Trade'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <Input
                                    type="datetime-local"
                                    value={newTrade.date}
                                    onChange={(e) => setNewTrade({ ...newTrade, date: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                                <span className="text-xs text-gray-400 ml-1">UTC Timezone</span>
                            </div>
                            <Input
                                placeholder="Pair (BTC/USDT)"
                                value={newTrade.pair}
                                onChange={(e) => setNewTrade({ ...newTrade, pair: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <select
                                value={newTrade.direction}
                                onChange={(e) => setNewTrade({ ...newTrade, direction: e.target.value })}
                                className="bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 h-10"
                            >
                                <option value="long" className="bg-gray-800 text-white">Long</option>
                                <option value="short" className="bg-gray-800 text-white">Short</option>
                            </select>
                            <Input
                                type="number"
                                placeholder="Margin"
                                value={newTrade.margin}
                                onChange={(e) => setNewTrade({ ...newTrade, margin: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <Input
                                type="number"
                                placeholder="Leverage"
                                value={newTrade.leverage}
                                onChange={(e) => setNewTrade({ ...newTrade, leverage: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                                type="number"
                                placeholder="Size"
                                value={newTrade.size}
                                onChange={(e) => setNewTrade({ ...newTrade, size: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                                type="number"
                                placeholder="Fee"
                                value={newTrade.fee}
                                onChange={(e) => setNewTrade({ ...newTrade, fee: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                                type="number"
                                placeholder="PnL"
                                value={newTrade.pnl}
                                onChange={(e) => setNewTrade({ ...newTrade, pnl: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <select
                                value={newTrade.result}
                                onChange={(e) => setNewTrade({ ...newTrade, result: e.target.value })}
                                className="bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 h-10"
                            >
                                <option value="win" className="bg-gray-800 text-white">Win</option>
                                <option value="lose" className="bg-gray-800 text-white">Lose</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleAddTrade}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {editingTrade ? 'Update Trade' : 'Add Trade'}
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
                    className="relative bg-gradient-to-br from-purple-500/5 via-black/40 to-pink-600/5 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 overflow-x-auto mb-8"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-50" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Trade History</h3>
                            <span className="text-sm text-gray-400">Total: {trades.length} trades</span>
                        </div>
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
                                    <th className="text-center text-gray-400 p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades
                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .slice((currentPage - 1) * tradesPerPage, currentPage * tradesPerPage)
                                    .map((trade) => (
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
                                            <td className={`p-3 text-right ${(() => {
                                                const profitAfterFees = trade.pnl - trade.fee;
                                                const profitShare = profitAfterFees > 0 ? profitAfterFees * (poolSettings?.profit_share_rate || 0) : 0;
                                                const netPnl = profitAfterFees - profitShare;
                                                return netPnl >= 0 ? 'text-green-400' : 'text-red-400';
                                            })()
                                                }`}>
                                                ${(() => {
                                                    const profitAfterFees = trade.pnl - trade.fee;
                                                    const profitShare = profitAfterFees > 0 ? profitAfterFees * (poolSettings?.profit_share_rate || 0) : 0;
                                                    const netPnl = profitAfterFees - profitShare;
                                                    return netPnl.toFixed(2);
                                                })()}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs ${trade.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {trade.result.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditTrade(trade)}
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteTradeMutation.mutate(trade.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(trades.length / tradesPerPage)}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </motion.div>

                {/* Withdrawal Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            Withdrawal Requests
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                    </div>
                    <WithdrawalManagement poolType={POOL_TYPE} />
                </motion.div>

                {/* Payment History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8"
                >
                    <PaymentHistory withdrawals={withdrawals} />
                </motion.div>

                {/* Activity Tracking System */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
                            Activity Tracking System
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                    </div>

                    {/* Deposits Tracking */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className="relative bg-gradient-to-br from-green-500/5 via-black/40 to-emerald-600/5 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 mb-6 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-50" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white">Deposits</h4>
                                        <p className="text-green-400 text-sm">
                                            {(() => {
                                                let count = 0;
                                                allInvestors.forEach(inv => count += (inv.deposit_transactions || []).length);
                                                return `${count} total transactions`;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                                    <span className="text-green-400 font-bold text-sm">ACTIVE</span>
                                </div>
                            </div>
                            {(() => {
                                const deposits = [];
                                allInvestors.forEach(investor => {
                                    const username = profilesMap.get(investor.id) || profilesMap.get(investor.wallet_address?.toLowerCase());
                                    (investor.deposit_transactions || []).forEach(deposit => {
                                        deposits.push({
                                            date: new Date(deposit.date),
                                            amount: deposit.amount,
                                            investor_name: username || investor.investor_name,
                                            wallet_address: investor.wallet_address,
                                            tx_hash: deposit.tx_hash
                                        });
                                    });
                                });
                                deposits.sort((a, b) => b.date.getTime() - a.date.getTime());

                                const depositsPerPage = 10;
                                const totalDepositPages = Math.ceil(deposits.length / depositsPerPage);
                                const paginatedDeposits = deposits.slice((depositPage - 1) * depositsPerPage, depositPage * depositsPerPage);

                                return (
                                    <>
                                        <div className="space-y-3">
                                            {paginatedDeposits.map((deposit, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative bg-gradient-to-br from-green-500/10 via-black/20 to-transparent backdrop-blur-sm border border-green-500/30 hover:border-green-400/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                    <div className="relative z-10 flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                                <span className="text-gray-400 text-sm font-medium">
                                                                    {deposit.date.toISOString().replace('T', ' ').slice(0, 19)} UTC
                                                                </span>
                                                            </div>
                                                            <p className="text-white font-bold text-lg mb-1">
                                                                {deposit.investor_name || `User ${deposit.wallet_address?.slice(0, 6)}`}
                                                            </p>
                                                            <p className="text-gray-400 text-sm font-mono bg-black/30 px-2 py-1 rounded inline-block">
                                                                {deposit.wallet_address.slice(0, 10)}...{deposit.wallet_address.slice(-8)}
                                                            </p>
                                                            {deposit.tx_hash && (
                                                                <a
                                                                    href={`https://bscscan.com/tx/${deposit.tx_hash}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-cyan-400 text-xs hover:text-cyan-300 mt-2 transition-colors"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
                                                                    TX: {deposit.tx_hash.slice(0, 10)}...
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="px-4 py-2 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl border border-green-500/30">
                                                                <p className="text-green-400 font-bold text-2xl">${deposit.amount.toFixed(2)}</p>
                                                                <p className="text-green-300/60 text-xs">USDT</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        {totalDepositPages > 1 && (
                                            <Pagination
                                                currentPage={depositPage}
                                                totalPages={totalDepositPages}
                                                onPageChange={setDepositPage}
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>

                    {/* Withdrawals Tracking */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                        className="relative bg-gradient-to-br from-yellow-500/5 via-black/40 to-orange-600/5 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-6 mb-6 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-50" />
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-xl">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white">Withdrawals</h4>
                                        <p className="text-yellow-400 text-sm">{withdrawals.length} total requests</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                    <span className="text-yellow-400 font-bold text-sm">MONITORING</span>
                                </div>
                            </div>
                            {(() => {
                                const sortedWithdrawals = [...withdrawals].sort((a, b) =>
                                    new Date(b.created_date) - new Date(a.created_date)
                                );

                                const withdrawalsPerPage = 10;
                                const totalWithdrawalPages = Math.ceil(sortedWithdrawals.length / withdrawalsPerPage);
                                const paginatedWithdrawals = sortedWithdrawals.slice(
                                    (withdrawalPage - 1) * withdrawalsPerPage,
                                    withdrawalPage * withdrawalsPerPage
                                );

                                return (
                                    <>
                                        <div className="space-y-3">
                                            {paginatedWithdrawals.map((withdrawal, idx) => (
                                                <motion.div
                                                    key={withdrawal.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative bg-gradient-to-br from-yellow-500/10 via-black/20 to-transparent backdrop-blur-sm border border-yellow-500/30 hover:border-yellow-400/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                                    <div className="relative z-10 flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm ${withdrawal.status === 'paid' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                                    withdrawal.status === 'pending' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse' :
                                                                        'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                    }`}>
                                                                    {withdrawal.status.toUpperCase()}
                                                                </span>
                                                                <span className="text-gray-400 text-sm font-medium">
                                                                    {new Date(withdrawal.created_date).toISOString().replace('T', ' ').slice(0, 19)} UTC
                                                                </span>
                                                            </div>
                                                            <p className="text-white font-bold text-lg mb-1">{withdrawal.name_surname}</p>
                                                            <p className="text-gray-400 text-sm font-mono bg-black/30 px-2 py-1 rounded inline-block">
                                                                {withdrawal.wallet_address.slice(0, 10)}...{withdrawal.wallet_address.slice(-8)}
                                                            </p>
                                                            {withdrawal.paid_date && (
                                                                <div className="flex items-center gap-1 text-green-400 text-xs mt-2">
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Paid: {new Date(withdrawal.paid_date).toISOString().replace('T', ' ').slice(0, 19)} UTC
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="px-4 py-2 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl border border-yellow-500/30">
                                                                <p className="text-yellow-400 font-bold text-2xl">-${withdrawal.amount.toFixed(2)}</p>
                                                                <p className="text-yellow-300/60 text-xs">USDT</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        {totalWithdrawalPages > 1 && (
                                            <Pagination
                                                currentPage={withdrawalPage}
                                                totalPages={totalWithdrawalPages}
                                                onPageChange={setWithdrawalPage}
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>

                    {/* Trades Tracking */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9 }}
                        className="relative bg-gradient-to-br from-cyan-500/5 via-black/40 to-purple-600/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent opacity-50" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white">Trades</h4>
                                        <p className="text-cyan-400 text-sm">{trades.length} total trades</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                                    <span className="text-cyan-400 font-bold text-sm">LIVE</span>
                                </div>
                            </div>
                            {(() => {
                                const sortedTrades = [...trades].sort((a, b) =>
                                    new Date(b.date) - new Date(a.date)
                                );

                                const tradesPerPageTracking = 10;
                                const totalTradePages = Math.ceil(sortedTrades.length / tradesPerPageTracking);
                                const paginatedTrades = sortedTrades.slice(
                                    (tradePage - 1) * tradesPerPageTracking,
                                    tradePage * tradesPerPageTracking
                                );

                                return (
                                    <>
                                        <div className="space-y-3">
                                            {paginatedTrades.map((trade, idx) => {
                                                const profitAfterFees = trade.pnl - trade.fee;
                                                const profitShare = profitAfterFees > 0 ? profitAfterFees * (poolSettings?.profit_share_rate || 0) : 0;
                                                const netPnl = profitAfterFees - profitShare;

                                                return (
                                                    <motion.div
                                                        key={trade.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className={`group relative backdrop-blur-sm rounded-2xl p-5 transition-all duration-300 border ${trade.result === 'win'
                                                            ? 'bg-gradient-to-br from-cyan-500/10 via-black/20 to-blue-500/5 border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20'
                                                            : 'bg-gradient-to-br from-red-500/10 via-black/20 to-pink-500/5 border-red-500/30 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20'
                                                            }`}
                                                    >
                                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl ${trade.result === 'win' ? 'bg-gradient-to-br from-cyan-500/5 to-transparent' : 'bg-gradient-to-br from-red-500/5 to-transparent'
                                                            }`} />
                                                        <div className="relative z-10 flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm border ${trade.result === 'win'
                                                                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                                                                        }`}>
                                                                        {trade.result.toUpperCase()}
                                                                    </span>
                                                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${trade.direction === 'long' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
                                                                        }`}>
                                                                        {trade.direction.toUpperCase()}
                                                                    </span>
                                                                    <span className="text-gray-400 text-sm">
                                                                        {new Date(trade.date).toISOString().replace('T', ' ').slice(0, 19)} UTC
                                                                    </span>
                                                                </div>
                                                                <p className="text-white font-bold text-xl mb-2">{trade.pair}</p>
                                                                <div className="flex flex-wrap gap-3 text-sm">
                                                                    <span className="px-2 py-1 bg-black/30 rounded-lg text-gray-300">
                                                                        {trade.leverage}x Leverage
                                                                    </span>
                                                                    <span className="px-2 py-1 bg-black/30 rounded-lg text-gray-300">
                                                                        ${trade.margin.toFixed(2)} Margin
                                                                    </span>
                                                                    <span className="px-2 py-1 bg-black/30 rounded-lg text-gray-300">
                                                                        ${trade.fee.toFixed(2)} Fee
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right space-y-2">
                                                                <div className={`px-4 py-2 backdrop-blur-sm rounded-xl border ${trade.pnl >= 0
                                                                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30'
                                                                    : 'bg-gradient-to-br from-red-500/20 to-pink-600/20 border-red-500/30'
                                                                    }`}>
                                                                    <p className="text-gray-400 text-xs mb-1">Gross PNL</p>
                                                                    <p className={`font-bold text-2xl ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                        ${trade.pnl.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                                <div className={`px-4 py-2 backdrop-blur-sm rounded-xl border ${netPnl >= 0
                                                                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30'
                                                                    : 'bg-gradient-to-br from-orange-500/20 to-red-600/20 border-orange-500/30'
                                                                    }`}>
                                                                    <p className="text-gray-400 text-xs mb-1">Net PNL</p>
                                                                    <p className={`font-bold text-lg ${netPnl >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                                                                        ${netPnl.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                        {totalTradePages > 1 && (
                                            <Pagination
                                                currentPage={tradePage}
                                                totalPages={totalTradePages}
                                                onPageChange={setTradePage}
                                            />
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-gradient-to-br from-red-500/20 via-black to-red-600/20 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 max-w-md w-full overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-red-400 to-red-600 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Reset Pool Database?</h3>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
                                <p className="text-white text-sm font-medium mb-3">
                                    This will permanently delete:
                                </p>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                        All {trades.length} trades
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                        All {allInvestors.length} investors and their deposits
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                        All {withdrawals.length} withdrawal requests
                                    </li>
                                </ul>
                            </div>
                            <p className="text-red-400 text-sm font-bold mb-6 text-center">
                                ⚠️ THIS ACTION CANNOT BE UNDONE ⚠️
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowResetModal(false)}
                                    variant="outline"
                                    className="flex-1 border-white/10 text-gray-300 hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => resetPoolMutation.mutate()}
                                    disabled={resetPoolMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 text-white border-0"
                                >
                                    {resetPoolMutation.isPending ? 'Resetting...' : 'Yes, Reset Pool'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Success!"
                message="Crypto Pool database has been reset successfully!"
            />

            {/* Settings Saved Modal */}
            <SuccessModal
                isOpen={showSettingsSavedModal}
                onClose={() => setShowSettingsSavedModal(false)}
                title="Settings Saved!"
                message="Pool settings have been updated successfully."
            />
        </div>
    );
}