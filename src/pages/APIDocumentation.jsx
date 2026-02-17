import React from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { Code, Activity, Lock, Zap, ExternalLink } from 'lucide-react';

export default function APIDocumentation() {
    const exchanges = [
        {
            name: 'Binance',
            logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
            description: 'World\'s largest cryptocurrency exchange by trading volume',
            website: 'https://www.binance.com',
            features: ['Spot Trading', 'Futures Trading', 'High Liquidity', 'Advanced Charting']
        },
        {
            name: 'MEXC',
            logo: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/544.png',
            description: 'Global cryptocurrency exchange with diverse trading pairs',
            website: 'https://www.mexc.com',
            features: ['Spot Trading', 'Margin Trading', 'Multiple Pairs', 'Low Fees']
        },
        {
            name: 'KuCoin',
            logo: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png',
            description: 'People\'s exchange with extensive altcoin selection',
            website: 'https://www.kucoin.com',
            features: ['Spot Trading', 'Futures', 'Wide Selection', 'Staking Options']
        },
        {
            name: 'Gate.io',
            logo: 'https://www.gate.io/favicon.ico',
            description: 'Comprehensive crypto trading platform with advanced features',
            website: 'https://www.gate.io',
            features: ['Spot Trading', 'Derivatives', 'Copy Trading', 'High Security']
        }
    ];

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Animated Background */}
                <div className="fixed inset-0 pointer-events-none">
                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            background: [
                                'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                                'radial-gradient(circle at 80% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                                'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                            ],
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.5, 0.3, 0.5],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                </div>

                <Navbar />
                
                <div className="pt-40 sm:pt-44 pb-20 px-4 sm:px-6 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-16"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
                                <Code className="w-4 h-4" />
                                Trading Infrastructure
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 relative px-4">
                                <span className="relative z-10">Exchange Integration</span>
                                <motion.div
                                    className="absolute inset-0 blur-2xl opacity-50"
                                    animate={{
                                        textShadow: [
                                            '0 0 20px rgba(220,38,38,0.5)',
                                            '0 0 40px rgba(220,38,38,0.8)',
                                            '0 0 20px rgba(220,38,38,0.5)',
                                        ],
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    Exchange Integration
                                </motion.div>
                            </h1>
                            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
                                Our platform executes trades across multiple top-tier cryptocurrency exchanges 
                                to ensure optimal liquidity, competitive fees, and reliable execution.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
                        >
                            <div className="bg-black/60 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4">
                                    <Activity className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Multi-Exchange Trading</h3>
                                <p className="text-gray-400 text-sm">
                                    Execute trades across 4 major exchanges for optimal price discovery and liquidity.
                                </p>
                            </div>

                            <div className="bg-black/60 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">High Performance</h3>
                                <p className="text-gray-400 text-sm">
                                    Fast order execution with direct API integration to minimize latency.
                                </p>
                            </div>

                            <div className="bg-black/60 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4">
                                    <Lock className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Secure Infrastructure</h3>
                                <p className="text-gray-400 text-sm">
                                    Enterprise-grade security with encrypted API connections and secure key management.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-16"
                        >
                            <h2 className="text-2xl font-bold text-white mb-8 text-center">Connected Exchanges</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {exchanges.map((exchange, idx) => (
                                    <motion.div
                                        key={exchange.name}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        className="bg-black/60 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl hover:bg-red-500/10 transition-all relative overflow-hidden"
                                    >
                                        <motion.div
                                            className="absolute inset-0 opacity-20"
                                            animate={{
                                                background: [
                                                    'radial-gradient(circle at 0% 0%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                                    'radial-gradient(circle at 100% 100%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                                    'radial-gradient(circle at 0% 0%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                                ],
                                            }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                        <div className="flex items-start gap-4 mb-4 relative z-10">
                                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                                <img src={exchange.logo} alt={exchange.name} className="w-8 h-8" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white mb-1">{exchange.name}</h3>
                                                <p className="text-gray-400 text-sm">{exchange.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                                            {exchange.features.map(feature => (
                                                <span key={feature} className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                        <a
                                            href={exchange.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors relative z-10"
                                        >
                                            Visit {exchange.name}
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-black/60 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden"
                        >
                            <motion.div
                                className="absolute inset-0 opacity-30"
                                animate={{
                                    background: [
                                        'radial-gradient(circle at 50% 50%, rgba(220,38,38,0.15) 0%, transparent 60%)',
                                        'radial-gradient(circle at 50% 50%, rgba(220,38,38,0.25) 0%, transparent 60%)',
                                        'radial-gradient(circle at 50% 50%, rgba(220,38,38,0.15) 0%, transparent 60%)',
                                    ],
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <h2 className="text-2xl font-bold text-white mb-4 relative z-10">Why Multiple Exchanges?</h2>
                            <div className="space-y-3 text-gray-300 relative z-10">
                                <p>
                                    <span className="text-red-400 font-semibold">• Liquidity Optimization:</span> Access deeper order books and better price execution across multiple venues.
                                </p>
                                <p>
                                    <span className="text-red-400 font-semibold">• Risk Distribution:</span> Diversify trading operations to reduce dependency on a single exchange.
                                </p>
                                <p>
                                    <span className="text-red-400 font-semibold">• Market Coverage:</span> Trade a wider range of assets and pairs available across different platforms.
                                </p>
                                <p>
                                    <span className="text-red-400 font-semibold">• Arbitrage Opportunities:</span> Capitalize on price differences between exchanges for better returns.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <Footer />
            </div>
    );
}