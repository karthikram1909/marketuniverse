import React from 'react';
import { WalletProvider } from '../components/wallet/WalletContext';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { DollarSign, Lock } from 'lucide-react';

export default function PrintMoney() {
    return (
        <WalletProvider>
            <div className="min-h-screen bg-black relative overflow-hidden">
                {/* Animated Background */}
                <div className="fixed inset-0 pointer-events-none">
                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            background: [
                                'radial-gradient(circle at 20% 50%, rgba(34,197,94,0.15) 0%, transparent 50%)',
                                'radial-gradient(circle at 80% 50%, rgba(34,197,94,0.15) 0%, transparent 50%)',
                                'radial-gradient(circle at 20% 50%, rgba(34,197,94,0.15) 0%, transparent 50%)',
                            ],
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.5, 0.3, 0.5],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                </div>

                <Navbar />
                
                <div className="pt-32 pb-20 px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="mb-8">
                                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center border-2 border-green-500/50 relative">
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-green-500/30"
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.5, 0, 0.5],
                                        }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    <DollarSign className="w-16 h-16 text-green-400" />
                                </div>
                                <h1 className="text-5xl md:text-7xl font-bold mb-6 relative">
                                    <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent">
                                        Print Money
                                    </span>
                                    <motion.div
                                        className="absolute inset-0 blur-2xl opacity-30"
                                        animate={{
                                            textShadow: [
                                                '0 0 20px rgba(34,197,94,0.5)',
                                                '0 0 40px rgba(34,197,94,0.8)',
                                                '0 0 20px rgba(34,197,94,0.5)',
                                            ],
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        Print Money
                                    </motion.div>
                                </h1>
                                <p className="text-xl md:text-2xl text-gray-400 mb-8">
                                    Let's Play the Game Together!
                                </p>
                            </div>

                            <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-12 border border-green-500/30 relative overflow-hidden">
                                <motion.div
                                    className="absolute inset-0 opacity-20"
                                    animate={{
                                        background: [
                                            'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.15) 0%, transparent 60%)',
                                            'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.25) 0%, transparent 60%)',
                                            'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.15) 0%, transparent 60%)',
                                        ],
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <Lock className="w-16 h-16 text-green-400 mx-auto mb-6 relative z-10" />
                                <h2 className="text-3xl font-bold text-white mb-4 relative z-10">Coming Soon</h2>
                                <p className="text-gray-300 text-lg mb-6 relative z-10">
                                    Print Money is being developed to bring you an exciting new way to earn and play in the crypto space.
                                </p>
                                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 border border-green-500/50 relative z-10">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                    <span className="text-green-300 font-medium">Under Development</span>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="mt-16 grid md:grid-cols-3 gap-6"
                            >
                                <div className="bg-black/60 rounded-2xl p-6 border border-green-500/20 backdrop-blur-xl">
                                    <div className="text-4xl mb-4">💰</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Earn Rewards</h3>
                                    <p className="text-gray-400">Multiple ways to generate passive income</p>
                                </div>
                                <div className="bg-black/60 rounded-2xl p-6 border border-green-500/20 backdrop-blur-xl">
                                    <div className="text-4xl mb-4">🎮</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Play & Win</h3>
                                    <p className="text-gray-400">Gamified earning experience</p>
                                </div>
                                <div className="bg-black/60 rounded-2xl p-6 border border-green-500/20 backdrop-blur-xl">
                                    <div className="text-4xl mb-4">🚀</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Grow Wealth</h3>
                                    <p className="text-gray-400">Innovative wealth building tools</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                <Footer />
            </div>
        </WalletProvider>
    );
}