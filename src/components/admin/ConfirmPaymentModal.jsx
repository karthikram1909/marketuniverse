import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, X, DollarSign, Wallet, AlertTriangle, Hash, Receipt } from 'lucide-react';

export default function ConfirmPaymentModal({ isOpen, withdrawal, onConfirm, onCancel, isLoading }) {
    const [txHash, setTxHash] = useState('');

    if (!withdrawal) return null;

    const handleConfirm = () => {
        onConfirm(txHash);
        setTxHash('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-gradient-to-br from-[#1f2937] to-[#0f172a] border-2 border-green-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Confirm Payment</h3>
                                        <p className="text-sm text-gray-400">Mark withdrawal as paid</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onCancel}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Details */}
                            <div className="space-y-4 mb-6">
                                {/* Amount Breakdown */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Requested Amount</span>
                                        <span className="text-white font-medium">${withdrawal.amount.toFixed(2)}</span>
                                    </div>

                                    {withdrawal.penalty_amount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-red-400">Early Withdrawal Penalty (10%)</span>
                                            <span className="text-red-400 font-medium">-${withdrawal.penalty_amount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="w-4 h-4 text-green-400" />
                                            <span className="text-gray-400 font-bold">NET TO PAY</span>
                                        </div>
                                        <span className="text-2xl font-bold text-green-400">
                                            ${(withdrawal.net_amount || withdrawal.amount).toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-center text-gray-500 uppercase tracking-wider">Pay this exact amount in USDT</p>
                                </div>

                                {/* Payment Address */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wallet className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm text-gray-400">Recipient Wallet (BEP-20)</span>
                                    </div>
                                    <p className="text-white font-mono text-xs break-all bg-black/30 p-2 rounded border border-white/5">
                                        {withdrawal.payment_address}
                                    </p>
                                </div>

                                {/* TX Hash Input */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-gray-400">Transaction Hash (Optional)</span>
                                    </div>
                                    <Input
                                        value={txHash}
                                        onChange={(e) => setTxHash(e.target.value)}
                                        placeholder="0x..."
                                        className="bg-black/30 border-white/10 text-white font-mono text-xs"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Provide the BSC transaction hash for the user to track.</p>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-yellow-400 font-bold text-sm mb-1">Important</p>
                                        <p className="text-gray-300 text-xs leading-relaxed">
                                            This will mark the request as <span className="text-white font-bold">PAID</span> and notify the user.
                                            Ensure you have transferred the funds before confirming.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={onCancel}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="flex-1 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl font-bold"
                                >
                                    {isLoading ? 'Processing...' : 'Confirm Paid'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}