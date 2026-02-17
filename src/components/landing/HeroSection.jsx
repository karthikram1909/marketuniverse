import React from 'react';
import { useWallet } from '../wallet/WalletContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wallet, TrendingUp, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '../common/Logo';


export default function HeroSection() {
    const { account, connectWallet, isConnecting } = useWallet();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-40 sm:pt-32 pb-20 px-6">
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
            {[...Array(12)].map((_, i) => (
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



            <div className="relative z-10 max-w-6xl mx-auto text-center">
                {/* Logo */}
                <div className="flex justify-center mb-2">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 lg:w-[576px] lg:h-[576px] relative flex items-center justify-center">
                        {/* Pulsing Golden Energy Waves */}
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={`wave-${i}`}
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: '2px solid rgba(245,201,106,0.3)',
                                    borderRadius: '50%',
                                }}
                                animate={{
                                    scale: [1, 2, 1],
                                    opacity: [0.5, 0, 0.5],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                    delay: i * 1.3
                                }}
                            />
                        ))}
                        <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/db7c6aec3_image.png"
                            alt="MarketsUniverse Logo"
                            className="w-full h-full object-contain relative z-10"
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-full px-4 py-2 mb-8">
                        <motion.div 
                            className="w-2 h-2 rounded-full bg-red-500"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-gray-300 text-sm">Live Trading • 24/7 Markets</span>
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 tracking-tight"
                >
                    <div className="relative mb-8">
                        {/* Horizontal laser scanner for Pool Trading */}
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(192,192,192,0.6) 50%, transparent 100%)',
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
                        <span style={{
                            color: 'transparent',
                            WebkitTextStroke: '2px white',
                            textShadow: '0 0 30px rgba(255,255,255,0.4)'
                        }}>
                            Pool Trading
                        </span>
                        {/* Vertical laser beams */}
                        {[...Array(11)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute top-0 bottom-0"
                                style={{
                                    left: `${i * 9}%`,
                                    width: '2px',
                                    background: 'linear-gradient(to bottom, transparent, rgba(192,192,192,0.8), transparent)',
                                    filter: 'blur(1px)'
                                }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scaleY: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                    <div className="relative">
                        {/* Horizontal laser scanner for Together We Trade */}
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
                        <motion.span 
                            animate={{ 
                                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            style={{
                                color: 'transparent',
                                WebkitTextStroke: '2px #dc2626',
                                textShadow: '0 0 30px rgba(220,38,38,0.6)'
                            }}
                        >
                            Together We Trade
                        </motion.span>
                        {/* Vertical laser beams */}
                        {[...Array(17)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute top-0 bottom-0"
                                style={{
                                    left: `${i * 5.8}%`,
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
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed px-4"
                >
                    Join our investment pools where we trade collectively. Professional strategies across crypto and traditional markets with transparent performance tracking.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    {account ? (
                        <Link to={createPageUrl('Dashboard')}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative px-8 py-4 text-white text-lg font-bold rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 w-full sm:w-auto"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)' }} />
                                <motion.div
                                    className="absolute inset-0 rounded-2xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(220,38,38,0.4), rgba(255,255,255,0.3))',
                                        filter: 'blur(10px)',
                                        zIndex: -1
                                    }}
                                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <span className="relative z-10 flex items-center justify-center gap-3 font-semibold tracking-wide bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent">
                                    Go to Dashboard
                                    <ArrowRight className="w-5 h-5 text-white" />
                                </span>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dc2626]/20 to-transparent"
                                    style={{ transform: 'skewX(-20deg)' }}
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                                />
                            </motion.button>
                        </Link>
                    ) : (
                        <motion.button
                            onClick={connectWallet}
                            disabled={isConnecting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative px-8 py-4 text-white text-lg font-bold rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 w-full sm:w-auto"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)'
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)' }} />
                            <motion.div
                                className="absolute inset-0 rounded-2xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(220,38,38,0.4), rgba(255,255,255,0.3))',
                                    filter: 'blur(10px)',
                                    zIndex: -1
                                }}
                                animate={{ opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <span className="relative z-10 flex items-center justify-center gap-3 font-semibold tracking-wide bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent">
                                <Wallet className="w-5 h-5 text-white" />
                                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                                <ArrowRight className="w-5 h-5 text-white" />
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dc2626]/20 to-transparent"
                                style={{ transform: 'skewX(-20deg)' }}
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                            />
                        </motion.button>
                    )}
                    <Link to={createPageUrl('Documentation')}>
                        <Button 
                            size="lg"
                            variant="outline"
                            className="bg-black/50 backdrop-blur-xl border-white/20 text-white hover:text-red-500 hover:bg-black/70 hover:border-red-500 rounded-xl px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto transition-all"
                        >
                            Learn More
                        </Button>
                    </Link>
                    <Link to={createPageUrl('FinancialHealth')}>
                        <Button 
                            size="lg"
                            variant="outline"
                            className="bg-black/50 backdrop-blur-xl border-white/20 text-white hover:text-red-500 hover:bg-black/70 hover:border-red-500 rounded-xl px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto transition-all"
                        >
                            About Us
                        </Button>
                    </Link>
                </motion.div>


            </div>
        </section>
    );
}