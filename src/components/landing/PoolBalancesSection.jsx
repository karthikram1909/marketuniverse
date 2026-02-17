import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users } from 'lucide-react';
import { calculatePoolMetrics } from '../pools/TimeBasedCalculations';

const PoolCard = ({ name, balance, color, gradient, investors, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        className="relative group"
    >
        <div className="absolute inset-0 bg-gradient-to-r opacity-20 blur-xl group-hover:opacity-30 transition-opacity"
            style={{ background: gradient }} />
        <div className="relative bg-black/60 backdrop-blur-xl border rounded-2xl p-6 hover:border-opacity-100 transition-all"
            style={{ borderColor: `${color}40` }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{name}</h3>
                <DollarSign className="w-6 h-6" style={{ color }} />
            </div>
            <div className="space-y-3">
                <div>
                    <p className="text-gray-400 text-sm mb-1">Total Value Locked</p>
                    <p className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
                        style={{ backgroundImage: gradient }}>
                        ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{investors} Active Investors</span>
                </div>
            </div>
        </div>
    </motion.div>
);

export default function PoolBalancesSection() {
    // Fetch all pool data
    const { data: scalpingInvestors = [] } = useQuery({
        queryKey: ['investors', 'scalping'],
        queryFn: () => base44.entities.PoolInvestor.filter({ pool_type: 'scalping' }),
        staleTime: 30000
    });

    const { data: scalpingTrades = [] } = useQuery({
        queryKey: ['trades', 'scalping'],
        queryFn: () => base44.entities.PoolTrade.filter({ pool_type: 'scalping' }),
        staleTime: 30000
    });

    const { data: scalpingWithdrawals = [] } = useQuery({
        queryKey: ['withdrawals', 'scalping'],
        queryFn: () => base44.entities.WithdrawalRequest.filter({ pool_type: 'scalping', status: 'paid' }),
        staleTime: 30000
    });

    const { data: traditionalInvestors = [] } = useQuery({
        queryKey: ['investors', 'traditional'],
        queryFn: () => base44.entities.PoolInvestor.filter({ pool_type: 'traditional' }),
        staleTime: 30000
    });

    const { data: traditionalTrades = [] } = useQuery({
        queryKey: ['trades', 'traditional'],
        queryFn: () => base44.entities.PoolTrade.filter({ pool_type: 'traditional' }),
        staleTime: 30000
    });

    const { data: traditionalWithdrawals = [] } = useQuery({
        queryKey: ['withdrawals', 'traditional'],
        queryFn: () => base44.entities.WithdrawalRequest.filter({ pool_type: 'traditional', status: 'paid' }),
        staleTime: 30000
    });

    const { data: vipInvestors = [] } = useQuery({
        queryKey: ['investors', 'vip'],
        queryFn: () => base44.entities.PoolInvestor.filter({ pool_type: 'vip' }),
        staleTime: 30000
    });

    const { data: vipTrades = [] } = useQuery({
        queryKey: ['trades', 'vip'],
        queryFn: () => base44.entities.PoolTrade.filter({ pool_type: 'vip' }),
        staleTime: 30000
    });

    const { data: vipWithdrawals = [] } = useQuery({
        queryKey: ['withdrawals', 'vip'],
        queryFn: () => base44.entities.WithdrawalRequest.filter({ pool_type: 'vip', status: 'paid' }),
        staleTime: 30000
    });

    const { data: scalpingSettings = [] } = useQuery({
        queryKey: ['settings', 'scalping'],
        queryFn: () => base44.entities.PoolSettings.filter({ pool_type: 'scalping' }),
        staleTime: 30000
    });

    const { data: traditionalSettings = [] } = useQuery({
        queryKey: ['settings', 'traditional'],
        queryFn: () => base44.entities.PoolSettings.filter({ pool_type: 'traditional' }),
        staleTime: 30000
    });

    const { data: vipSettings = [] } = useQuery({
        queryKey: ['settings', 'vip'],
        queryFn: () => base44.entities.PoolSettings.filter({ pool_type: 'vip' }),
        staleTime: 30000
    });

    // Calculate pool metrics
    const scalpingMetrics = calculatePoolMetrics({
        trades: scalpingTrades,
        investors: scalpingInvestors,
        withdrawals: scalpingWithdrawals,
        profitShareRate: scalpingSettings[0]?.profit_share_rate || 0
    });

    const traditionalMetrics = calculatePoolMetrics({
        trades: traditionalTrades,
        investors: traditionalInvestors,
        withdrawals: traditionalWithdrawals,
        profitShareRate: traditionalSettings[0]?.profit_share_rate || 0
    });

    const vipMetrics = calculatePoolMetrics({
        trades: vipTrades,
        investors: vipInvestors,
        withdrawals: vipWithdrawals,
        profitShareRate: vipSettings[0]?.profit_share_rate || 0
    });

    const totalBalance = scalpingMetrics.totalBalance + traditionalMetrics.totalBalance + vipMetrics.totalBalance;

    return (
        <section className="py-20 px-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent" />
            
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                        <TrendingUp className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm font-semibold">LIVE DATA</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Real-Time Pool Balances
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Track the total value locked across all investment pools in real-time
                    </p>
                </motion.div>

                {/* Total TVL Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ 
                        scale: 1.01,
                        boxShadow: '0 8px 40px rgba(220,38,38,0.3)'
                    }}
                    className="mb-12"
                >
                    <div className="relative backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        <div 
                            className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)'
                            }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-3xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(220,38,38,0.4), rgba(255,255,255,0.3))',
                                filter: 'blur(20px)',
                                zIndex: 0
                            }}
                            animate={{
                                opacity: [0.4, 0.7, 0.4],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <div className="relative z-10">
                            <p className="text-gray-300 text-sm uppercase tracking-wider mb-2">Total Value Locked</p>
                            <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent">
                                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dc2626]/20 to-transparent"
                            style={{
                                transform: 'skewX(-20deg)'
                            }}
                            animate={{
                                x: ['-200%', '200%'],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatDelay: 2,
                                ease: "easeInOut"
                            }}
                        />
                    </div>
                </motion.div>

                {/* Pool Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PoolCard
                        name="Crypto Pool"
                        balance={scalpingMetrics.totalBalance}
                        color="#ef4444"
                        gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                        investors={scalpingInvestors.length}
                        delay={0.1}
                    />
                    <PoolCard
                        name="Traditional Pool"
                        balance={traditionalMetrics.totalBalance}
                        color="#22c55e"
                        gradient="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                        investors={traditionalInvestors.length}
                        delay={0.2}
                    />
                    <PoolCard
                        name="VIP Pool"
                        balance={vipMetrics.totalBalance}
                        color="#f59e0b"
                        gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                        investors={vipInvestors.length}
                        delay={0.3}
                    />
                </div>
            </div>
        </section>
    );
}