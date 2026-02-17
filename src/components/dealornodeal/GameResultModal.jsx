import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Trophy, DollarSign, TrendingUp, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';

export default function GameResultModal({ isOpen, onClose, winnings, xpEarned, dealAccepted }) {
    useEffect(() => {
        if (!isOpen) return;
        
        // Trigger confetti
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const confettiInterval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                clearInterval(confettiInterval);
                return;
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => {
            clearInterval(confettiInterval);
        };
    }, [isOpen]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-[#f5c96a] max-w-[90vw] sm:max-w-md md:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">Game Results</DialogTitle>
                <DialogDescription className="sr-only">Your game has ended - view your winnings and XP earned</DialogDescription>
                <Button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full w-8 h-8 p-0 bg-white/10 hover:bg-white/20 border border-white/20 z-50"
                >
                    <X className="w-4 h-4 text-white" />
                </Button>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="text-center py-4 sm:py-6 px-2 sm:px-4"
                >
                    {/* Trophy Icon */}
                    <motion.div
                        initial={{ rotate: -10, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="flex justify-center mb-4 sm:mb-6"
                    >
                        <div className="relative">
                            <Trophy className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-[#f5c96a]" />
                            <motion.div
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-[#f5c96a] rounded-full blur-xl"
                            />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2"
                    >
                        {dealAccepted ? '🤝 Deal Accepted!' : '🎉 Game Complete!'}
                    </motion.h2>

                    <motion.p
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6"
                    >
                        Congratulations on finishing the game!
                    </motion.p>

                    {/* Winnings Display */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6"
                    >
                        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                            <span className="text-gray-400 text-sm sm:text-base md:text-lg">Your Winnings</span>
                        </div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                            className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-400 break-words"
                        >
                            {formatCurrency(winnings)}
                        </motion.div>
                    </motion.div>

                    {/* XP Earned */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="bg-white/5 border border-cyan-500/30 rounded-lg sm:rounded-xl p-4 sm:p-6"
                    >
                        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                            <span className="text-sm sm:text-base text-gray-400">XP Earned:</span>
                            <span className="text-xl sm:text-2xl font-bold text-cyan-400">+{xpEarned} XP</span>
                        </div>
                    </motion.div>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}