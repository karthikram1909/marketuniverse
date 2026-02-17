import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Briefcase, DollarSign, TrendingUp, Users, Calendar, Trophy, X, Trash2, Clock, Play, CreditCard, Lock, Unlock, Sparkles, RotateCcw } from 'lucide-react';
import { getCompletedLevelNumbers, XP_LEVELS } from '../dealornodeal/XPUtils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ConfirmResetModal from './ConfirmResetModal';
import TrophyManagement from './TrophyManagement';
import NFTSalesPanel from './NFTSalesPanel';
import ScatterWinsPanel from './ScatterWinsPanel';
import ManualPayoutsPanel from './ManualPayoutsPanel';

export default function DealOrNoDealPanel() {
    const [selectedGame, setSelectedGame] = useState(null);
    const [resetModal, setResetModal] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [xrpRate, setXrpRate] = useState('');
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [gameWalletAddress, setGameWalletAddress] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchWallet, setSearchWallet] = useState('');
    const [exactXP, setExactXP] = useState('');
    const itemsPerPage = 10;
    const queryClient = useQueryClient();

    const { data: allGames = [], isPending } = useQuery({
        queryKey: ['dealOrNoDealGames'],
        queryFn: async () => {
            const { data } = await supabase.from('deal_or_no_deal_games').select('*').order('created_date', { ascending: false }).limit(1000);
            return data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false,
        refetchInterval: false
    });

    const { data: activePeriod } = useQuery({
        queryKey: ['activeLeaderboardPeriod'],
        queryFn: async () => {
            const { data } = await supabase.from('leaderboard_periods').select('*').eq('status', 'active').order('created_date', { ascending: false }).limit(1);
            return data?.[0] || null;
        },
        staleTime: 60000,
        refetchOnWindowFocus: false,
        refetchInterval: false
    });

    const { data: allPeriods = [] } = useQuery({
        queryKey: ['allLeaderboardPeriods'],
        queryFn: async () => {
            const { data } = await supabase.from('leaderboard_periods').select('*').order('created_date', { ascending: false });
            return data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false,
        refetchInterval: false
    });

    const { data: allProfiles = [] } = useQuery({
        queryKey: ['allPlayerProfiles'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').order('total_xp', { ascending: false });
            return data || [];
        },
        staleTime: 60000,
        refetchOnWindowFocus: false,
        refetchInterval: false
    });

    // Get current user
    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
                return { ...user, ...profile };
            }
            return null;
        },
        staleTime: 300000,
        refetchOnWindowFocus: false,
        refetchInterval: false
    });

    // Set admin level mutation
    const setAdminLevelMutation = useMutation({
        mutationFn: async ({ targetLevel, exactXP }) => {
            const { data, error } = await supabase.functions.invoke('set-admin-player-level', {
                body: { targetLevel, exactXP }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['allPlayerProfiles'] });
            queryClient.invalidateQueries({ queryKey: ['playerTrophies'] });
            alert(`✅ ${data.message}\n\nTrophies Awarded: ${data.trophiesAwarded}`);
        },
        onError: (error) => {
            alert('❌ Failed to set level: ' + error.message);
        }
    });

    // Reset admin player mutation
    const resetAdminPlayerMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('set-admin-player-level', {
                body: { targetLevel: 0 }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allPlayerProfiles'] });
            queryClient.invalidateQueries({ queryKey: ['playerTrophies'] });
            setExactXP('');
            alert('✅ Admin player reset to Level 0!');
        },
        onError: (error) => {
            alert('❌ Failed to reset: ' + error.message);
        }
    });

    // Calculate top 3 players from PlayerProfile (single source of truth)
    const top3Players = React.useMemo(() => {
        // Use PlayerProfile as the ONLY source of truth
        return allProfiles
            .sort((a, b) => b.total_xp - a.total_xp)
            .slice(0, 3)
            .map(profile => {
                // Get completed level (the highest level they've earned a trophy for)
                const completedLevelNumbers = getCompletedLevelNumbers(profile.total_xp);
                const completedLevel = completedLevelNumbers.length > 0
                    ? completedLevelNumbers[completedLevelNumbers.length - 1]
                    : 0;
                const completedLevelInfo = XP_LEVELS[completedLevel];

                return {
                    wallet_address: profile.wallet_address,
                    player_name: profile.player_name || 'Anonymous',
                    total_xp: profile.total_xp,
                    total_games_played: profile.total_games_played,
                    total_winnings: profile.total_winnings,
                    current_level: completedLevel,
                    god_name: completedLevelInfo.name
                };
            });
    }, [allProfiles]);

    const { data: gameSettings } = useQuery({
        queryKey: ['gameSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('game_settings').select('*').eq('game_type', 'dealornodeal');
            return data?.[0] || { purchases_locked: false, game_wallet_address: null };
        },
        staleTime: 60000,
        refetchOnWindowFocus: false,
        refetchInterval: false
    });

    // Update local state when game settings change
    React.useEffect(() => {
        if (gameSettings?.game_wallet_address) {
            setGameWalletAddress(gameSettings.game_wallet_address);
        }
    }, [gameSettings]);

    const [entryFee, setEntryFee] = useState(1);

    React.useEffect(() => {
        if (gameSettings?.entry_fee !== undefined) {
            setEntryFee(gameSettings.entry_fee);
        }
    }, [gameSettings]);

    const deleteAllGamesMutation = useMutation({
        mutationFn: async () => {
            // Delete all games
            await supabase.from('deal_or_no_deal_games').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            // Delete all periods
            await supabase.from('leaderboard_periods').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            // Delete all profiles
            await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            // Delete all trophies
            await supabase.from('player_trophies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dealOrNoDealGames'] });
            queryClient.invalidateQueries({ queryKey: ['activeLeaderboardPeriod'] });
            queryClient.invalidateQueries({ queryKey: ['allLeaderboardPeriods'] });
            queryClient.invalidateQueries({ queryKey: ['playerProfile'] });
            queryClient.invalidateQueries({ queryKey: ['allPlayerProfiles'] });
            queryClient.invalidateQueries({ queryKey: ['playerTrophies'] });
            setResetModal(false);
        }
    });

    const deletePlayerDataMutation = useMutation({
        mutationFn: async (walletAddress) => {
            const wallet = walletAddress.toLowerCase();
            await supabase.from('deal_or_no_deal_games').delete().eq('wallet_address', wallet);
            await supabase.from('profiles').delete().eq('wallet_address', wallet);
            await supabase.from('player_trophies').delete().eq('wallet_address', wallet);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dealOrNoDealGames'] });
            queryClient.invalidateQueries({ queryKey: ['allPlayerProfiles'] });
            queryClient.invalidateQueries({ queryKey: ['playerTrophies'] });
        }
    });

    const startNewPeriodMutation = useMutation({
        mutationFn: async () => {
            // End current active period if exists
            if (activePeriod) {
                await supabase.from('leaderboard_periods').update({ status: 'completed' }).eq('id', activePeriod.id);
            }

            // Create new period
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            const periodNumber = allPeriods.length + 1;

            const { data } = await supabase.from('leaderboard_periods').insert({
                period_number: periodNumber,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active'
            }).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeLeaderboardPeriod'] });
            queryClient.invalidateQueries({ queryKey: ['allLeaderboardPeriods'] });
        }
    });

    const togglePauseMutation = useMutation({
        mutationFn: async ({ periodId, isPaused }) => {
            if (isPaused) {
                // Resume: calculate paused duration and extend end_date
                const { data: period } = await supabase.from('leaderboard_periods').select('*').eq('id', periodId).maybeSingle();
                if (!period?.paused_at) return;

                const pausedAt = new Date(period.paused_at);
                const now = new Date();
                const pausedDuration = now.getTime() - pausedAt.getTime();

                const currentEndDate = new Date(period.end_date);
                const newEndDate = new Date(currentEndDate.getTime() + pausedDuration);

                const { data } = await supabase.from('leaderboard_periods').update({
                    end_date: newEndDate.toISOString(),
                    paused_at: null,
                    frozen_time_remaining: null
                }).eq('id', periodId).select().single();
                return data;
            } else {
                // Pause: record current time and calculate frozen time remaining
                const { data: period } = await supabase.from('leaderboard_periods').select('*').eq('id', periodId).maybeSingle();
                if (!period) return;

                const now = new Date();
                const endDate = new Date(period.end_date);
                const timeRemaining = endDate.getTime() - now.getTime();

                const { data } = await supabase.from('leaderboard_periods').update({
                    paused_at: now.toISOString(),
                    frozen_time_remaining: timeRemaining
                }).eq('id', periodId).select().single();
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeLeaderboardPeriod'] });
            queryClient.invalidateQueries({ queryKey: ['allLeaderboardPeriods'] });
        }
    });

    const markPeriodPaidMutation = useMutation({
        mutationFn: async ({ periodId, xrpUsdRate }) => {
            const totalXRP = 350; // 200 + 100 + 50
            const totalUSD = totalXRP * parseFloat(xrpUsdRate);

            const { data: updated } = await supabase.from('leaderboard_periods').update({
                status: 'paid',
                paid_date: new Date().toISOString(),
                xrp_usd_rate: parseFloat(xrpUsdRate),
                total_paid_usd: totalUSD,
                winner_1st: top3Players[0]?.wallet_address,
                winner_2nd: top3Players[1]?.wallet_address,
                winner_3rd: top3Players[2]?.wallet_address,
                winner_1st_score: top3Players[0]?.total_xp || 0,
                winner_2nd_score: top3Players[1]?.total_xp || 0,
                winner_3rd_score: top3Players[2]?.total_xp || 0
            }).eq('id', periodId).select().single();

            // Create extensions for winners
            const prizes = [
                { profile: top3Players[0], xrp: 200, place: '1st' },
                { profile: top3Players[1], xrp: 100, place: '2nd' },
                { profile: top3Players[2], xrp: 50, place: '3rd' }
            ];

            const notifications = prizes
                .filter(p => p.profile?.wallet_address)
                .map(({ profile, xrp, place }) => ({
                    wallet_address: profile.wallet_address.toLowerCase(),
                    type: 'trade_completed',
                    title: `🏆 Leaderboard Winner - ${place} Place!`,
                    message: `Congratulations! You won ${xrp} XRP for finishing ${place} place in the monthly Deal or No Deal leaderboard!`,
                    amount: xrp * parseFloat(xrpUsdRate),
                    read: false
                }));

            if (notifications.length > 0) {
                await supabase.from('notifications').insert(notifications);
            }

            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeLeaderboardPeriod'] });
            queryClient.invalidateQueries({ queryKey: ['allLeaderboardPeriods'] });
            setPaymentModal(false);
            setXrpRate('');
        }
    });

    const [lockCooldown, setLockCooldown] = useState(false);

    const toggleGameLockMutation = useMutation({
        mutationFn: async (value) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!gameSettings?.id) {
                const { data } = await supabase.from('game_settings').insert({
                    game_type: 'dealornodeal',
                    purchases_locked: value
                }).select().single();
                return data;
            }
            const { data } = await supabase.from('game_settings').update({
                purchases_locked: value
            }).eq('id', gameSettings.id).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gameSettings'] });
            setLockCooldown(true);
            setTimeout(() => setLockCooldown(false), 3000);
        }
    });

    const updateGameWalletMutation = useMutation({
        mutationFn: async (walletAddress) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!gameSettings?.id) {
                const { data } = await supabase.from('game_settings').insert({
                    game_type: 'dealornodeal',
                    purchases_locked: false,
                    game_wallet_address: walletAddress
                }).select().single();
                return data;
            }
            const { data } = await supabase.from('game_settings').update({
                game_wallet_address: walletAddress
            }).eq('id', gameSettings.id).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gameSettings'] });
        }
    });

    const updateEntryFeeMutation = useMutation({
        mutationFn: async (fee) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!gameSettings?.id) {
                const { data } = await supabase.from('game_settings').insert({
                    game_type: 'dealornodeal',
                    entry_fee: fee,
                    purchases_locked: false
                }).select().single();
                return data;
            }
            const { data } = await supabase.from('game_settings').update({
                entry_fee: fee
            }).eq('id', gameSettings.id).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gameSettings'] });
        }
    });

    const totalRevenue = allGames.reduce((sum, game) => sum + (game.entry_fee || 0), 0);

    // Calculate total USD paid (sum of paid periods in USD)
    const totalPaidUSD = allPeriods
        .filter(p => p.status === 'paid')
        .reduce((sum, period) => sum + (period.total_paid_usd || 0), 0);

    const activeGames = allGames.filter(g => g.game_status === 'active').length;
    const completedGames = allGames.filter(g => g.game_status !== 'active').length;
    const totalPlayers = allGames.length; // Total games played = total players
    const netProfit = totalRevenue - totalPaidUSD;

    // Countdown timer
    useEffect(() => {
        if (!activePeriod) return;

        // If paused, show frozen time
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

    const isPeriodEnded = activePeriod && new Date().getTime() >= new Date(activePeriod.end_date).getTime();

    // Search and pagination logic
    const filteredGames = searchWallet
        ? allGames.filter(game => game.wallet_address.toLowerCase().includes(searchWallet.toLowerCase()))
        : allGames;
    const totalPages = Math.ceil(filteredGames.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedGames = filteredGames.slice(startIndex, startIndex + itemsPerPage);

    if (isLoading) {
        return (
            <div className="text-white text-center py-12">Loading games...</div>
        );
    }

    return (
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="overview">Overview & Games</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard Periods</TabsTrigger>
                <TabsTrigger value="trophies">Trophy Management</TabsTrigger>
                <TabsTrigger value="nft-sales">NFT Sales</TabsTrigger>
                <TabsTrigger value="scatter">Scatter Wins</TabsTrigger>
                <TabsTrigger value="manual-payouts">Manual Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
                {/* Admin Testing Tools */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-2xl p-6"
                >
                    <div className="flex items-start gap-4">
                        <Sparkles className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-purple-400 mb-2">🧪 Admin Testing Tools</h3>
                            <p className="text-white mb-4">
                                Test Deal or No Deal progression by setting your admin player to any level instantly.
                                This will award all trophies up to the selected level.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Set Exact XP */}
                                <div className="bg-black/30 rounded-xl p-4">
                                    <h4 className="text-white font-bold mb-3">Set Exact XP Amount</h4>
                                    <div className="space-y-3">
                                        <Input
                                            type="number"
                                            placeholder="e.g., 150000"
                                            value={exactXP}
                                            onChange={(e) => setExactXP(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                        <Button
                                            onClick={() => {
                                                const xp = parseInt(exactXP);
                                                if (isNaN(xp) || xp < 0) {
                                                    alert('Please enter a valid XP amount');
                                                    return;
                                                }
                                                if (confirm(`Set admin XP to ${xp.toLocaleString()}?\n\nLevel and god name will be calculated automatically based on this XP amount.\n\nAll trophies up to the calculated level will be awarded.\n\nContinue?`)) {
                                                    setAdminLevelMutation.mutate({ exactXP: xp });
                                                }
                                            }}
                                            disabled={setAdminLevelMutation.isPending || !exactXP}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white"
                                        >
                                            {setAdminLevelMutation.isPending ? 'Setting...' : 'Set Exact XP'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Reset Level */}
                                <div className="bg-black/30 rounded-xl p-4">
                                    <h4 className="text-white font-bold mb-3">Reset Admin Player</h4>
                                    <p className="text-gray-300 text-sm mb-3">
                                        Reset your admin player back to Level 0 (New God Born) with 0 XP.
                                    </p>
                                    <Button
                                        onClick={() => {
                                            if (confirm('Reset admin player to Level 0?\n\nThis will:\n• Set your XP to 0\n• Reset to Level 0 (New God Born)\n• Remove all progress\n• Keep existing trophies\n\nContinue?')) {
                                                resetAdminPlayerMutation.mutate();
                                            }
                                        }}
                                        disabled={resetAdminPlayerMutation.isPending}
                                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 text-white"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        {resetAdminPlayerMutation.isPending ? 'Resetting...' : 'Reset to Level 0'}
                                    </Button>
                                </div>
                            </div>

                            {currentUser && (() => {
                                const adminProfile = allProfiles.find(p => p.wallet_address?.toLowerCase() === currentUser.wallet_address?.toLowerCase());
                                return (
                                    <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                        <p className="text-blue-400 text-sm mb-2">
                                            <strong>Current Admin:</strong> {currentUser.wallet_address?.slice(0, 8)}...{currentUser.wallet_address?.slice(-6)}
                                        </p>
                                        {adminProfile && (
                                            <div className="flex items-center gap-4 pt-2 border-t border-blue-500/20">
                                                <div>
                                                    <p className="text-xs text-gray-400">Total XP</p>
                                                    <p className="text-cyan-400 font-bold">{(adminProfile.total_xp || 0).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Level</p>
                                                    <p className="text-purple-400 font-bold">{(() => {
                                                        const xp = adminProfile.total_xp || 0;
                                                        for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
                                                            if (i < XP_LEVELS.length - 1) {
                                                                if (xp >= XP_LEVELS[i + 1].xpRequired) return i;
                                                            } else if (xp >= XP_LEVELS[12].xpRequired) return 12;
                                                        }
                                                        return 0;
                                                    })()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">God Title</p>
                                                    <p className="text-[#f5c96a] font-bold">{adminProfile.god_name || 'New God Born'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </motion.div>

                {/* Game Settings Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Merge Duplicates Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6"
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <Users className="w-6 h-6 text-orange-400" />
                                Fix Duplicate Profiles
                            </h3>
                            <p className="text-gray-400 text-sm">Merge duplicate player profiles with same wallet address</p>
                        </div>
                        <Button
                            onClick={async () => {
                                if (!confirm('Merge all duplicate player profiles? This will combine their XP, games, and winnings.')) return;
                                try {
                                    const { data, error } = await supabase.functions.invoke('merge-duplicate-profiles', {});
                                    if (error) throw error;
                                    if (data?.success) {
                                        queryClient.invalidateQueries({ queryKey: ['dealOrNoDealGames'] });
                                        queryClient.invalidateQueries({ queryKey: ['allPlayerProfiles'] });
                                        alert(`Success! ${data.message}\n\nMerged profiles:\n${data.merged.map(m => `- ${m.player_name}: ${m.merged_from} profiles → ${m.new_total_xp.toLocaleString()} XP (${m.new_god_name})`).join('\n')}`);
                                    }
                                } catch (error) {
                                    alert('Failed to merge duplicates: ' + error.message);
                                }
                            }}
                            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/50 rounded-xl"
                        >
                            Merge Duplicate Profiles
                        </Button>
                    </motion.div>

                    {/* Entry Fee Configuration */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6"
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-blue-400" />
                                Entry Fee (USDT)
                            </h3>
                            <p className="text-gray-400 text-sm">Set the entry fee for each game</p>
                        </div>
                        <div className="flex gap-3">
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g., 1"
                                value={entryFee}
                                onChange={(e) => setEntryFee(parseFloat(e.target.value) || 0)}
                                className="bg-white/5 border-white/10 text-white flex-1"
                            />
                            <Button
                                onClick={() => updateEntryFeeMutation.mutate(entryFee)}
                                disabled={updateEntryFeeMutation.isPending || entryFee < 0}
                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateEntryFeeMutation.isPending ? 'Saving...' : 'Update Fee'}
                            </Button>
                        </div>
                        {gameSettings?.entry_fee !== undefined && (
                            <div className="mt-3 bg-white/5 rounded-xl p-3">
                                <p className="text-xs text-gray-400 mb-1">Current Entry Fee:</p>
                                <p className="text-white text-2xl font-bold">${gameSettings.entry_fee.toFixed(2)} USDT</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Game Wallet Address Configuration */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6"
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <DollarSign className="w-6 h-6 text-green-400" />
                                Game Payment Wallet
                            </h3>
                            <p className="text-gray-400 text-sm">Set the wallet address to receive game entry fees</p>
                        </div>
                        <div className="flex gap-3">
                            <Input
                                placeholder="Enter BEP-20 wallet address (e.g., 0x748D1fbC3CbEC5c1982926335eeBa27DcF843e3a1)"
                                value={gameWalletAddress}
                                onChange={(e) => setGameWalletAddress(e.target.value)}
                                className="bg-white/5 border-white/10 text-white flex-1 font-mono text-sm"
                            />
                            <Button
                                onClick={() => updateGameWalletMutation.mutate(gameWalletAddress)}
                                disabled={updateGameWalletMutation.isPending || !gameWalletAddress}
                                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateGameWalletMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                        {gameSettings?.game_wallet_address && (
                            <div className="mt-3 bg-white/5 rounded-xl p-3">
                                <p className="text-xs text-gray-400 mb-1">Current Wallet:</p>
                                <p className="text-white font-mono text-xs break-all">{gameSettings.game_wallet_address}</p>
                            </div>
                        )}
                        {!gameSettings?.game_wallet_address && (
                            <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                <p className="text-red-400 text-sm">
                                    ⚠️ No wallet address configured. Players cannot pay to start games until you set this.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Game Lock Control */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-[#f5c96a]" />
                                Game Access Control
                            </h3>
                            <p className="text-gray-400 text-sm">Lock or unlock new game purchases</p>
                        </div>
                        <Button
                            onClick={() => toggleGameLockMutation.mutate(!gameSettings?.purchases_locked)}
                            disabled={toggleGameLockMutation.isPending || lockCooldown}
                            className={`${gameSettings?.purchases_locked
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50'
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/50'
                                } border px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {lockCooldown ? (
                                <>
                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                    Please wait...
                                </>
                            ) : gameSettings?.purchases_locked ? (
                                <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Games Locked
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Games Open
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Admin Testing Toggle */}
                    <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                        <div>
                            <p className="text-white font-semibold mb-1 flex items-center gap-2">
                                <Users className="w-4 h-4 text-cyan-400" />
                                Allow Admin Testing During Lock
                            </p>
                            <p className="text-gray-400 text-xs">
                                When enabled, admins can test games even when locked for users
                            </p>
                        </div>
                        <Button
                            onClick={async () => {
                                const newValue = !gameSettings?.allow_admin_during_lock;
                                if (!gameSettings?.id) {
                                    await supabase.from('game_settings').insert({
                                        game_type: 'dealornodeal',
                                        purchases_locked: gameSettings?.purchases_locked || false,
                                        allow_admin_during_lock: newValue
                                    });
                                } else {
                                    await supabase.from('game_settings').update({
                                        allow_admin_during_lock: newValue
                                    }).eq('id', gameSettings.id);
                                }
                                queryClient.invalidateQueries({ queryKey: ['gameSettings'] });
                            }}
                            className={`${gameSettings?.allow_admin_during_lock
                                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/50'
                                : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/20'
                                } border px-4 py-2 rounded-lg text-sm`}
                        >
                            {gameSettings?.allow_admin_during_lock ? 'Enabled' : 'Disabled'}
                        </Button>
                    </div>

                    {
                        gameSettings?.purchases_locked && !gameSettings?.allow_admin_during_lock && (
                            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                <p className="text-red-400 text-sm">
                                    ⚠️ New games are currently locked. Players cannot start new games until you unlock.
                                </p>
                            </div>
                        )
                    }

                    {
                        gameSettings?.purchases_locked && gameSettings?.allow_admin_during_lock && (
                            <div className="mt-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                                <p className="text-cyan-400 text-sm">
                                    ✓ Games locked for users, but admins can test. Regular users see "Games Locked" message.
                                </p>
                            </div>
                        )
                    }
                </motion.div >

                {/* Leaderboard with Countdown */}
                {
                    activePeriod && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border-2 border-purple-500/50"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                                        <Trophy className="w-7 h-7 text-yellow-400" />
                                        Current Leaderboard - Period #{activePeriod.period_number}
                                    </h3>
                                    <p className="text-gray-400">Top 3 players will win XRP prizes</p>
                                </div>
                            </div>

                            {/* Countdown Timer */}
                            <div className="bg-black/30 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <Clock className="w-5 h-5 text-cyan-400" />
                                    <span className="text-white font-semibold">
                                        {isPeriodEnded ? 'Period Ended - Pay Winners' : 'Time Until Period Ends'}
                                    </span>
                                </div>
                                {!isPeriodEnded ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { label: 'Days', value: timeLeft.days },
                                            { label: 'Hours', value: timeLeft.hours },
                                            { label: 'Minutes', value: timeLeft.minutes },
                                            { label: 'Seconds', value: timeLeft.seconds }
                                        ].map((item) => (
                                            <div key={item.label} className="bg-white/5 rounded-lg p-3 text-center">
                                                <div className="text-3xl font-bold text-white mb-1">
                                                    {item.value.toString().padStart(2, '0')}
                                                </div>
                                                <div className="text-xs text-gray-400">{item.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Button
                                            onClick={() => setPaymentModal(true)}
                                            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-xl"
                                        >
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Pay Winners & Record Payment
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Top 3 Leaderboard */}
                            <div className="grid md:grid-cols-3 gap-4">
                                {top3Players.map((player, index) => (
                                    <motion.div
                                        key={player.wallet_address}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`rounded-xl p-6 text-center ${index === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/50' :
                                            index === 1 ? 'bg-gradient-to-br from-gray-400/20 to-slate-400/20 border-2 border-gray-400/50' :
                                                'bg-gradient-to-br from-orange-600/20 to-amber-700/20 border-2 border-orange-600/50'
                                            }`}
                                    >
                                        <div className="mb-4">
                                            {index === 0 ? <Trophy className="w-12 h-12 text-yellow-400 mx-auto" /> :
                                                index === 1 ? <Trophy className="w-10 h-10 text-gray-400 mx-auto" /> :
                                                    <Trophy className="w-9 h-9 text-orange-600 mx-auto" />}
                                        </div>
                                        <p className="text-2xl font-bold mb-2 text-white">
                                            {index === 0 ? '1st Place' : index === 1 ? '2nd Place' : '3rd Place'}
                                        </p>
                                        <p className="text-white font-semibold mb-2">{player.player_name || 'Anonymous'}</p>
                                        <p className="text-gray-400 text-xs font-mono mb-3">
                                            {player.wallet_address?.slice(0, 6)}...{player.wallet_address?.slice(-4)}
                                        </p>
                                        <p className="text-cyan-400 text-xl font-bold mb-1">
                                            {(player.total_xp || 0).toLocaleString()} XP
                                        </p>
                                        <p className="text-[#f5c96a] text-2xl font-bold">
                                            {index === 0 ? '200 XRP' : index === 1 ? '100 XRP' : '50 XRP'}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Full Leaderboard Table */}
                            <div className="mt-8">
                                <h4 className="text-xl font-bold text-white mb-4">Complete Rankings</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rank</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Player</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Total XP</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Level</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">God Title</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Games Played</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Total Winnings</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allProfiles
                                                .sort((a, b) => b.total_xp - a.total_xp)
                                                .map((profile, index) => {
                                                    const rank = index + 1;
                                                    const isTop3 = rank <= 3;
                                                    const isTop10 = rank <= 10;

                                                    // Get completed level (not in-progress level)
                                                    const completedLevelNumbers = getCompletedLevelNumbers(profile.total_xp);
                                                    const completedLevel = completedLevelNumbers.length > 0
                                                        ? completedLevelNumbers[completedLevelNumbers.length - 1]
                                                        : 0;
                                                    const completedLevelInfo = XP_LEVELS[completedLevel];

                                                    return (
                                                        <tr
                                                            key={profile.id}
                                                            className={`border-b border-white/5 hover:bg-white/5 ${isTop3 ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10' :
                                                                isTop10 ? 'bg-gradient-to-r from-purple-500/5 to-pink-500/5' : ''
                                                                }`}
                                                        >
                                                            <td className="py-3 px-4">
                                                                <span className={`font-bold text-lg ${rank === 1 ? 'text-yellow-400' :
                                                                    rank === 2 ? 'text-gray-400' :
                                                                        rank === 3 ? 'text-orange-600' :
                                                                            isTop10 ? 'text-purple-400' :
                                                                                'text-gray-500'
                                                                    }`}>
                                                                    #{rank}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-white font-medium">
                                                                {profile.player_name || 'Anonymous'}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-400 font-mono text-sm">
                                                                {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="text-cyan-400 font-bold">
                                                                    {(profile.total_xp || 0).toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg font-bold">
                                                                    {completedLevel}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-[#f5c96a] font-semibold">
                                                                {completedLevelInfo.name}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-300">
                                                                {profile.total_games_played || 0}
                                                            </td>
                                                            <td className="py-3 px-4 text-green-400 font-bold">
                                                                ${(profile.total_winnings || 0).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (confirm(`Delete ALL data for ${profile.player_name}? This will remove their games, profile, and trophies.`)) {
                                                                            deletePlayerDataMutation.mutate(profile.wallet_address);
                                                                        }
                                                                    }}
                                                                    disabled={deletePlayerDataMutation.isPending}
                                                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )
                }

                {/* Stats */}
                <div className="grid md:grid-cols-5 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-[#f5c96a]/20 to-yellow-500/20 rounded-2xl p-6 led-glow-gold"
                    >
                        <Briefcase className="w-8 h-8 text-[#f5c96a] mb-3" />
                        <p className="text-gray-400 text-sm mb-1">Total Games</p>
                        <p className="text-white text-3xl font-bold">{allGames.length}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 led-glow-green"
                    >
                        <DollarSign className="w-8 h-8 text-green-400 mb-3" />
                        <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                        <p className="text-white text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl p-6 led-glow-red"
                    >
                        <TrendingUp className="w-8 h-8 text-red-400 mb-3" />
                        <p className="text-gray-400 text-sm mb-1">Total Paid Out</p>
                        <p className="text-white text-3xl font-bold">${totalPaidUSD.toFixed(2)}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 led-glow-cyan"
                    >
                        <Users className="w-8 h-8 text-cyan-400 mb-3" />
                        <p className="text-gray-400 text-sm mb-1">Total Players</p>
                        <p className="text-white text-3xl font-bold">{totalPlayers}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 led-glow-purple"
                    >
                        <Trophy className="w-8 h-8 text-purple-400 mb-3" />
                        <p className="text-gray-400 text-sm mb-1">Net Profit</p>
                        <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${netProfit.toFixed(2)}
                        </p>
                    </motion.div>
                </div>

                {/* Games Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                >
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-[#f5c96a]" />
                                All Game Transactions ({filteredGames.length}{searchWallet && ` of ${allGames.length}`})
                            </h3>
                            <Button
                                onClick={() => setResetModal(true)}
                                disabled={deleteAllGamesMutation.isPending}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Reset All Games
                            </Button>
                        </div>
                        <Input
                            placeholder="Search by wallet address..."
                            value={searchWallet}
                            onChange={(e) => {
                                setSearchWallet(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Player</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Case #</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Entry Fee</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Winnings</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">XP Earned</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">TX Hash</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedGames.map((game) => (
                                    <tr key={game.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-gray-300 text-sm">
                                            {new Date(game.created_date).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-white font-medium">
                                            {game.player_name}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 font-mono text-sm">
                                            {game.wallet_address.slice(0, 6)}...{game.wallet_address.slice(-4)}
                                        </td>
                                        <td className="py-3 px-4 text-[#f5c96a] font-bold">
                                            #{game.player_case_number}
                                        </td>
                                        <td className="py-3 px-4 text-green-400 font-bold">
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
                                                <span className="text-gray-500">-</span>
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
                                                <span className="text-cyan-400 font-bold">
                                                    {(game.xp_earned || 0).toLocaleString()} XP
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
                                                    {game.tx_hash.slice(0, 8)}...
                                                </a>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Button
                                                size="sm"
                                                onClick={() => setSelectedGame(game)}
                                                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                                            >
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {allGames.length === 0 && (
                                    <tr>
                                        <td colSpan="10" className="py-8 text-center text-gray-500">
                                            No games played yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 px-4">
                            <div className="text-gray-400 text-sm">
                                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredGames.length)} of {filteredGames.length} games
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </Button>
                                <div className="flex gap-1">
                                    {(() => {
                                        const pageNumbers = [];
                                        const showEllipsis = totalPages > 7;

                                        if (!showEllipsis) {
                                            for (let i = 1; i <= totalPages; i++) {
                                                pageNumbers.push(i);
                                            }
                                        } else {
                                            pageNumbers.push(1);

                                            if (currentPage <= 3) {
                                                pageNumbers.push(2, 3, 4, '...', totalPages);
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNumbers.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                            } else {
                                                pageNumbers.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                            }
                                        }

                                        return pageNumbers.map((page, idx) => {
                                            if (page === '...') {
                                                return (
                                                    <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-500">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return (
                                                <Button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`${currentPage === page
                                                        ? 'bg-[#f5c96a] text-black'
                                                        : 'bg-white/5 hover:bg-white/10 text-white'
                                                        } border border-white/10 min-w-[40px]`}
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        });
                                    })()}
                                </div>
                                <Button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Game Details Modal */}
                {
                    selectedGame && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedGame(null)}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-[#f5c96a] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <Briefcase className="w-6 h-6 text-[#f5c96a]" />
                                        Game Details
                                    </h3>
                                    <button
                                        onClick={() => setSelectedGame(null)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <p className="text-gray-400 text-sm mb-1">Player</p>
                                            <p className="text-white font-bold">{selectedGame.player_name}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <p className="text-gray-400 text-sm mb-1">Date</p>
                                            <p className="text-white font-bold">
                                                {new Date(selectedGame.created_date).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-gray-400 text-sm mb-1">Wallet Address</p>
                                        <p className="text-white font-mono text-sm">{selectedGame.wallet_address}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <p className="text-gray-400 text-sm mb-1">Entry Fee</p>
                                            <p className="text-green-400 font-bold text-xl">${selectedGame.entry_fee.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <p className="text-gray-400 text-sm mb-1">Final Winnings</p>
                                            <p className="text-green-400 font-bold text-xl">
                                                {selectedGame.final_winnings ? `$${selectedGame.final_winnings.toFixed(2)}` : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <p className="text-gray-400 text-sm mb-1">Player Case</p>
                                            <p className="text-[#f5c96a] font-bold text-xl">#{selectedGame.player_case_number}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4">
                                            <p className="text-gray-400 text-sm mb-1">Case Amount</p>
                                            <p className="text-[#f5c96a] font-bold text-xl">${selectedGame.player_case_amount.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-gray-400 text-sm mb-1">Game Status</p>
                                        <p className="text-white font-bold capitalize">{selectedGame.game_status}</p>
                                    </div>

                                    {selectedGame.game_status !== 'active' && selectedGame.deal_accepted_at_round && (
                                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                                            <p className="text-gray-400 text-sm mb-1">Deal Accepted</p>
                                            <p className="text-purple-400 font-bold">Round {selectedGame.deal_accepted_at_round}</p>
                                        </div>
                                    )}

                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-gray-400 text-sm mb-3">Banker Offers History</p>
                                        {selectedGame.banker_offers && selectedGame.banker_offers.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                {selectedGame.banker_offers.map((offer, idx) => (
                                                    <div key={idx} className="bg-white/5 rounded-lg p-2 text-center">
                                                        <p className="text-gray-400 text-xs">Round {offer.round}</p>
                                                        <p className="text-white font-bold">${offer.offer.toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No banker offers yet</p>
                                        )}
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4">
                                        <p className="text-gray-400 text-sm mb-1">Transaction Hash</p>
                                        {selectedGame.tx_hash ? (
                                            <a
                                                href={`https://bscscan.com/tx/${selectedGame.tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-cyan-400 hover:text-cyan-300 underline font-mono text-sm break-all"
                                            >
                                                {selectedGame.tx_hash}
                                            </a>
                                        ) : (
                                            <p className="text-gray-500">-</p>
                                        )}
                                    </div>

                                    {/* All Briefcases Display */}
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                                        <p className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            All 26 Briefcases (Admin View)
                                        </p>
                                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                            {selectedGame.case_amounts?.map((amount, index) => {
                                                const caseNumber = index + 1;
                                                const isPlayerCase = caseNumber === selectedGame.player_case_number;
                                                const isOpened = selectedGame.opened_cases?.includes(caseNumber);
                                                return (
                                                    <div
                                                        key={caseNumber}
                                                        className={`relative rounded-lg p-2 text-center transition-all ${isPlayerCase
                                                            ? 'bg-[#f5c96a]/30 border-2 border-[#f5c96a] ring-2 ring-[#f5c96a]/50'
                                                            : isOpened
                                                                ? 'bg-red-500/20 border border-red-500/50 opacity-60'
                                                                : 'bg-white/5 border border-white/20'
                                                            }`}
                                                    >
                                                        {isPlayerCase && (
                                                            <div className="absolute -top-2 -right-2 bg-[#f5c96a] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                                ★
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-gray-400 mb-0.5">#{caseNumber}</p>
                                                        <p className={`font-bold text-xs ${isPlayerCase ? 'text-[#f5c96a]' :
                                                            amount >= 100000 ? 'text-green-400' :
                                                                amount >= 10000 ? 'text-cyan-400' :
                                                                    'text-white'
                                                            }`}>
                                                            ${amount.toLocaleString()}
                                                        </p>
                                                        {isOpened && (
                                                            <p className="text-xs text-red-400 mt-0.5">Opened</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-[#f5c96a] rounded border-2 border-[#f5c96a]"></div>
                                                <span className="text-gray-400">Player's Case</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-red-500/20 rounded border border-red-500/50"></div>
                                                <span className="text-gray-400">Opened</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-white/5 rounded border border-white/20"></div>
                                                <span className="text-gray-400">Unopened</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {/* Reset Confirmation Modal */}
                <ConfirmResetModal
                    isOpen={resetModal}
                    onClose={() => setResetModal(false)}
                    onConfirm={() => deleteAllGamesMutation.mutate()}
                    title="Delete All Deal or No Deal Data?"
                    description="This will permanently delete ALL game records and leaderboard periods. This action cannot be undone."
                    isLoading={deleteAllGamesMutation.isPending}
                />

                {/* Payment Modal */}
                <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
                    <DialogContent className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-green-500/50 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-green-400" />
                                Record XRP Payment
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-gray-400 text-sm mb-2">Prize Distribution</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">1st Place:</span>
                                        <span className="text-yellow-400 font-bold">200 XRP</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">2nd Place:</span>
                                        <span className="text-gray-400 font-bold">100 XRP</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">3rd Place:</span>
                                        <span className="text-orange-600 font-bold">50 XRP</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-white/10">
                                        <span className="text-white font-semibold">Total:</span>
                                        <span className="text-[#f5c96a] font-bold">350 XRP</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-white text-sm font-semibold mb-2 block">
                                    XRP to USD Exchange Rate
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 2.45"
                                    value={xrpRate}
                                    onChange={(e) => setXrpRate(e.target.value)}
                                    className="bg-white/10 border-white/20 text-white"
                                />
                                <p className="text-gray-400 text-xs mt-1">
                                    Enter current XRP/USD rate to calculate total in dollars
                                </p>
                            </div>
                            {xrpRate && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                    <p className="text-gray-400 text-sm mb-1">Total Payment (USD)</p>
                                    <p className="text-green-400 text-3xl font-bold">
                                        ${(350 * parseFloat(xrpRate)).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPaymentModal(false);
                                    setXrpRate('');
                                }}
                                className="border-white/20 text-white hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (xrpRate && parseFloat(xrpRate) > 0) {
                                        markPeriodPaidMutation.mutate({
                                            periodId: activePeriod.id,
                                            xrpUsdRate: xrpRate
                                        });
                                    }
                                }}
                                disabled={!xrpRate || parseFloat(xrpRate) <= 0 || markPeriodPaidMutation.isPending}
                                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
                            >
                                <Trophy className="w-4 h-4 mr-2" />
                                {markPeriodPaidMutation.isPending ? 'Recording...' : 'Confirm Payment'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog >
            </TabsContent >

            <TabsContent value="leaderboard">
                <LeaderboardSection
                    activePeriod={activePeriod}
                    allPeriods={allPeriods}
                    startNewPeriodMutation={startNewPeriodMutation}
                    markPeriodPaidMutation={markPeriodPaidMutation}
                    togglePauseMutation={togglePauseMutation}
                />
            </TabsContent>

            <TabsContent value="trophies">
                <TrophyManagement />
            </TabsContent>

            <TabsContent value="nft-sales">
                <NFTSalesPanel />
            </TabsContent>

            <TabsContent value="scatter">
                <ScatterWinsPanel />
            </TabsContent>

            <TabsContent value="manual-payouts">
                <ManualPayoutsPanel />
            </TabsContent>
        </Tabs >
    );
}

function LeaderboardSection({ activePeriod, allPeriods, startNewPeriodMutation, markPeriodPaidMutation, togglePauseMutation }) {
    const completedPeriods = allPeriods.filter(p => p.status !== 'active');
    const isPaused = activePeriod?.paused_at ? true : false;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border-2 border-purple-500/50"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                        <Clock className="w-7 h-7 text-purple-400" />
                        Leaderboard Period Control
                    </h3>
                    <p className="text-gray-400">Manage 30-day leaderboard periods and XRP prizes</p>
                </div>
            </div>

            {activePeriod ? (
                <div className="bg-black/30 rounded-xl p-6 space-y-4">
                    {isPaused && (
                        <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
                                <p className="text-yellow-400 font-bold text-lg">⏸️ PERIOD PAUSED</p>
                            </div>
                            <p className="text-gray-300 text-sm">
                                Competition timer is paused. Players can still play, but the countdown is frozen.
                                Paused since: {new Date(activePeriod.paused_at).toLocaleString()}
                            </p>
                        </div>
                    )}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">Period Number</p>
                            <p className="text-white text-2xl font-bold">#{activePeriod.period_number}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">Start Date</p>
                            <p className="text-white font-bold">
                                {new Date(activePeriod.start_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">End Date</p>
                            <p className="text-white font-bold">
                                {new Date(activePeriod.end_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <Button
                            onClick={() => togglePauseMutation.mutate({ periodId: activePeriod.id, isPaused })}
                            disabled={togglePauseMutation.isPending}
                            className={`${isPaused
                                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/50'
                                : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/50'
                                } border rounded-xl`}
                        >
                            {isPaused ? (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Resume Period (Extend Deadline)
                                </>
                            ) : (
                                <>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Pause Period
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => markPeriodPaidMutation.mutate(activePeriod.id)}
                            disabled={markPeriodPaidMutation.isPending || isPaused}
                            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-xl disabled:opacity-50"
                        >
                            <Trophy className="w-4 h-4 mr-2" />
                            Mark Winners Paid & End Period
                        </Button>
                        <Button
                            onClick={() => startNewPeriodMutation.mutate()}
                            disabled={startNewPeriodMutation.isPending || isPaused}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 rounded-xl disabled:opacity-50"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Start New Period (Reset Clock)
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No active period. Start a new 30-day period.</p>
                    <Button
                        onClick={() => startNewPeriodMutation.mutate()}
                        disabled={startNewPeriodMutation.isPending}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 rounded-xl"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        {startNewPeriodMutation.isPending ? 'Starting...' : 'Start New Period'}
                    </Button>
                </div>
            )}

            {/* Completed Periods */}
            {completedPeriods.length > 0 && (
                <div className="mt-8">
                    <h4 className="text-xl font-bold text-white mb-4">Completed Periods</h4>
                    <div className="space-y-3">
                        {completedPeriods.map((period) => (
                            <div key={period.id} className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-white font-semibold">Period #{period.period_number}</h5>
                                    <span className={`px-3 py-1 rounded-full text-sm ${period.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {period.status}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}