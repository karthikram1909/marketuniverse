import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DollarSign, Trophy, AlertCircle } from 'lucide-react';

export default function SellOrContinueModal({ isOpen, nftPrices, playerTrophies, onSell, onContinue }) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate total BTC and USDT value
    const calculateTotal = () => {
        const btcPriceMap = {
            0: 0.000011,
            1: 0.000033,
            2: 0.000056,
            3: 0.00010,
            4: 0.00016,
            5: 0.00022,
            6: 0.00033,
            7: 0.00045,
            8: 0.00072,
            9: 0.0011
        };

        let totalBTC = 0;
        let totalUSDT = 0;

        playerTrophies.forEach(trophy => {
            if (trophy.trophy_level <= 9) {
                const btcPrice = btcPriceMap[trophy.trophy_level];
                totalBTC += btcPrice;
                totalUSDT += parseFloat(nftPrices[`level${trophy.trophy_level}`] || 0);
            }
        });

        return { totalBTC, totalUSDT };
    };

    const { totalBTC, totalUSDT } = calculateTotal();

    const handleSell = async () => {
        setIsProcessing(true);
        await onSell();
        setIsProcessing(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onContinue}>
            <DialogContent className="bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl border-2 border-purple-500/50 max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">Make Your Choice</DialogTitle>
                <DialogDescription className="sr-only">Choose to sell your NFTs or continue playing for 1 BTC</DialogDescription>
                
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="relative z-10 py-4"
                >
                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
                        Make Your Choice
                    </h2>

                    {/* Two Options */}
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                        {/* Option 1: Sell NFTs */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-4 sm:p-6"
                        >
                            <div className="flex items-center gap-2 sm:gap-3 mb-4">
                                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
                                <h3 className="text-xl sm:text-2xl font-bold text-white">Sell NFTs</h3>
                            </div>
                            <div className="space-y-3 mb-4 sm:mb-6">
                                <p className="text-gray-300 text-xs sm:text-sm">
                                    Sell all your Trophy NFTs (Levels 0-9) at current marketplace prices:
                                </p>
                                <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                                    <p className="text-green-400 text-xl sm:text-2xl font-bold">
                                        {totalBTC.toFixed(6)} BTC
                                    </p>
                                    <p className="text-gray-400 text-xs sm:text-sm">
                                        ≈ ${totalUSDT.toLocaleString()} USDT
                                    </p>
                                </div>
                                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 sm:p-3">
                                    <p className="text-red-300 text-xs flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>You will restart from Level 0 and marketplace will lock again until you reach Level 9</span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleSell}
                                disabled={isProcessing}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white font-bold py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                            >
                                {isProcessing ? 'Processing...' : 'Sell All NFTs'}
                            </Button>
                        </motion.div>

                        {/* Option 2: Continue for 1 BTC */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl p-4 sm:p-6"
                        >
                            <div className="flex items-center gap-2 sm:gap-3 mb-4">
                                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                                <h3 className="text-xl sm:text-2xl font-bold text-white">Continue</h3>
                            </div>
                            <div className="space-y-3 mb-4 sm:mb-6">
                                <p className="text-gray-300 text-xs sm:text-sm">
                                    Keep your NFTs and continue playing for the ultimate reward:
                                </p>
                                <div className="bg-black/40 rounded-lg p-3 sm:p-4">
                                    <p className="text-yellow-400 text-2xl sm:text-3xl font-bold">
                                        1 BTC
                                    </p>
                                    <p className="text-gray-400 text-xs sm:text-sm">
                                        Complete Level 13 (Zeus Complete)
                                    </p>
                                </div>
                                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2 sm:p-3">
                                    <p className="text-yellow-300 text-xs flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>Marketplace stays locked but you can claim 1 BTC at Level 13!</span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={onContinue}
                                disabled={isProcessing}
                                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:opacity-90 text-white font-bold py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                            >
                                Continue for 1 BTC
                            </Button>
                        </motion.div>
                    </div>

                    {/* Info */}
                    <div className="space-y-3">
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 sm:p-4">
                            <p className="text-gray-300 text-xs sm:text-sm text-center">
                                <span className="text-purple-400 font-semibold">Important:</span> You can sell your NFTs each time you reach Level 9. This decision only affects your current progression.
                            </p>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 sm:p-4">
                            <p className="text-orange-300 text-xs sm:text-sm text-center">
                                <span className="text-orange-400 font-semibold">XP Reduction:</span> Risk XP rewards reduced by 75% (25 XP per banker refusal instead of 100 XP). Maximum 200 XP from refusals through Level 9-13.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}