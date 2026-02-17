import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Briefcase, Star } from 'lucide-react';

const ROUNDS_CONFIG = [
    { round: 1, casesToOpen: 6 },
    { round: 2, casesToOpen: 5 },
    { round: 3, casesToOpen: 4 },
    { round: 4, casesToOpen: 3 },
    { round: 5, casesToOpen: 2 },
    { round: 6, casesToOpen: 2 },
    { round: 7, casesToOpen: 2 },
    { round: 8, casesToOpen: 2 },
    { round: 9, casesToOpen: 2 }
];

export default function GameBoard({ game, eliminatedAmounts = [], onOpenCase, onFinalChoice, processingCases = new Set() }) {
    const audioRef = useRef(null);
    const [audioLoaded, setAudioLoaded] = useState(false);

    useEffect(() => {
        // Preload audio on mount
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.6;
        audio.preload = 'auto';
        audio.addEventListener('canplaythrough', () => setAudioLoaded(true), { once: true });
        audio.load();
        audioRef.current = audio;
    }, []);
    
    const currentRoundConfig = ROUNDS_CONFIG.find(r => r.round === game.current_round);
    
    // Calculate total cases opened before current round
    let previousRoundsCases = 0;
    for (let i = 0; i < game.current_round - 1; i++) {
        if (ROUNDS_CONFIG[i]) {
            previousRoundsCases += ROUNDS_CONFIG[i].casesToOpen;
        }
    }
    
    const casesOpenedThisRound = game.opened_cases.length - previousRoundsCases;
    const casesRemainingThisRound = currentRoundConfig 
        ? currentRoundConfig.casesToOpen - casesOpenedThisRound 
        : 0;

    const isFinalDecision = game.opened_cases.length === 24;

    const remainingCase = isFinalDecision 
        ? Array.from({ length: 26 }, (_, i) => i + 1).find(
            n => n !== game.player_case_number && !game.opened_cases.includes(n)
        )
        : null;

    const handleCaseClick = async (num) => {
        // Bug #1 & #4 fix - simple check using game state only
        if (processingCases.has(num) || game.opened_cases.includes(num)) {
            return;
        }
        
        // Play briefcase opening sound
        if (audioRef.current && audioLoaded) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.log('Sound blocked:', err));
        }
        
        await onOpenCase(num);
    };

    return (
        <div className="space-y-6">
            {/* Round Info */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl p-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-1">Round {game.current_round}</h2>
                        {!isFinalDecision && (
                            <p className="text-gray-300">
                                Open {casesRemainingThisRound} more case{casesRemainingThisRound !== 1 ? 's' : ''} this round
                            </p>
                        )}
                        {isFinalDecision && (
                            <p className="text-[#f5c96a] font-semibold text-lg">
                                Final Decision: Keep Case #{game.player_case_number} or Swap with Case #{remainingCase}?
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-sm mb-2">Your Briefcase</p>
                        <div className="flex items-center justify-end gap-2">
                            <div className="bg-[#f5c96a] text-black font-bold text-sm px-2 py-0.5 rounded-md shadow-lg">
                                #{game.player_case_number}
                            </div>
                            <div className="relative inline-block">
                                <img 
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/f9d1f57d9_image.png"
                                    alt="Your Briefcase"
                                    className="w-16 h-16 object-contain"
                                />
                                <Star className="absolute -top-1 -right-1 w-4 h-4 text-[#f5c96a] drop-shadow-lg" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Final Decision Buttons */}
            {isFinalDecision && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid md:grid-cols-2 gap-6"
                >
                    <Button
                        onClick={() => onFinalChoice(true)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl py-12 text-xl"
                    >
                        <Star className="w-8 h-8 mr-3" />
                        Keep My Case #{game.player_case_number}
                    </Button>
                    <Button
                        onClick={() => onFinalChoice(false)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-90 text-white border-0 rounded-xl py-12 text-xl"
                    >
                        <Briefcase className="w-8 h-8 mr-3" />
                        Swap for Case #{remainingCase}
                    </Button>
                </motion.div>
            )}

            {/* Cases and Prize Board Layout */}
            <div className="grid lg:grid-cols-[300px,1fr,300px] gap-6">
                {/* Left Prize Board */}
                <div className="hidden lg:block bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-[#f5c96a]/30 rounded-xl p-4">
                    <h3 className="text-[#f5c96a] font-bold text-center mb-4">Prize Board</h3>
                    <div className="space-y-1.5">
                        {[0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750].map((amount, idx) => {
                            const isEliminated = eliminatedAmounts.includes(amount);

                            let bgColor = 'bg-white/5';
                            let borderColor = 'border-transparent';
                            let textColor = 'text-white';
                            let animationColors = [];

                            if (isEliminated) {
                                if (amount <= 75) {
                                    bgColor = 'bg-green-600/40';
                                    borderColor = 'border-green-500/70';
                                    textColor = 'text-green-300';
                                    animationColors = ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.3)'];
                                } else if (amount <= 750) {
                                    bgColor = 'bg-cyan-600/40';
                                    borderColor = 'border-cyan-500/70';
                                    textColor = 'text-cyan-300';
                                    animationColors = ['rgba(34, 211, 238, 0.3)', 'rgba(34, 211, 238, 0.1)', 'rgba(34, 211, 238, 0.3)'];
                                } else if (amount <= 75000) {
                                    bgColor = 'bg-red-600/40';
                                    borderColor = 'border-red-500/70';
                                    textColor = 'text-red-300';
                                    animationColors = ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.3)'];
                                } else if (amount <= 500000) {
                                    bgColor = 'bg-orange-600/40';
                                    borderColor = 'border-orange-500/70';
                                    textColor = 'text-orange-300';
                                    animationColors = ['rgba(249, 115, 22, 0.3)', 'rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0.3)'];
                                } else {
                                    bgColor = 'bg-yellow-600/40';
                                    borderColor = 'border-yellow-500/70';
                                    textColor = 'text-yellow-300';
                                    animationColors = ['rgba(234, 179, 8, 0.3)', 'rgba(234, 179, 8, 0.1)', 'rgba(234, 179, 8, 0.3)'];
                                }
                            }

                            return (
                                <motion.div
                                    key={idx}
                                    animate={isEliminated ? { 
                                        backgroundColor: animationColors
                                    } : {}}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className={`flex items-center justify-center px-2 py-1.5 rounded-lg border-2 ${
                                        isEliminated ? `${bgColor} ${borderColor} line-through` : 'bg-white/5 border-transparent'
                                    }`}
                                >
                                    <span className={`font-mono font-bold text-sm ${textColor}`}>
                                        ${amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount.toFixed(2)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Cases Grid - Center */}
                <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-13 gap-2 sm:gap-3">
                    {Array.from({ length: 26 }, (_, i) => i + 1).map((num) => {
                    const isPlayerCase = num === game.player_case_number;
                    const isOpened = game.opened_cases.includes(num);
                    const isProcessing = processingCases.has(num);

                    return (
                        <motion.div
                            key={num}
                            className="flex flex-col items-center gap-1 sm:gap-2"
                        >
                            <div className="relative">
                                {isPlayerCase && (
                                    <Star className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 text-[#f5c96a] drop-shadow-lg" />
                                )}
                                <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-bold text-xs sm:text-base ${
                                    isPlayerCase ? 'bg-[#f5c96a] text-black' : 'bg-white/90 text-black'
                                }`}>
                                    {num}
                                </div>
                            </div>
                            <motion.button
                                onClick={() => handleCaseClick(num)}
                                disabled={isPlayerCase || isOpened || isFinalDecision || isProcessing}
                                whileHover={!isPlayerCase && !isOpened && !isFinalDecision && !isProcessing ? { scale: 1.05 } : {}}
                                whileTap={!isPlayerCase && !isOpened && !isFinalDecision && !isProcessing ? { scale: 0.95 } : {}}
                                className={`relative w-full aspect-square rounded-lg transition-all flex items-center justify-center ${
                                    isPlayerCase
                                        ? 'cursor-not-allowed'
                                        : isOpened
                                        ? 'cursor-not-allowed opacity-20 grayscale'
                                        : isProcessing
                                        ? 'cursor-wait opacity-75 animate-pulse'
                                        : 'cursor-pointer hover:opacity-90'
                                }`}
                            >
                                <img 
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/f9d1f57d9_image.png"
                                    alt={`Case ${num}`}
                                    className="w-full h-full object-contain"
                                />
                                {isOpened && (
                                    <div className="absolute inset-0 bg-red-900/80 rounded-lg flex items-center justify-center">
                                        <span className="text-red-300 font-bold text-xs sm:text-sm rotate-[-15deg]">OPENED</span>
                                    </div>
                                )}
                            </motion.button>
                        </motion.div>
                    );
                })}
                </div>

                {/* Right Prize Board */}
                <div className="hidden lg:block bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-[#f5c96a]/30 rounded-xl p-4">
                    <h3 className="text-[#f5c96a] font-bold text-center mb-4">Prize Board</h3>
                    <div className="space-y-1.5">
                        {[1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000].map((amount, idx) => {
                            const isEliminated = eliminatedAmounts.includes(amount);

                            let bgColor = 'bg-white/5';
                            let borderColor = 'border-transparent';
                            let textColor = 'text-white';
                            let animationColors = [];

                            if (isEliminated) {
                                if (amount <= 75) {
                                    bgColor = 'bg-green-600/40';
                                    borderColor = 'border-green-500/70';
                                    textColor = 'text-green-300';
                                    animationColors = ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.3)'];
                                } else if (amount <= 750) {
                                    bgColor = 'bg-cyan-600/40';
                                    borderColor = 'border-cyan-500/70';
                                    textColor = 'text-cyan-300';
                                    animationColors = ['rgba(34, 211, 238, 0.3)', 'rgba(34, 211, 238, 0.1)', 'rgba(34, 211, 238, 0.3)'];
                                } else if (amount <= 75000) {
                                    bgColor = 'bg-red-600/40';
                                    borderColor = 'border-red-500/70';
                                    textColor = 'text-red-300';
                                    animationColors = ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.3)'];
                                } else if (amount <= 500000) {
                                    bgColor = 'bg-orange-600/40';
                                    borderColor = 'border-orange-500/70';
                                    textColor = 'text-orange-300';
                                    animationColors = ['rgba(249, 115, 22, 0.3)', 'rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0.3)'];
                                } else {
                                    bgColor = 'bg-yellow-600/40';
                                    borderColor = 'border-yellow-500/70';
                                    textColor = 'text-yellow-300';
                                    animationColors = ['rgba(234, 179, 8, 0.3)', 'rgba(234, 179, 8, 0.1)', 'rgba(234, 179, 8, 0.3)'];
                                }
                            }

                            return (
                                <motion.div
                                    key={idx}
                                    animate={isEliminated ? { 
                                        backgroundColor: animationColors
                                    } : {}}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className={`flex items-center justify-center px-2 py-1.5 rounded-lg border-2 ${
                                        isEliminated ? `${bgColor} ${borderColor} line-through` : 'bg-white/5 border-transparent'
                                    }`}
                                >
                                    <span className={`font-mono font-bold text-sm ${textColor}`}>
                                        ${amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount.toFixed(2)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile Prize Board */}
            <div className="lg:hidden grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-3">Left Side</h3>
                    <div className="space-y-2">
                        {[0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750].map((amount, idx) => {
                            const isEliminated = eliminatedAmounts.includes(amount);

                            let bgColor = 'bg-white/5';
                            let borderColor = 'border-transparent';
                            let textColor = 'text-white';
                            let animationColors = [];

                            if (isEliminated) {
                                if (amount <= 75) {
                                    bgColor = 'bg-green-600/40';
                                    borderColor = 'border-green-500/70';
                                    textColor = 'text-green-300';
                                    animationColors = ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.3)'];
                                } else if (amount <= 750) {
                                    bgColor = 'bg-cyan-600/40';
                                    borderColor = 'border-cyan-500/70';
                                    textColor = 'text-cyan-300';
                                    animationColors = ['rgba(34, 211, 238, 0.3)', 'rgba(34, 211, 238, 0.1)', 'rgba(34, 211, 238, 0.3)'];
                                } else if (amount <= 75000) {
                                    bgColor = 'bg-red-600/40';
                                    borderColor = 'border-red-500/70';
                                    textColor = 'text-red-300';
                                    animationColors = ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.3)'];
                                } else if (amount <= 500000) {
                                    bgColor = 'bg-orange-600/40';
                                    borderColor = 'border-orange-500/70';
                                    textColor = 'text-orange-300';
                                    animationColors = ['rgba(249, 115, 22, 0.3)', 'rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0.3)'];
                                } else {
                                    bgColor = 'bg-yellow-600/40';
                                    borderColor = 'border-yellow-500/70';
                                    textColor = 'text-yellow-300';
                                    animationColors = ['rgba(234, 179, 8, 0.3)', 'rgba(234, 179, 8, 0.1)', 'rgba(234, 179, 8, 0.3)'];
                                }
                            }

                            return (
                                <motion.div
                                    key={idx}
                                    animate={isEliminated ? { 
                                        backgroundColor: animationColors
                                    } : {}}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg border-2 ${
                                        isEliminated ? `${bgColor} ${borderColor} line-through` : 'bg-white/5 border-transparent'
                                    }`}
                                >
                                    <span className={`font-mono font-bold ${textColor}`}>
                                        ${amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount.toFixed(2)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-bold mb-3">Right Side</h3>
                    <div className="space-y-2">
                        {[1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000].map((amount, idx) => {
                            const isEliminated = eliminatedAmounts.includes(amount);

                            let bgColor = 'bg-white/5';
                            let borderColor = 'border-transparent';
                            let textColor = 'text-white';
                            let animationColors = [];

                            if (isEliminated) {
                                if (amount <= 75) {
                                    bgColor = 'bg-green-600/40';
                                    borderColor = 'border-green-500/70';
                                    textColor = 'text-green-300';
                                    animationColors = ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.3)'];
                                } else if (amount <= 750) {
                                    bgColor = 'bg-cyan-600/40';
                                    borderColor = 'border-cyan-500/70';
                                    textColor = 'text-cyan-300';
                                    animationColors = ['rgba(34, 211, 238, 0.3)', 'rgba(34, 211, 238, 0.1)', 'rgba(34, 211, 238, 0.3)'];
                                } else if (amount <= 75000) {
                                    bgColor = 'bg-red-600/40';
                                    borderColor = 'border-red-500/70';
                                    textColor = 'text-red-300';
                                    animationColors = ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.3)'];
                                } else if (amount <= 500000) {
                                    bgColor = 'bg-orange-600/40';
                                    borderColor = 'border-orange-500/70';
                                    textColor = 'text-orange-300';
                                    animationColors = ['rgba(249, 115, 22, 0.3)', 'rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0.3)'];
                                } else {
                                    bgColor = 'bg-yellow-600/40';
                                    borderColor = 'border-yellow-500/70';
                                    textColor = 'text-yellow-300';
                                    animationColors = ['rgba(234, 179, 8, 0.3)', 'rgba(234, 179, 8, 0.1)', 'rgba(234, 179, 8, 0.3)'];
                                }
                            }

                            return (
                                <motion.div
                                    key={idx}
                                    animate={isEliminated ? { 
                                        backgroundColor: animationColors
                                    } : {}}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg border-2 ${
                                        isEliminated ? `${bgColor} ${borderColor} line-through` : 'bg-white/5 border-transparent'
                                    }`}
                                >
                                    <span className={`font-mono font-bold ${textColor}`}>
                                        ${amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount.toFixed(2)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Banker Offers History */}
            {game.banker_offers && game.banker_offers.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-bold mb-4">Banker's Offers History</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {game.banker_offers.map((offer, idx) => (
                            <div key={idx} className="bg-white/5 rounded-lg p-4 text-center">
                                <p className="text-gray-400 text-sm mb-1">Round {offer.round}</p>
                                <p className="text-2xl font-bold text-green-400">${offer.offer.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}