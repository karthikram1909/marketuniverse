import React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../wallet/WalletContext';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CTASection() {
    const { account, connectWallet, isConnecting } = useWallet();

    return (
        <section className="relative py-24 px-6">
            <div className="absolute inset-0 bg-black" />
            
            <motion.div 
                className="absolute inset-0"
                animate={{ opacity: [0.5, 0.7, 0.5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, transparent 60%)',
                }}
            />
            
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={`cta-orb-${i}`}
                    className="absolute rounded-full"
                    style={{
                        width: `${Math.random() * 150 + 80}px`,
                        height: `${Math.random() * 150 + 80}px`,
                        background: i % 2 === 0 ? 'radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        x: [0, Math.random() * 70 - 35, 0],
                        y: [0, Math.random() * 70 - 35, 0],
                        opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative z-10 max-w-4xl mx-auto"
            >
                <div className="bg-gradient-to-br from-white/5 to-black/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-12 md:p-16 text-center overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-red-500/30 rounded-full px-4 py-2 mb-8">
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Sparkles className="w-4 h-4 text-red-400" />
                            </motion.div>
                            <span className="text-gray-300 text-sm">Start investing in seconds</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
                            Ready to Start Investing?
                        </h2>
                        <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-10 max-w-xl mx-auto px-4">
                            Connect your MetaMask wallet and unlock the full potential of decentralized finance.
                        </p>

                        {account ? (
                            <Link to={createPageUrl('Dashboard')}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative px-10 py-4 text-white text-lg font-bold rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10"
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
                                    <span className="relative z-10 flex items-center justify-center gap-3 font-semibold tracking-wide bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent whitespace-nowrap">
                                        Open Dashboard
                                        <ArrowRight className="w-5 h-5 text-white flex-shrink-0" />
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
                                className="relative px-10 py-4 text-white text-lg font-bold rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10"
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
                                <span className="relative z-10 flex items-center justify-center gap-3 font-semibold tracking-wide bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent whitespace-nowrap">
                                    <Wallet className="w-5 h-5 text-white flex-shrink-0" />
                                    {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                                    <ArrowRight className="w-5 h-5 text-white flex-shrink-0" />
                                </span>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dc2626]/20 to-transparent"
                                    style={{ transform: 'skewX(-20deg)' }}
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                                />
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>
        </section>
    );
}