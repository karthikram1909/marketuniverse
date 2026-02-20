import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
    TrendingUp, Users, UserPlus, Wallet, Globe, Clock,
    BarChart3, ArrowLeft, Menu, X, Shield, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TrafficMap from '../components/analytics/TrafficMap';
import Logo from '../components/common/Logo';
import ConfirmResetModal from '../components/admin/ConfirmResetModal';

export default function TrafficAnalytics() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [resetModal, setResetModal] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    React.useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const queryClient = useQueryClient();

    // Fetch analytics data
    const { data: visits = [] } = useQuery({
        queryKey: ['allVisits'],
        queryFn: () => base44.entities.Visit.list('-created_date', 1000),
        refetchInterval: 30000
    });

    const { data: pageViews = [] } = useQuery({
        queryKey: ['allPageViews'],
        queryFn: () => base44.entities.PageView.list('-created_date', 1000),
        refetchInterval: 30000
    });

    const { data: investors = [] } = useQuery({
        queryKey: ['investorsList'],
        queryFn: async () => {
            const [scalping, main, traditional] = await Promise.all([
                base44.entities.PoolInvestor.filter({ pool_type: 'scalping' }),
                base44.entities.PoolInvestor.filter({ pool_type: 'main' }),
                base44.entities.PoolInvestor.filter({ pool_type: 'traditional' })
            ]);
            const allInvestors = [...scalping, ...main, ...traditional];
            const uniqueWallets = new Set(allInvestors.map(inv => inv.wallet_address));
            return Array.from(uniqueWallets);
        }
    });

    const { data: userAgreements = [] } = useQuery({
        queryKey: ['userAgreementsList'],
        queryFn: () => base44.entities.UserAgreement.list(),
        refetchInterval: 30000
    });

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisits = visits.filter(v => new Date(v.created_date) >= today);
    const newVisitorsToday = todayVisits.filter(v => v.is_new_visitor).length;
    const returningVisitorsToday = todayVisits.filter(v => !v.is_new_visitor).length;
    const totalRegistered = userAgreements.length;
    const activeInvestors = investors.length;

    // Page statistics
    const pageStats = pageViews.reduce((acc, pv) => {
        const page = pv.page_name || '/';
        if (!acc[page]) {
            acc[page] = { visits: 0, totalTime: 0 };
        }
        acc[page].visits += 1;
        acc[page].totalTime += pv.time_spent || 0;
        return acc;
    }, {});

    const topPages = Object.entries(pageStats)
        .map(([page, stats]) => ({
            page,
            visits: stats.visits,
            avgTime: Math.round(stats.totalTime / stats.visits)
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);

    const totalTimeSpent = pageViews.reduce((sum, pv) => sum + (pv.time_spent || 0), 0);
    const avgSessionTime = pageViews.length > 0 ? Math.round(totalTimeSpent / pageViews.length) : 0;

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    };

    const resetTrafficDataMutation = useMutation({
        mutationFn: async () => {
            const allVisits = await base44.entities.Visit.list();
            const allPageViews = await base44.entities.PageView.list();
            await Promise.all([
                ...allVisits.map(visit => base44.entities.Visit.delete(visit.id)),
                ...allPageViews.map(pageView => base44.entities.PageView.delete(pageView.id))
            ]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allVisits']);
            queryClient.invalidateQueries(['allPageViews']);
            setResetModal(false);
        }
    });

    return (
        <div className="min-h-screen bg-[#0a0f1a] flex relative overflow-hidden">
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
                        className="fixed top-0 left-0 h-screen w-64 bg-[#0f1420] border-r border-white/10 p-6 z-40 flex flex-col"
                    >
                        <Link to={createPageUrl('Home')} className="mb-10 block">
                            <Logo size="default" showText={true} />
                        </Link>

                        <nav className="flex-1 space-y-2">
                            <Link
                                to={createPageUrl('GeneralAdmin')}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <Shield className="w-5 h-5" />
                                Admin Panel
                            </Link>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white">
                                <BarChart3 className="w-5 h-5" />
                                Traffic Analytics
                            </div>
                        </nav>

                        <div className="pt-6 border-t border-white/10">
                            <Link to={createPageUrl('Dashboard')}>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
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
            <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-auto transition-all duration-300 ${isDesktop ? 'ml-64' : ''}`}>
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 pt-12 lg:pt-0 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Traffic Analytics</h1>
                            <p className="text-gray-400">Real-time visitor tracking and platform statistics</p>
                        </div>
                        <Button
                            onClick={() => setResetModal(true)}
                            disabled={resetTrafficDataMutation.isLoading}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Reset Traffic Data
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-cyan-500/50 rounded-2xl p-6 led-glow-cyan"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <UserPlus className="w-8 h-8 text-cyan-400" />
                                <span className="text-xs text-gray-400">Today</span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{newVisitorsToday}</div>
                            <div className="text-sm text-gray-400">New Visitors</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-purple-500/50 rounded-2xl p-6 led-glow-purple"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Users className="w-8 h-8 text-purple-400" />
                                <span className="text-xs text-gray-400">Today</span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{returningVisitorsToday}</div>
                            <div className="text-sm text-gray-400">Returning Visitors</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-green-500/50 rounded-2xl p-6 led-glow-green"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Wallet className="w-8 h-8 text-green-400" />
                                <span className="text-xs text-gray-400">All Time</span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{totalRegistered}</div>
                            <div className="text-sm text-gray-400">Registered Users</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-yellow-500/50 rounded-2xl p-6 led-glow-gold"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-8 h-8 text-yellow-400" />
                                <span className="text-xs text-gray-400">All Time</span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{activeInvestors}</div>
                            <div className="text-sm text-gray-400">Active Investors</div>
                        </motion.div>
                    </div>

                    {/* World Map */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-8"
                    >
                        <div className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Globe className="w-6 h-6 text-cyan-400" />
                                <h2 className="text-xl font-bold text-white">Real-Time Visitor Map</h2>
                                <div className="ml-auto flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                                        <span className="text-gray-400">New</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                                        <span className="text-gray-400">Returning</span>
                                    </div>
                                </div>
                            </div>
                            <TrafficMap />
                        </div>
                    </motion.div>

                    {/* Page Statistics */}
                    <div className="grid lg:grid-cols-2 gap-8 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <BarChart3 className="w-6 h-6 text-blue-400" />
                                <h2 className="text-xl font-bold text-white">Top Pages</h2>
                            </div>
                            <div className="space-y-3">
                                {topPages.map((page, index) => (
                                    <div key={page.page} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>
                                            <span className="text-white font-medium truncate">{page.page}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-blue-400 font-bold">{page.visits}</span>
                                            <span className="text-gray-400 text-sm">{formatTime(page.avgTime)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-6 h-6 text-orange-400" />
                                <h2 className="text-xl font-bold text-white">Time Statistics</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <div className="text-gray-400 text-sm mb-1">Average Session Duration</div>
                                    <div className="text-3xl font-bold text-white">{formatTime(avgSessionTime)}</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <div className="text-gray-400 text-sm mb-1">Total Time on Platform</div>
                                    <div className="text-3xl font-bold text-white">{formatTime(totalTimeSpent)}</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <div className="text-gray-400 text-sm mb-1">Total Page Views</div>
                                    <div className="text-3xl font-bold text-white">{pageViews.length.toLocaleString()}</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Reset Confirmation Modal */}
            <ConfirmResetModal
                isOpen={resetModal}
                onClose={() => setResetModal(false)}
                onConfirm={() => resetTrafficDataMutation.mutate()}
                title="Reset All Traffic Data?"
                description="This will permanently delete ALL visitor and page view data. This action cannot be undone. Use this before going public to clear test data."
                isLoading={resetTrafficDataMutation.isLoading}
            />
        </div>
    );
}