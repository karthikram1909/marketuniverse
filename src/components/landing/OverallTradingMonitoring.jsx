import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    TrendingUp, Activity, BarChart3, Zap, Percent, Target, 
    CheckCircle2, XCircle, DollarSign, Award 
} from 'lucide-react';
import FullscreenChart from '../charts/FullscreenChart';

export default function OverallTradingMonitoring() {
    // Fetch all trades from all pools
    const { data: scalpingTrades = [] } = useQuery({
        queryKey: ['trades', 'scalping'],
        queryFn: () => base44.entities.PoolTrade.filter({ pool_type: 'scalping' }),
        staleTime: 60000
    });

    const { data: traditionalTrades = [] } = useQuery({
        queryKey: ['trades', 'traditional'],
        queryFn: () => base44.entities.PoolTrade.filter({ pool_type: 'traditional' }),
        staleTime: 60000
    });

    const { data: vipTrades = [] } = useQuery({
        queryKey: ['trades', 'vip'],
        queryFn: () => base44.entities.PoolTrade.filter({ pool_type: 'vip' }),
        staleTime: 60000
    });

    // Fetch pool settings for profit share rates
    const { data: scalpingSettings } = useQuery({
        queryKey: ['poolSettings', 'scalping'],
        queryFn: () => base44.entities.PoolSettings.filter({ pool_type: 'scalping' }).then(res => res[0]),
        staleTime: 60000
    });

    const { data: traditionalSettings } = useQuery({
        queryKey: ['poolSettings', 'traditional'],
        queryFn: () => base44.entities.PoolSettings.filter({ pool_type: 'traditional' }).then(res => res[0]),
        staleTime: 60000
    });

    const { data: vipSettings } = useQuery({
        queryKey: ['poolSettings', 'vip'],
        queryFn: () => base44.entities.PoolSettings.filter({ pool_type: 'vip' }).then(res => res[0]),
        staleTime: 60000
    });

    // Fetch all investors from all pools
    const { data: scalpingInvestors = [] } = useQuery({
        queryKey: ['investors', 'scalping'],
        queryFn: () => base44.entities.PoolInvestor.filter({ pool_type: 'scalping' }),
        staleTime: 60000
    });

    const { data: traditionalInvestors = [] } = useQuery({
        queryKey: ['investors', 'traditional'],
        queryFn: () => base44.entities.PoolInvestor.filter({ pool_type: 'traditional' }),
        staleTime: 60000
    });

    const { data: vipInvestors = [] } = useQuery({
        queryKey: ['investors', 'vip'],
        queryFn: () => base44.entities.PoolInvestor.filter({ pool_type: 'vip' }),
        staleTime: 60000
    });

    // Combine all trades with profit share rates
    const allTrades = useMemo(() => {
        const scalpingRate = scalpingSettings?.profit_share_rate || 0;
        const traditionalRate = traditionalSettings?.profit_share_rate || 0;
        const vipRate = vipSettings?.profit_share_rate || 0;

        return [
            ...scalpingTrades.map(t => ({ ...t, profitShareRate: scalpingRate })),
            ...traditionalTrades.map(t => ({ ...t, profitShareRate: traditionalRate })),
            ...vipTrades.map(t => ({ ...t, profitShareRate: vipRate }))
        ];
    }, [scalpingTrades, traditionalTrades, vipTrades, scalpingSettings, traditionalSettings, vipSettings]);

    // Filter trades from December 28th, 2025 onwards
    const filteredTrades = useMemo(() => {
        const decemberStart = new Date('2025-12-28');
        return allTrades.filter(trade => new Date(trade.date) >= decemberStart);
    }, [allTrades]);

    const allInvestors = useMemo(() => 
        [...scalpingInvestors, ...traditionalInvestors, ...vipInvestors],
        [scalpingInvestors, traditionalInvestors, vipInvestors]
    );

    // Calculate overall metrics
    const metrics = useMemo(() => {
        const totalTrades = filteredTrades.length;
        const winningTrades = filteredTrades.filter(t => t.result === 'win').length;
        const losingTrades = filteredTrades.filter(t => t.result === 'lose').length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        
        const grossPnl = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const tradingFees = filteredTrades.reduce((sum, t) => sum + (t.fee || 0), 0);
        const totalDeposits = allInvestors.reduce((sum, inv) => sum + (inv.invested_amount || 0), 0);

        return {
            totalTrades,
            winningTrades,
            losingTrades,
            winRate,
            grossPnl,
            tradingFees,
            totalDeposits
        };
    }, [filteredTrades, allInvestors]);

    // Helper to generate date range from December 28th, 2025
    const generateDateRange = (startDate, endDate) => {
        const dates = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    // 1. Daily Performance
    const dailyData = useMemo(() => {
        if (filteredTrades.length === 0) return [];
        
        const decStart = new Date('2025-12-28');
        const latestDate = new Date(Math.max(...filteredTrades.map(t => new Date(t.date))));
        const dateRange = generateDateRange(decStart, latestDate);
        
        const dailyMap = {};
        filteredTrades.forEach(trade => {
            const dateKey = new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { date: dateKey, grossPnl: 0, fees: 0, profitShare: 0, trades: 0 };
            }
            const profitAfterFees = (trade.pnl || 0) - (trade.fee || 0);
            const share = profitAfterFees > 0 ? profitAfterFees * (trade.profitShareRate || 0) : 0;
            
            dailyMap[dateKey].grossPnl += trade.pnl || 0;
            dailyMap[dateKey].fees += trade.fee || 0;
            dailyMap[dateKey].profitShare += share;
            dailyMap[dateKey].trades += 1;
        });
        
        return dateRange.map(date => {
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const dayData = dailyMap[dateKey] || { grossPnl: 0, fees: 0, profitShare: 0, trades: 0 };
            return {
                date: dateKey,
                grossPnl: parseFloat(dayData.grossPnl.toFixed(2)),
                fees: parseFloat(dayData.fees.toFixed(2)),
                trades: dayData.trades,
                netPnl: parseFloat((dayData.grossPnl - dayData.fees - dayData.profitShare).toFixed(2))
            };
        });
    }, [filteredTrades]);

    // 2. Cumulative Performance Over Time
    const cumulativeData = useMemo(() => {
        if (filteredTrades.length === 0) return [];
        
        const sorted = [...filteredTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
        const decStart = new Date('2025-12-28');
        const firstTradeDate = new Date(sorted[0].date);
        
        const result = [];
        // Add zero values for dates before first trade
        const current = new Date(decStart);
        while (current < firstTradeDate) {
            result.push({
                date: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                grossPnl: 0,
                fees: 0,
                netPnl: 0
            });
            current.setDate(current.getDate() + 1);
        }
        
        let cumulativeGrossPnl = 0;
        let cumulativeFees = 0;
        let cumulativeProfitShare = 0;
        sorted.forEach(trade => {
            cumulativeGrossPnl += trade.pnl || 0;
            cumulativeFees += trade.fee || 0;
            
            const profitAfterFees = (trade.pnl || 0) - (trade.fee || 0);
            const share = profitAfterFees > 0 ? profitAfterFees * (trade.profitShareRate || 0) : 0;
            cumulativeProfitShare += share;
            
            result.push({
                date: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                grossPnl: parseFloat(cumulativeGrossPnl.toFixed(2)),
                fees: parseFloat(cumulativeFees.toFixed(2)),
                netPnl: parseFloat((cumulativeGrossPnl - cumulativeFees - cumulativeProfitShare).toFixed(2))
            });
        });
        
        return result;
    }, [filteredTrades]);

    // 3. Margin Utilization
    const marginData = useMemo(() => {
        if (filteredTrades.length === 0) return [];
        
        const decStart = new Date('2025-12-28');
        const latestDate = new Date(Math.max(...filteredTrades.map(t => new Date(t.date))));
        const dateRange = generateDateRange(decStart, latestDate);
        
        const dailyMap = {};
        filteredTrades.forEach(trade => {
            const dateKey = new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { date: dateKey, totalMargin: 0, count: 0 };
            }
            dailyMap[dateKey].totalMargin += trade.margin || 0;
            dailyMap[dateKey].count += 1;
        });
        
        return dateRange.map(date => {
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const dayData = dailyMap[dateKey];
            return {
                date: dateKey,
                avgMargin: dayData ? parseFloat((dayData.totalMargin / dayData.count).toFixed(2)) : 0
            };
        });
    }, [filteredTrades]);

    // 4. Win/Loss Streak
    const streakData = useMemo(() => {
        if (filteredTrades.length === 0) return [];
        
        const sorted = [...filteredTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
        const decStart = new Date('2025-12-28');
        const firstTradeDate = new Date(sorted[0].date);
        
        const result = [];
        // Add zero streak for dates before first trade
        const current = new Date(decStart);
        while (current < firstTradeDate) {
            result.push({
                date: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                streak: 0
            });
            current.setDate(current.getDate() + 1);
        }
        
        let currentStreak = 0;
        sorted.forEach(trade => {
            if (trade.result === 'win') {
                currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
            } else {
                currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
            }
            result.push({
                date: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                streak: currentStreak
            });
        });
        
        return result;
    }, [filteredTrades]);

    // 5. Leverage Usage
    const leverageData = useMemo(() => {
        if (filteredTrades.length === 0) return [];
        
        const decStart = new Date('2025-12-28');
        const latestDate = new Date(Math.max(...filteredTrades.map(t => new Date(t.date))));
        const dateRange = generateDateRange(decStart, latestDate);
        
        const dailyMap = {};
        filteredTrades.forEach(trade => {
            const dateKey = new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { date: dateKey, totalLeverage: 0, count: 0 };
            }
            dailyMap[dateKey].totalLeverage += trade.leverage || 0;
            dailyMap[dateKey].count += 1;
        });
        
        return dateRange.map(date => {
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const dayData = dailyMap[dateKey];
            return {
                date: dateKey,
                avgLeverage: dayData ? parseFloat((dayData.totalLeverage / dayData.count).toFixed(1)) : 0
            };
        });
    }, [filteredTrades]);

    // 6. Trade Volume
    const volumeData = useMemo(() => {
        if (filteredTrades.length === 0) return [];
        
        const decStart = new Date('2025-12-28');
        const latestDate = new Date(Math.max(...filteredTrades.map(t => new Date(t.date))));
        const dateRange = generateDateRange(decStart, latestDate);
        
        const dailyMap = {};
        filteredTrades.forEach(trade => {
            const dateKey = new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;
        });
        
        return dateRange.map(date => {
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return {
                date: dateKey,
                trades: dailyMap[dateKey] || 0
            };
        });
    }, [filteredTrades]);

    // 7. ROI Timeline
    const roiData = useMemo(() => {
        if (metrics.totalDeposits === 0 || filteredTrades.length === 0) return [];
        
        const sorted = [...filteredTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
        const decStart = new Date('2025-12-28');
        const firstTradeDate = new Date(sorted[0].date);
        
        const result = [];
        // Add zero ROI for dates before first trade
        const current = new Date(decStart);
        while (current < firstTradeDate) {
            result.push({
                date: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                roi: 0
            });
            current.setDate(current.getDate() + 1);
        }
        
        let cumulativePnl = 0;
        sorted.forEach(trade => {
            const profitAfterFees = (trade.pnl || 0) - (trade.fee || 0);
            const share = profitAfterFees > 0 ? profitAfterFees * (trade.profitShareRate || 0) : 0;
            cumulativePnl += profitAfterFees - share;
            
            const roi = (cumulativePnl / metrics.totalDeposits) * 100;
            result.push({
                date: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                roi: parseFloat(roi.toFixed(2))
            });
        });
        
        return result;
    }, [filteredTrades, metrics.totalDeposits]);

    // 8. Monthly Performance
    const monthlyData = useMemo(() => {
        if (filteredTrades.length === 0) return [];
        
        const monthlyMap = {};
        // Ensure December 2025 exists
        monthlyMap['Dec 2025'] = { month: 'Dec 2025', grossPnl: 0, fees: 0, profitShare: 0 };
        
        filteredTrades.forEach(trade => {
            const monthKey = new Date(trade.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = { month: monthKey, grossPnl: 0, fees: 0, profitShare: 0 };
            }
            
            const profitAfterFees = (trade.pnl || 0) - (trade.fee || 0);
            const share = profitAfterFees > 0 ? profitAfterFees * (trade.profitShareRate || 0) : 0;
            
            monthlyMap[monthKey].grossPnl += trade.pnl || 0;
            monthlyMap[monthKey].fees += trade.fee || 0;
            monthlyMap[monthKey].profitShare += share;
        });
        
        return Object.values(monthlyMap).map(m => ({
            ...m,
            netPnl: parseFloat((m.grossPnl - m.fees - m.profitShare).toFixed(2)),
            grossPnl: parseFloat(m.grossPnl.toFixed(2)),
            fees: parseFloat(m.fees.toFixed(2))
        })).sort((a, b) => {
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            return dateA - dateB;
        });
    }, [filteredTrades]);



    if (filteredTrades.length === 0) return null;

    return (
        <div className="w-full mb-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-3">
                    <div className="h-1 w-16 bg-gradient-to-r from-red-500 via-cyan-500 to-purple-500 rounded-full" />
                    <motion.h2 
                        className="text-4xl sm:text-5xl font-bold relative"
                        style={{
                            background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(6,182,212,0.2) 35%, rgba(168,85,247,0.2) 65%, rgba(239,68,68,0.15) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(139,92,246,0.3)',
                            borderRadius: '20px',
                            padding: '20px 40px',
                            boxShadow: '0 8px 32px rgba(139,92,246,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(6,182,212,0.2)',
                            textShadow: '0 0 40px rgba(139,92,246,0.8), 0 4px 8px rgba(0,0,0,0.5)',
                            WebkitTextFillColor: 'transparent',
                            backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #06b6d4 50%, #a855f7 100%)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text'
                        }}
                        animate={{
                            boxShadow: [
                                '0 8px 32px rgba(139,92,246,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(6,182,212,0.2)',
                                '0 8px 32px rgba(6,182,212,0.5), inset 0 2px 0 rgba(255,255,255,0.3), 0 20px 60px rgba(139,92,246,0.4)',
                                '0 8px 32px rgba(139,92,246,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(6,182,212,0.2)'
                            ]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        Overall Trading Monitoring
                    </motion.h2>
                    <div className="h-1 w-16 bg-gradient-to-r from-purple-500 via-cyan-500 to-red-500 rounded-full" />
                </div>
                <p className="text-gray-400 text-lg mt-6">Combined Performance Across All Pools</p>
            </motion.div>

            {/* Overall Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400 text-xs">Total Trades</span>
                    </div>
                    <p className="text-blue-400 font-bold text-2xl">{metrics.totalTrades}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-gray-400 text-xs">Wins</span>
                    </div>
                    <p className="text-green-400 font-bold text-2xl">{metrics.winningTrades}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-red-500/10 to-pink-600/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-gray-400 text-xs">Losses</span>
                    </div>
                    <p className="text-red-400 font-bold text-2xl">{metrics.losingTrades}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-400 text-xs">Win Rate</span>
                    </div>
                    <p className="text-purple-400 font-bold text-2xl">{metrics.winRate.toFixed(1)}%</p>
                </motion.div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Cumulative Performance */}
                <FullscreenChart icon={TrendingUp} title="Cumulative Performance">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={cumulativeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'white'
                                }}
                                labelStyle={{ color: 'white' }}
                            />
                            <Line type="monotone" dataKey="grossPnl" stroke="#3b82f6" name="Gross PNL" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="netPnl" stroke="#22c55e" name="Net PNL" strokeWidth={2} dot={false} />
                        </LineChart>
                        </ResponsiveContainer>
                        </FullscreenChart>

                        {/* 2. Daily Performance */}
                        <FullscreenChart icon={BarChart3} title="Daily Performance">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'white'
                                }}
                                labelStyle={{ color: 'white' }}
                            />
                            <Bar dataKey="netPnl" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                        </FullscreenChart>

                        {/* 3. Win Rate Pie */}
                        <FullscreenChart icon={Target} title="Win/Loss Distribution">
                    <ResponsiveContainer width="100%" height={200}>
                       <PieChart>
                           <Pie
                               data={[
                                   { name: 'Wins', value: metrics.winningTrades },
                                   { name: 'Losses', value: metrics.losingTrades }
                               ]}
                               cx="50%"
                               cy="50%"
                               innerRadius={50}
                               outerRadius={70}
                               paddingAngle={5}
                               dataKey="value"
                               label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                               labelLine={false}
                           >
                               <Cell fill="#22c55e" />
                               <Cell fill="#ef4444" />
                           </Pie>
                           <Tooltip
                               contentStyle={{
                                   backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                   border: '1px solid rgba(255,255,255,0.1)',
                                   borderRadius: '8px',
                                   fontSize: '12px',
                                   color: 'white'
                               }}
                               itemStyle={{ color: 'white' }}
                               labelStyle={{ color: 'white' }}
                           />
                       </PieChart>
                       </ResponsiveContainer>
                       </FullscreenChart>

                       {/* 4. Margin Utilization */}
                       <FullscreenChart icon={Activity} title="Margin Utilization">
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={marginData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'white'
                                }}
                                labelStyle={{ color: 'white' }}
                                formatter={(value) => [`$${value}`, 'Avg Margin']}
                            />
                            <Area type="monotone" dataKey="avgMargin" stroke="#3b82f6" fill="url(#marginGradient)" strokeWidth={2} />
                            <defs>
                                <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                        </AreaChart>
                        </ResponsiveContainer>
                        </FullscreenChart>

                        {/* 5. Win/Loss Streak */}
                        <FullscreenChart icon={TrendingUp} title="Win/Loss Streak">
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={streakData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'white'
                                }}
                                labelStyle={{ color: 'white' }}
                            />
                            <Area type="monotone" dataKey="streak" stroke="#a855f7" fill="url(#streakGradient)" strokeWidth={2} />
                            <defs>
                                <linearGradient id="streakGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                        </AreaChart>
                        </ResponsiveContainer>
                        </FullscreenChart>

                        {/* 6. Leverage Usage */}
                        <FullscreenChart icon={Zap} title="Average Leverage">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={leverageData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'white'
                                }}
                                labelStyle={{ color: 'white' }}
                                formatter={(value) => [`${value}x`, 'Avg Leverage']}
                            />
                            <Bar dataKey="avgLeverage" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                        </FullscreenChart>

                        {/* 7. Trade Volume */}
                        <FullscreenChart icon={Activity} title="Trade Volume">
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={volumeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'white'
                                }}
                                labelStyle={{ color: 'white' }}
                            />
                            <Area type="monotone" dataKey="trades" stroke="#06b6d4" fill="url(#volumeGradient)" strokeWidth={2} />
                            <defs>
                                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                        </AreaChart>
                        </ResponsiveContainer>
                        </FullscreenChart>

                        {/* 8. ROI Timeline */}
                        <FullscreenChart icon={Percent} title="ROI Over Time">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={roiData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'white'
                                }}
                                labelStyle={{ color: 'white' }}
                                formatter={(value) => [`${value}%`, 'ROI']}
                            />
                            <Line type="monotone" dataKey="roi" stroke="#ec4899" strokeWidth={2} dot={false} />
                        </LineChart>
                        </ResponsiveContainer>
                        </FullscreenChart>

                        {/* 9. Monthly Performance */}
                        <FullscreenChart icon={BarChart3} title="Monthly Performance">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'white'
                                }}
                                labelStyle={{ color: 'white' }}
                            />
                            <Legend />
                            <Bar dataKey="netPnl" fill="#22c55e" radius={[4, 4, 0, 0]} name="Net PNL" />
                        </BarChart>
                        </ResponsiveContainer>
                        </FullscreenChart>
                        </div>
                        </div>
                        );
                        }