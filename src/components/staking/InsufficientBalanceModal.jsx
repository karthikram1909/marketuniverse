import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';

export default function InsufficientBalanceModal({ isOpen, onClose, cryptoType, requiredAmount, currentBalance }) {
    if (!isOpen) return null;

    const content = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-gradient-to-br from-[#1f2937] to-[#0f172a] border border-red-500/50 rounded-2xl p-8 max-w-md w-full relative shadow-2xl"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Icon */}
                            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10 text-red-400" />
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-white text-center mb-3">
                                Insufficient Balance
                            </h2>

                            {/* Message */}
                            <div className="space-y-4 mb-6">
                                <p className="text-gray-300 text-center">
                                    Your wallet doesn't have enough <span className="text-white font-bold">{cryptoType}</span> to complete this staking transaction.
                                </p>

                                {/* Balance Info */}
                                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Required Amount:</span>
                                        <span className="text-white font-bold">{requiredAmount} {cryptoType}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Your Balance:</span>
                                        <span className="text-red-400 font-bold">{currentBalance} {cryptoType}</span>
                                    </div>
                                    <div className="border-t border-white/10 pt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400 text-sm">Missing:</span>
                                            <span className="text-red-400 font-bold">
                                                {(requiredAmount - currentBalance).toFixed(6)} {cryptoType}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Wallet className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-white font-semibold mb-1 text-sm">What to do:</h4>
                                            <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                                                <li>Add more {cryptoType} to your wallet</li>
                                                <li>Make sure you're on BNB Smart Chain (BSC)</li>
                                                <li>Try staking a smaller amount</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <Button
                                onClick={onClose}
                                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 text-white border-0 rounded-xl py-6"
                            >
                                Got it
                            </Button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
}