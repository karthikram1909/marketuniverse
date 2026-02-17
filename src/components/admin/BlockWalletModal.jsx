import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BlockWalletModal({ isOpen, onClose, onConfirm, walletAddress, isLoading }) {
    return (
        <Dialog open={isOpen} modal={true}>
            <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-red-500/50 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-red-400">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                        >
                            <AlertTriangle className="w-6 h-6" />
                        </motion.div>
                        Block Wallet
                    </DialogTitle>
                    <DialogDescription className="text-gray-300 pt-4">
                        <div className="space-y-4">
                            <p className="text-base">
                                Are you sure you want to block this wallet address?
                            </p>
                            
                            <div className="bg-black/40 rounded-lg p-4 border border-red-500/30">
                                <p className="text-xs text-gray-400 mb-2">Wallet Address:</p>
                                <p className="text-white font-mono text-sm break-all">
                                    {walletAddress}
                                </p>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <p className="text-red-400 text-xs">
                                    <strong>Warning:</strong> This wallet will be prevented from making deposits, 
                                    withdrawals, and all platform transactions.
                                </p>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-3 mt-6">
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        disabled={isLoading}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 text-white border-0"
                    >
                        {isLoading ? 'Blocking...' : 'Block Wallet'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}