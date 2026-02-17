import React from 'react';
import { WalletProvider } from '../components/wallet/WalletContext';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { FileCheck, Clock } from 'lucide-react';

export default function Licenses() {
    return (
        <WalletProvider>
            <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">
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

                <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 relative z-10">
                    <div className="max-w-2xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Icon */}
                            <motion.div
                                className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-full mb-8"
                                animate={{
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <FileCheck className="w-12 h-12 text-red-400" />
                            </motion.div>

                            {/* Title */}
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
                                Licenses & Compliance
                            </h1>

                            {/* Coming Soon Badge */}
                            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-6 py-3 mb-6">
                                <Clock className="w-5 h-5 text-red-400" />
                                <span className="text-red-400 font-medium">Coming Soon</span>
                            </div>

                            {/* Description */}
                            <p className="text-gray-400 text-lg sm:text-xl leading-relaxed mb-8">
                                Our platform holds all necessary licenses and regulatory approvals to operate in full compliance with financial regulations.
                            </p>

                            <p className="text-gray-500 text-base">
                                Official license documentation and compliance certificates will be published here once received from regulatory authorities.
                            </p>
                        </motion.div>
                    </div>
                </div>

                <Footer />
            </div>
        </WalletProvider>
    );
}