import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CaseRevealModal({ isOpen, caseNumber, amount, onComplete }) {
    const onCompleteRef = useRef(onComplete);
    
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);
    
    useEffect(() => {
        if (!isOpen || amount === null) return;
        
        // Display for 2.5 seconds then auto-close (only when amount is loaded)
        const timer = setTimeout(() => {
            onCompleteRef.current();
        }, 2500);

        return () => clearTimeout(timer);
    }, [isOpen, caseNumber, amount]);

    const formatAmount = (amt) => {
        if (amt >= 1000000) {
            return `$${(amt / 1000000).toFixed(1)}M`;
        }
        if (amt >= 1000) {
            return `$${(amt / 1000).toFixed(0)}k`;
        }
        return `$${amt.toFixed(2)}`;
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
                        transition={{ duration: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-[101] p-6"
                    >
                        <div className="relative bg-gradient-to-br from-red-900/40 via-black/90 to-orange-900/40 backdrop-blur-xl border-4 border-red-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-red-500/30">
                            {/* Content */}
                            <div className="relative z-10 text-center">
                                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-3">
                                        <TrendingDown className="w-5 h-5 text-red-400" />
                                        <span className="text-white font-bold">Case #{caseNumber}</span>
                                    </div>

                                    {/* Briefcase Image */}
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className="mb-4"
                                    >
                                        <img 
                                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/f9d1f57d9_image.png"
                                            alt="Briefcase"
                                            className="w-32 h-32 mx-auto object-contain"
                                        />
                                    </motion.div>

                                    <motion.div 
                                        key={amount}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className="bg-gradient-to-br from-red-500/30 to-orange-500/30 border-2 border-red-500 rounded-2xl p-4 mb-4"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <DollarSign className="w-6 h-6 text-red-300" />
                                            <div className="text-4xl font-bold text-white">
                                                {amount !== null ? formatAmount(amount) : '...'}
                                            </div>
                                        </div>
                                        <div className="text-gray-300 text-xs mt-1">Eliminated</div>
                                    </motion.div>

                                    {/* Progress Bar - only animate when amount is loaded */}
                                    {amount !== null && (
                                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: '100%' }}
                                                animate={{ width: '0%' }}
                                                transition={{ duration: 2.5, ease: 'linear' }}
                                                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                                            />
                                        </div>
                                    )}
                                </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}