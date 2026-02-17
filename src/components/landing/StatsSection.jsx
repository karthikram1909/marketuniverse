import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, TrendingUp, Shield, ArrowUpRight, Wallet } from 'lucide-react';
import { calculatePoolMetrics } from '../pools/TimeBasedCalculations';
import OverallTradingMonitoring from './OverallTradingMonitoring';

export default function StatsSection() {
    // Fetch all investors from all pools
    const { data: allInvestors = [] } = useQuery({
        queryKey: ['allInvestors'],
        queryFn: async () => {
            return await base44.entities.PoolInvestor.list();
        }
    });

    // Fetch all trades from all pools
    const { data: allTrades = [] } = useQuery({
        queryKey: ['allTrades'],
        queryFn: async () => {
            return await base44.entities.PoolTrade.list();
        }
    });

    // Fetch all withdrawal requests
    const { data: allWithdrawals = [] } = useQuery({
        queryKey: ['allWithdrawals'],
        queryFn: async () => {
            return await base44.entities.WithdrawalRequest.list();
        }
    });

    // Fetch pool settings for all pools
    const { data: poolSettings = [] } = useQuery({
        queryKey: ['poolSettings'],
        queryFn: async () => {
            return await base44.entities.PoolSettings.list();
        }
    });

    // Calculate stats
    const calculateStats = () => {
        // Total Investments (total invested money)
        const totalInvestments = allInvestors.reduce((sum, inv) => sum + (inv.invested_amount || 0), 0);

        // Active Investors (unique wallet addresses with investments)
        const uniqueWallets = new Set(allInvestors.map(inv => inv.wallet_address?.toLowerCase()));
        const activeInvestors = uniqueWallets.size;

        // Security Score (successful trades percentage)
        const totalTrades = allTrades.length;
        const successfulTrades = allTrades.filter(t => t.result === 'win').length;
        const securityScore = totalTrades > 0 ? (successfulTrades / totalTrades * 100) : 0;

        // Calculate Net PnL from all pools (Gross PnL - Fees - Profit Share)
        const totalGrossPnl = allTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalFees = allTrades.reduce((sum, t) => sum + (t.fee || 0), 0);
        
        // Calculate total profit share across all pools
        const totalProfitShare = allTrades.reduce((sum, trade) => {
            const cleanPnl = (trade.pnl || 0) - (trade.fee || 0);
            if (cleanPnl > 0) {
                const settings = poolSettings.find(s => s.pool_type === trade.pool_type);
                const profitShareRate = settings?.profit_share_rate || 0;
                return sum + (cleanPnl * profitShareRate);
            }
            return sum;
        }, 0);

        const totalNetPnl = totalGrossPnl - totalFees - totalProfitShare;

        // Total Paid to Investors (ONLY confirmed paid withdrawals)
        const totalPaidToInvestors = allWithdrawals
            .filter(w => w.status === 'paid')
            .reduce((sum, w) => sum + (w.amount || 0), 0);

        // Calculate total real-time balance across all pools
        let totalPoolBalance = 0;
        ['scalping', 'traditional', 'vip'].forEach(poolType => {
            const poolInvestors = allInvestors.filter(inv => inv.pool_type === poolType);
            const poolTrades = allTrades.filter(t => t.pool_type === poolType);
            const poolWithdrawals = allWithdrawals.filter(w => w.pool_type === poolType);
            const settings = poolSettings.find(s => s.pool_type === poolType);
            
            const metrics = calculatePoolMetrics({
                trades: poolTrades,
                investors: poolInvestors,
                withdrawals: poolWithdrawals,
                profitShareRate: settings?.profit_share_rate || 0
            });
            
            totalPoolBalance += metrics.totalBalance;
        });

        return {
            totalInvestments,
            activeInvestors,
            securityScore,
            totalNetPnl,
            totalPaidToInvestors,
            totalPoolBalance
        };
    };

    const stats = calculateStats();

    const statsData = [
        {
            icon: DollarSign,
            label: 'Total Investments',
            value: `$${stats.totalInvestments.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            gradient: 'from-cyan-500 to-blue-500',
            description: 'Total invested capital'
        },
        {
            icon: Wallet,
            label: 'Total Pool Balance',
            value: `$${stats.totalPoolBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            gradient: 'from-emerald-500 to-teal-500',
            description: 'Real-time balance across all pools',
            isPositive: stats.totalPoolBalance >= 0
        },
        {
            icon: Users,
            label: 'Active Investors',
            value: stats.activeInvestors.toString(),
            gradient: 'from-blue-500 to-purple-500',
            description: 'Registered participants'
        },
        {
            icon: TrendingUp,
            label: 'Pools Total Net PnL',
            value: `$${stats.totalNetPnl.toFixed(2)}`,
            gradient: 'from-green-500 to-emerald-500',
            description: 'All pools combined',
            isPositive: stats.totalNetPnl >= 0
        },
        {
            icon: Shield,
            label: 'Trading Score',
            value: `${stats.securityScore.toFixed(1)}%`,
            gradient: 'from-purple-500 to-pink-500',
            description: 'Trade success rate'
        },
        {
            icon: ArrowUpRight,
            label: 'Paid to Investors',
            value: `$${Math.max(stats.totalPaidToInvestors, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            gradient: 'from-orange-500 to-red-500',
            description: 'Total earnings distributed'
        }
    ];

    return (
        <section className="relative py-24 px-6">
            <div className="absolute inset-0 bg-black" />
            
            <motion.div 
                className="absolute inset-0"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.08) 0%, transparent 60%)',
                }}
            />
            
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={`stats-orb-${i}`}
                    className="absolute rounded-full"
                    style={{
                        width: `${Math.random() * 120 + 60}px`,
                        height: `${Math.random() * 120 + 60}px`,
                        background: i % 3 === 0 ? 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        x: [0, Math.random() * 60 - 30, 0],
                        y: [0, Math.random() * 60 - 30, 0],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: Math.random() * 12 + 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}

            <div className="relative z-10 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase mb-4 block">
                        Platform Statistics
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
                        Real-Time Performance
                    </h2>
                    <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
                        Live metrics from our trading pools and investor activity
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {statsData.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className={`h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 ${
                                index === 0 ? 'led-glow-cyan' : 
                                index === 1 ? 'led-glow-green' : 
                                index === 2 ? 'led-glow-blue' : 
                                index === 3 ? 'led-glow-green' : 
                                index === 4 ? 'led-glow-purple' : 
                                'led-glow-red'
                            }`}>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} p-0.5 mb-4`}>
                                    <div className="w-full h-full rounded-xl bg-[#0a0f1a] flex items-center justify-center">
                                        <stat.icon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                                <h3 className={`text-2xl font-bold mb-1 ${
                                    stat.isPositive !== undefined 
                                        ? stat.isPositive 
                                            ? 'text-green-400' 
                                            : 'text-red-400'
                                        : 'text-white'
                                }`}>
                                    {stat.value}
                                </h3>
                                <p className="text-gray-500 text-xs">{stat.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Overall Trading Monitoring */}
                <div className="mt-16">
                    <OverallTradingMonitoring />
                </div>
            </div>
        </section>
    );
}