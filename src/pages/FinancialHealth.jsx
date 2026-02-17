import React from 'react';
import { WalletProvider } from '../components/wallet/WalletContext';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Percent, Activity, Banknote, Droplets } from 'lucide-react';

const revenueData = [
    { year: '2021', revenue: 2.5, growth: 0 },
    { year: '2022', revenue: 4.2, growth: 68 },
    { year: '2023', revenue: 7.8, growth: 85.7 },
    { year: '2024', revenue: 14.3, growth: 83.3 },
    { year: '2025', revenue: 25.6, growth: 79 }
];

const profitabilityData = [
    { year: '2021', grossMargin: 45, operatingMargin: 12, netMargin: 8 },
    { year: '2022', grossMargin: 52, operatingMargin: 18, netMargin: 14 },
    { year: '2023', grossMargin: 58, operatingMargin: 24, netMargin: 19 },
    { year: '2024', grossMargin: 62, operatingMargin: 28, netMargin: 22 },
    { year: '2025', grossMargin: 65, operatingMargin: 32, netMargin: 26 }
];

const cashFlowData = [
    { year: '2021', operating: 1.8, investing: -0.5, financing: 0.3 },
    { year: '2022', operating: 3.2, investing: -0.8, financing: 0.2 },
    { year: '2023', operating: 5.9, investing: -1.2, financing: -0.1 },
    { year: '2024', operating: 10.8, investing: -1.8, financing: -0.3 },
    { year: '2025', operating: 19.2, investing: -2.5, financing: -0.5 }
];

const debtEquityData = [
    { name: 'Equity', value: 75, color: '#22d3ee' },
    { name: 'Debt', value: 25, color: '#f59e0b' }
];

const financialRatios = {
    pe: 28.5,
    ps: 4.2,
    roe: 18.5,
    roic: 22.3,
    currentRatio: 2.8,
    quickRatio: 2.1,
    debtToEquity: 0.33
};

