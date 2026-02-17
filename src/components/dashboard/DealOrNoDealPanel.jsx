import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Briefcase, Trophy, DollarSign, TrendingUp, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import XPProgressBar from '../dealornodeal/XPProgressBar';
import TrophyCabinet from '../dealornodeal/TrophyCabinet';

export default function DealOrNoDealPanel({ walletAddress }) {
    const { data: userGames = [], isLoading } = useQuery({
        queryKey: ['userDealGames', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('deal_or_no_deal_games').select('*').eq('wallet_address', walletAddress?.toLowerCase()).order('created_date', { ascending: false });
            return data || [];
        },
        enabled: !!walletAddress,
        staleTime: 0,
        refetchInterval: 5000
    });

    const { data: playerProfile } = useQuery({
        queryKey: ['playerProfileDashboard', walletAddress],
        queryFn: async () => {
            if (!walletAddress) return null;
            const { data } = await supabase.from('profiles').select('*').eq('wallet_address', walletAddress.toLowerCase());
            return data?.[0] || null;
        },
        enabled: !!walletAddress,
        staleTime: 0,
        refetchInterval: 10000
    });

    const totalGamesPlayed = userGames.length;
    const activeGames = userGames.filter(g => g.game_status === 'active').length;
    const completedGames = userGames.filter(g => g.game_status !== 'active').length;
    const totalSpent = userGames.reduce((sum, game) => sum + (game.entry_fee || 0), 0);
    const totalWon = userGames
        .filter(g => g.game_status !== 'active')
        .reduce((sum, game) => sum + (game.final_winnings || 0), 0);
    const netProfit = totalWon - totalSpent;

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-[#1a1f2e]/50 to-[#0f1420]/50 border border-white/10 rounded-2xl p-8 text-center">
                <p className="text-gray-400">Loading your games...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* XP Progress Bar */}
            {playerProfile && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Level Progress</h2>
                    <XPProgressBar totalXP={playerProfile.total_xp} />
                </div>
            )}

            {/* Trophy Cabinet */}
            {playerProfile && (
                <TrophyCabinet
                    walletAddress={walletAddress.toLowerCase()}
                    totalXP={playerProfile.total_xp}
                />
            )}

            {/* Game Statistics Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <Briefcase className="w-7 h-7 text-[#f5c96a]" />
                    Game Statistics
                </h2>
                <p className="text-gray-400">Your game statistics and history</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#f5c96a]/20 to-yellow-500/20 rounded-xl p-4 led-glow-gold"
                >
                    <Briefcase className="w-6 h-6 text-[#f5c96a] mb-2" />
                    <p className="text-gray-400 text-xs mb-1">Total Games</p>
                    <p className="text-white text-2xl font-bold">{totalGamesPlayed}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 led-glow-cyan"
                >
                    <TrendingUp className="w-6 h-6 text-cyan-400 mb-2" />
                    <p className="text-gray-400 text-xs mb-1">Active</p>
                    <p className="text-white text-2xl font-bold">{activeGames}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 led-glow-green"
                >
                    <Trophy className="w-6 h-6 text-green-400 mb-2" />
                    <p className="text-gray-400 text-xs mb-1">Completed</p>
                    <p className="text-white text-2xl font-bold">{completedGames}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-4 led-glow-red"
                >
                    <DollarSign className="w-6 h-6 text-red-400 mb-2" />
                    <p className="text-gray-400 text-xs mb-1">Total Spent</p>
                    <p className="text-white text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-4 led-glow-cyan"
                >
                    <Trophy className="w-6 h-6 text-cyan-400 mb-2" />
                    <p className="text-gray-400 text-xs mb-1">Total XP</p>
                    <p className="text-white text-2xl font-bold">{playerProfile?.total_xp?.toLocaleString() || 0}</p>
                </motion.div>
            </div>

            {/* Game History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-[#1a1f2e]/50 to-[#0f1420]/50 border border-white/10 rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-white mb-4">Recent Games</h3>

                {userGames.length === 0 ? (
                    <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">You haven't played any games yet</p>
                        <Link to={createPageUrl('DealOrNoDeal')}>
                            <Button className="bg-gradient-to-r from-[#f5c96a] to-yellow-600 hover:opacity-90 text-black font-bold">
                                Play Your First Game
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Date</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Case #</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Entry Fee</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Winnings</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Profit</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">TX Hash</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userGames.slice(0, 10).map((game) => {
                                    const profit = (game.final_winnings || 0) - game.entry_fee;
                                    return (
                                        <tr key={game.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3 px-4 text-gray-300 text-sm">
                                                {new Date(game.created_date).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-[#f5c96a] font-bold">
                                                #{game.player_case_number}
                                            </td>
                                            <td className="py-3 px-4 text-white">
                                                ${game.entry_fee.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${game.game_status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                                        game.game_status === 'deal_accepted' ? 'bg-purple-500/20 text-purple-400' :
                                                            'bg-green-500/20 text-green-400'
                                                    }`}>
                                                    {game.game_status === 'deal_accepted' ? 'Deal' : game.game_status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {game.game_status === 'active' ? (
                                                    <span className="text-gray-500">In Progress</span>
                                                ) : (
                                                    <span className="text-green-400 font-bold">
                                                        ${(game.final_winnings || 0).toFixed(2)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {game.game_status === 'active' ? (
                                                    <span className="text-gray-500">-</span>
                                                ) : (
                                                    <span className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-gray-300 font-mono text-xs">
                                                {game.tx_hash ? (
                                                    <a
                                                        href={`https://bscscan.com/tx/${game.tx_hash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-cyan-400 hover:text-cyan-300 underline"
                                                    >
                                                        {game.tx_hash.slice(0, 6)}...{game.tx_hash.slice(-4)}
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}