import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, DollarSign, Receipt, Award, Target, CheckCircle2, XCircle } from 'lucide-react';
import { calculatePoolMetrics } from './TimeBasedCalculations';
import TradesMonitoring from './TradesMonitoring';

export default function PoolPerformance({
    trades = [],
    investors = [],
    withdrawals = [],
    profitShareRate = 0,
    poolType = 'scalping'
}) {
    const filteredTrades = useMemo(() => {
        // Show all trades regardless of date
        return trades;
    }, [trades]);

    const metrics = useMemo(() => {
        // Use time-based calculation for accurate metrics
        const poolMetrics = calculatePoolMetrics({
            trades: filteredTrades,
            investors,
            withdrawals,
            profitShareRate
        });

        // Win Rate calculations
        const totalTrades = filteredTrades.length;
        const winningTrades = filteredTrades.filter(t => t.result === 'win').length;
        const losingTrades = filteredTrades.filter(t => t.result === 'lose').length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        return {
            ...poolMetrics,
            totalTrades,
            winningTrades,
            losingTrades,
            winRate
        };
    }, [filteredTrades, investors, withdrawals, profitShareRate]);

    // Generate chart data - cumulative over time
    const chartData = useMemo(() => {
        const sortedTrades = [...filteredTrades].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        let cumulativeGrossPnl = 0;
        let cumulativeFees = 0;
        let cumulativeProfitShare = 0;
        let cumulativeNetPnl = 0;

        return sortedTrades.map((trade, idx) => {
            cumulativeGrossPnl += trade.pnl || 0;
            cumulativeFees += trade.fee || 0;

            const profitAfterFees = cumulativeGrossPnl - cumulativeFees;
            // Calculate profit share on profit after fees
            cumulativeProfitShare = profitAfterFees > 0
                ? profitAfterFees * profitShareRate
                : 0;

            cumulativeNetPnl = profitAfterFees - cumulativeProfitShare;

            return {
                date: new Date(trade.date).toLocaleDateString(),
                grossPnl: parseFloat(cumulativeGrossPnl.toFixed(2)),
                fees: parseFloat(cumulativeFees.toFixed(2)),
                profitShare: parseFloat(cumulativeProfitShare.toFixed(2)),
                netPnl: parseFloat(cumulativeNetPnl.toFixed(2))
            };
        });
    }, [filteredTrades, profitShareRate]);

    // Generate daily aggregated data for bar chart
    const dailyData = useMemo(() => {
        if (!filteredTrades || filteredTrades.length === 0) return [];

        const sortedTrades = [...filteredTrades].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        const dailyMap = {};

        sortedTrades.forEach(trade => {
            const dateKey = new Date(trade.date).toISOString().split('T')[0];

            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = {
                    date: dateKey,
                    grossPnl: 0,
                    fees: 0,
                    profitShare: 0,
                    netPnl: 0,
                    trades: 0
                };
            }

            const day = dailyMap[dateKey];
            day.grossPnl += trade.pnl || 0;
            day.fees += trade.fee || 0;
            day.trades += 1;
        });

        return Object.values(dailyMap).map(day => {
            const profitAfterFees = day.grossPnl - day.fees;
            day.profitShare = profitAfterFees > 0 ? profitAfterFees * profitShareRate : 0;
            day.netPnl = profitAfterFees - day.profitShare;

            return {
                date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                grossPnl: parseFloat(day.grossPnl.toFixed(2)),
                fees: parseFloat(day.fees.toFixed(2)),
                profitShare: parseFloat(day.profitShare.toFixed(2)),
                netPnl: parseFloat(day.netPnl.toFixed(2)),
                trades: day.trades
            };
        });
    }, [filteredTrades, profitShareRate]);

    const StatCard = ({ icon: Icon, label, value, color, gradient, forceColor = null }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`relative ${gradient} backdrop-blur-xl border border-white/20 rounded-2xl p-6 overflow-hidden group transition-all duration-300 hover:shadow-xl`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-xl ${color} backdrop-blur-sm`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-gray-300 text-sm font-medium">{label}</span>
                </div>
                <p className={`text-3xl font-bold ${forceColor || (value >= 0 ? 'text-green-400' : 'text-red-400')
                    }`}>
                    ${Math.abs(value).toFixed(2)}
                </p>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    icon={TrendingUp}
                    label="Gross PNL"
                    value={metrics.grossPnl}
                    color="bg-green-500/30 text-green-400"
                    forceColor="text-green-400"
                    gradient="bg-gradient-to-br from-green-500/10 via-black/20 to-green-600/5"
                />
                <StatCard
                    icon={Receipt}
                    label="Trading Fees"
                    value={metrics.tradingFees}
                    color="bg-red-500/30 text-red-400"
                    gradient="bg-gradient-to-br from-red-500/10 via-black/20 to-red-600/5"
                />
                <StatCard
                    icon={Award}
                    label="Profit Share"
                    value={metrics.profitShare}
                    color="bg-purple-500/30 text-purple-400"
                    gradient="bg-gradient-to-br from-purple-500/10 via-black/20 to-purple-600/5"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Net PNL"
                    value={metrics.netPnl}
                    color="bg-green-500/30 text-green-400"
                    forceColor="text-green-400"
                    gradient="bg-gradient-to-br from-green-500/10 via-black/20 to-green-600/5"
                />
                <StatCard
                    icon={DollarSign}
                    label="Total Pool Balance"
                    value={metrics.totalBalance}
                    color="bg-cyan-500/30 text-cyan-400"
                    gradient="bg-gradient-to-br from-cyan-500/10 via-black/20 to-cyan-600/5"
                />
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-purple-500/5 via-black/40 to-cyan-500/5 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 opacity-50" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-purple-400 to-cyan-600 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Performance Over Time</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255,255,255,0.5)"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.5)"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'white'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="grossPnl"
                                    stroke="#4ade80"
                                    name="Gross PNL"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="fees"
                                    stroke="#ef4444"
                                    name="Trading Fees"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="profitShare"
                                    stroke="#a855f7"
                                    name="Profit Share"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="netPnl"
                                    stroke="#22c55e"
                                    name="Net PNL"
                                    strokeWidth={3}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* Daily Performance Bar Chart */}
            {dailyData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-cyan-500/5 via-black/40 to-purple-500/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-50" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Daily Performance</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255,255,255,0.5)"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.5)"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'white'
                                    }}
                                    formatter={(value, name) => {
                                        if (name === 'trades') return [value, 'Trades'];
                                        return [`$${value}`, name];
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="grossPnl"
                                    fill="#4ade80"
                                    name="Gross PNL"
                                    radius={[8, 8, 0, 0]}
                                />
                                <Bar
                                    dataKey="fees"
                                    fill="#ef4444"
                                    name="Trading Fees"
                                    radius={[8, 8, 0, 0]}
                                />
                                <Bar
                                    dataKey="profitShare"
                                    fill="#a855f7"
                                    name="Profit Share"
                                    radius={[8, 8, 0, 0]}
                                />
                                <Bar
                                    dataKey="netPnl"
                                    fill="#22c55e"
                                    name="Net PNL"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* Trades Monitoring Section */}
            <TradesMonitoring
                trades={trades}
                investors={investors}
                profitShareRate={profitShareRate}
            />

            {/* Additional Info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative bg-gradient-to-br from-green-500/5 via-black/40 to-yellow-500/5 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-yellow-500/5 opacity-50" />
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-green-400 to-yellow-600 rounded-xl">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Balance Breakdown</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 hover:shadow-lg hover:shadow-green-500/10 transition-all">
                            <span className="text-gray-300 text-sm font-medium block mb-2">Total Deposits</span>
                            <p className="text-green-400 font-bold text-2xl">${metrics.totalDeposits.toFixed(2)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/10 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-4 hover:shadow-lg hover:shadow-yellow-500/10 transition-all">
                            <span className="text-gray-300 text-sm font-medium block mb-2">Total Withdrawals</span>
                            <p className="text-yellow-400 font-bold text-2xl">${metrics.totalWithdrawals.toFixed(2)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 hover:shadow-lg hover:shadow-green-500/10 transition-all">
                            <span className="text-gray-300 text-sm font-medium block mb-2">Net PNL</span>
                            <p className="font-bold text-2xl text-green-400">
                                ${Math.abs(metrics.netPnl).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10 bg-black/20 rounded-xl p-4">
                        <p className="text-xs text-gray-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                            <strong className="text-cyan-400">Formula:</strong> Total Pool Balance = Total Deposits - Total Withdrawals + Net PNL
                        </p>
                        <p className="text-xs text-gray-300 mt-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                            <strong className="text-purple-400">Net PNL Formula:</strong> (Gross PNL - Trading Fees) - Profit Share ({poolType === 'vip' ? '10%' : '20%'} of profit after fees)
                        </p>
                        {poolType === 'vip' && (
                            <p className="text-xs text-yellow-300 mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                                <strong className="text-yellow-400">Deposit Limits:</strong> Minimum 20,000 USDT - Maximum Unlimited
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Win Rate Section */}
            {metrics.totalTrades > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative bg-gradient-to-br from-cyan-500/5 via-black/40 to-purple-500/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-50" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Pool Win Rate</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Stats Cards */}
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-gray-300 text-sm font-medium block mb-1">Total Trades</span>
                                            <p className="text-blue-400 font-bold text-3xl">{metrics.totalTrades}</p>
                                        </div>
                                        <div className="p-3 bg-blue-500/20 rounded-xl">
                                            <Target className="w-6 h-6 text-blue-400" />
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-green-500/10 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-gray-300 text-sm font-medium block mb-1">Successful Trades</span>
                                            <p className="text-green-400 font-bold text-3xl">{metrics.winningTrades}</p>
                                        </div>
                                        <div className="p-3 bg-green-500/20 rounded-xl">
                                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-gradient-to-br from-red-500/10 to-pink-600/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-5 hover:shadow-lg hover:shadow-red-500/10 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-gray-300 text-sm font-medium block mb-1">Failed Trades</span>
                                            <p className="text-red-400 font-bold text-3xl">{metrics.losingTrades}</p>
                                        </div>
                                        <div className="p-3 bg-red-500/20 rounded-xl">
                                            <XCircle className="w-6 h-6 text-red-400" />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Chart */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6"
                            >
                                <div className="relative">
                                    <ResponsiveContainer width={240} height={240}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Wins', value: metrics.winningTrades },
                                                    { name: 'Losses', value: metrics.losingTrades }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                animationBegin={0}
                                                animationDuration={1000}
                                                label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                                labelLine={false}
                                            >
                                                <Cell fill="#22c55e" />
                                                <Cell fill="#ef4444" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                                                {metrics.winRate.toFixed(1)}%
                                            </p>
                                            <p className="text-gray-400 text-sm mt-1">Win Rate</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-400 rounded-full" />
                                        <span className="text-gray-300 text-sm">Wins</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-400 rounded-full" />
                                        <span className="text-gray-300 text-sm">Losses</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}