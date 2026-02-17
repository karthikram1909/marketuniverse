import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PurchaseProcessModal({ isOpen, packageData, status }) {
    const getStatusConfig = () => {
        switch (status) {
            case 'confirming':
                return {
                    icon: Loader2,
                    iconClass: 'text-blue-400 animate-spin',
                    title: 'Confirm Transaction',
                    description: 'Please confirm the transaction in your MetaMask wallet'
                };
            case 'processing':
                return {
                    icon: Loader2,
                    iconClass: 'text-purple-400 animate-spin',
                    title: 'Processing Transaction',
                    description: 'Your transaction is being confirmed on the blockchain...'
                };
            case 'success':
                return {
                    icon: CheckCircle2,
                    iconClass: 'text-green-400',
                    title: 'Purchase Successful!',
                    description: 'Your lesson package has been purchased successfully'
                };
            case 'error':
                return {
                    icon: AlertCircle,
                    iconClass: 'text-red-400',
                    title: 'Transaction Failed',
                    description: 'Your transaction could not be completed'
                };
            default:
                return {
                    icon: Loader2,
                    iconClass: 'text-gray-400 animate-spin',
                    title: 'Preparing...',
                    description: 'Preparing your transaction...'
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="bg-[#1a1f2e] border-purple-500/50 max-w-md" hideClose>
                <div className="py-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={status}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="text-center"
                        >
                            {/* Icon */}
                            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                <Icon className={`w-10 h-10 ${config.iconClass}`} />
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-bold text-white mb-2">{config.title}</h3>
                            <p className="text-gray-400 mb-6">{config.description}</p>

                            {/* Package Info */}
                            {packageData && (
                                <div className="bg-[#0f1420] rounded-xl p-4 border border-white/10 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Package</span>
                                        <span className="text-white font-semibold">{packageData.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm">Amount</span>
                                        <span className="text-purple-400 font-bold text-lg">{packageData.price} USDT</span>
                                    </div>
                                </div>
                            )}

                            {/* Progress Steps */}
                            <div className="space-y-3">
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${status === 'confirming' || status === 'processing' || status === 'success' ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-[#0f1420] border border-white/10'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'confirming' || status === 'processing' || status === 'success' ? 'bg-purple-500' : 'bg-gray-600'}`}>
                                        {status === 'confirming' ? (
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <span className="text-white text-sm font-medium">Wallet Confirmation</span>
                                </div>

                                <div className={`flex items-center gap-3 p-3 rounded-lg ${status === 'processing' || status === 'success' ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-[#0f1420] border border-white/10'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'processing' ? 'bg-purple-500' : status === 'success' ? 'bg-green-500' : 'bg-gray-600'}`}>
                                        {status === 'processing' ? (
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        ) : status === 'success' ? (
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        ) : (
                                            <span className="text-white text-xs">2</span>
                                        )}
                                    </div>
                                    <span className="text-white text-sm font-medium">Blockchain Confirmation</span>
                                </div>

                                <div className={`flex items-center gap-3 p-3 rounded-lg ${status === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-[#0f1420] border border-white/10'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'success' ? 'bg-green-500' : 'bg-gray-600'}`}>
                                        {status === 'success' ? (
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        ) : (
                                            <span className="text-white text-xs">3</span>
                                        )}
                                    </div>
                                    <span className="text-white text-sm font-medium">Purchase Complete</span>
                                </div>
                            </div>

                            {/* Success Message */}
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl"
                                >
                                    <p className="text-green-400 text-sm">
                                        Our team will contact you within 24 hours to schedule your lessons.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}