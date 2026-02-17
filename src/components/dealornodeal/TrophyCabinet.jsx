import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, X } from 'lucide-react';
import { XP_LEVELS } from './XPUtils';

export default function TrophyCabinet({ walletAddress, totalXP }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const { data: earnedTrophies = [] } = useQuery({
        queryKey: ['playerTrophies', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('player_trophies').select('*').eq('wallet_address', walletAddress).order('trophy_level', { ascending: false });
            return data || [];
        },
        enabled: !!walletAddress
    });

    const { data: allTrophies = [] } = useQuery({
        queryKey: ['allTrophies'],
        queryFn: async () => {
            const { data } = await supabase.from('trophies').select('*').order('level', { ascending: true });
            return data || [];
        }
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-[#f5c96a] rounded-2xl p-6"
        >
            <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-[#f5c96a]" />
                <div>
                    <h2 className="text-2xl font-bold text-white">Trophy Cabinet</h2>
                    <p className="text-gray-400 text-sm">
                        {earnedTrophies.length} / {XP_LEVELS.length} Gods Unlocked
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {XP_LEVELS.map((level) => {
                    const earned = earnedTrophies.find(t => t.trophy_level === level.level);
                    const trophy = allTrophies.find(t => t.level === level.level);
                    // Trophy unlocks when you COMPLETE the level (reach next level's XP requirement)
                    // For Level 12 (max), unlock when you reach its requirement
                    const nextLevel = XP_LEVELS[level.level + 1];
                    const isUnlocked = nextLevel ? (totalXP >= nextLevel.xpRequired) : (level.level === 12 && totalXP >= level.xpRequired);

                    return (
                        <motion.div
                            key={level.level}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: level.level * 0.05 }}
                            className={`relative p-4 rounded-xl border-2 ${isUnlocked
                                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-[#f5c96a]'
                                    : 'bg-black/40 border-gray-700'
                                }`}
                        >
                            {/* Trophy Image or Placeholder */}
                            <div
                                className={`aspect-square mb-3 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center ${(trophy?.nft_image_url || earned?.nft_image_url) ? 'cursor-pointer hover:ring-2 hover:ring-[#f5c96a] transition-all' : ''
                                    }`}
                                onClick={() => {
                                    const imageUrl = trophy?.nft_image_url || earned?.nft_image_url;
                                    if (imageUrl) setSelectedImage(imageUrl);
                                }}
                            >
                                {(() => {
                                    const imageUrl = trophy?.nft_image_url || earned?.nft_image_url;

                                    if (imageUrl && isUnlocked) {
                                        return (
                                            <img
                                                src={imageUrl}
                                                alt={level.name}
                                                className="w-full h-full object-cover"
                                            />
                                        );
                                    } else if (isUnlocked) {
                                        return <Trophy className="w-12 h-12 text-[#f5c96a]" />;
                                    } else {
                                        return <Lock className="w-12 h-12 text-gray-600" />;
                                    }
                                })()}
                            </div>

                            {/* Level Info */}
                            <div className="text-center">
                                <p className={`text-xs font-bold ${isUnlocked ? 'text-[#f5c96a]' : 'text-gray-500'}`}>
                                    Level {level.level}
                                </p>
                                <p className={`text-sm font-semibold ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                    {level.name}
                                </p>
                                {!isUnlocked && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(level.xpRequired || 0).toLocaleString()} XP
                                    </p>
                                )}
                            </div>

                            {/* Earned Date */}
                            {earned && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* 1 BTC Reward Card - Unlock by COMPLETING Level 12 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`mt-6 p-6 rounded-xl border-2 ${totalXP >= 2000001
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500'
                        : 'bg-black/40 border-gray-700'
                    }`}
            >
                <div className="text-center">
                    <h3 className="text-3xl font-bold text-[#f5c96a] mb-2">🏆 1 BTC REWARD 🏆</h3>
                    <p className="text-white text-lg mb-2">
                        Complete Level 12 (Zeus) - Requires 2,000,001 XP
                    </p>
                    {totalXP >= 2000001 ? (
                        <>
                            <p className="text-green-400 font-bold mb-2">CONGRATULATIONS! CONTACT ADMIN TO CLAIM</p>
                            <p className="text-gray-400 text-sm">After claiming, you can earn the reward again by completing another round!</p>
                        </>
                    ) : (
                        <p className="text-gray-400">
                            {(2000001 - (totalXP || 0)).toLocaleString()} XP remaining
                        </p>
                    )}
                </div>
            </motion.div>

            {/* Full-Size Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            src={selectedImage}
                            alt="Trophy NFT"
                            className="max-w-full max-h-[90vh] object-contain rounded-xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}