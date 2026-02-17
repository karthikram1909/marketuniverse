import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessModal({ isOpen, onClose, title, message }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative bg-gradient-to-br from-green-500/20 via-black to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 max-w-md w-full overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-50" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-block p-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-6"
                        >
                            <CheckCircle className="w-12 h-12 text-white" />
                        </motion.div>
                        
                        <h3 className="text-3xl font-bold text-white mb-4">{title}</h3>
                        <p className="text-gray-300 mb-8 text-lg">{message}</p>
                        
                        <Button
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl py-6 text-lg font-bold"
                        >
                            Got it!
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}