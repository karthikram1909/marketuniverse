import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, TrendingUp } from 'lucide-react';

const SCATTER_AMOUNTS = [0.50, 1, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50];

export default function ScatterModal({ isOpen, onComplete, consecutiveWins = 3 }) {
    const [boxAmounts, setBoxAmounts] = useState([]);
    const [selectedBoxes, setSelectedBoxes] = useState([]);
    const [revealedBoxes, setRevealedBoxes] = useState([]);
    const [stage, setStage] = useState('intro'); // intro, picking, revealing, result
    const [totalWinnings, setTotalWinnings] = useState(0);

    useEffect(() => {
        if (isOpen) {
            // Shuffle amounts
            const shuffled = [...SCATTER_AMOUNTS].sort(() => Math.random() - 0.5);
            setBoxAmounts(shuffled);
            setSelectedBoxes([]);
            setRevealedBoxes([]);
            setStage('intro');
            setTotalWinnings(0);
        }
    }, [isOpen]);

    const handleBoxClick = (boxIndex) => {
        if (stage !== 'picking') return;
        if (selectedBoxes.includes(boxIndex)) {
            setSelectedBoxes(prev => prev.filter(i => i !== boxIndex));
        } else if (selectedBoxes.length < 3) {
            setSelectedBoxes(prev => [...prev, boxIndex]);
        }
    };

    const handleConfirmSelection = async () => {
        setStage('revealing');
        
        // Reveal boxes one by one
        for (let i = 0; i < selectedBoxes.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setRevealedBoxes(prev => [...prev, selectedBoxes[i]]);
        }

        // Calculate total
        const total = selectedBoxes.reduce((sum, idx) => sum + boxAmounts[idx], 0);
        setTotalWinnings(total);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStage('result');
    };

    const handleFinish = () => {
        onComplete({
            boxesPicked: selectedBoxes,
            boxAmounts,
            totalWinnings
        });
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent className="max-w-4xl bg-gradient-to-br from-purple-900/95 to-pink-900/95 border-2 border-yellow-400/50 p-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-purple-500/10 pointer-events-none" />
                
                {/* Stage: Intro */}
                {stage === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative p-8 text-center"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-24 h-24 mx-auto mb-6"
                        >
                            <Sparkles className="w-24 h-24 text-yellow-400" />
                        </motion.div>
                        <h2 className="text-4xl font-bold text-yellow-400 mb-4">
                            🎉 SCATTER BONUS UNLOCKED! 🎉
                        </h2>
                        <p className="text-white text-xl mb-6">
                            You hit <span className="text-yellow-400 font-bold">$1,000,000</span> {consecutiveWins} {consecutiveWins === 1 ? 'time' : 'times'} in a row!
                        </p>
                        <div className="bg-black/40 rounded-xl p-6 mb-6">
                            <p className="text-white text-center">
                                <span className="text-cyan-400 font-bold">Note:</span> Pick 3 boxes - Win the total amount inside!
                            </p>
                        </div>
                        <Button
                            onClick={() => setStage('picking')}
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:opacity-90 font-bold text-lg px-8 py-6"
                        >
                            <Gift className="w-6 h-6 mr-2" />
                            Start Picking!
                        </Button>
                    </motion.div>
                )}

                {/* Stage: Picking */}
                {stage === 'picking' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative p-8"
                    >
                        <h3 className="text-3xl font-bold text-yellow-400 text-center mb-2">
                            Pick 3 Boxes
                        </h3>
                        <p className="text-white text-center mb-6">
                            Selected: {selectedBoxes.length}/3
                        </p>

                        <div className="grid grid-cols-5 gap-4 mb-6">
                            {boxAmounts.map((_, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <motion.div 
                                        animate={{
                                            background: [
                                                'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.9) 100%)',
                                                'linear-gradient(135deg, rgba(10,10,10,0.9) 0%, rgba(40,40,40,0.8) 100%)',
                                                'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.9) 100%)',
                                            ]
                                        }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="px-4 py-2 rounded-lg backdrop-blur-xl border border-white/20 shadow-lg"
                                    >
                                        <div className="text-2xl font-bold bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-300 bg-clip-text text-transparent">
                                            {index + 1}
                                        </div>
                                    </motion.div>
                                    <button
                                        onClick={() => handleBoxClick(index)}
                                        className={`aspect-square w-full rounded-xl overflow-hidden transition-all ${
                                            selectedBoxes.includes(index)
                                                ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-purple-900'
                                                : 'hover:ring-2 hover:ring-yellow-400/50'
                                        }`}
                                    >
                                        <img 
                                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/6b5cc5f6c_image.png"
                                            alt="Box"
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        <div className="text-center">
                            <Button
                                onClick={handleConfirmSelection}
                                disabled={selectedBoxes.length !== 3}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white font-bold text-lg px-8 py-6 disabled:opacity-50"
                            >
                                Confirm Selection
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Stage: Revealing */}
                {stage === 'revealing' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative p-8"
                    >
                        <h3 className="text-3xl font-bold text-yellow-400 text-center mb-6">
                            Revealing Your Boxes...
                        </h3>

                        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                            {selectedBoxes.map((boxIndex, i) => (
                                <motion.div
                                    key={boxIndex}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.5 }}
                                    className="flex flex-col items-center gap-3"
                                >
                                    <motion.div
                                        animate={{
                                            boxShadow: revealedBoxes.includes(boxIndex) 
                                                ? ['0 0 20px rgba(250,204,21,0.5)', '0 0 40px rgba(250,204,21,0.8)', '0 0 20px rgba(250,204,21,0.5)']
                                                : '0 0 0px rgba(0,0,0,0)'
                                        }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="w-full aspect-square rounded-xl overflow-hidden border-4 border-yellow-400"
                                    >
                                        <img 
                                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/6b5cc5f6c_image.png"
                                            alt="Bitcoin Box"
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                    <AnimatePresence>
                                        {revealedBoxes.includes(boxIndex) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg px-4 py-2 border-2 border-green-400"
                                            >
                                                <div className="text-2xl font-bold text-white">
                                                    ${boxAmounts[boxIndex]}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Stage: Result */}
                {stage === 'result' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative p-8 text-center"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: 3 }}
                        >
                            <TrendingUp className="w-24 h-24 text-green-400 mx-auto mb-6" />
                        </motion.div>
                        <h2 className="text-5xl font-bold text-yellow-400 mb-4">
                            CONGRATULATIONS!
                        </h2>
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400 rounded-2xl p-8 mb-6">
                            <p className="text-white text-xl mb-2">You won</p>
                            <p className="text-6xl font-bold text-green-400 mb-2">
                                ${totalWinnings.toFixed(2)}
                            </p>
                            <p className="text-gray-300 text-sm">Payment will be processed by admin</p>
                        </div>
                        <Button
                            onClick={handleFinish}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white font-bold text-lg px-8 py-6"
                        >
                            Claim Prize
                        </Button>
                    </motion.div>
                )}
            </DialogContent>
        </Dialog>
    );
}