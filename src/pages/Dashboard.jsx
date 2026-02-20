import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../components/wallet/WalletContext';
import UserProfileForm from '../components/dashboard/UserProfileForm';
import PoolTradesPanel from '../components/dashboard/PoolTradesPanel';
import StakingContracts from '../components/dashboard/StakingContracts';
import WithdrawalsPanel from '../components/dashboard/WithdrawalsPanel';

import PoolsOverview from '../components/dashboard/PoolsOverview';
import TaxReportPanel from '../components/dashboard/TaxReportPanel';
import DealOrNoDealPanel from '../components/dashboard/DealOrNoDealPanel';
import KYCPanel from '../components/dashboard/KYCPanel';
import ProfileCompletionModal from '../components/dashboard/ProfileCompletionModal';
import NotificationsPanel from '../components/dashboard/NotificationsPanel';
import ChatRoom from './Chat';

import Logo from '../components/common/Logo';
import { Button } from '@/components/ui/button';
import { Wallet, Home, Settings, Bell, LogOut, Menu, X, Shield, Briefcase, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';

function DashboardContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { account, connectWallet, disconnectWallet, isConnecting, formatAddress } = useWallet();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);

    // Use useQuery for user data so it updates automatically
    const { data: user, isLoading: isChecking } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            return { ...user, ...profile };
        },
        retry: false,
        staleTime: 300000,
        refetchOnWindowFocus: false,
        refetchOnMount: false
    });

    // Check for any pending transactions on dashboard load
    useEffect(() => {
        if (!account) return;

        const checkPendingTransactions = async () => {
            try {
                const { data: pending } = await supabase
                    .from('pending_transactions')
                    .select('*')
                    .eq('wallet_address', account.toLowerCase())
                    .in('status', ['pending', 'verifying']);

                // Verify each pending transaction
                if (pending) {
                    for (const tx of pending) {
                        if (tx.tx_hash) {
                            try {
                                await supabase.functions.invoke('verify-bsc-transaction', {
                                    body: { txHash: tx.tx_hash }
                                });
                            } catch (error) {
                                console.error('Failed to verify pending tx:', tx.tx_hash, error);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to check pending transactions:', error);
            }
        };

        checkPendingTransactions();
    }, [account]);

    // Read query param to set activeView on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const viewParam = params.get('view');
        if (viewParam === 'chat') {
            setActiveView('chat');
        }
    }, [location.search]);

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);



    // Fetch unread notifications count
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', account],
        queryFn: async () => {
            if (!account) return [];
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('wallet_address', account.toLowerCase())
                .eq('read', false)
                .eq('is_admin', false);
            return data || [];
        },
        enabled: !!account,
        staleTime: 5000,
        refetchInterval: false,
        refetchOnWindowFocus: true
    });

    // Realtime subscription for notifications
    useEffect(() => {
        if (!account) return;

        const channel = supabase
            .channel(`public:notifications:wallet:${account.toLowerCase()}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `wallet_address=eq.${account.toLowerCase()}`
            }, () => {
                // Invalidate query to refetch latest notifications
                queryClient.invalidateQueries({ queryKey: ['notifications', account] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [account]);

    // Auto-fill withdrawal wallet address when wallet connects
    useEffect(() => {
        const saveWalletAddress = async () => {
            if (account && user && account.toLowerCase() !== user.wallet_address?.toLowerCase()) {
                try {
                    await supabase
                        .from('profiles')
                        .update({
                            withdrawal_wallet_address: user.withdrawal_wallet_address || account.toLowerCase()
                        })
                        .eq('id', user.id);
                } catch (error) {
                    console.error('Failed to save wallet address:', error);
                }
            }
        };
        saveWalletAddress();
    }, [account, user]);

    // Check if profile is complete (only required fields for AML/KYC)
    // Optional fields: discord_name, x_profile_link, avatar_url
    const isProfileComplete = () => {
        if (!user) return false;
        return !!(
            (user.display_name || user.full_name) &&
            user.email &&
            user.telephone &&
            user.withdrawal_wallet_address &&
            user.country &&
            user.city &&
            user.address &&
            user.date_of_birth &&
            user.occupation
        );
    };

    // Show profile completion modal on dashboard load
    useEffect(() => {
        if (user && !isProfileComplete()) {
            const timer = setTimeout(() => {
                if (!isProfileComplete()) {
                    setShowProfileModal(true);
                    setActiveView('profile');
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Handle navigation with profile check
    const handleViewChange = (view) => {
        if (!isProfileComplete() && view !== 'profile') {
            setShowWarningModal(true);
            return;
        }
        setActiveView(view);
        setSidebarOpen(false);
    };

    const handleProfileModalClose = () => {
        setShowProfileModal(false);
        setActiveView('profile');
    };

    const handleWarningModalClose = () => {
        setShowWarningModal(false);
        setActiveView('profile');
    };



    if (isChecking) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Please Login</h1>
                    <p className="text-gray-400 mb-6">You need to be logged in to access the dashboard.</p>
                    <Link to={createPageUrl('Landing')}>
                        <Button className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                            Go to Home
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!account && activeView !== 'chat') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
                {/* Animated Red Background */}
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: [
                            'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 80% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                        ]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md relative z-10"
                >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-8">
                        <Wallet className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
                    <p className="text-sm sm:text-base text-gray-400 mb-8">
                        Connect your MetaMask wallet to access your personalized dashboard and start trading.
                    </p>
                    <Button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        size="lg"
                        className="relative px-12 py-6 text-xl font-bold rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        {/* Glass reflection */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)'
                            }}
                        />

                        {/* Button text with gradient */}
                        <span className="relative z-10 flex items-center gap-3 font-semibold tracking-wide bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent">
                            <Wallet className="w-5 h-5" style={{ color: '#dc2626' }} />
                            {isConnecting ? 'CONNECTING...' : 'CONNECT METAMASK'}
                        </span>
                    </Button>
                    <Link to={createPageUrl('Landing')} className="block mt-6">
                        <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            ← Back to Home
                        </Button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex relative overflow-hidden">
            {/* Animated Red Background */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                    background: [
                        'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                    ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Mobile Menu Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 rounded-lg text-white"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {(sidebarOpen || isDesktop) && (
                    <motion.aside
                        initial={isDesktop ? false : { x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        className="fixed top-0 left-0 h-screen w-64 bg-black/40 backdrop-blur-xl border-r border-red-500/20 p-6 z-40 flex flex-col"
                        style={{
                            boxShadow: '0 8px 32px 0 rgba(220, 38, 38, 0.1)'
                        }}
                    >
                        <Link to={createPageUrl('Landing')} className="mb-10 block">
                            <Logo size="default" showText={true} />
                        </Link>

                        <nav className="flex-1 space-y-2">
                            <motion.button
                                onClick={() => handleViewChange('dashboard')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden group ${activeView === 'dashboard'
                                    ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-white border border-red-500/30'
                                    : 'text-gray-400 hover:text-white'
                                    } transition-all`}
                            >
                                {activeView === 'dashboard' && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeView === 'dashboard' ? { rotate: [0, -10, 10, 0] } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Home className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Dashboard</span>
                            </motion.button>

                            <motion.button
                                onClick={() => {
                                    setActiveView('profile');
                                    setSidebarOpen(false);
                                }}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden group ${activeView === 'profile'
                                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                                    : 'text-gray-400 hover:text-white'
                                    } transition-all`}
                            >
                                {activeView === 'profile' && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeView === 'profile' ? { rotate: [0, 180, 360] } : {}}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Settings className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Profile</span>
                            </motion.button>

                            <motion.button
                                onClick={() => handleViewChange('dealornodeal')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden group ${activeView === 'dealornodeal'
                                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-white border border-yellow-500/30'
                                    : 'text-gray-400 hover:text-white'
                                    } transition-all`}
                            >
                                {activeView === 'dealornodeal' && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeView === 'dealornodeal' ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 0.5, repeat: activeView === 'dealornodeal' ? Infinity : 0, repeatDelay: 2 }}
                                >
                                    <Briefcase className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Deal or No Deal</span>
                            </motion.button>

                            <motion.button
                                onClick={() => handleViewChange('kyc')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden group ${activeView === 'kyc'
                                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30'
                                    : 'text-gray-400 hover:text-white'
                                    } transition-all`}
                            >
                                {activeView === 'kyc' && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeView === 'kyc' ? {
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                    } : {}}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Shield className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">AML & KYC</span>
                            </motion.button>

                            <motion.button
                                onClick={() => handleViewChange('notifications')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden group ${activeView === 'notifications'
                                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-white border border-green-500/30'
                                    : 'text-gray-400 hover:text-white'
                                    } transition-all`}
                            >
                                {activeView === 'notifications' && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={notifications.length > 0 ? {
                                        rotate: [0, -15, 15, -10, 10, 0],
                                        scale: [1, 1.1, 1]
                                    } : {}}
                                    transition={{ duration: 0.5, repeat: notifications.length > 0 ? Infinity : 0, repeatDelay: 3 }}
                                >
                                    <Bell className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Notifications</span>
                                {notifications.length > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                                    >
                                        {notifications.length}
                                    </motion.span>
                                )}
                            </motion.button>

                            <motion.button
                                onClick={() => handleViewChange('chat')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden group ${activeView === 'chat'
                                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-500/30'
                                    : 'text-gray-400 hover:text-white'
                                    } transition-all`}
                            >
                                {activeView === 'chat' && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeView === 'chat' ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    <MessageCircle className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Chat</span>
                            </motion.button>

                            {user?.role === 'admin' && (
                                <Link to={createPageUrl('GeneralAdmin')}>
                                    <motion.div
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white transition-all border border-transparent hover:border-red-500/30 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10"
                                    >
                                        <Shield className="w-5 h-5" />
                                        <span className="font-medium">Admin Panel</span>
                                    </motion.div>
                                </Link>
                            )}

                        </nav>

                        <motion.div
                            className="pt-6 border-t border-red-500/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.div
                                className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
                                whileHover={{ scale: 1.02 }}
                            >
                                {user?.avatar_url ? (
                                    <motion.img
                                        src={user.avatar_url}
                                        alt="Profile"
                                        className="w-10 h-10 rounded-full object-cover border-2 border-red-500 shadow-lg"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                    />
                                ) : (
                                    <motion.div
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                    >
                                        <span className="text-white font-bold text-sm">
                                            {account?.slice(2, 4).toUpperCase() || 'U'}
                                        </span>
                                    </motion.div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-semibold truncate">{formatAddress(account)}</p>
                                    <div className="flex items-center gap-1">
                                        <motion.div
                                            className="w-2 h-2 bg-green-500 rounded-full"
                                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        <p className="text-green-400 text-xs font-medium">Connected</p>
                                    </div>
                                </div>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-orange-500/20 border border-transparent hover:border-red-500/30 transition-all"
                                    onClick={() => {
                                        try {
                                            disconnectWallet?.();
                                        } catch (error) {
                                            console.error('Disconnect error:', error);
                                            navigate(createPageUrl('Home'));
                                        }
                                    }}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    <span className="font-medium">Disconnect</span>
                                </Button>
                            </motion.div>
                        </motion.div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-auto relative z-10 transition-all duration-300 ${isDesktop ? 'ml-64' : ''}`}>
                <div className="max-w-7xl mx-auto">
                    {activeView === 'profile' && (
                        <>
                            <motion.div
                                className="mb-6 sm:mb-8 pt-12 lg:pt-0"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <motion.h1
                                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    Profile Details
                                </motion.h1>
                                <motion.p
                                    className="text-sm sm:text-base text-gray-400"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Complete your profile for AML/KYC compliance
                                </motion.p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <UserProfileForm />
                            </motion.div>
                        </>
                    )}

                    {activeView === 'dashboard' && (
                        <>
                            <motion.div
                                className="mb-6 sm:mb-8 pt-12 lg:pt-0"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <motion.h1
                                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-red-400 to-white bg-clip-text text-transparent mb-2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    Dashboard
                                </motion.h1>
                                <motion.p
                                    className="text-sm sm:text-base text-gray-400"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Welcome back! Here's your portfolio overview.
                                </motion.p>
                            </motion.div>

                            {/* Pools & Staking Overview */}
                            <motion.div
                                className="mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <PoolsOverview />
                            </motion.div>

                            {/* Staking Contracts */}
                            <motion.div
                                className="mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <StakingContracts />
                            </motion.div>

                            {/* Withdrawals */}
                            <motion.div
                                className="mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <WithdrawalsPanel />
                            </motion.div>

                            {/* Tax Report */}
                            <motion.div
                                className="mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <TaxReportPanel walletAddress={account} />
                            </motion.div>

                            {/* Pool Trades */}
                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <PoolTradesPanel poolType="scalping" poolName="Crypto Pool" />
                                <PoolTradesPanel poolType="traditional" poolName="Traditional Pool" />
                                <PoolTradesPanel poolType="vip" poolName="VIP Pool" />
                            </motion.div>
                        </>
                    )}



                    {activeView === 'dealornodeal' && (
                        <>
                            <motion.div
                                className="mb-6 sm:mb-8 pt-12 lg:pt-0"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <motion.h1
                                            className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            Deal or No Deal
                                        </motion.h1>
                                        <motion.p
                                            className="text-sm sm:text-base text-gray-400"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            Track your game statistics and history.
                                        </motion.p>
                                    </div>
                                    <Link to={createPageUrl('DealOrNoDeal')}>
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Button className="bg-gradient-to-r from-[#f5c96a] to-yellow-600 hover:opacity-90 text-black font-bold shadow-lg border-2 border-yellow-400/50">
                                                <motion.div
                                                    animate={{ rotate: [0, 10, -10, 0] }}
                                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                >
                                                    <Briefcase className="w-4 h-4 mr-2" />
                                                </motion.div>
                                                Play Game
                                            </Button>
                                        </motion.div>
                                    </Link>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <DealOrNoDealPanel walletAddress={account} />
                            </motion.div>
                        </>
                    )}



                    {activeView === 'kyc' && (
                        <>
                            <motion.div
                                className="mb-6 sm:mb-8 pt-12 lg:pt-0"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <motion.h1
                                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    AML & KYC Verification
                                </motion.h1>
                                <motion.p
                                    className="text-sm sm:text-base text-gray-400"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Complete your identity verification process.
                                </motion.p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <KYCPanel />
                            </motion.div>
                        </>
                    )}

                    {activeView === 'notifications' && (
                        <>
                            <motion.div
                                className="mb-6 sm:mb-8 pt-12 lg:pt-0"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <motion.h1
                                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent mb-2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    Notifications
                                </motion.h1>
                                <motion.p
                                    className="text-sm sm:text-base text-gray-400"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Stay updated with your VIP Pool activities.
                                </motion.p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <NotificationsPanel />
                            </motion.div>
                        </>
                    )}

                    {activeView === 'chat' && (
                        <ChatRoom />
                    )}
                </div>

                {/* Profile Completion Modals */}
                <ProfileCompletionModal
                    isOpen={showProfileModal}
                    onClose={handleProfileModalClose}
                    isWarning={false}
                />
                <ProfileCompletionModal
                    isOpen={showWarningModal}
                    onClose={handleWarningModalClose}
                    isWarning={true}
                />
            </main>
        </div>
    );
}

export default function Dashboard() {
    return <DashboardContent />;
}