export default function FinancialHealth() {
    return (
        <WalletProvider>
            <div className="min-h-screen bg-black relative overflow-hidden">
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
                
                <Navbar />
                
                <div className="pt-40 sm:pt-44 pb-20 px-4 sm:px-6 relative z-10">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-16"
                        >
                            <div className="inline-block px-4 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full mb-6">
                                <span className="text-red-400 text-sm font-semibold uppercase tracking-wider">Financial Health</span>
                            </div>
                            
                            {/* Title with Laser Effect */}
                            <div className="relative mb-6">
                                <motion.div
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.6) 50%, transparent 100%)',
                                        height: '4px',
                                        top: '50%',
                                        filter: 'blur(2px)'
                                    }}
                                    animate={{
                                        x: ['200%', '-100%'],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                        ease: "linear"
                                    }}
                                />
                                <h1 className="text-2xl sm:text-5xl md:text-7xl font-bold tracking-wider relative px-4" style={{ 
                                    fontFamily: 'Arial, sans-serif',
                                    letterSpacing: '0.1em'
                                }}>
                                    <span style={{
                                        color: 'transparent',
                                        WebkitTextStroke: '2px #dc2626',
                                        textShadow: '0 0 30px rgba(220,38,38,0.6)'
                                    }}>
                                        COMPANY FINANCIAL OVERVIEW
                                    </span>
                                </h1>
                                {/* Vertical laser beams */}
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute top-0 bottom-0"
                                        style={{
                                            left: `${i * 8.5}%`,
                                            width: '2px',
                                            background: 'linear-gradient(to bottom, transparent, rgba(220,38,38,0.8), transparent)',
                                            filter: 'blur(1px)'
                                        }}
                                        animate={{
                                            opacity: [0, 1, 0],
                                            scaleY: [0.5, 1, 0.5]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.15,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </div>
                            
                            <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto px-4">
                                Transparent financial metrics and performance indicators demonstrating our company's fiscal strength and growth trajectory.
                            </p>
                        </motion.div>

                        {/* Key Metrics Cards */}
                        <div className="grid md:grid-cols-3 gap-6 mb-12">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-black/60 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all duration-300 backdrop-blur-xl"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">Revenue Growth</h3>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">79%</div>
                                <p className="text-gray-400 text-sm">Year-over-year growth (2025)</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-black/60 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all duration-300 backdrop-blur-xl"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                        <Percent className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">Net Margin</h3>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">26%</div>
                                <p className="text-gray-400 text-sm">Healthy profitability (2025)</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-black/60 border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-all duration-300 backdrop-blur-xl"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">ROE</h3>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">18.5%</div>
                                <p className="text-gray-400 text-sm">Return on Equity</p>
                            </motion.div>
                        </div>

                        {/* Revenue Growth Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-black/60 border border-red-500/20 rounded-2xl p-4 sm:p-8 mb-8 backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                                <h2 className="text-lg sm:text-2xl font-bold text-white">Revenue Growth</h2>
                            </div>
                            <div className="h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                        <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} name="Revenue ($M)" dot={{ fill: '#22d3ee', r: 4 }} />
                                        <Line type="monotone" dataKey="growth" stroke="#10b981" strokeWidth={2} name="Growth (%)" dot={{ fill: '#10b981', r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Profitability Margins */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-black/60 border border-red-500/20 rounded-2xl p-4 sm:p-8 mb-8 backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <Percent className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                                <h2 className="text-lg sm:text-2xl font-bold text-white">Profitability Margins</h2>
                            </div>
                            <div className="h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={profitabilityData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                        <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="grossMargin" fill="#22d3ee" name="Gross (%)" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="operatingMargin" fill="#a78bfa" name="Operating (%)" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="netMargin" fill="#10b981" name="Net (%)" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Cash Flow & Debt */}
                        <div className="grid lg:grid-cols-2 gap-8 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-black/60 border border-red-500/20 rounded-2xl p-4 sm:p-8 backdrop-blur-xl"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                                    <h2 className="text-lg sm:text-2xl font-bold text-white">Cash Flow</h2>
                                </div>
                                <div className="h-64 sm:h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={cashFlowData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                            <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Bar dataKey="operating" fill="#10b981" name="Operating" radius={[8, 8, 0, 0]} />
                                            <Bar dataKey="investing" fill="#f59e0b" name="Investing" radius={[8, 8, 0, 0]} />
                                            <Bar dataKey="financing" fill="#ef4444" name="Financing" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="bg-black/60 border border-red-500/20 rounded-2xl p-4 sm:p-8 backdrop-blur-xl"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                                    <h2 className="text-lg sm:text-2xl font-bold text-white">Debt vs Equity</h2>
                                </div>
                                <div className="h-64 sm:h-80 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={debtEquityData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}%`}
                                                labelLine={false}
                                                style={{ fontSize: '12px' }}
                                            >
                                                {debtEquityData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-center text-gray-400 text-sm mt-4">
                                    Debt-to-Equity Ratio: <span className="text-white font-bold">0.33</span>
                                </p>
                            </motion.div>
                        </div>

                        {/* Financial Ratios */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="bg-black/60 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Key Financial Ratios</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                                    <div className="text-gray-400 text-sm mb-2">P/E Ratio</div>
                                    <div className="text-3xl font-bold text-white mb-1">{financialRatios.pe}</div>
                                    <p className="text-xs text-gray-500">Price to Earnings</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                                    <div className="text-gray-400 text-sm mb-2">P/S Ratio</div>
                                    <div className="text-3xl font-bold text-white mb-1">{financialRatios.ps}</div>
                                    <p className="text-xs text-gray-500">Price to Sales</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300">
                                    <div className="text-gray-400 text-sm mb-2">ROE</div>
                                    <div className="text-3xl font-bold text-white mb-1">{financialRatios.roe}%</div>
                                    <p className="text-xs text-gray-500">Return on Equity</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
                                    <div className="text-gray-400 text-sm mb-2">ROIC</div>
                                    <div className="text-3xl font-bold text-white mb-1">{financialRatios.roic}%</div>
                                    <p className="text-xs text-gray-500">Return on Invested Capital</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-yellow-500/30 transition-all duration-300">
                                    <div className="text-gray-400 text-sm mb-2">Current Ratio</div>
                                    <div className="text-3xl font-bold text-white mb-1">{financialRatios.currentRatio}</div>
                                    <p className="text-xs text-gray-500">Liquidity Measure</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-orange-500/30 transition-all duration-300">
                                    <div className="text-gray-400 text-sm mb-2">Quick Ratio</div>
                                    <div className="text-3xl font-bold text-white mb-1">{financialRatios.quickRatio}</div>
                                    <p className="text-xs text-gray-500">Immediate Liquidity</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-pink-500/30 transition-all duration-300 md:col-span-2">
                                    <div className="text-gray-400 text-sm mb-2">Debt-to-Equity</div>
                                    <div className="text-3xl font-bold text-white mb-1">{financialRatios.debtToEquity}</div>
                                    <p className="text-xs text-gray-500">Low leverage, strong balance sheet</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Explaining the Numbers */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.85 }}
                            className="mt-8 bg-black/60 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Explaining the Numbers</h2>
                            <div className="space-y-6">
                                {/* Growth */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 }}
                                    className="border-l-4 border-red-500 pl-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="text-red-400">1.</span> Growth (Very Strong)
                                    </h3>
                                    <div className="space-y-2 text-gray-300">
                                        <p>For a financial-investments / trading platform:</p>
                                        <p className="ml-4">• <strong className="text-white">79% revenue growth (2025)</strong> is excellent.</p>
                                        <p className="ml-4">• Most listed brokers or asset managers grow much slower (often 5–20% unless they're early-stage fintech).</p>
                                        <p className="text-red-400 font-semibold mt-3">👉 For this sector, that growth rate is top-tier and suggests user growth, higher trading volumes, or new products working well.</p>
                                    </div>
                                </motion.div>

                                {/* Profitability */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.0 }}
                                    className="border-l-4 border-red-500 pl-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="text-red-400">2.</span> Profitability (Also Very Strong)
                                    </h3>
                                    <div className="space-y-2 text-gray-300">
                                        <p>You've got:</p>
                                        <p className="ml-4">• Net margin ≈ <strong className="text-white">26%</strong></p>
                                        <p className="ml-4">• ROE <strong className="text-white">18.5%</strong>, ROIC <strong className="text-white">22.3%</strong></p>
                                        <p className="mt-3">For financial services:</p>
                                        <p className="ml-4">• Net margins in the teens are already solid; mid-20s is very attractive.</p>
                                        <p className="ml-4">• ROE in the 15–20% range is exactly what investors like in a financial firm. Many big banks sit around 10–15%.</p>
                                        <p className="text-red-400 font-semibold mt-3">👉 This says: the company converts trading/fees into profit very efficiently and uses capital well.</p>
                                    </div>
                                </motion.div>

                                {/* Balance Sheet & Risk */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.1 }}
                                    className="border-l-4 border-red-500 pl-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="text-red-400">3.</span> Balance Sheet & Risk (Conservative = Good Here)
                                    </h3>
                                    <div className="space-y-2 text-gray-300">
                                        <p>Debt-to-Equity <strong className="text-white">0.33</strong>, 75% equity / 25% debt.</p>
                                        <p className="ml-4">→ That's low leverage for a finance-related business. Many brokers and banks are much more levered.</p>
                                        <p className="mt-2">Current ratio <strong className="text-white">2.8</strong>, quick ratio <strong className="text-white">2.1</strong>.</p>
                                        <p className="ml-4">→ Plenty of liquidity to handle short-term obligations, margin calls, client withdrawals, etc.</p>
                                        <p className="text-red-400 font-semibold mt-3">👉 For a trading/financial company this is comfortably safe – not over-leveraged, which reduces blow-up risk in stressed markets.</p>
                                    </div>
                                </motion.div>

                                {/* Cash Flow */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.2 }}
                                    className="border-l-4 border-red-500 pl-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="text-red-400">4.</span> Cash Flow (Clean Story)
                                    </h3>
                                    <div className="space-y-2 text-gray-300">
                                        <p className="ml-4">• Operating cash flow positive and growing every year.</p>
                                        <p className="ml-4">• Investing CF negative (spending to grow the platform, tech, licenses).</p>
                                        <p className="ml-4">• Financing CF mildly negative (likely repaying debt, maybe small dividends or buybacks).</p>
                                        <p className="text-red-400 font-semibold mt-3">👉 This is exactly what you want: the core business funds its own growth, not constant capital raises.</p>
                                    </div>
                                </motion.div>

                                {/* Valuation */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.3 }}
                                    className="border-l-4 border-red-500 pl-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="text-red-400">5.</span> Valuation (The "But...")
                                    </h3>
                                    <div className="space-y-2 text-gray-300">
                                        <p>P/E <strong className="text-white">28.5</strong></p>
                                        <p>P/S <strong className="text-white">4.2</strong></p>
                                        <p className="mt-3">For a financial-investments/trading company:</p>
                                        <p className="ml-4">• That's expensive vs traditional brokers/asset managers, which might trade at P/E 10–18, P/S often {"<"}3.</p>
                                        <p className="ml-4">• It's more in line with high-growth fintech (like early-stage trading apps, payment companies, etc.).</p>
                                        <p className="text-red-400 font-semibold mt-3">👉 Market is pricing it as a high-growth fintech winner, not a boring broker. If growth or profitability slows, the multiple could compress.</p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Where Those Numbers Come From */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="mt-8 bg-black/60 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Where Those Numbers Come From</h2>
                            <div className="space-y-6">
                                {/* Income Statement */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.95 }}
                                    className="bg-black/40 rounded-xl p-6 border border-red-500/20"
                                >
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-sm font-bold">1</span>
                                        Income Statement
                                    </h3>
                                    <div className="space-y-3 text-gray-300">
                                        <div>
                                            <p className="text-red-400 font-semibold mb-2">What it is:</p>
                                            <p>A movie of performance over a period (month/quarter/year).</p>
                                        </div>
                                        <div>
                                            <p className="text-red-400 font-semibold mb-2">Main pieces:</p>
                                            <ul className="ml-6 space-y-1">
                                                <li>• <strong className="text-white">Revenue (Sales)</strong> – all money earned from selling products/services.</li>
                                                <li>• <strong className="text-white">Expenses</strong> – salaries, rent, marketing, interest, taxes, etc.</li>
                                                <li>• <strong className="text-white">Net Income (Profit)</strong> – Revenue − Expenses.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-red-400 font-semibold mb-2">Ratios you get from here:</p>
                                            <ul className="ml-6 space-y-1">
                                                <li>• <strong className="text-white">Net Margin</strong> = Net Income ÷ Revenue<br/>
                                                    <span className="text-sm text-gray-400 ml-4">→ Shows how much profit the company keeps from each $1 of sales.</span>
                                                </li>
                                                <li>• <strong className="text-white">ROE (Return on Equity)</strong> partly uses Net Income (ROE = Net Income ÷ Equity).</li>
                                            </ul>
                                        </div>
                                        <div className="bg-red-500/10 rounded-lg p-3 mt-3">
                                            <p className="text-red-300 font-semibold">Investor question it answers:</p>
                                            <p className="text-gray-300 italic">"Is this business actually profitable, and how fast is profit growing?"</p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Balance Sheet */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.0 }}
                                    className="bg-black/40 rounded-xl p-6 border border-red-500/20"
                                >
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-sm font-bold">2</span>
                                        Balance Sheet
                                    </h3>
                                    <div className="space-y-3 text-gray-300">
                                        <div>
                                            <p className="text-red-400 font-semibold mb-2">What it is:</p>
                                            <p>A photo of what the company owns and owes at a specific date.</p>
                                        </div>
                                        <div>
                                            <p className="text-red-400 font-semibold mb-2">Main pieces:</p>
                                            <ul className="ml-6 space-y-1">
                                                <li>• <strong className="text-white">Assets</strong> – cash, inventory, equipment, buildings, investments.</li>
                                                <li>• <strong className="text-white">Liabilities</strong> – loans, payables, other debts.</li>
                                                <li>• <strong className="text-white">Equity</strong> – what's left for the owners (Assets − Liabilities).</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-red-400 font-semibold mb-2">Ratios you get from here:</p>
                                            <ul className="ml-6 space-y-1">
                                                <li>• <strong className="text-white">Debt</strong> (total liabilities)</li>
                                                <li>• <strong className="text-white">Equity</strong> (owners' capital)</li>
                                                <li>• <strong className="text-white">Debt-to-Equity</strong> = Debt ÷ Equity → leverage risk.</li>
                                                <li>• <strong className="text-white">Current Ratio</strong> = Current Assets ÷ Current Liabilities</li>
                                                <li>• <strong className="text-white">Quick Ratio</strong> = (Cash + Receivables + Marketable Securities) ÷ Current Liabilities</li>
                                            </ul>
                                        </div>
                                        <div className="bg-red-500/10 rounded-lg p-3 mt-3">
                                            <p className="text-red-300 font-semibold">Investor question it answers:</p>
                                            <p className="text-gray-300 italic">"How strong is the balance sheet? Can they pay their bills and survive bad times?"</p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Cash Flow Statement */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.05 }}
                                    className="bg-black/40 rounded-xl p-6 border border-red-500/20"
                                >
                                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-sm font-bold">3</span>
                                        Cash-Flow Statement
                                    </h3>
                                    <div className="space-y-3 text-gray-300">
                                        <div>
                                            <p className="text-red-400 font-semibold mb-2">What it is:</p>
                                            <p>Tracks where actual cash moves, split into three buckets:</p>
                                        </div>
                                        <div>
                                            <ul className="ml-6 space-y-1">
                                                <li>• <strong className="text-white">Operating cash flow</strong> – cash from core business (customers paying, paying suppliers, wages).</li>
                                                <li>• <strong className="text-white">Investing cash flow</strong> – buying/selling long-term assets (machinery, acquisitions).</li>
                                                <li>• <strong className="text-white">Financing cash flow</strong> – raising/repaying debt or equity (loans, share issues, dividends).</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-red-400 font-semibold mb-2">Ratios / insights you get from here:</p>
                                            <ul className="ml-6 space-y-1">
                                                <li>• Is the company generating cash from operations or just accounting profit?</li>
                                                <li>• Are they investing heavily (negative investing CF) to grow?</li>
                                                <li>• Are they issuing debt/equity or paying it back?</li>
                                            </ul>
                                        </div>
                                        <div className="bg-red-500/10 rounded-lg p-3 mt-3">
                                            <p className="text-red-300 font-semibold">Investor question it answers:</p>
                                            <p className="text-gray-300 italic">"Is real cash coming in, and how is management using it?"</p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Summary Box */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.1 }}
                                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-6"
                                >
                                    <h4 className="text-white font-bold mb-3">Put together:</h4>
                                    <div className="space-y-2 text-gray-300">
                                        <p>• <strong className="text-red-400">Income statement</strong> → Profitability.</p>
                                        <p>• <strong className="text-red-400">Balance sheet</strong> → Strength & risk.</p>
                                        <p>• <strong className="text-red-400">Cash-flow statement</strong> → Cash reality & capital discipline.</p>
                                        <p className="text-white font-semibold mt-3">Everything on your dashboard (ROE, margins, leverage, liquidity, etc.) is built on those three reports.</p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="mt-8 bg-black/60 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Financial Health Summary</h3>
                            <div className="space-y-3 text-gray-300">
                                <p>✓ <strong className="text-white">Strong Revenue Growth:</strong> Consistent year-over-year revenue increases with 79% growth in 2025.</p>
                                <p>✓ <strong className="text-white">Profitable Operations:</strong> Positive net margins at 26% demonstrating efficient cost management.</p>
                                <p>✓ <strong className="text-white">Positive Cash Flow:</strong> Strong operating cash flow generation ensuring liquidity and growth capacity.</p>
                                <p>✓ <strong className="text-white">Conservative Debt Levels:</strong> Low debt-to-equity ratio of 0.33 with comfortable interest coverage.</p>
                                <p>✓ <strong className="text-white">Strong Liquidity:</strong> Current ratio of 2.8 ensures ability to weather market downturns.</p>
                                <p>✓ <strong className="text-white">Efficient Capital Use:</strong> ROE of 18.5% and ROIC of 22.3% demonstrate effective capital allocation.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="relative z-10">
                    <Footer />
                </div>
            </div>
        </WalletProvider>
    );
}