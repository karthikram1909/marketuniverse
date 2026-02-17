import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CancelContractModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    contract, 
    penaltyRate, 
    penalty, 
    finalAmount,
    isLoading 
}) {
    if (!contract) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-gradient-to-br from-black via-red-950/20 to-black border-2 border-red-500/30 rounded-2xl p-6 shadow-2xl"
                            style={{ boxShadow: '0 20px 60px rgba(220, 38, 38, 0.3)' }}
                        >
                            {/* Animated glow */}
                            <motion.div
                                className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />

                            {/* Close button */}
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>

                            {/* Warning Icon */}
                            <div className="flex justify-center mb-4">
                                <motion.div
                                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                    className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border-2 border-red-500/50"
                                >
                                    <AlertTriangle className="w-8 h-8 text-red-400" />
                                </motion.div>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-white text-center mb-2 relative z-10">
                                Cancel Staking Contract?
                            </h2>
                            <p className="text-gray-400 text-center text-sm mb-6 relative z-10">
                                This action cannot be undone
                            </p>

                            {/* Contract Details */}
                            <div className="space-y-3 mb-6 relative z-10">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-400 text-sm">Contract Type</span>
                                        <span className="text-white font-bold">{contract.crypto_type} Staking</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Staked Amount</span>
                                        <span className="text-white font-bold">
                                            {(contract.staked_amount || 0).toFixed(6)} {contract.crypto_type}
                                        </span>
                                    </div>
                                </div>

                                {/* Warning Box */}
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                    <div className="flex items-start gap-2 mb-3">
                                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-red-400 font-semibold text-sm">Early Cancellation Penalty</p>
                                            <p className="text-gray-400 text-xs mt-1">
                                                You will lose {(penaltyRate * 100).toFixed(0)}% of your earnings
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Total Earned</span>
                                            <span className="text-white">
                                                {(contract.total_earned || 0).toFixed(6)} {contract.crypto_type}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Penalty ({(penaltyRate * 100).toFixed(0)}%)</span>
                                            <span className="text-red-400 font-bold">
                                                -{penalty.toFixed(6)} {contract.crypto_type}
                                            </span>
                                        </div>
                                        <div className="h-px bg-white/10 my-2" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-semibold">You Will Receive</span>
                                            <span className="text-green-400 font-bold text-base">
                                                {finalAmount.toFixed(6)} {contract.crypto_type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 relative z-10">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1"
                                >
                                    <Button
                                        onClick={onClose}
                                        disabled={isLoading}
                                        className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-xl py-6"
                                    >
                                        Keep Staking
                                    </Button>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1"
                                >
                                    <Button
                                        onClick={onConfirm}
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 text-white border-0 rounded-xl py-6 font-bold"
                                    >
                                        {isLoading ? 'Cancelling...' : 'Cancel Contract'}
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}