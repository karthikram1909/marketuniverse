import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Clock, TrendingUp } from 'lucide-react';
import { getCompletedLevelNumbers, XP_LEVELS } from './XPUtils';

export default function Leaderboard() {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // Fetch current active period
    const { data: activePeriod } = useQuery({
        queryKey: ['activeLeaderboardPeriod'],
        queryFn: async () => {
            const { data } = await supabase.from('leaderboard_periods').select('*').eq('status', 'active').order('created_date', { ascending: false }).limit(1);
            return data?.[0] || null;
        },
        staleTime: 300000,
        refetchInterval: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false
    });

    // Fetch player profiles for XP ranking
    const { data: allProfiles = [] } = useQuery({
        queryKey: ['allPlayerProfiles'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').order('total_xp', { ascending: false });
            return data || [];
        },
        staleTime: 60000,
        refetchInterval: false
    });



    // Calculate rankings by XP (top 10 players) - USE PROFILE DATA AS SOURCE OF TRUTH
    const rankings = React.useMemo(() => {
        // Use profiles as the single source of truth for XP and levels
        return allProfiles
            .map(profile => {
                // Get completed level (the highest level they've earned a trophy for)
                const completedLevelNumbers = getCompletedLevelNumbers(profile.total_xp);
                const completedLevel = completedLevelNumbers.length > 0
                    ? completedLevelNumbers[completedLevelNumbers.length - 1]
                    : 0;
                const completedLevelInfo = XP_LEVELS[completedLevel];

                return {
                    wallet_address: profile.wallet_address.toLowerCase(),
                    player_name: profile.player_name || 'Anonymous',
                    total_xp: profile.total_xp || 0,
                    total_games_played: profile.total_games_played || 0,
                    total_winnings: profile.total_winnings || 0,
                    current_level: completedLevel,
                    god_name: completedLevelInfo.name
                };
            })
            .sort((a, b) => b.total_xp - a.total_xp)
            .slice(0, 10);
    }, [allProfiles]);

    // Countdown timer and period check
    useEffect(() => {
        if (!activePeriod) return;

        // If paused, show frozen time and stop counting
        if (activePeriod.paused_at && activePeriod.frozen_time_remaining) {
            const distance = activePeriod.frozen_time_remaining;
            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
            return;
        }

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(activePeriod.end_date).getTime();
            const distance = end - now;

            if (distance < 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                // Trigger backend check when period ends
                supabase.functions.invoke('check-leaderboard-period', {}).catch(err =>
                    console.error('Failed to check leaderboard period:', err)
                );
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [activePeriod]);

    const getPodiumIcon = (rank) => {
        if (rank === 0) return <Trophy className="w-8 h-8 text-yellow-400" />;
        if (rank === 1) return <Award className="w-7 h-7 text-gray-400" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-orange-600" />;
        return null;
    };

    const getPrize = (rank) => {
        if (rank === 0) return '200 XRP';
        if (rank === 1) return '100 XRP';
        if (rank === 2) return '50 XRP';
        if (rank === 3 || rank === 4) return '25 XRP';
        if (rank >= 5 && rank <= 7) return '15 XRP';
        if (rank === 8 || rank === 9) return '10 XRP';
        return '-';
    };

    if (!activePeriod) {
        return (
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-purple-500/50 rounded-2xl p-8 text-center">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No active leaderboard period</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-purple-500/5 via-black/40 to-pink-600/5 backdrop-blur-xl border border-purple-500/20 rounded-3xl overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/5 opacity-50" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />

            {/* Header with Countdown */}
            <div className="relative z-10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                    <div>
                        <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                            <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
                            Leaderboard - Period #{activePeriod.period_number}
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">Top 10 players win XRP at the end of 30 days!</p>
                    </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        <span className="text-white font-semibold">
                            {activePeriod.paused_at ? '⏸️ Competition Paused' : 'Time Until Next Payout'}
                        </span>
                    </div>
                    {activePeriod.paused_at && (
                        <div className="mb-3 text-center">
                            <p className="text-yellow-400 text-sm">Timer is frozen by admin. Keep playing!</p>
                        </div>
                    )}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'Days', value: timeLeft.days },
                            { label: 'Hours', value: timeLeft.hours },
                            { label: 'Minutes', value: timeLeft.minutes },
                            { label: 'Seconds', value: timeLeft.seconds }
                        ].map((item) => (
                            <div key={item.label} className={`rounded-lg p-3 text-center ${activePeriod.paused_at ? 'bg-yellow-500/10' : 'bg-white/5'
                                }`}>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {item.value.toString().padStart(2, '0')}
                                </div>
                                <div className="text-xs text-gray-400">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Prize Pool */}
            <div className="relative z-10 p-4 sm:p-6 border-b border-white/10 space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center">
                        <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-yellow-400 mx-auto mb-2" />
                        <p className="text-yellow-400 text-lg sm:text-2xl font-bold">200 XRP</p>
                        <p className="text-gray-400 text-xs sm:text-sm">1st Place</p>
                    </div>
                    <div className="text-center">
                        <Award className="w-6 h-6 sm:w-9 sm:h-9 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-lg sm:text-2xl font-bold">100 XRP</p>
                        <p className="text-gray-400 text-xs sm:text-sm">2nd Place</p>
                    </div>
                    <div className="text-center">
                        <Medal className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mx-auto mb-2" />
                        <p className="text-orange-600 text-lg sm:text-2xl font-bold">50 XRP</p>
                        <p className="text-gray-400 text-xs sm:text-sm">3rd Place</p>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-3 text-center">
                    <p className="text-cyan-400 font-semibold text-sm">
                        4th-5th: <span className="text-white">25 XRP</span> |
                        6th-8th: <span className="text-white">15 XRP</span> |
                        9th-10th: <span className="text-white">10 XRP</span>
                    </p>
                    <p className="text-gray-400 text-xs mt-1">465 XRP total distributed monthly</p>
                </div>
            </div>

            {/* Rankings Table */}
            <div className="relative z-10 p-4 sm:p-6">
                {rankings.length === 0 ? (
                    <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No games played this period yet. Be the first!</p>
                    </div>
                ) : (
                    <div className="space-y-3 overflow-x-auto">
                        {rankings.map((player, index) => (
                            <div key={player.wallet_address}>
                                {/* Visual separator after top 3 */}
                                {index === 3 && (
                                    <div className="flex items-center gap-2 my-4">
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                                        <span className="text-cyan-400 text-xs font-semibold px-3">4th-5th Place • 25 XRP</span>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                                    </div>
                                )}
                                {/* Visual separator after 5th place */}
                                {index === 5 && (
                                    <div className="flex items-center gap-2 my-4">
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
                                        <span className="text-green-400 text-xs font-semibold px-3">6th-8th Place • 15 XRP</span>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
                                    </div>
                                )}
                                {/* Visual separator after 8th place */}
                                {index === 8 && (
                                    <div className="flex items-center gap-2 my-4">
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                                        <span className="text-blue-400 text-xs font-semibold px-3">9th-10th Place • 10 XRP</span>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                                    </div>
                                )}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl min-w-[320px] backdrop-blur-sm transition-all duration-300 ${index < 3
                                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20'
                                            : index >= 3 && index <= 4
                                                ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20'
                                                : index >= 5 && index <= 7
                                                    ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 hover:shadow-lg hover:shadow-green-500/20'
                                                    : index >= 8 && index <= 9
                                                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/20'
                                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-center w-10 sm:w-12 flex-shrink-0">
                                        {index < 3 ? (
                                            getPodiumIcon(index)
                                        ) : (
                                            <span className="text-xl sm:text-2xl font-bold text-gray-500">#{index + 1}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm sm:text-base truncate">
                                            {player.player_name || 'Anonymous'}
                                        </p>
                                        <p className="text-gray-400 text-xs font-mono">
                                            {player.wallet_address?.slice(0, 6) || ''}...{player.wallet_address?.slice(-4) || ''}
                                        </p>
                                        <p className="text-cyan-400 text-xs sm:text-sm font-semibold">
                                            {player.god_name} • Level {player.current_level}
                                        </p>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg sm:text-2xl font-bold text-cyan-400">
                                            {(player.total_xp || 0).toLocaleString()} XP
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            {player.total_games_played || 0} game{player.total_games_played !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {index < 10 && (
                                        <div className="text-right flex-shrink-0">
                                            <p className={`text-sm sm:text-lg font-bold ${index < 3 ? 'text-[#f5c96a]'
                                                    : index >= 3 && index <= 4 ? 'text-blue-400'
                                                        : index >= 5 && index <= 7 ? 'text-green-400'
                                                            : 'text-cyan-400'
                                                }`}>
                                                {getPrize(index)}
                                            </p>
                                            <p className="text-gray-400 text-xs">Prize</p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}