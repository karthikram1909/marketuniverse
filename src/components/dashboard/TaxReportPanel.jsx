import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import TaxReportModal from './TaxReportModal';

export default function TaxReportPanel({ walletAddress }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-black/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 overflow-hidden"
                style={{
                    boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.1)'
                }}
            >
                <motion.div 
                    className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-transparent rounded-full blur-3xl" 
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="flex items-center justify-between mb-6 relative z-10 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <motion.div 
                            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg"
                            animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <FileText className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Tax Report</h3>
                            <p className="text-sm text-gray-400">View your annual financial report</p>
                        </div>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-white rounded-xl shadow-lg border-2 border-emerald-400/30"
                        >
                            <motion.div
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                            </motion.div>
                            View Report
                        </Button>
                    </motion.div>
                </div>

                <motion.div 
                    className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20 relative z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <p className="text-sm text-white mb-3 font-semibold">
                        Your comprehensive financial report includes:
                    </p>
                    <ul className="text-sm text-gray-300 space-y-2">
                        {[
                            'All pool investments, deposits, and performance (Crypto, Traditional, VIP)',
                            'Staking contract details and earnings',
                            'Deal or No Deal game activity and XP',
                            'Complete withdrawal history',
                            'Detailed transaction timestamps',
                            'Fees and profit share breakdown'
                        ].map((item, idx) => (
                            <motion.li 
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                className="flex items-start gap-2"
                            >
                                <motion.span 
                                    className="text-emerald-400 mt-0.5"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                                >
                                    •
                                </motion.span>
                                {item}
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>

                <motion.p 
                    className="text-xs text-gray-500 mt-4 relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    * This report is for informational purposes only. Please consult with a tax professional for accurate tax filing.
                </motion.p>
            </motion.div>

            <TaxReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                walletAddress={walletAddress}
            />
        </>
    );
}