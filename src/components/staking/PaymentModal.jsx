import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function PaymentModal({ isOpen, type, message, onClose }) {
    const config = {
        success: {
            icon: CheckCircle,
            iconColor: 'text-green-400',
            bgGradient: 'from-green-500/20 to-emerald-500/20',
            borderColor: 'border-green-500/30',
            title: 'Success!',
            buttonClass: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90'
        },
        error: {
            icon: XCircle,
            iconColor: 'text-red-400',
            bgGradient: 'from-red-500/20 to-orange-500/20',
            borderColor: 'border-red-500/30',
            title: 'Error',
            buttonClass: 'bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90'
        },
        processing: {
            icon: Loader2,
            iconColor: 'text-blue-400',
            bgGradient: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30',
            title: 'Processing...',
            buttonClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90',
            spinning: true
        },
        warning: {
            icon: AlertCircle,
            iconColor: 'text-yellow-400',
            bgGradient: 'from-yellow-500/20 to-orange-500/20',
            borderColor: 'border-yellow-500/30',
            title: 'Warning',
            buttonClass: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90'
        }
    };

    const currentConfig = config[type] || config.success;
    const Icon = currentConfig.icon;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99998]"
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] w-full max-w-md px-4"
                        style={{ position: 'fixed' }}
                    >
                        <div className="bg-gradient-to-br from-[#1f2937] to-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Icon Header */}
                            <div className={`bg-gradient-to-r ${currentConfig.bgGradient} border-b ${currentConfig.borderColor} p-8 flex flex-col items-center justify-center`}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                    className={`w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border ${currentConfig.borderColor} flex items-center justify-center mb-4`}
                                >
                                    <Icon 
                                        className={`w-10 h-10 ${currentConfig.iconColor} ${currentConfig.spinning ? 'animate-spin' : ''}`}
                                    />
                                </motion.div>
                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-2xl font-bold text-white"
                                >
                                    {currentConfig.title}
                                </motion.h3>
                            </div>

                            {/* Content */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="p-6"
                            >
                                <p className="text-gray-300 text-center leading-relaxed">
                                    {message}
                                </p>
                            </motion.div>

                            {/* Action Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/5 border-t border-white/10 p-6"
                            >
                                <Button
                                    onClick={onClose}
                                    className={`w-full ${currentConfig.buttonClass} text-white border-0 rounded-xl py-6 text-lg font-semibold`}
                                >
                                    {type === 'processing' ? 'Close' : 'Got it'}
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}