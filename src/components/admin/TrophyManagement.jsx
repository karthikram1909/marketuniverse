import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Upload, Save, Trash2, Award, Users } from 'lucide-react';
import { toast } from 'sonner';
import { XP_LEVELS, getCompletedLevelNumbers } from '../dealornodeal/XPUtils';
import { motion } from 'framer-motion';

export default function TrophyManagement() {
    const queryClient = useQueryClient();
    const [uploadingLevel, setUploadingLevel] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [uploadedNFT, setUploadedNFT] = useState(null);
    const [viewingImage, setViewingImage] = useState(null);

    const { data: trophies = [] } = useQuery({
        queryKey: ['allTrophies'],
        queryFn: async () => {
            const { data } = await supabase.from('trophies').select('*').order('level', { ascending: true });
            return data || [];
        }
    });

    const { data: allPlayers = [] } = useQuery({
        queryKey: ['allPlayers'],
        queryFn: async () => {
            const { data } = await supabase.from('player_profiles').select('*').order('total_xp', { ascending: false });
            return data || [];
        }
    });

    // Real-time BTC/USDT via WebSocket (no flickering)
    const [btcRate, setBtcRate] = useState(0);

    useEffect(() => {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.c) {
                setBtcRate(parseFloat(data.c));
            }
        };

        ws.onerror = () => {
            console.error('WebSocket error');
        };

        return () => ws.close();
    }, []);

    // Calculate all NFT prices from DATABASE values
    const nftPrices = useMemo(() => {
        if (!btcRate || trophies.length === 0) return {};
        const prices = {};
        trophies.forEach(trophy => {
            const btcPrice = trophy.btc_sale_price || 0;
            prices[`level${trophy.level}`] = (btcPrice * btcRate).toFixed(btcPrice >= 1 ? 2 : btcPrice >= 0.001 ? 3 : 4);
        });
        return prices;
    }, [btcRate, trophies]);

    const uploadImageMutation = useMutation({
        mutationFn: async ({ file }) => {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { data, error } = await supabase.storage.from('trophies').upload(fileName, file);
            if (error) {
                // Try 'public' bucket as fallback
                const { data: data2, error: error2 } = await supabase.storage.from('public').upload(`trophies/${fileName}`, file);
                if (error2) throw error;
                const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(`trophies/${fileName}`);
                return publicUrl;
            }
            const { data: { publicUrl } } = supabase.storage.from('trophies').getPublicUrl(fileName);
            return publicUrl;
        }
    });

    const createOrUpdateTrophyMutation = useMutation({
        mutationFn: async ({ level, imageUrl }) => {
            const levelInfo = XP_LEVELS.find(l => l.level === level);
            const existing = trophies.find(t => t.level === level);

            if (existing) {
                const { data } = await supabase.from('trophies').update({
                    nft_image_url: imageUrl
                }).eq('id', existing.id).select().single();
                return data;
            } else {
                const { data } = await supabase.from('trophies').insert({
                    level: level,
                    god_name: levelInfo.name,
                    xp_required: levelInfo.xpRequired,
                    nft_image_url: imageUrl,
                    description: `${levelInfo.name} God Trophy - Level ${level}`
                }).select().single();
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allTrophies'] });
            toast.success('Trophy image updated!');
            setUploadingLevel(null);
        }
    });

    const deleteTrophyMutation = useMutation({
        mutationFn: async (trophyId) => {
            await supabase.from('trophies').delete().eq('id', trophyId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allTrophies'] });
            toast.success('Trophy deleted!');
        }
    });

    const { data: allPlayerTrophies = [] } = useQuery({
        queryKey: ['allPlayerTrophiesAdmin'],
        queryFn: async () => {
            const { data } = await supabase.from('player_trophies').select('*').order('earned_date', { ascending: false });
            return data || [];
        }
    });

    const removePlayerTrophyMutation = useMutation({
        mutationFn: async (trophyId) => {
            await supabase.from('player_trophies').delete().eq('id', trophyId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allPlayerTrophiesAdmin'] });
            queryClient.invalidateQueries({ queryKey: ['playerTrophies'] });
            toast.success('Trophy removed from player!');
        }
    });

    const awardNFTMutation = useMutation({
        mutationFn: async ({ player, level, nftUrl }) => {
            const levelInfo = XP_LEVELS.find(l => l.level === level);

            // Check if player already has this trophy
            const { data: existing } = await supabase.from('player_trophies').select('*')
                .eq('wallet_address', player.wallet_address)
                .eq('trophy_level', level);

            if (existing && existing.length > 0) {
                throw new Error('Player already has this trophy!');
            }

            const { data } = await supabase.from('player_trophies').insert({
                wallet_address: player.wallet_address,
                trophy_level: level,
                god_name: levelInfo.name,
                earned_date: new Date().toISOString(),
                nft_image_url: nftUrl
            }).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playerTrophies'] });
            toast.success('NFT Trophy awarded!');
            setSelectedPlayer(null);
            setSelectedLevel(null);
            setUploadedNFT(null);
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to award trophy');
        }
    });

    const handleImageUpload = async (level, file) => {
        if (!file) return;

        try {
            setUploadingLevel(level);
            const imageUrl = await uploadImageMutation.mutateAsync({ file });
            await createOrUpdateTrophyMutation.mutateAsync({ level, imageUrl });
        } catch (error) {
            toast.error('Failed to upload image');
            setUploadingLevel(null);
        }
    };

    const handleNFTUpload = async (file) => {
        if (!file) return;
        try {
            const imageUrl = await uploadImageMutation.mutateAsync({ file });
            setUploadedNFT(imageUrl);
            toast.success('NFT uploaded! Now select player and level.');
        } catch (error) {
            toast.error('Failed to upload NFT');
        }
    };

    const handleAwardNFT = () => {
        if (!selectedPlayer || !selectedLevel || !uploadedNFT) {
            toast.error('Please select player, level, and upload NFT');
            return;
        }
        awardNFTMutation.mutate({
            player: selectedPlayer,
            level: selectedLevel,
            nftUrl: uploadedNFT
        });
    };

    return (
        <div className="space-y-6">
            {/* XP Ranges Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-500/50 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-8 h-8 text-green-400" />
                    <div>
                        <h3 className="text-2xl font-bold text-white">Trophy XP Ranges</h3>
                        <p className="text-gray-400 text-sm">Complete XP requirements for each god level</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-green-500/30">
                                <th className="text-left py-3 px-4 text-green-400 font-bold">Level</th>
                                <th className="text-left py-3 px-4 text-green-400 font-bold">God Name</th>
                                <th className="text-left py-3 px-4 text-green-400 font-bold">XP Range</th>
                                <th className="text-left py-3 px-4 text-green-400 font-bold">Trophy Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {XP_LEVELS.map((level, index) => {
                                const nextLevel = XP_LEVELS[index + 1];
                                const rangeStart = level.xpRequired;
                                const rangeEnd = nextLevel ? nextLevel.xpRequired - 1 : null;
                                const trophy = trophies.find(t => t.level === level.level);

                                return (
                                    <tr key={level.level} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="py-3 px-4">
                                            <span className="text-cyan-400 font-bold text-lg">
                                                Level {level.level}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-[#f5c96a] font-semibold">
                                                {level.name}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {level.level === 13 ? (
                                                <span className="text-[#f5c96a] font-bold text-lg">
                                                    2,000,001 - 1 BTC IS YOURS!!
                                                </span>
                                            ) : (
                                                <span className="text-white font-mono">
                                                    {rangeStart.toLocaleString()} - {rangeEnd ? rangeEnd.toLocaleString() : '∞'} XP
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {trophy?.nft_image_url ? (
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={trophy.nft_image_url}
                                                        alt={level.name}
                                                        className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform"
                                                        onClick={() => setViewingImage({ url: trophy.nft_image_url, title: level.name })}
                                                    />
                                                    <span className="text-green-400 text-sm">✓ NFT Set</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-sm">No NFT</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 bg-black/30 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">
                        <span className="text-green-400 font-bold">Note:</span> Players earn trophies when they complete a level (reach the next level's XP requirement).
                        Level 12 trophy (Zeus) is earned at 2,000,001 XP. <span className="text-[#f5c96a] font-bold">Level 13 trophy (Zeus Complete) at 2,000,001 XP = 1 BTC IS YOURS!</span> Players can earn this reward multiple times - after claiming, they can earn it again.
                    </p>
                </div>
            </motion.div>

            {/* NFT Pricing Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-500/50 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-8 h-8 text-purple-400" />
                    <div>
                        <h3 className="text-2xl font-bold text-white">NFT Trophy Marketplace Prices</h3>
                        <p className="text-gray-400 text-sm">Fixed BTC prices for Trophy NFT sales</p>
                    </div>
                </div>

                <div className="mb-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <p className="text-cyan-400 text-sm">
                        <span className="font-bold">🔓 Marketplace Unlock:</span> Players can start selling their Trophy NFTs once they <span className="text-[#f5c96a] font-bold">complete Level 9 (Poseidon)</span>.
                        This unlocks NFT sales for ALL their earned trophies.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-purple-500/30">
                                <th className="text-left py-3 px-4 text-purple-400 font-bold">Level</th>
                                <th className="text-left py-3 px-4 text-purple-400 font-bold">God Trophy</th>
                                <th className="text-left py-3 px-4 text-purple-400 font-bold">Sale Price (BTC)</th>
                                <th className="text-left py-3 px-4 text-purple-400 font-bold">Value (USDT)</th>
                                <th className="text-left py-3 px-4 text-purple-400 font-bold">Marketplace Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trophies.filter(t => t.level <= 12).map((trophy) => (
                                <tr key={trophy.level} className={`border-b border-white/10 hover:bg-white/5 ${trophy.level === 9 ? 'bg-cyan-500/10' : ''}`}>
                                    <td className="py-3 px-4"><span className="text-cyan-400 font-bold">Level {trophy.level}</span></td>
                                    <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">{trophy.god_name}</span></td>
                                    <td className="py-3 px-4">
                                        <span className={`font-bold ${trophy.level === 12 ? 'text-[#f5c96a] text-xl' : 'text-green-400'}`}>
                                            {trophy.btc_sale_price ? `${trophy.btc_sale_price.toFixed(trophy.btc_sale_price >= 1 ? 0 : 6)} BTC` : 'Not Set'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`font-semibold ${trophy.level === 12 ? 'text-cyan-300 font-bold text-xl' : 'text-cyan-300'}`}>
                                            ${nftPrices[`level${trophy.level}`] || '...'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {trophy.level < 9 ? (
                                            <span className="text-red-400 text-sm">🔒 Locked until Level 9</span>
                                        ) : trophy.level === 9 ? (
                                            <span className="text-cyan-400 text-sm font-bold">✓ Marketplace Unlocked!</span>
                                        ) : (
                                            <span className="text-green-400 text-sm">✓ Available for Sale</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 bg-black/30 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">
                        <span className="text-purple-400 font-bold">Admin Info:</span> NFT Marketplace unlocks for players after they complete Level 9 (Poseidon).
                        All earned trophies can then be sold at the fixed BTC prices shown above. <span className="text-[#f5c96a] font-bold">Zeus Trophy sells for 1 full BTC!</span>
                    </p>
                </div>
            </motion.div>

            {/* Award NFT to Player Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-500/50 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Award className="w-8 h-8 text-[#f5c96a]" />
                    <div>
                        <h3 className="text-2xl font-bold text-white">Award NFT Trophy</h3>
                        <p className="text-gray-400 text-sm">Select player, level, and upload NFT to award</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Player Selection */}
                    <div className="bg-black/30 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-cyan-400" />
                            Select Player
                        </h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {allPlayers.map((player) => (
                                <button
                                    key={player.id}
                                    onClick={() => setSelectedPlayer(player)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedPlayer?.id === player.id
                                        ? 'bg-purple-500/30 border-purple-500'
                                        : 'bg-white/5 border-white/10 hover:border-purple-500/50'
                                        }`}
                                >
                                    <p className="text-white font-semibold">{player.player_name || 'Unknown'}</p>
                                    <p className="text-gray-400 text-sm">{player.email || 'No email'}</p>
                                    <p className="text-gray-500 text-xs font-mono">{player.wallet_address}</p>
                                    <p className="text-cyan-400 text-sm mt-1">
                                        {(player.total_xp || 0).toLocaleString()} XP • Level {player.current_level}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Level & NFT Upload */}
                    <div className="bg-black/30 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-[#f5c96a]" />
                            Select Level & Upload NFT
                        </h4>

                        {/* Level Selection */}
                        <div className="mb-6">
                            <label className="text-gray-400 text-sm mb-2 block">Trophy Level</label>
                            <select
                                value={selectedLevel || ''}
                                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                                className="w-full bg-white/5 border-2 border-white/10 rounded-lg p-3 text-white"
                            >
                                <option value="">Select Level...</option>
                                {XP_LEVELS.map((level) => (
                                    <option key={level.level} value={level.level}>
                                        Level {level.level} - {level.name} ({(level.xpRequired || 0).toLocaleString()} XP)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* NFT Upload */}
                        <div className="mb-6">
                            <label className="text-gray-400 text-sm mb-2 block">Upload NFT Image</label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleNFTUpload(e.target.files[0])}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            {uploadedNFT && (
                                <div className="mt-3 p-2 bg-green-500/20 border border-green-500 rounded-lg">
                                    <img src={uploadedNFT} alt="Uploaded NFT" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                                    <p className="text-green-400 text-sm text-center mt-2">✓ NFT Ready</p>
                                </div>
                            )}
                        </div>

                        {/* Award Button */}
                        <Button
                            onClick={handleAwardNFT}
                            disabled={!selectedPlayer || !selectedLevel || !uploadedNFT || awardNFTMutation.isPending}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white border-0"
                        >
                            <Award className="w-5 h-5 mr-2" />
                            {awardNFTMutation.isPending ? 'Awarding...' : 'Award NFT Trophy'}
                        </Button>

                        {selectedPlayer && (
                            <p className="text-gray-400 text-sm mt-3 text-center">
                                Awarding to: <span className="text-white font-semibold">{selectedPlayer.player_name}</span>
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Existing Trophy Templates Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-gray-900/80 to-gray-800/90 border-2 border-gray-700 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-8 h-8 text-gray-400" />
                    <div>
                        <h3 className="text-2xl font-bold text-white">Trophy Templates</h3>
                        <p className="text-gray-400 text-sm">
                            Upload default NFT images for each god level (optional)
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {XP_LEVELS.map((level) => {
                        const trophy = trophies.find(t => t.level === level.level);
                        const isUploading = uploadingLevel === level.level;

                        return (
                            <div
                                key={level.level}
                                className="bg-white/5 border-2 border-white/10 rounded-xl p-4 hover:border-gray-500 transition-colors"
                            >
                                {/* Level Header */}
                                <div className="mb-3">
                                    <h3 className="font-bold text-lg text-gray-300">
                                        Level {level.level}
                                    </h3>
                                    <p className="text-sm text-gray-400">{level.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {(level.xpRequired || 0).toLocaleString()} XP
                                    </p>
                                </div>

                                {/* Image Preview */}
                                <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                                    {trophy?.nft_image_url ? (
                                        <img
                                            src={trophy.nft_image_url}
                                            alt={level.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Trophy className="w-16 h-16 text-gray-600" />
                                    )}
                                </div>

                                {/* Upload Button */}
                                <div className="space-y-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(level.level, e.target.files[0])}
                                        disabled={isUploading}
                                        className="text-sm bg-white/5 border-white/10 text-white"
                                    />
                                    {trophy && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => deleteTrophyMutation.mutate(trophy.id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remove
                                        </Button>
                                    )}
                                </div>

                                {isUploading && (
                                    <p className="text-xs text-blue-400 mt-2 text-center">
                                        Uploading...
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Player Trophy Collection View */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-2 border-cyan-500/50 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Users className="w-8 h-8 text-cyan-400" />
                    <div>
                        <h3 className="text-2xl font-bold text-white">Player Trophy Collections</h3>
                        <p className="text-gray-400 text-sm">View each player's trophy cabinet</p>
                    </div>
                </div>

                {allPlayers.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No players yet</p>
                ) : (
                    <div className="space-y-6">
                        {allPlayers.map((player) => {
                            const playerTrophies = allPlayerTrophies.filter(t => t.wallet_address === player.wallet_address);

                            // Calculate COMPLETED level from XP (same logic as backend)
                            const totalXP = player.total_xp || 0;
                            let completedLevel = -1;
                            for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
                                if (i < XP_LEVELS.length - 1) {
                                    if (totalXP >= XP_LEVELS[i + 1].xpRequired) {
                                        completedLevel = i;
                                        break;
                                    }
                                } else {
                                    if (totalXP >= XP_LEVELS[12].xpRequired) {
                                        completedLevel = 12;
                                        break;
                                    }
                                }
                            }
                            if (completedLevel === -1) completedLevel = 0;

                            const godName = XP_LEVELS[completedLevel].name;

                            return (
                                <div
                                    key={player.id}
                                    className="bg-gradient-to-br from-black/40 to-black/20 border-2 border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all"
                                >
                                    {/* Player Header */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                                        <div>
                                            <h4 className="text-xl font-bold text-white">{player.player_name || 'Unknown Player'}</h4>
                                            <p className="text-gray-400 text-sm font-mono">{player.wallet_address}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-cyan-400 font-semibold">
                                                    {(player.total_xp || 0).toLocaleString()} XP
                                                </span>
                                                <span className="text-[#f5c96a] font-semibold">
                                                    Level {completedLevel} • {godName}
                                                </span>
                                                <span className="text-purple-400 font-semibold">
                                                    {playerTrophies.length} Trophies
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Player Trophies */}
                                    {playerTrophies.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4 italic">No trophies earned yet</p>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {playerTrophies.sort((a, b) => a.trophy_level - b.trophy_level).map((playerTrophy) => {
                                                const levelInfo = XP_LEVELS.find(l => l.level === playerTrophy.trophy_level);
                                                const nextLevel = XP_LEVELS[playerTrophy.trophy_level + 1];
                                                const rangeStart = levelInfo?.xpRequired || 0;
                                                const rangeEnd = nextLevel ? nextLevel.xpRequired - 1 : null;

                                                return (
                                                    <div
                                                        key={playerTrophy.id}
                                                        className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl p-4 hover:border-purple-500 transition-all"
                                                    >
                                                        {/* Trophy Image */}
                                                        <div
                                                            className="aspect-square mb-3 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer"
                                                            onClick={() => {
                                                                const trophy = trophies.find(t => t.level === playerTrophy.trophy_level);
                                                                const imageUrl = trophy?.nft_image_url || playerTrophy.nft_image_url;
                                                                if (imageUrl) setViewingImage({ url: imageUrl, title: playerTrophy.god_name });
                                                            }}
                                                        >
                                                            {(() => {
                                                                const trophy = trophies.find(t => t.level === playerTrophy.trophy_level);
                                                                const imageUrl = trophy?.nft_image_url || playerTrophy.nft_image_url;

                                                                return imageUrl ? (
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={playerTrophy.god_name}
                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform pointer-events-none"
                                                                    />
                                                                ) : (
                                                                    <Trophy className="w-12 h-12 text-gray-600" />
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Trophy Info */}
                                                        <div className="text-center">
                                                            <div className="text-cyan-400 font-bold text-sm mb-1">
                                                                Level {playerTrophy.trophy_level}
                                                            </div>
                                                            <div className="text-[#f5c96a] font-semibold text-xs mb-1">
                                                                {playerTrophy.god_name}
                                                            </div>
                                                            <div className="text-gray-400 text-xs mb-1 font-mono">
                                                                {rangeStart.toLocaleString()}-{rangeEnd ? rangeEnd.toLocaleString() : '∞'}
                                                            </div>
                                                            <div className="text-gray-500 text-xs">
                                                                {new Date(playerTrophy.earned_date).toLocaleDateString()}
                                                            </div>
                                                        </div>

                                                        {/* Remove Button (shows on hover) */}
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                if (confirm(`Remove ${playerTrophy.god_name} trophy from ${player.player_name}?`)) {
                                                                    removePlayerTrophyMutation.mutate(playerTrophy.id);
                                                                }
                                                            }}
                                                            disabled={removePlayerTrophyMutation.isPending}
                                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500 text-white border-0 w-6 h-6 p-0"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* 1 BTC Reward Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-2 border-yellow-500/50 rounded-2xl p-6"
            >
                <h3 className="text-2xl font-bold text-[#f5c96a] mb-4">1 BTC Reward Status</h3>
                <BTCRewardTracking />
            </motion.div>

            {/* Image Viewer Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setViewingImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold"
                        >
                            ✕ Close
                        </button>
                        <img
                            src={viewingImage.url}
                            alt={viewingImage.title}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <p className="text-white text-center mt-4 text-lg font-semibold">
                            {viewingImage.title}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function BTCRewardTracking() {
    const { data: profiles = [] } = useQuery({
        queryKey: ['btcEligiblePlayers'],
        queryFn: async () => {
            const { data } = await supabase.from('player_profiles').select('*').gte('total_xp', 1000001).order('total_xp', { ascending: false });
            return data || [];
        }
    });

    return (
        <div>
            <p className="text-sm text-gray-600 mb-4">
                Players who have completed Level 12 (Zeus) at 1,000,001+ XP and are eligible for the 1 BTC reward. This reward can be earned multiple times:
            </p>

            {profiles.length === 0 ? (
                <p className="text-gray-500 italic">No players have reached this milestone yet.</p>
            ) : (
                <div className="space-y-3">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            className={`p-4 rounded-lg border-2 ${profile.btc_reward_claimed
                                ? 'bg-gray-100 border-gray-300'
                                : 'bg-yellow-50 border-yellow-500'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{profile.player_name}</p>
                                    <p className="text-sm text-gray-600 font-mono">
                                        {profile.wallet_address}
                                    </p>
                                    <p className="text-sm text-purple-600">
                                        {(profile.total_xp || 0).toLocaleString()} XP • {profile.god_name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {profile.btc_reward_claimed ? (
                                        <span className="text-green-600 font-semibold">✓ Claimed</span>
                                    ) : (
                                        <span className="text-yellow-600 font-semibold">⚠ Pending</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}