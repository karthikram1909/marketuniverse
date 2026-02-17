import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles } from 'lucide-react';

export default function MarketplaceUnlockedModal({ isOpen, onContinue }) {
    return (
        <Dialog open={isOpen} onOpenChange={onContinue}>
            <DialogContent className="bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-purple-900/95 backdrop-blur-xl border-2 border-purple-500/50 max-w-[90vw] sm:max-w-md md:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">Marketplace Unlocked</DialogTitle>
                <DialogDescription className="sr-only">You've unlocked the NFT Marketplace by completing Level 9</DialogDescription>
                
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl animate-pulse pointer-events-none" />
                
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="relative z-10 text-center py-4 sm:py-6 px-2 sm:px-4"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="mb-6"
                    >
                        <div className="relative inline-block">
                            <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-purple-400 mx-auto" />
                            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                            <motion.div
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-purple-500 rounded-full blur-xl"
                            />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4"
                    >
                        🎉 Marketplace Unlocked!
                    </motion.h2>

                    {/* Description */}
                    <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3 mb-6 sm:mb-8"
                    >
                        <p className="text-lg sm:text-xl text-purple-200">
                            Congratulations on completing <span className="text-cyan-400 font-bold">Level 9 (Poseidon)</span>!
                        </p>
                        <p className="text-base sm:text-lg text-gray-300">
                            You've unlocked access to the <span className="text-yellow-400 font-semibold">NFT Marketplace</span> where you can sell all your earned Trophy NFTs!
                        </p>
                        <div className="bg-black/30 rounded-xl p-4 mt-4">
                            <p className="text-sm text-gray-400">
                                You now have a choice to make...
                            </p>
                        </div>
                    </motion.div>

                    {/* Continue Button */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                    >
                        <Button
                            onClick={onContinue}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white text-base sm:text-lg py-4 sm:py-6 rounded-xl font-bold shadow-lg shadow-purple-500/30"
                        >
                            Continue
                        </Button>
                    </motion.div>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}