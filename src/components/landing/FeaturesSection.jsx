import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
    Layers, 
    LineChart, 
    Shield, 
    Zap, 
    Coins, 
    Lock 
} from 'lucide-react';

const features = [
    {
        icon: Layers,
        title: 'Multi-Chain Support',
        description: 'Trade across Ethereum, Polygon, BSC, Arbitrum, and more with seamless bridging.',
        gradient: 'from-cyan-500 to-blue-500'
    },
    {
        icon: LineChart,
        title: 'Daily Trading',
        description: 'Real-time charts, portfolio tracking, and AI-powered market insights.',
        gradient: 'from-blue-500 to-purple-500'
    },
    {
        icon: Shield,
        title: 'Bank-Grade Security',
        description: 'Multi-sig wallets, audited contracts, and 24/7 monitoring systems.',
        gradient: 'from-purple-500 to-pink-500'
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Sub-second execution with MEV protection and optimal routing.',
        gradient: 'from-orange-500 to-red-500'
    },
    {
        icon: Coins,
        title: 'Staking',
        description: 'Stake your crypto assets and earn compounding APY with flexible lock periods.',
        gradient: 'from-green-500 to-cyan-500'
    },
    {
        icon: Lock,
        title: 'Non-Custodial',
        description: 'Your keys, your crypto. Full control over your assets at all times.',
        gradient: 'from-pink-500 to-rose-500'
    }
];

export default function FeaturesSection() {
    return (
        <section id="features" className="relative py-24 px-6">
                    <div className="absolute inset-0 bg-black" />

                    {/* Red Energy Gradient */}
                    <motion.div 
                        className="absolute inset-0"
                        animate={{ opacity: [0.4, 0.6, 0.4] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.1) 0%, transparent 70%)',
                        }}
                    />

                    {/* Floating Orbs */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={`feature-orb-${i}`}
                            className="absolute rounded-full"
                            style={{
                                width: `${Math.random() * 100 + 50}px`,
                                height: `${Math.random() * 100 + 50}px`,
                                background: i % 2 === 0 ? 'radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                                filter: 'blur(40px)',
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                x: [0, Math.random() * 50 - 25, 0],
                                y: [0, Math.random() * 50 - 25, 0],
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: Math.random() * 10 + 10,
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
                    className="text-center mb-16"
                >
                    <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase mb-4 block">
                        Why Choose Us
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
                        Built for Serious Investors
                    </h2>
                    <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
                        Professional-grade tools and infrastructure designed for both retail and institutional investors.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.03, y: -8 }}
                            className="group relative"
                        >
                            <motion.div 
                                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-xl rounded-2xl transition-opacity duration-500`}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <div className={`relative h-full bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-white/30 hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                                index === 0 ? 'led-glow-cyan' : 
                                index === 1 ? 'led-glow-blue' : 
                                index === 2 ? 'led-glow-purple' : 
                                index === 3 ? 'led-glow-red' : 
                                index === 4 ? 'led-glow-green' : 
                                'led-glow-gold'
                            }`}>
                                <motion.div 
                                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6 shadow-lg`}
                                    whileHover={{ rotate: [0, -10, 10, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="w-full h-full rounded-2xl bg-[#0a0f1a] flex items-center justify-center">
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>
                                </motion.div>
                                <h3 className="text-xl font-bold text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}