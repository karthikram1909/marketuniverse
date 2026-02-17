import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { PieChartIcon, BarChart3, TrendingUp, Zap, Activity, Percent } from 'lucide-react';
import FullscreenChart from '../charts/FullscreenChart';

export default function TradesMonitoring({ trades = [], investors = [], profitShareRate = 0 }) {
    // Filter trades from December 28th, 2025 onwards
    const filteredTrades = useMemo(() => {
        const decemberStart = new Date('2025-12-28');
        return trades.filter(trade => new Date(trade.date) >= decemberStart);
    }, [trades]);

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

    // 1. Margin Utilization Over Time
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

    // 2. Monthly Performance Summary
    const monthlyData = useMemo(() => {
        if (filteredTrades.length === 0) return [];
        
        const monthlyMap = {};
        // Ensure December 2025 exists
        monthlyMap['Dec 2025'] = { month: 'Dec 2025', grossPnl: 0, fees: 0, netPnl: 0 };
        
        filteredTrades.forEach(trade => {
            const monthKey = new Date(trade.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = { month: monthKey, grossPnl: 0, fees: 0, netPnl: 0 };
            }
            monthlyMap[monthKey].grossPnl += trade.pnl || 0;
            monthlyMap[monthKey].fees += trade.fee || 0;
        });
        
        return Object.values(monthlyMap).map(m => {
            const profitAfterFees = m.grossPnl - m.fees;
            const profitShare = profitAfterFees > 0 ? profitAfterFees * profitShareRate : 0;
            m.netPnl = profitAfterFees - profitShare;
            return {
                ...m,
                grossPnl: parseFloat(m.grossPnl.toFixed(2)),
                fees: parseFloat(m.fees.toFixed(2)),
                netPnl: parseFloat(m.netPnl.toFixed(2))
            };
        }).sort((a, b) => {
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            return dateA - dateB;
        });
    }, [filteredTrades, profitShareRate]);

    // 3. Win/Loss Streak Timeline
    const streakData = useMemo(() => {
        if (filteredTrades.length === 0) return [];
        
        const sorted = [...filteredTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
        const decStart = new Date('2025-12-28');
        const firstTradeDate = new Date(sorted[0].date);
        
        // Add zero streak for dates before first trade
        const result = [];
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

    // 4. Leverage Usage Over Time
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

    // 5. Trade Volume Timeline
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

    // 6. ROI Timeline (cumulative)
    const roiData = useMemo(() => {
        if (investors.length === 0 || filteredTrades.length === 0) return [];
        
        const totalDeposits = investors.reduce((sum, inv) => sum + (inv.invested_amount || 0), 0);
        if (totalDeposits === 0) return [];

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
            const profitShare = profitAfterFees > 0 ? profitAfterFees * profitShareRate : 0;
            cumulativePnl += profitAfterFees - profitShare;
            
            const roi = (cumulativePnl / totalDeposits) * 100;
            result.push({
                date: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                roi: parseFloat(roi.toFixed(2))
            });
        });
        
        return result;
    }, [filteredTrades, investors, profitShareRate]);

    const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6'];

    if (filteredTrades.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Trades Monitoring
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Margin Utilization Over Time */}
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
                            <Area 
                                type="monotone" 
                                dataKey="avgMargin" 
                                stroke="#3b82f6" 
                                fill="url(#marginGradient)"
                                strokeWidth={2}
                            />
                            <defs>
                                <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </FullscreenChart>

                {/* 2. Monthly Performance Summary */}
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
                            <Bar dataKey="netPnl" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </FullscreenChart>

                {/* 3. Win/Loss Streak Timeline */}
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
                            <Area 
                                type="monotone" 
                                dataKey="streak" 
                                stroke="#a855f7" 
                                fill="url(#streakGradient)"
                                strokeWidth={2}
                            />
                            <defs>
                                <linearGradient id="streakGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </FullscreenChart>

                {/* 4. Leverage Usage Over Time */}
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

                {/* 5. Trade Volume Timeline */}
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
                            <Area 
                                type="monotone" 
                                dataKey="trades" 
                                stroke="#06b6d4" 
                                fill="url(#volumeGradient)"
                                strokeWidth={2}
                            />
                            <defs>
                                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </FullscreenChart>

                {/* 6. ROI Timeline */}
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
                            <Line 
                                type="monotone" 
                                dataKey="roi" 
                                stroke="#ec4899" 
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </FullscreenChart>
            </div>
        </div>
    );
}