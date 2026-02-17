import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteMessageModal({ isOpen, onClose, onConfirm, isLoading }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-6"
                    >
                        <div className="bg-gradient-to-br from-[#1f2937] to-[#0f172a] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-red-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Delete Message</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-gray-300 mb-6">
                                Are you sure you want to delete this support message? This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    className="flex-1 border-white/10 text-gray-300 hover:bg-white/5"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                >
                                    {isLoading ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}