import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Clock, Zap, Shield, TrendingUp, Users, Sparkles } from 'lucide-react';
import Navbar from '../components/landing/Navbar';

export default function BuyPMUCoin() {
    const [timeLeft, setTimeLeft] = useState({
        days: 60,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        // Set target date to 60 days from now
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 60);
        
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;
            
            if (distance > 0) {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            <Navbar />
            {/* Animated Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-black to-gray-900/20" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 pt-40 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl mx-auto text-center"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        className="mb-8 flex justify-center"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-gray-300 rounded-full blur-xl opacity-50 animate-pulse" />
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/70f67f1c8_image.png"
                                alt="PMU Coin Logo"
                                className="relative w-48 h-48 object-contain"
                            />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-6 relative"
                    >
                        <motion.h1
                            whileHover={{ scale: 1.05 }}
                            className="text-6xl md:text-8xl font-black tracking-wider relative"
                            style={{
                                WebkitTextStroke: '2px #F5C96A',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 0 30px rgba(245, 201, 106, 0.5), 0 0 60px rgba(245, 201, 106, 0.3)',
                                filter: 'drop-shadow(0 10px 20px rgba(245, 201, 106, 0.4))',
                                transform: 'perspective(500px) rotateX(10deg)',
                                overflow: 'hidden'
                            }}
                        >
                            <motion.span
                                className="relative inline-block"
                                animate={{
                                    textShadow: [
                                        '0 0 30px rgba(245, 201, 106, 0.5)',
                                        '0 0 50px rgba(245, 201, 106, 0.8)',
                                        '0 0 30px rgba(245, 201, 106, 0.5)',
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                PMU COIN
                                <motion.div
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(245,201,106,0.9) 50%, transparent 100%)',
                                        mixBlendMode: 'screen',
                                    }}
                                    animate={{
                                        x: ['-200%', '200%'],
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        repeatDelay: 1.5,
                                        ease: "linear"
                                    }}
                                />
                            </motion.span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-xs md:text-sm text-gray-400 mt-2 tracking-widest"
                        >
                            PLANITARXIS MARKETS UNIVERSE
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="mb-8"
                    >
                        <div className="inline-block bg-gradient-to-r from-yellow-500/20 to-gray-400/20 backdrop-blur-xl border border-yellow-500/30 rounded-full px-8 py-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                                <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
                                ICO PRESALE
                            </h2>
                        </div>
                    </motion.div>

                    {/* Countdown Timer */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mb-8"
                    >
                        <div className="flex justify-center gap-4">
                            <motion.div 
                                whileHover={{ scale: 1.1, y: -5 }}
                                className="bg-gradient-to-br from-yellow-500/20 to-gray-400/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-4 min-w-[100px]"
                            >
                                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                                    {timeLeft.days}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">DAYS</div>
                            </motion.div>
                            <motion.div 
                                whileHover={{ scale: 1.1, y: -5 }}
                                className="bg-gradient-to-br from-yellow-500/20 to-gray-400/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-4 min-w-[100px]"
                            >
                                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-gray-300 bg-clip-text text-transparent">
                                    {timeLeft.hours}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">HOURS</div>
                            </motion.div>
                            <motion.div 
                                whileHover={{ scale: 1.1, y: -5 }}
                                className="bg-gradient-to-br from-yellow-500/20 to-gray-400/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-4 min-w-[100px]"
                            >
                                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
                                    {timeLeft.minutes}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">MINUTES</div>
                            </motion.div>
                            <motion.div 
                                whileHover={{ scale: 1.1, y: -5 }}
                                className="bg-gradient-to-br from-yellow-500/20 to-gray-400/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-4 min-w-[100px]"
                            >
                                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-300 to-yellow-400 bg-clip-text text-transparent">
                                    {timeLeft.seconds}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">SECONDS</div>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="text-2xl md:text-3xl text-gray-300 mb-12"
                    >
                        Coming Soon
                    </motion.p>

                    {/* Features Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-12"
                    >
                        <motion.div 
                            whileHover={{ scale: 1.05, y: -10, rotateY: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 cursor-pointer"
                        >
                            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                                <Zap className="w-12 h-12 text-yellow-400 mb-4 mx-auto" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
                            <p className="text-gray-400">High-speed transactions on cutting-edge blockchain technology</p>
                        </motion.div>
                        <motion.div 
                            whileHover={{ scale: 1.05, y: -10, rotateY: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="bg-gradient-to-br from-gray-400/10 via-transparent to-transparent backdrop-blur-xl border border-gray-400/20 rounded-2xl p-6 cursor-pointer"
                        >
                            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                                <Shield className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-2">Secure & Trusted</h3>
                            <p className="text-gray-400">Military-grade security with audited smart contracts</p>
                        </motion.div>
                        <motion.div 
                            whileHover={{ scale: 1.05, y: -10, rotateY: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="bg-gradient-to-br from-yellow-600/10 via-transparent to-transparent backdrop-blur-xl border border-yellow-600/20 rounded-2xl p-6 cursor-pointer"
                        >
                            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                                <TrendingUp className="w-12 h-12 text-yellow-500 mb-4 mx-auto" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-2">High Potential</h3>
                            <p className="text-gray-400">Early investor benefits with exclusive rewards</p>
                        </motion.div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-r from-yellow-500/5 via-gray-500/5 to-yellow-600/5 backdrop-blur-2xl border border-yellow-500/20 rounded-3xl p-8 mb-12"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <motion.div whileHover={{ y: -5, scale: 1.05 }} transition={{ type: "spring" }}>
                                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                                    <Coins className="w-8 h-8 text-yellow-400 mb-2 mx-auto" />
                                </motion.div>
                                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-1">7,777,777</p>
                                <p className="text-gray-400">Total Supply</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -5, scale: 1.05 }} transition={{ type: "spring" }}>
                                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                                    <TrendingUp className="w-8 h-8 text-gray-300 mb-2 mx-auto" />
                                </motion.div>
                                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-gray-300 bg-clip-text text-transparent mb-1">$1B</p>
                                <p className="text-gray-400">Market Cap 1st Target</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -5, scale: 1.05 }} transition={{ type: "spring" }}>
                                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                                    <Sparkles className="w-8 h-8 text-yellow-500 mb-2 mx-auto" />
                                </motion.div>
                                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent mb-1">20%</p>
                                <p className="text-gray-400">Early Investor Bonus</p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.4 }}
                    >
                        <p className="text-xl text-gray-400 mb-6">
                            Be the first to know when we launch
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
                            <motion.div 
                                whileHover={{ scale: 1.1, y: -5 }}
                                className="bg-gradient-to-r from-yellow-500/10 to-gray-400/10 backdrop-blur-xl border border-yellow-500/30 rounded-full px-8 py-4 text-lg cursor-pointer"
                            >
                                <span className="bg-gradient-to-r from-yellow-400 to-gray-300 bg-clip-text text-transparent font-bold">Launching Q2 2026</span>
                            </motion.div>
                            <motion.button
                                whileHover={{ scale: 1.1, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-full px-8 py-4 text-lg shadow-lg shadow-yellow-500/50 transition-all"
                            >
                                Whitepaper
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Roadmap Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6 }}
                        className="mt-20"
                    >
                        <div className="flex items-center gap-3 mb-12 justify-center">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent max-w-xs" />
                            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-gray-300 to-yellow-400 bg-clip-text text-transparent">
                                ROADMAP
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent max-w-xs" />
                        </div>

                        <div className="relative max-w-5xl mx-auto">
                            {/* Timeline Line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500/30 via-gray-400/30 to-yellow-600/30 transform -translate-x-1/2 hidden md:block" />

                            {/* Roadmap Items */}
                            <div className="space-y-12">
                                {/* March 1st - White-paper Release */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="md:text-right">
                                        <div className="bg-gradient-to-br from-yellow-500/20 via-black/40 to-yellow-600/10 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-yellow-400 mb-2">White-paper Release</h3>
                                            <p className="text-gray-300 text-lg">March 1st 2026</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block" />
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-yellow-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-yellow-500/50" />
                                </motion.div>

                                {/* March 8th - Smart Contract */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="hidden md:block" />
                                    <div>
                                        <div className="bg-gradient-to-br from-gray-400/20 via-black/40 to-gray-500/10 backdrop-blur-xl border border-gray-400/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-gray-400/20 transition-all">
                                            <h3 className="text-2xl font-bold text-gray-300 mb-2">Smart Contract Deployment</h3>
                                            <p className="text-gray-400 text-lg">March 8th 2026</p>
                                        </div>
                                    </div>
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-400 rounded-full border-4 border-black hidden md:block shadow-lg shadow-gray-400/50" />
                                </motion.div>

                                {/* March 9th - Tokens Allocation */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="md:text-right">
                                        <div className="bg-gradient-to-br from-yellow-500/20 via-black/40 to-yellow-600/10 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-yellow-400 mb-2">Tokens Allocation Map Release</h3>
                                            <p className="text-gray-300 text-lg">March 9th 2026</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block" />
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-yellow-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-yellow-500/50" />
                                </motion.div>

                                {/* March 10th - Pre-sales Round 1 */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="hidden md:block" />
                                    <div>
                                        <div className="bg-gradient-to-br from-green-500/20 via-black/40 to-emerald-600/10 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-green-400 mb-2">Pre-sales Round 1</h3>
                                            <p className="text-gray-300 text-lg">March 10th - April 10th 2026</p>
                                            <p className="text-green-300 font-bold mt-2">🎁 Round Bonus 20%</p>
                                        </div>
                                    </div>
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-green-500/50" />
                                </motion.div>

                                {/* April 11th - Pre-sales Round 2 */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="md:text-right">
                                        <div className="bg-gradient-to-br from-cyan-500/20 via-black/40 to-blue-600/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-cyan-400 mb-2">Pre-sales Round 2</h3>
                                            <p className="text-gray-300 text-lg">April 11th - May 11th 2026</p>
                                            <p className="text-cyan-300 font-bold mt-2">🎁 Round Bonus 10%</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block" />
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-cyan-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-cyan-500/50" />
                                </motion.div>

                                {/* May 15th - Huge Partnerships */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="hidden md:block" />
                                    <div>
                                        <div className="bg-gradient-to-br from-purple-500/20 via-black/40 to-pink-600/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-purple-400 mb-2">Huge Partnerships Announcement</h3>
                                            <p className="text-gray-300 text-lg">May 15th 2026</p>
                                        </div>
                                    </div>
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-purple-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-purple-500/50" />
                                </motion.div>

                                {/* May 20th - DEX Listing */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="md:text-right">
                                        <div className="bg-gradient-to-br from-yellow-500/20 via-black/40 to-orange-600/10 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-yellow-400 mb-2">DEX Listing</h3>
                                            <p className="text-gray-300 text-lg">May 20th 2026</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block" />
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-yellow-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-yellow-500/50" />
                                </motion.div>

                                {/* June 22nd - CEX Listing */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="hidden md:block" />
                                    <div>
                                        <div className="bg-gradient-to-br from-orange-500/20 via-black/40 to-red-600/10 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-orange-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-orange-400 mb-2">CEX Listing Tier - 1</h3>
                                            <p className="text-gray-300 text-lg">June 22nd 2026</p>
                                        </div>
                                    </div>
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-orange-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-orange-500/50" />
                                </motion.div>

                                {/* June 30th - Betting System */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="md:text-right">
                                        <div className="bg-gradient-to-br from-red-500/20 via-black/40 to-pink-600/10 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-red-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-red-400 mb-2">Betting System Integration</h3>
                                            <p className="text-gray-300 text-lg">June 30th 2026</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block" />
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-red-500/50" />
                                </motion.div>

                                {/* July 24th - Bingo Lobby */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="hidden md:block" />
                                    <div>
                                        <div className="bg-gradient-to-br from-blue-500/20 via-black/40 to-cyan-600/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-blue-400 mb-2">Bingo Lobby Integration</h3>
                                            <p className="text-gray-300 text-lg">July 24th 2026</p>
                                        </div>
                                    </div>
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-blue-500/50" />
                                </motion.div>

                                {/* January 15th 2027 - Arbitrage System */}
                                <motion.div 
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="relative md:grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div className="md:text-right">
                                        <div className="bg-gradient-to-br from-yellow-500/20 via-black/40 to-gray-600/10 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all">
                                            <h3 className="text-2xl font-bold text-yellow-400 mb-2">Arbitrage System BETA</h3>
                                            <p className="text-gray-300 text-lg">January 15th 2027</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:block" />
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-yellow-500 rounded-full border-4 border-black hidden md:block shadow-lg shadow-yellow-500/50" />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Particles Effect */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(30)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-500 to-gray-300 rounded-full shadow-lg shadow-yellow-500/50"
                                initial={{
                                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                                    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                                    opacity: 0,
                                    scale: 0
                                }}
                                animate={{
                                    y: [null, -100],
                                    opacity: [0, 1, 0],
                                    scale: [0, 1.5, 0]
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}