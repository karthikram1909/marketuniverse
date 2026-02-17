import React from 'react';
import { WalletProvider } from '../components/wallet/WalletContext';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import LiveTicker from '../components/pools/LiveTicker';
import PoolCard from '../components/pools/PoolCard';
import { TrendingUp, CheckCircle, Star, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const pools = [
    {
        title: 'Crypto Pool',
        subtitle: 'High-frequency scalping • Cryptocurrency',
        icon: Zap,
        badges: ['⚡ Fast Execution', '📈 High Volatility', '⏱️ No Lock-In'],
        description: 'Flexible crypto scalping with no commitments.',
        stats: [
            { label: 'Min Deposit', value: 'No Minimum' },
            { label: 'Lock-In', value: 'None' },
            { label: 'Profit Share', value: '20%' }
        ],
        color: '#ef4444',
        gradient: 'from-red-500 to-orange-500',
        pathData: 'M0,25 Q10,5 20,15 T40,10 T60,20 T80,8 T100,15',
        path: 'CryptoPool'
    },
    {
        title: 'Traditional Pool',
        subtitle: 'Conservative strategy • 1-12 month commitment',
        icon: CheckCircle,
        badges: ['🧭 Stable Returns', '🔒 Lock-In Period', '🛡️ Capital Preservation'],
        description: 'Stable returns with 1-12 month commitment.',
        stats: [
            { label: 'Min Deposit', value: 'No Minimum' },
            { label: 'Lock-In', value: '1-12 Months' },
            { label: 'Profit Share', value: '20%' }
        ],
        color: '#f5c96a',
        gradient: 'from-yellow-500 to-orange-500',
        pathData: 'M0,20 Q20,18 40,16 T80,12 T100,10',
        path: 'TraditionalPool'
    },
    {
        title: 'VIP Pool',
        subtitle: 'Premium strategies • Advanced trading',
        icon: Star,
        badges: ['🚀 Multi-Strategy', '💎 Premium Access', '⚡ No Lock-In'],
        description: 'Premium strategies with flexible terms.',
        stats: [
            { label: 'Min Deposit', value: '$20,000' },
            { label: 'Lock-In', value: 'None' },
            { label: 'Profit Share', value: '10%' }
        ],
        color: '#a855f7',
        gradient: 'from-purple-500 to-pink-600',
        pathData: 'M0,22 Q25,20 50,18 T100,14',
        path: 'VIPPool'
    }
];

export default function PoolPlans() {
    return (
        <WalletProvider>
            <div className="min-h-screen bg-black relative overflow-hidden">
                {/* Base Background */}
                <div className="absolute inset-0 bg-black" />

                {/* Animated Red Energy Gradient */}
                <motion.div 
                    className="absolute inset-0"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.6, 0.8, 0.6]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, rgba(0,0,0,0.8) 50%, black 100%)',
                    }}
                />

                {/* Floating Energy Orbs */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={`orb-${i}`}
                        className="absolute rounded-full"
                        style={{
                            width: `${Math.random() * 150 + 50}px`,
                            height: `${Math.random() * 150 + 50}px`,
                            background: i % 2 === 0 
                                ? 'radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                            filter: 'blur(40px)',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            x: [0, Math.random() * 100 - 50, 0],
                            y: [0, Math.random() * 100 - 50, 0],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                ))}

                {/* Geometric Grid Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(220,38,38,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(220,38,38,0.5) 1px, transparent 1px),
                            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
                    }}
                />
                
                <Navbar />
                
                <main className="relative z-10 px-4 sm:px-6 pt-32 pb-20">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-16"
                        >
                            <h1 className="relative text-5xl md:text-6xl font-bold text-white mb-4 inline-block">
                                <motion.div
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.6) 50%, transparent 100%)',
                                        height: '4px',
                                        filter: 'blur(2px)'
                                    }}
                                    animate={{
                                        x: ['-100%', '200%'],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                        ease: "linear"
                                    }}
                                />
                                Investment Pools
                            </h1>
                            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                                Choose the strategy that fits your goals
                            </p>
                        </motion.div>

                        {/* Live Ticker */}
                        <div className="mb-12">
                            <LiveTicker />
                        </div>

                        {/* Pool Cards */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pools.map((pool, index) => (
                                <PoolCard key={index} pool={pool} index={index} />
                            ))}
                        </div>

                        {/* Brief Overview */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-16 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
                        >
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-red-500" />
                                How It Works
                            </h2>
                            <p className="text-gray-300">
                                Connect your wallet, deposit USDT (BEP-20) into your chosen pool, and professional traders manage the funds. You earn or lose based on your ownership percentage of the pool. Managers take 10-20% of profits only. Withdraw anytime (except Traditional Pool lock-in periods).
                            </p>
                        </motion.div>

                        {/* Detailed Explanation */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-8 bg-black/60 border border-red-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl"
                        >
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-3">
                                <Shield className="w-7 h-7 text-red-400" />
                                Pool Investment Mechanics
                            </h2>
                            <p className="text-red-400 text-base sm:text-lg mb-8">Complete guide to how pool trading works</p>

                            <div className="space-y-8">
                                {/* Point 1 */}
                                <div className="border-l-4 border-cyan-500 pl-6">
                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                        1. Pool Concept & Collective Investment
                                    </h3>
                                    <div className="text-gray-300 space-y-3">
                                        <p>Investment pools combine funds from multiple investors into a single trading account managed by professional traders. This allows access to advanced strategies and larger position sizes while sharing costs and expertise.</p>
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <p className="text-cyan-400 font-semibold mb-2">Core Principles:</p>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Your deposits are pooled with other investors' capital</li>
                                                <li>• Professional traders execute strategies on the collective fund</li>
                                                <li>• You own a percentage of the total pool based on your investment</li>
                                                <li>• Profits and losses are distributed proportionally to ownership</li>
                                                <li>• All transactions are transparent and recorded on blockchain</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Point 2 */}
                                <div className="border-l-4 border-green-500 pl-6">
                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                        2. Time-Based Ownership System
                                    </h3>
                                    <div className="text-gray-300 space-y-3">
                                        <p>Our fair distribution system ensures you only profit from trades executed AFTER your deposit:</p>
                                        <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                                            <p><span className="text-white font-semibold">When you deposit:</span> System snapshots the pool's Net Asset Value (NAV)</p>
                                            <p><span className="text-white font-semibold">Ownership % =</span> (Your Investment ÷ Total Pool Size) × 100</p>
                                            <p><span className="text-white font-semibold">Each trade:</span> Profit/loss distributed to all investors based on their ownership % at trade time</p>
                                            <p><span className="text-white font-semibold">When others deposit:</span> Your ownership % adjusts automatically (pool grows)</p>
                                            <p><span className="text-white font-semibold">When others withdraw:</span> Your ownership % increases (pool shrinks)</p>
                                        </div>
                                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                                            <p className="text-white font-semibold mb-2">Timeline Example:</p>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Day 1: Pool has $50,000, you deposit $10,000 → You own 16.67%</li>
                                                <li>• Day 2: Trade wins $3,000 → You get 16.67% = ~$500 (after fees/share)</li>
                                                <li>• Day 3: Another investor adds $15,000 → Your ownership drops to 13.16%</li>
                                                <li>• Day 4: Trade wins $4,000 → You get 13.16% = ~$526</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Point 3 */}
                                <div className="border-l-4 border-yellow-500 pl-6">
                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                        3. Profit Distribution Formula
                                    </h3>
                                    <div className="text-gray-300 space-y-3">
                                        <p>Every trade's profit or loss flows through this calculation:</p>
                                        <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm font-mono">
                                            <p><span className="text-white">Step 1:</span> Gross PnL = Trade profit/loss × Your ownership %</p>
                                            <p><span className="text-white">Step 2:</span> Clean PnL = Gross PnL − Trading Fees</p>
                                            <p><span className="text-white">Step 3:</span> Manager Share = Clean PnL × Profit Share Rate (if Clean PnL &gt; 0)</p>
                                            <p><span className="text-white">Step 4:</span> Your Net PnL = Clean PnL − Manager Share</p>
                                            <p className="pt-2 border-t border-white/10 text-green-400"><span className="text-white">Final:</span> Total Balance = Deposits + Net PnL − Withdrawals</p>
                                        </div>
                                        <p className="text-yellow-400 text-sm font-semibold">Important: Manager profit share (10-20%) only applies to positive Clean PnL. Losses have NO manager fee.</p>
                                    </div>
                                </div>

                                {/* Point 4 */}
                                <div className="border-l-4 border-purple-500 pl-6">
                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                        4. Manager Profit Share Examples
                                    </h3>
                                    <div className="text-gray-300 space-y-3">
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                            <p className="text-white font-semibold mb-2">Winning Trade (20% profit share - Crypto/Traditional):</p>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Trade Gross PnL: <span className="text-green-400">+$1,000</span></li>
                                                <li>• Trading Fee: <span className="text-orange-400">-$10</span></li>
                                                <li>• Clean PnL: <span className="text-green-400">$990</span></li>
                                                <li>• Manager Share (20%): <span className="text-yellow-400">-$198</span></li>
                                                <li>• Your Net PnL: <span className="text-green-400 font-bold">+$792</span></li>
                                            </ul>
                                        </div>
                                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                            <p className="text-white font-semibold mb-2">Winning Trade (10% profit share - VIP Pool):</p>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Trade Gross PnL: <span className="text-green-400">+$1,000</span></li>
                                                <li>• Trading Fee: <span className="text-orange-400">-$10</span></li>
                                                <li>• Clean PnL: <span className="text-green-400">$990</span></li>
                                                <li>• Manager Share (10%): <span className="text-yellow-400">-$99</span></li>
                                                <li>• Your Net PnL: <span className="text-green-400 font-bold">+$891</span></li>
                                            </ul>
                                        </div>
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                            <p className="text-white font-semibold mb-2">Losing Trade (All Pools):</p>
                                            <ul className="space-y-1 text-sm">
                                                <li>• Trade Gross PnL: <span className="text-red-400">-$500</span></li>
                                                <li>• Trading Fee: <span className="text-orange-400">-$10</span></li>
                                                <li>• Clean PnL: <span className="text-red-400">-$510</span></li>
                                                <li>• Manager Share: <span className="text-gray-400">$0 (no fee on losses)</span></li>
                                                <li>• Your Net PnL: <span className="text-red-400 font-bold">-$510</span></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Point 5 */}
                                <div className="border-l-4 border-orange-500 pl-6">
                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                        5. Pool Comparison
                                    </h3>
                                    <div className="text-gray-300">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-white/10">
                                                        <th className="text-left text-white p-3">Feature</th>
                                                        <th className="text-left text-red-400 p-3">Crypto Pool</th>
                                                        <th className="text-left text-yellow-400 p-3">Traditional Pool</th>
                                                        <th className="text-left text-purple-400 p-3">VIP Pool</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-gray-300">
                                                    <tr className="border-b border-white/5">
                                                        <td className="p-3 text-white font-semibold">Strategy</td>
                                                        <td className="p-3">High-frequency scalping</td>
                                                        <td className="p-3">Conservative long-term</td>
                                                        <td className="p-3">Multi-strategy premium</td>
                                                    </tr>
                                                    <tr className="border-b border-white/5">
                                                        <td className="p-3 text-white font-semibold">Lock-In Period</td>
                                                        <td className="p-3 text-green-400">None</td>
                                                        <td className="p-3 text-orange-400">1-12 months</td>
                                                        <td className="p-3 text-green-400">None</td>
                                                    </tr>
                                                    <tr className="border-b border-white/5">
                                                        <td className="p-3 text-white font-semibold">Min Deposit</td>
                                                        <td className="p-3">No minimum</td>
                                                        <td className="p-3">No minimum</td>
                                                        <td className="p-3 text-purple-400">$20,000</td>
                                                    </tr>
                                                    <tr className="border-b border-white/5">
                                                        <td className="p-3 text-white font-semibold">Profit Share</td>
                                                        <td className="p-3">20%</td>
                                                        <td className="p-3">20%</td>
                                                        <td className="p-3 text-green-400">10%</td>
                                                    </tr>
                                                    <tr className="border-b border-white/5">
                                                        <td className="p-3 text-white font-semibold">Early Withdrawal Penalty</td>
                                                        <td className="p-3 text-green-400">0%</td>
                                                        <td className="p-3 text-red-400">10%</td>
                                                        <td className="p-3 text-green-400">0%</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-3 text-white font-semibold">Best For</td>
                                                        <td className="p-3">Active traders, flexibility</td>
                                                        <td className="p-3">Long-term investors</td>
                                                        <td className="p-3">High-net-worth investors</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Point 6 */}
                                <div className="border-l-4 border-blue-500 pl-6">
                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                        6. Real-Time Balance Calculation
                                    </h3>
                                    <div className="text-gray-300 space-y-3">
                                        <p>Your balance updates in real-time as the pool executes trades. The system tracks every deposit, withdrawal, and trade to calculate your exact ownership and profit/loss at any moment.</p>
                                        <div className="bg-white/5 rounded-lg p-4 text-sm">
                                            <p className="text-white font-semibold mb-2">What you see on your dashboard:</p>
                                            <ul className="space-y-1">
                                                <li>• <span className="text-cyan-400">Total Balance:</span> Your current withdrawable amount</li>
                                                <li>• <span className="text-cyan-400">Ownership %:</span> Your share of the entire pool</li>
                                                <li>• <span className="text-cyan-400">Gross PnL:</span> Your share of raw trade profits/losses</li>
                                                <li>• <span className="text-cyan-400">Fees Paid:</span> Your share of exchange trading fees</li>
                                                <li>• <span className="text-cyan-400">Profit Share Paid:</span> Manager's cut (10-20% on profits only)</li>
                                                <li>• <span className="text-cyan-400">Net PnL:</span> Your actual profit/loss after all deductions</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Point 7 */}
                                <div className="border-l-4 border-red-500 pl-6">
                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                                        7. Deposits & Withdrawals
                                    </h3>
                                    <div className="text-gray-300 space-y-3">
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                            <p className="text-white font-semibold mb-2">Depositing:</p>
                                            <ul className="space-y-1 text-sm">
                                                <li>1. Connect MetaMask wallet (BSC network)</li>
                                                <li>2. Send USDT (BEP-20) to pool address</li>
                                                <li>3. Transaction verified on blockchain automatically</li>
                                                <li>4. Your ownership % calculated instantly</li>
                                                <li>5. You start earning/losing from next trade onward</li>
                                            </ul>
                                        </div>
                                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                            <p className="text-white font-semibold mb-2">Withdrawing:</p>
                                            <ul className="space-y-1 text-sm">
                                                <li>1. Request withdrawal via dashboard (up to current balance)</li>
                                                <li>2. Admin reviews and processes (3-7 business days)</li>
                                                <li>3. USDT sent to your BEP-20 address</li>
                                                <li>4. Traditional Pool: 10% penalty if before lock-in ends</li>
                                                <li>5. Crypto/VIP Pools: No penalties, withdraw anytime</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </main>

                <Footer />
            </div>
        </WalletProvider>
    );
}