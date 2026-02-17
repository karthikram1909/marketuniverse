import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wallet, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InsufficientBalanceModal({ isOpen, onClose, currentBalance, requiredAmount, packageName }) {
    const difference = requiredAmount - currentBalance;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1f2e] border-red-500/50 max-w-md">
                <DialogHeader>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center"
                    >
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </motion.div>
                    <DialogTitle className="text-white text-xl text-center">Insufficient USDT Balance</DialogTitle>
                    <DialogDescription className="text-gray-400 text-center">
                        You don't have enough USDT to purchase this lesson package
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Package Info */}
                    <div className="bg-[#0f1420] rounded-xl p-4 border border-white/10">
                        <p className="text-gray-400 text-sm mb-1">Selected Package</p>
                        <p className="text-white font-semibold">{packageName}</p>
                    </div>

                    {/* Balance Overview */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[#0f1420] rounded-lg border border-white/10">
                            <span className="text-gray-400 text-sm">Your Balance</span>
                            <span className="text-white font-semibold">{currentBalance.toFixed(2)} USDT</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#0f1420] rounded-lg border border-white/10">
                            <span className="text-gray-400 text-sm">Required Amount</span>
                            <span className="text-white font-semibold">{requiredAmount.toFixed(2)} USDT</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                            <span className="text-red-400 text-sm font-medium">You Need</span>
                            <span className="text-red-400 font-bold">{difference.toFixed(2)} USDT More</span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                            <Wallet className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-white font-semibold mb-1">How to Add USDT</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    Purchase USDT (BEP-20) on Binance, Coinbase, or any crypto exchange, then transfer it to your MetaMask wallet on the BNB Smart Chain network.
                                </p>
                            </div>
                        </div>
                        <a 
                            href="https://www.binance.com/en/how-to-buy/usd-coin" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                        >
                            Learn how to buy USDT
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={onClose}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white border-0"
                        >
                            Refresh Balance
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}