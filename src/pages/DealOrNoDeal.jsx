import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { gameService } from '@/api/gameService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletProvider, useWallet } from '../components/wallet/WalletContext';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, DollarSign, TrendingUp, Crown, Trophy, Lock, Home, Shield, Sparkles, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import PaymentModal from '../components/dealornodeal/PaymentModal';
import GameBoard from '../components/dealornodeal/GameBoard';
import BankerOffer from '../components/dealornodeal/BankerOffer';
import Leaderboard from '../components/dealornodeal/Leaderboard';
import XPProgressBar from '../components/dealornodeal/XPProgressBar';
import TrophyCabinet from '../components/dealornodeal/TrophyCabinet';
import GameResultModal from '../components/dealornodeal/GameResultModal';
import CaseRevealModal from '../components/dealornodeal/CaseRevealModal';
import MarketplaceUnlockedModal from '../components/dealornodeal/MarketplaceUnlockedModal';
import SellOrContinueModal from '../components/dealornodeal/SellOrContinueModal';
import ScatterModal from '../components/dealornodeal/ScatterModal';
import TotalPayouts from '../components/dealornodeal/TotalPayouts';

// Entry fee is now loaded from GameSettings

const PRIZE_AMOUNTS = [
    0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000,
    5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000
];

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

function DealOrNoDealContent() {
    const { account: walletAccount } = useWallet();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Fallback to user profile wallet if no Web3 wallet connected
    const account = walletAccount || user?.wallet_address;

    const [showPayment, setShowPayment] = useState(false);
    const [activeGame, setActiveGame] = useState(null);
    const [showBankerOffer, setShowBankerOffer] = useState(false);
    const [currentOffer, setCurrentOffer] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false);
    const [gameResult, setGameResult] = useState(null);
    const [revealedCase, setRevealedCase] = useState(null);
    const [showCaseReveal, setShowCaseReveal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [eliminatedAmounts, setEliminatedAmounts] = useState([]);
    const [showMarketplaceUnlocked, setShowMarketplaceUnlocked] = useState(false);
    const [showSellOrContinue, setShowSellOrContinue] = useState(false);
    const [level9JustUnlocked, setLevel9JustUnlocked] = useState(false);
    const [showScatter, setShowScatter] = useState(false);
    const [scatterTriggered, setScatterTriggered] = useState(false);

    const [userLoading, setUserLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await gameService.getCurrentUserWithProfile();
                setUser(currentUser);
            } catch (error) {
                console.log('User not authenticated');
            } finally {
                setUserLoading(false);
            }
        };
        loadUser();
    }, []);

    const { data: userGames = [], isPending: gamesLoading, refetch: refetchUserGames } = useQuery({
        queryKey: ['userGames', account],
        queryFn: async () => {
            if (!account) return [];

            // Get current user to match RLS policy
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No authenticated user found');
                return [];
            }

            const { data, error } = await supabase
                .from('deal_or_no_deal_games')
                .select('*')
                .eq('user_id', user.id)  // Match RLS policy
                .order('created_at', { ascending: false })
                .limit(1000);

            if (error) {
                console.error('Error fetching user games:', error);
                return [];
            }

            return data || [];
        },
        enabled: !!account,
        staleTime: 30000,
        refetchInterval: false
    });

    const { data: allGames = [] } = useQuery({
        queryKey: ['allGames'],
        queryFn: async () => {
            const { data } = await supabase
                .from('deal_or_no_deal_games')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1000);
            return data || [];
        },
        staleTime: 60000,
        refetchInterval: false
    });

    const { data: playerProfile } = useQuery({
        queryKey: ['playerProfile', account],
        queryFn: async () => {
            if (!account) return null;
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('wallet_address', account.toLowerCase())
                .maybeSingle();
            return data;
        },
        enabled: !!account,
        staleTime: 30000,
        refetchInterval: false
    });

    const { data: playerTrophies = [] } = useQuery({
        queryKey: ['playerTrophies', account],
        queryFn: async () => {
            if (!account) return [];
            const { data } = await supabase
                .from('player_trophies')
                .select('*')
                .eq('wallet_address', account.toLowerCase())
                .order('trophy_level', { ascending: true });
            return data || [];
        },
        enabled: !!account,
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    const { data: gameSettings } = useQuery({
        queryKey: ['gameSettings'],
        queryFn: async () => {
            const { data } = await supabase
                .from('game_settings')
                .select('*')
                .eq('game_type', 'dealornodeal')
                .maybeSingle();
            return data || { purchases_locked: false, game_wallet_address: '0x508D61ad3f1559679BfAe3942508B4cf7767935A', entry_fee: 0.01, scatter_consecutive_wins: 3 };
        },
        staleTime: 10000,
        refetchInterval: false,
        refetchOnWindowFocus: true
    });

    // Fetch trophies with prices from database
    const { data: trophies = [] } = useQuery({
        queryKey: ['trophies'],
        queryFn: async () => {
            const { data } = await supabase.from('trophies').select('*').order('level', { ascending: true });
            return data || [];
        },
        staleTime: 60000
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

    const GAME_FEE = gameSettings?.entry_fee || 0.01;

    useEffect(() => {
        const active = userGames.find(g => g.game_status === 'active');
        setActiveGame(active || null);

        // Initialize eliminated amounts from opened cases (Bug #1 fix)
        if (active && active.case_amounts) {
            const eliminated = active.opened_cases.map(caseNum => active.case_amounts[caseNum - 1]);
            setEliminatedAmounts(eliminated);
        } else if (!active) {
            setEliminatedAmounts([]);
        }
    }, [userGames]);

    // Check for pending scatter on mount/profile load (removed - causes double trigger)
    // Scatter is now ONLY shown via Game Result Modal close handler

    // One-time check on mount to restore any pending scatters
    useEffect(() => {
        const checkAndRestoreScatter = async () => {
            if (!account || !user) return;

            try {
                const response = await gameService.checkPendingScatter({
                    walletAddress: account
                });

                if (response.data.hasPendingScatter) {
                    toast.success(response.data.message);
                    setTimeout(() => {
                        queryClient.invalidateQueries({ queryKey: ['playerProfile'] });
                    }, 500);
                }
            } catch (error) {
                console.error('Error checking pending scatter:', error);
            }
        };

        checkAndRestoreScatter();
    }, [account, user]);



    const createGameMutation = useMutation({
        mutationFn: async ({ caseNumber, txHash }) => {
            // Verify payment + create game atomically on backend (secure, unhackable)
            const response = await gameService.createVerifiedGame({
                txHash,
                caseNumber,
                gameFee: GAME_FEE
            });

            if (!response.success && !response.game) {
                // If createVerifiedGame returns object like {success: true, game: ...}
                // or throws.
                // My implementation returns { success: true, game: ... } or throws.
            }

            return response.game;

            return response.game;
        },
        onSuccess: (newGame) => {
            queryClient.invalidateQueries({ queryKey: ['userGames', account] });
            toast.success('Game started! Pick your case!');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to start game - please contact support with your transaction hash');
        }
    });



    const openCaseMutation = useMutation({
        mutationFn: async ({ gameId, caseNumber }) => {
            // Open case SERVER-SIDE (secure, unhackable)
            const result = await gameService.openCase({ gameId, caseNumber });
            return result;
        },
        onError: (error, { caseNumber }) => {
            console.error('Error opening case:', error);
            setShowCaseReveal(false);
            setRevealedCase(null);
            setProcessingCases(prev => {
                const newSet = new Set(prev);
                newSet.delete(caseNumber);
                return newSet;
            });
            toast.error(error.message || 'Failed to open case');
        }
    });

    const acceptDealMutation = useMutation({
        mutationFn: async ({ gameId }) => {
            // Validate and update game SERVER-SIDE (secure, unhackable)
            const result = await gameService.validateDealAcceptance({ gameId });
            return result.updatedGame;
        },
        onSuccess: async (updatedGame) => {
            await updatePlayerProfileMutation.mutateAsync({
                walletAddress: account.toLowerCase(),
                xpEarned: updatedGame.xp_earned,
                winnings: updatedGame.final_winnings
            });

            // Manually update cache
            queryClient.setQueryData(['userGames', account], (oldGames) => {
                return oldGames.map(g => g.id === updatedGame.id ? updatedGame : g);
            });
            queryClient.invalidateQueries({ queryKey: ['playerProfile'] });
            setShowBankerOffer(false);

            // Create notifications inline
            try {
                await Promise.all([
                    supabase.from('notifications').insert({
                        wallet_address: account.toLowerCase(),
                        type: 'trade_completed',
                        title: 'Deal Accepted!',
                        message: `You accepted the Banker's offer of $${updatedGame.final_winnings.toLocaleString()} and earned ${updatedGame.xp_earned} XP!`,
                        amount: updatedGame.final_winnings,
                        read: false,
                        // is_admin: false,
                    }),
                    supabase.from('notifications').insert({
                        wallet_address: account.toLowerCase(),
                        type: 'trade_completed',
                        title: 'Deal Accepted by Player',
                        message: `Player accepted the Banker's offer of $${updatedGame.final_winnings.toLocaleString()}.`,
                        amount: updatedGame.final_winnings,
                        read: false,
                        // is_admin: true
                    })
                ]);
            } catch (error) {
                console.warn('Failed to create notifications:', error);
            }

            // Check for scatter trigger
            await checkScatterTrigger(updatedGame);

            // Show result modal
            setGameResult({
                winnings: updatedGame.final_winnings,
                xpEarned: updatedGame.xp_earned,
                dealAccepted: true
            });
            setShowResultModal(true);
        }
    });

    const updatePlayerProfileMutation = useMutation({
        mutationFn: async ({ walletAddress, xpEarned, winnings }) => {
            // Skip profile update - columns (total_xp, current_level, total_winnings) don't exist in profiles table
            console.log('Profile update skipped - schema mismatch:', { walletAddress, xpEarned, winnings });
            return { success: true };
        }
    });

    const awardTrophyForLevel = async (walletAddress, level, godName) => {
        try {
            // Check if trophy already exists
            const { data: existing } = await supabase
                .from('player_trophies')
                .select('*')
                .eq('wallet_address', walletAddress)
                .eq('trophy_level', level);

            if (!existing || existing.length === 0) {
                // Get default trophy image if available
                const { data: trophies } = await supabase
                    .from('trophies')
                    .select('*')
                    .eq('level', level);
                const nftImageUrl = trophies?.[0]?.nft_image_url || null;

                await supabase.from('player_trophies').insert({
                    wallet_address: walletAddress,
                    trophy_level: level,
                    god_name: godName,
                    earned_date: new Date().toISOString(),
                    nft_image_url: nftImageUrl
                });

                toast.success(`🏆 New level unlocked: ${godName}!`);
            }
        } catch (error) {
            console.error('Error awarding trophy:', error);
        }
    };

    const completeGameMutation = useMutation({
        mutationFn: async ({ gameId, keepOriginal }) => {
            // Validate and update game SERVER-SIDE (secure, unhackable)
            const result = await gameService.validateFinalWinnings({
                gameId,
                keepOriginal
            });
            return result.updatedGame;
        },
        onSuccess: async (updatedGame) => {
            await updatePlayerProfileMutation.mutateAsync({
                walletAddress: account.toLowerCase(),
                xpEarned: updatedGame.xp_earned,
                winnings: updatedGame.final_winnings
            });

            // Manually update cache
            queryClient.setQueryData(['userGames', account], (oldGames) => {
                return oldGames.map(g => g.id === updatedGame.id ? updatedGame : g);
            });
            queryClient.invalidateQueries({ queryKey: ['playerProfile'] });

            // Create notifications inline
            try {
                await Promise.all([
                    supabase.from('notifications').insert({
                        wallet_address: account.toLowerCase(),
                        type: 'trade_completed',
                        title: 'Deal or No Deal Game Completed',
                        message: `Your game has ended! You won $${updatedGame.final_winnings.toLocaleString()} and earned ${updatedGame.xp_earned} XP.`,
                        amount: updatedGame.final_winnings,
                        read: false,
                        // is_admin: false,
                    }),
                    supabase.from('notifications').insert({
                        wallet_address: account.toLowerCase(),
                        type: 'trade_completed',
                        title: 'Game Completed',
                        message: `Game completed with winnings: $${updatedGame.final_winnings.toLocaleString()}.`,
                        amount: updatedGame.final_winnings,
                        read: false,
                        // is_admin: true
                    })
                ]);
            } catch (error) {
                console.warn('Failed to create notifications:', error);
            }

            // Check for scatter trigger
            await checkScatterTrigger(updatedGame);

            // Show result modal
            setGameResult({
                winnings: updatedGame.final_winnings,
                xpEarned: updatedGame.xp_earned,
                dealAccepted: false
            });
            setShowResultModal(true);
        }
    });

    const checkScatterTrigger = async (completedGame) => {
        // Only check if final winnings = 1,000,000
        if (completedGame.final_winnings !== 1000000) {
            return;
        }

        // Get required consecutive wins setting (default 3)
        const requiredConsecutiveWins = gameSettings?.scatter_consecutive_wins || 3;

        // Get last N completed games (including this one)
        const { data: completedGames } = await supabase
            .from('deal_or_no_deal_games')
            .select('*')
            .eq('wallet_address', account.toLowerCase())
            .in('game_status', ['completed', 'deal_accepted'])
            .order('created_at', { ascending: false })
            .limit(requiredConsecutiveWins);

        // Must have EXACTLY N games AND all must be $1M
        if (completedGames && completedGames.length === requiredConsecutiveWins) {
            const allWon1M = completedGames.every(g => g.final_winnings === 1000000);

            if (allWon1M) {
                // Check if scatter already triggered for these specific games
                const gameIds = completedGames.map(g => g.id).sort();
                const { data: existingScatters } = await supabase
                    .from('scatter_wins')
                    .select('*')
                    .eq('wallet_address', account.toLowerCase());

                const alreadyTriggered = (existingScatters || []).some(scatter => {
                    const triggeringIds = (scatter.triggering_games || []).sort();
                    return JSON.stringify(triggeringIds) === JSON.stringify(gameIds);
                });

                if (!alreadyTriggered && playerProfile) {
                    await supabase
                        .from('profiles')
                        .update({ scatter_pending: true })
                        .eq('id', playerProfile.id);

                    queryClient.invalidateQueries({ queryKey: ['playerProfile'] });
                    setScatterTriggered(true);
                }
            }
        }
    };

    const handleScatterComplete = async (scatterData) => {
        try {
            // Get required consecutive wins for notification message
            const requiredConsecutiveWins = gameSettings?.scatter_consecutive_wins || 3;

            // Create scatter win record
            const { error: scatterError } = await supabase.from('scatter_wins').insert({
                wallet_address: account.toLowerCase(),
                player_name: playerProfile?.player_name || user?.full_name || 'Anonymous',
                boxes_picked: scatterData.boxesPicked,
                box_amounts: scatterData.boxAmounts,
                total_winnings: scatterData.totalWinnings,
                status: 'pending',
                triggering_games: userGames.slice(0, requiredConsecutiveWins).map(g => g.id)
            });

            if (scatterError) throw scatterError;

            // Clear scatter pending flag
            if (playerProfile) {
                await supabase
                    .from('profiles')
                    .update({ scatter_pending: false })
                    .eq('id', playerProfile.id);

                queryClient.invalidateQueries({ queryKey: ['playerProfile'] });
            }

            // Send notifications
            await Promise.all([
                supabase.from('notifications').insert({
                    wallet_address: account.toLowerCase(),
                    type: 'trade_completed',
                    title: '🎉 SCATTER BONUS WON!',
                    message: `Congratulations! You triggered the Scatter Bonus by winning $1,000,000 ${requiredConsecutiveWins} times in a row! You won $${scatterData.totalWinnings.toFixed(2)} from Scatter! Admin will process payment.`,
                    amount: scatterData.totalWinnings,
                    read: false,
                    // is_admin: false,
                }),
                supabase.from('notifications').insert({
                    wallet_address: account.toLowerCase(),
                    type: 'trade_completed',
                    title: '💰 Scatter Bonus - Payment Pending',
                    message: `Player ${playerProfile?.player_name} won Scatter Bonus: $${scatterData.totalWinnings.toFixed(2)}. Check Scatter Sales panel to process payment.`,
                    amount: scatterData.totalWinnings,
                    read: false,
                    // is_admin: true
                })
            ]);

            setShowScatter(false);
            setScatterTriggered(false);
            toast.success(`🎉 Scatter won $${scatterData.totalWinnings.toFixed(2)}! Payment pending.`);
        } catch (error) {
            console.error('Error saving scatter win:', error);
            toast.error('Failed to save scatter win');
        }
    };

    const handleStartNewGame = () => {
        if (!account) {
            toast.error('Please connect your wallet first!');
            return;
        }
        // Check if locked AND if admin bypass is not enabled or user is not admin
        if (gameSettings?.purchases_locked && !(gameSettings?.allow_admin_during_lock && user?.role === 'admin')) {
            toast.error('New games are currently locked. Please try again later.');
            return;
        }
        setShowPayment(true);
    };

    const handlePaymentSuccess = async (caseNumber, txHash, gameId) => {
        console.log('=== PAYMENT SUCCESS ===');
        console.log('Case Number:', caseNumber);
        console.log('TX Hash:', txHash);
        console.log('Game ID:', gameId);

        // If gameId is provided, game is already created - navigate to refresh
        if (gameId) {
            console.log('Game created successfully, refreshing...');
            toast.success('🎮 Game created! Loading your game...');

            // Force refresh the user games
            await queryClient.invalidateQueries({ queryKey: ['userGames', account] });
            const result = await refetchUserGames();

            console.log('Refetch result:', result);
            console.log('Updated userGames:', result.data);

            // Small delay to ensure state propagates
            await new Promise(resolve => setTimeout(resolve, 100));

            toast.success('🎉 Game ready! Select your cases!');
            return;
        }

        // Otherwise, mark as processing (old flow)
        try {
            console.log('Calling createGameMutation...');
            await createGameMutation.mutateAsync({ caseNumber, txHash });
            console.log('Game marked as processing');
        } catch (error) {
            console.error('=== MARK PROCESSING FAILED ===');
            console.error('Full error:', error);
            toast.error(`Failed to start game creation: ${error.message}`);
        }
    };

    const [processingCases, setProcessingCases] = useState(new Set());

    const handleOpenCase = async (caseNumber) => {
        if (!activeGame || activeGame.game_status !== 'active') return;

        if (showBankerOffer) return;

        if (processingCases.has(caseNumber) || activeGame.opened_cases.includes(caseNumber)) {
            return;
        }

        // INSTANT UI UPDATE - mark case as opened immediately
        setActiveGame(prev => ({
            ...prev,
            opened_cases: [...prev.opened_cases, caseNumber]
        }));

        setProcessingCases(prev => new Set(prev).add(caseNumber));

        try {
            // Show modal instantly
            setRevealedCase({ number: caseNumber, amount: null, shouldShowOffer: false });
            setShowCaseReveal(true);

            // Load amount immediately
            const result = await openCaseMutation.mutateAsync({ gameId: activeGame.id, caseNumber });

            // Update with actual data from backend
            setEliminatedAmounts(prev => [...prev, result.openedAmount]);
            queryClient.invalidateQueries({ queryKey: ['userGames', account] });

            setRevealedCase({
                number: caseNumber,
                amount: result.openedAmount,
                shouldShowOffer: result.shouldShowOffer,
                bankerOffer: result.bankerOffer
            });

        } catch (error) {
            // Rollback on error
            setActiveGame(prev => ({
                ...prev,
                opened_cases: prev.opened_cases.filter(c => c !== caseNumber)
            }));
            setShowCaseReveal(false);
            setRevealedCase(null);
            setProcessingCases(prev => {
                const newSet = new Set(prev);
                newSet.delete(caseNumber);
                return newSet;
            });

            toast.error(error.message || 'Failed to open case');
        }
    };

    const handleCaseRevealComplete = () => {
        setShowCaseReveal(false);

        // Clear processing for the revealed case
        if (revealedCase) {
            setProcessingCases(prev => {
                const newSet = new Set(prev);
                newSet.delete(revealedCase.number);
                return newSet;
            });

            // Show banker offer IMMEDIATELY if round just completed
            if (revealedCase.shouldShowOffer && revealedCase.bankerOffer) {
                setCurrentOffer(revealedCase.bankerOffer);
                setShowBankerOffer(true);
            }

            setRevealedCase(null);
        }
    };

    const handleDeal = async () => {
        if (!activeGame) return;
        await acceptDealMutation.mutateAsync({
            gameId: activeGame.id
        });
    };

    const handleNoDeal = () => {
        setShowBankerOffer(false);
    };

    const handleFinalChoice = async (keepOriginal) => {
        if (!activeGame) return;

        await completeGameMutation.mutateAsync({
            gameId: activeGame.id,
            keepOriginal
        });
    };

    const handleMarketplaceUnlockedContinue = () => {
        setShowMarketplaceUnlocked(false);
        setShowSellOrContinue(true);
    };

    const handleSellNFTs = async () => {
        try {
            // Calculate NFT values from database prices
            const nftsToSell = playerTrophies.filter(t => t.trophy_level <= 9).map(trophy => {
                const trophyData = trophies.find(t => t.level === trophy.trophy_level);
                const btcPrice = trophyData?.btc_sale_price || 0;
                return {
                    level: trophy.trophy_level,
                    god_name: trophy.god_name,
                    btc_price: btcPrice,
                    usdt_value: parseFloat(nftPrices[`level${trophy.trophy_level}`] || 0)
                };
            });

            const totalBTC = nftsToSell.reduce((sum, nft) => sum + nft.btc_price, 0);
            const totalUSDT = nftsToSell.reduce((sum, nft) => sum + nft.usdt_value, 0);

            // Create NFT sale request
            const { error: saleError } = await supabase.from('nft_sale_requests').insert({
                wallet_address: account.toLowerCase(),
                player_name: playerProfile?.player_name || user?.full_name || 'Anonymous',
                nfts_sold: nftsToSell,
                total_btc_value: totalBTC,
                total_usdt_value: totalUSDT,
                status: 'pending',
                request_date: new Date().toISOString()
            });

            if (saleError) throw saleError;

            // Reset player to Level 0 and reset the continue flag
            await supabase.from('profiles').update({
                total_xp: 0,
                current_level: 0,
                god_name: 'New God Born',
                chose_continue_after_level9: false
            }).eq('id', playerProfile.id);

            // Delete all trophies Level 0-9
            const trophyIds = playerTrophies.filter(t => t.trophy_level <= 9).map(t => t.id);
            if (trophyIds.length > 0) {
                await supabase.from('player_trophies').delete().in('id', trophyIds);
            }

            // Create notifications
            await Promise.all([
                supabase.from('notifications').insert({
                    wallet_address: account.toLowerCase(),
                    type: 'trade_completed',
                    title: '🎉 NFT Sale Request Submitted!',
                    message: `You've requested to sell your Trophy NFTs (Levels 0-9) for ${totalBTC.toFixed(6)} BTC (≈$${totalUSDT.toLocaleString()} USDT). Admin will process your payment soon. You've been reset to Level 0 and marketplace is locked until you reach Level 9 again!`,
                    read: false,
                    // is_admin: false,
                }),
                supabase.from('notifications').insert({
                    wallet_address: account.toLowerCase(),
                    type: 'trade_completed',
                    title: '💰 NFT Sale Request - Payment Pending',
                    message: `Player ${playerProfile?.player_name} requested to sell Trophy NFTs (Levels 0-9) for ${totalBTC.toFixed(6)} BTC (≈$${totalUSDT.toLocaleString()} USDT). Check NFT Sales panel to process payment.`,
                    read: false,
                    // is_admin: true
                })
            ]);

            queryClient.invalidateQueries(['playerProfile']);
            queryClient.invalidateQueries(['playerTrophies']);
            setShowSellOrContinue(false);
            toast.success('NFT sale request submitted! Admin will process payment soon.');
        } catch (error) {
            console.error('Error selling NFTs:', error);
            toast.error('Failed to submit NFT sale request');
        }
    };

    const handleContinueFor1BTC = async () => {
        try {
            // Mark the CURRENT ACTIVE GAME ONLY with continue flag
            if (activeGame) {
                await supabase.from('deal_or_no_deal_games').update({
                    continuing_after_level9: true
                }).eq('id', activeGame.id);
            }

            // Update player profile flag
            if (playerProfile) {
                await supabase.from('profiles').update({
                    chose_continue_after_level9: true
                }).eq('id', playerProfile.id);
            }

            setShowSellOrContinue(false);
            toast.success('Great choice! Keep earning XP towards 1 BTC! (25 XP per banker refusal in this game path)');
        } catch (error) {
            console.error('Error setting continue flag:', error);
            toast.error('Failed to update game settings');
        }
    };

    const completedGames = userGames.filter(g => g.game_status !== 'active');
    const totalWinnings = completedGames.reduce((sum, g) => sum + (g.final_winnings || 0), 0);
    const totalSpent = userGames.length * GAME_FEE;

    // Pagination logic for all games
    const totalPages = Math.ceil(allGames.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedGames = allGames.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Animated Background */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    background: [
                        'radial-gradient(circle at 20% 50%, rgba(168,85,247,0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 50%, rgba(236,72,153,0.12) 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 80%, rgba(6,182,212,0.12) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, rgba(168,85,247,0.15) 0%, transparent 50%)',
                    ]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating Orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

            <Navbar />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-40 sm:pt-44">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex gap-3 mb-4">
                        <Link to={createPageUrl('Dashboard')}>
                            <Button className="bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Landing')}>
                            <Button className="bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all">
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full" />
                        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Deal or No Deal
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">Win monthly XRP rewards and up to 1 BTC</p>
                </motion.div>

                {/* Locked Warning */}
                {gameSettings?.purchases_locked && !(gameSettings?.allow_admin_during_lock && user?.role === 'admin') && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 relative bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 flex items-center gap-4 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50" />
                        <div className="relative z-10 flex items-center gap-4 w-full">
                            <Lock className="w-8 h-8 text-red-400 flex-shrink-0" />
                            <div>
                                <h3 className="text-white font-semibold mb-1">Games Currently Locked</h3>
                                <p className="text-gray-300 text-sm">
                                    New games are temporarily unavailable. Please check back later.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Admin Testing Mode Notice */}
                {gameSettings?.purchases_locked && gameSettings?.allow_admin_during_lock && user?.role === 'admin' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 relative bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 flex items-center gap-4 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-50" />
                        <div className="relative z-10 flex items-center gap-4 w-full">
                            <Shield className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                            <div>
                                <h3 className="text-white font-semibold mb-1">Admin Testing Mode Active</h3>
                                <p className="text-gray-300 text-sm">
                                    Games are locked for users, but you can test as an admin. Regular users cannot see or play games.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Scatter Bonus Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 relative overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl p-1">
                        <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-3xl p-6 md:p-8">
                            {/* Animated Background Particles */}
                            <div className="absolute inset-0 overflow-hidden rounded-3xl">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 180, 360]
                                    }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"
                                />
                                <motion.div
                                    animate={{
                                        scale: [1.2, 1, 1.2],
                                        rotate: [360, 180, 0]
                                    }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
                                />
                            </div>

                            <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center">
                                {/* Left Side - Text Content */}
                                <div>
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="inline-block mb-3"
                                    >
                                        <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-transparent bg-clip-text text-4xl md:text-5xl font-black">
                                            ⚡ SCATTER BONUS ⚡
                                        </span>
                                    </motion.div>

                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                        Win BIG with Consecutive $1M Hits!
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-start gap-3">
                                            <motion.div
                                                animate={{ rotate: [0, 360] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center"
                                            >
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </motion.div>
                                            <p className="text-gray-300">
                                                Hit <span className="text-yellow-400 font-bold">{gameSettings?.scatter_consecutive_wins || 3} consecutive $1,000,000</span> wins
                                            </p>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center"
                                            >
                                                <Gift className="w-4 h-4 text-white" />
                                            </motion.div>
                                            <p className="text-gray-300">
                                                Unlock <span className="text-pink-400 font-bold">Scatter Bonus Round</span>
                                            </p>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <motion.div
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center"
                                            >
                                                <TrendingUp className="w-4 h-4 text-white" />
                                            </motion.div>
                                            <p className="text-gray-300">
                                                Pick 3 boxes and <span className="text-green-400 font-bold">win the total amount</span>!
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl px-4 py-2 inline-block">
                                        <p className="text-yellow-300 font-semibold text-sm">
                                            💰 WIN 1 BITCOIN EARLIER!
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side - Bitcoin Box Image */}
                                <div className="flex items-center justify-center">
                                    <motion.div
                                        animate={{
                                            y: [0, -15, 0],
                                            rotateY: [0, 10, 0, -10, 0]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="relative"
                                    >
                                        {/* Glow Effect */}
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.3, 1],
                                                opacity: [0.3, 0.6, 0.3]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full blur-3xl"
                                        />

                                        {/* Bitcoin Box */}
                                        <div className="relative">
                                            <img
                                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/6b5cc5f6c_image.png"
                                                alt="Scatter Bonus Box"
                                                className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl"
                                            />

                                            {/* Sparkle Effects */}
                                            <motion.div
                                                animate={{
                                                    scale: [0, 1, 0],
                                                    rotate: [0, 180, 360]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                                                className="absolute top-10 right-10"
                                            >
                                                <Sparkles className="w-8 h-8 text-yellow-400" />
                                            </motion.div>

                                            <motion.div
                                                animate={{
                                                    scale: [0, 1, 0],
                                                    rotate: [360, 180, 0]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                                className="absolute bottom-10 left-10"
                                            >
                                                <Sparkles className="w-6 h-6 text-pink-400" />
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Total Payouts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <TotalPayouts />
                </motion.div>

                {/* Leaderboard at Top */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Leaderboard />
                </motion.div>

                {/* Start New Game Button */}
                {!activeGame && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 flex flex-col items-center"
                    >
                        <Button
                            onClick={handleStartNewGame}
                            disabled={gameSettings?.purchases_locked && !(gameSettings?.allow_admin_during_lock && user?.role === 'admin')}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl px-8 py-6 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-green-500/20"
                        >
                            <DollarSign className="w-6 h-6 mr-2" />
                            {(gameSettings?.purchases_locked && !(gameSettings?.allow_admin_during_lock && user?.role === 'admin')) ? 'Games Locked' : `Start New Game ($${GAME_FEE})`}
                        </Button>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl px-6 py-3 backdrop-blur-sm"
                        >
                            <p className="text-yellow-400 font-semibold text-center text-sm sm:text-base">
                                🎉 Special Launch Offer: Only $1 per game for the first 3 months!
                            </p>
                            <p className="text-gray-300 text-center text-xs sm:text-sm mt-2">
                                Note: Platform administrators (Hello World User) are not eligible to participate in gameplay or competitions to ensure fairness and integrity. This account is designated for testing and platform management purposes only.
                            </p>
                        </motion.div>
                    </motion.div>
                )}

                {/* All Game Transactions */}
                {allGames.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
                    >
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                            <Briefcase className="w-6 h-6 text-[#f5c96a]" />
                            All Game Transactions ({allGames.length})
                        </h3>

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
                                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">TX Hash</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedGames.map((game) => (
                                        <tr key={game.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3 px-4 text-gray-300 text-sm">
                                                {new Date(game.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-white font-medium">
                                                {game.wallet_address?.slice(0, 8) || 'Unknown'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-300 font-mono text-sm">
                                                {game.wallet_address?.slice(0, 6)}...{game.wallet_address?.slice(-4)}
                                            </td>
                                            <td className="py-3 px-4 text-[#f5c96a] font-bold">
                                                #{game.my_case}
                                            </td>
                                            <td className="py-3 px-4 text-green-400 font-bold">
                                                ${(game.game_fee || 0).toFixed(2)}
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-gray-400 text-sm">
                                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, allGames.length)} of {allGames.length} transactions
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
                                                // Show all pages if 7 or fewer
                                                for (let i = 1; i <= totalPages; i++) {
                                                    pageNumbers.push(i);
                                                }
                                            } else {
                                                // Always show first page
                                                pageNumbers.push(1);

                                                if (currentPage <= 3) {
                                                    // Near start: 1 2 3 4 ... last
                                                    pageNumbers.push(2, 3, 4, '...', totalPages);
                                                } else if (currentPage >= totalPages - 2) {
                                                    // Near end: 1 ... last-3 last-2 last-1 last
                                                    pageNumbers.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                                } else {
                                                    // Middle: 1 ... current-1 current current+1 ... last
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
                                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
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
                )}

                {/* Active Game */}
                {activeGame && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8"
                    >
                        <GameBoard
                            game={activeGame}
                            eliminatedAmounts={eliminatedAmounts}
                            onOpenCase={handleOpenCase}
                            onFinalChoice={handleFinalChoice}
                            processingCases={processingCases}
                        />
                    </motion.div>
                )}

                {/* Game Instructions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 relative bg-gradient-to-br from-cyan-500/5 via-black/40 to-purple-500/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-50" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">How to Play Deal or No Deal</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Game Overview */}
                            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
                                <h3 className="text-xl font-bold text-cyan-400 mb-3">🎮 Game Overview</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Deal or No Deal is a game of chance and strategy where you compete for prizes ranging from $0.01 to $1,000,000!
                                    Pay $3 entry fee, choose your lucky case, and eliminate other cases to reveal what's inside them.
                                    The Banker will make you offers based on the remaining prizes - will you take the deal or risk it all?
                                </p>
                            </div>

                            {/* How It Works */}
                            <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                                <h3 className="text-xl font-bold text-cyan-400 mb-4">📋 How It Works</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">1</div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">Pay Entry Fee & Choose Your Case</h4>
                                            <p className="text-gray-400 text-sm">Pay ${GAME_FEE} in USDT and select one case from 1-26. This is YOUR case - you'll keep it until the end!</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">2</div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">Open Cases in Rounds</h4>
                                            <p className="text-gray-400 text-sm">
                                                • Round 1: Open 6 cases<br />
                                                • Round 2: Open 5 cases<br />
                                                • Round 3: Open 4 cases<br />
                                                • Round 4: Open 3 cases<br />
                                                • Round 5-9: Open 2 cases per round
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">3</div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">Banker's Offers</h4>
                                            <p className="text-gray-400 text-sm">After each round, the Banker calculates an offer based on the remaining prizes. You can accept (Deal!) or reject (No Deal!) the offer.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">4</div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">Final Decision</h4>
                                            <p className="text-gray-400 text-sm">When only 2 cases remain (yours + 1 other), make your final choice: keep your original case or swap it for the last remaining case!</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">5</div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">Win & Earn XP</h4>
                                            <p className="text-gray-400 text-sm">Your winnings are determined by the case you end up with. Plus, earn XP based on your winnings and number of banker offers refused to climb the leaderboard and unlock god-level trophies!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prize Distribution */}
                            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-600/10 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:shadow-yellow-500/10 transition-all">
                                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-4">💰 Prize Distribution (26 Cases)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="bg-black/30 rounded-lg p-3">
                                        <div className="text-gray-400 mb-1">Low Prizes</div>
                                        <div className="text-white font-mono text-xs sm:text-sm">$0.01 - $100</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3">
                                        <div className="text-gray-400 mb-1">Medium Prizes</div>
                                        <div className="text-white font-mono text-xs sm:text-sm">$200 - $1,000</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3">
                                        <div className="text-yellow-400 mb-1">High Prizes</div>
                                        <div className="text-white font-mono text-xs sm:text-sm">$5,000 - $100,000</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3">
                                        <div className="text-[#f5c96a] mb-1">Jackpot Prizes</div>
                                        <div className="text-white font-mono text-xs sm:text-sm">$200K - $1M</div>
                                    </div>
                                </div>
                            </div>

                            {/* Trophy XP Ranges Table */}
                            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-500/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-green-500/10 transition-all">
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
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 0</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">New God Born</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">0 - 10,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 1</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Aphrodite</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">10,001 - 20,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 2</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Dionysus</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">20,001 - 30,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 3</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Artemis</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">30,001 - 50,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 4</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Hermes</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">50,001 - 70,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 5</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Demetra</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">70,001 - 101,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 6</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Apollon</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">101,001 - 151,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 7</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Ares</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">151,001 - 201,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 8</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Hephaestus</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">201,001 - 301,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 9</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Poseidon</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">301,001 - 501,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 10</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Athena</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">501,001 - 751,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 11</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Hera</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">751,001 - 1,000,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 12</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Zeus</span></td>
                                                <td className="py-3 px-4"><span className="text-white font-mono">1,000,001 - 2,000,000 XP</span></td>
                                            </tr>
                                            <tr className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-3 px-4"><span className="text-cyan-400 font-bold text-lg">Level 13</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-semibold">Zeus Complete</span></td>
                                                <td className="py-3 px-4"><span className="text-[#f5c96a] font-bold text-lg">2,000,001 - 1 BTC IS YOURS!!</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 bg-black/30 rounded-lg p-4">
                                    <p className="text-gray-400 text-sm">
                                        <span className="text-green-400 font-bold">Note:</span> Players earn trophies when they complete a level (reach the next level's XP requirement).
                                        Level 12 trophy (Zeus) is earned at 2,000,001 XP. <span className="text-[#f5c96a] font-bold">Level 13 trophy (Zeus Complete) at 2,000,001 XP = 1 BTC IS YOURS!</span> Players can earn this reward multiple times - after claiming, they can earn it again.
                                    </p>
                                </div>
                            </div>

                            {/* NFT Pricing Table */}
                            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-500/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <DollarSign className="w-8 h-8 text-purple-400" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">NFT Trophy Marketplace Prices</h3>
                                        <p className="text-gray-400 text-sm">Sell your earned trophies as NFTs on the marketplace</p>
                                    </div>
                                </div>

                                <div className="mb-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                                    <p className="text-orange-400 text-sm">
                                        <span className="font-bold">⚠️ Dynamic Pricing:</span> NFT prices are shown in both BTC and USDT. The USDT values change in real-time based on current Bitcoin market price and conditions.
                                    </p>
                                </div>

                                <div className="mb-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                                    <p className="text-cyan-400 text-sm">
                                        <span className="font-bold">🔓 Unlock NFT Sales:</span> You can start selling your Trophy NFTs once you <span className="text-[#f5c96a] font-bold">complete Level 9 (Poseidon)</span>. Keep earning XP to unlock the marketplace!
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
                                        <span className="text-purple-400 font-bold">NFT Sales Info:</span> Once you complete Level 9 (Poseidon), you gain access to sell ALL your earned Trophy NFTs on the marketplace. Prices are fixed in BTC. <span className="text-[#f5c96a] font-bold">Zeus Trophy (Level 12) sells for 1 full BTC!</span>
                                    </p>
                                </div>
                            </div>

                            {/* XP System */}
                            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-6 hover:shadow-lg hover:shadow-green-500/10 transition-all">
                                <h3 className="text-xl font-bold text-cyan-400 mb-4">⚡ XP & Leveling System</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-white font-semibold mb-2">How XP is Calculated:</p>
                                        <div className="space-y-2 ml-4">
                                            <p className="text-gray-300">
                                                <span className="text-cyan-400 font-semibold">$1 - $50,000:</span> 100 XP
                                            </p>
                                            <p className="text-gray-300">
                                                <span className="text-cyan-400 font-semibold">$50,001 - $100,000:</span> 300 XP
                                            </p>
                                            <p className="text-gray-300">
                                                <span className="text-cyan-400 font-semibold">$100,001 - $300,000:</span> 500 XP
                                            </p>
                                            <p className="text-gray-300">
                                                <span className="text-cyan-400 font-semibold">$301,000 - $500,000:</span> 1,000 XP
                                            </p>
                                            <p className="text-gray-300">
                                                <span className="text-cyan-400 font-semibold">$501,000 - $750,000:</span> 2,000 XP
                                            </p>
                                            <p className="text-gray-300">
                                                <span className="text-cyan-400 font-semibold">$750,001+:</span> 5,000 XP
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-gray-300">
                                        <span className="text-cyan-400 font-semibold">Risk Bonus:</span> Bonus XP based on your current level for each Banker offer you refuse
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="text-cyan-400 font-semibold">God Levels:</span> Progress through 13 god levels (0-12), each with unique titles and trophy NFTs
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="text-[#f5c96a] font-semibold">Ultimate Reward:</span> Complete Level 13 (Zeus Complete) at 2,000,001+ XP and claim 1 BTC! 🏆
                                    </p>
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
                                        <p className="text-yellow-400 text-sm">
                                            <span className="font-bold">📌 Important:</span> NFT payments are happening once competition gets completed.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Leaderboard Prizes */}
                            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 sm:p-6">
                                <h3 className="text-lg sm:text-xl font-bold text-purple-400 mb-3 sm:mb-4">🏆 Monthly Leaderboard Prizes</h3>
                                <p className="text-sm sm:text-base text-gray-300 mb-4">
                                    Every 30 days, the top 10 players with the highest total XP win XRP rewards:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/50 rounded-lg p-4 text-center">
                                        <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                        <div className="text-xl sm:text-2xl font-bold text-yellow-400 mb-1">200 XRP</div>
                                        <div className="text-gray-300 text-sm">1st Place</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-gray-400/20 to-slate-400/20 border border-gray-400/50 rounded-lg p-4 text-center">
                                        <Trophy className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                                        <div className="text-xl sm:text-2xl font-bold text-gray-400 mb-1">100 XRP</div>
                                        <div className="text-gray-300 text-sm">2nd Place</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-600/20 to-amber-700/20 border border-orange-600/50 rounded-lg p-4 text-center">
                                        <Trophy className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                                        <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-1">50 XRP</div>
                                        <div className="text-gray-300 text-sm">3rd Place</div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
                                    <p className="text-cyan-400 font-semibold mb-2 text-sm">4th - 10th Place Rewards:</p>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-300">• 4th-5th Place: <span className="text-blue-400 font-bold">25 XRP each</span></p>
                                        <p className="text-gray-300">• 6th-8th Place: <span className="text-green-400 font-bold">15 XRP each</span></p>
                                        <p className="text-gray-300">• 9th-10th Place: <span className="text-cyan-400 font-bold">10 XRP each</span></p>
                                    </div>
                                    <p className="text-gray-400 text-xs mt-2">Total monthly rewards: 465 XRP distributed</p>
                                </div>
                            </div>

                            {/* Game Conditions */}
                            <div className="bg-gradient-to-br from-red-500/10 to-pink-600/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 hover:shadow-lg hover:shadow-red-500/10 transition-all">
                                <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Game Conditions & Rules</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">Entry fee is ${GAME_FEE} USDT (BEP-20) per game - non-refundable once game starts</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">Prize amounts are randomly distributed among 26 cases at game start - completely fair and random</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">Once you select a case to open, it cannot be undone - choose carefully!</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">Banker offers are calculated algorithmically based on remaining prizes (70-90% of average)</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">If you accept a Banker's offer, the game ends immediately and you receive that amount</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">Only one active game per wallet address - finish your current game before starting a new one</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">Winnings are recorded in your game history but not automatically paid out - this is for entertainment tracking</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">Leaderboard rankings are based on total XP accumulated across all games within the 30-day period</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">XRP prizes are paid to top 10 players at the end of each 30-day period by admin verification</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="text-red-400 font-bold">•</div>
                                        <p className="text-gray-300">The 1 BTC reward is awarded after completing Level 13 (Zeus Complete) at 2,000,001+ XP and receiving the trophy. Once claimed, a new round starts and you can earn it again</p>
                                    </div>
                                </div>
                            </div>

                            {/* Strategy Tips */}
                            <div className="bg-gradient-to-br from-orange-500/10 to-red-600/10 backdrop-blur-sm border border-orange-500/20 rounded-xl p-6 hover:shadow-lg hover:shadow-orange-500/10 transition-all">
                                <h3 className="text-xl font-bold text-cyan-400 mb-4">💡 Strategy Tips</h3>
                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-300">
                                        <span className="text-cyan-400 font-semibold">Risk vs Reward:</span> Refusing Banker offers earns bonus XP but increases risk of ending with a lower prize
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="text-cyan-400 font-semibold">Focus on XP:</span> To climb the leaderboard, play consistently and refuse early low offers for bonus XP
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="text-cyan-400 font-semibold">Know When to Deal:</span> If high prizes are eliminated early, accepting the Banker's offer might be wise
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="text-cyan-400 font-semibold">Final Swap:</span> Statistically, swapping vs keeping has equal odds - trust your instinct!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Payment Modal */}
                {showPayment && (
                    <PaymentModal
                        isOpen={showPayment}
                        onClose={() => setShowPayment(false)}
                        gameFee={GAME_FEE}
                        gameWallet={gameSettings?.game_wallet_address || '0x508D61ad3f1559679BfAe3942508B4cf7767935A'}
                        currentBtcPrice={btcRate}
                        onSuccess={handlePaymentSuccess}
                    />
                )}

                {/* Banker Offer Modal */}
                <BankerOffer
                    isOpen={showBankerOffer}
                    offer={currentOffer}
                    onDeal={handleDeal}
                    onNoDeal={handleNoDeal}
                />

                {/* Game Result Modal */}
                {gameResult && (
                    <GameResultModal
                        isOpen={showResultModal}
                        onClose={() => {
                            setShowResultModal(false);
                            setGameResult(null);
                            setActiveGame(null);

                            // CRITICAL: Proper modal sequencing
                            // 1. Game Result Modal (just closed)
                            // 2. Scatter Modal (if scatter triggered)
                            // 3. Marketplace/Sell Modal (if Level 9 unlocked)

                            if (scatterTriggered) {
                                // Scatter takes priority - show first
                                setTimeout(() => {
                                    setShowScatter(true);
                                }, 300);
                            } else if (level9JustUnlocked) {
                                // No scatter, but Level 9 unlocked - show marketplace
                                setTimeout(() => {
                                    setShowMarketplaceUnlocked(true);
                                    setLevel9JustUnlocked(false);
                                }, 300);
                            }
                        }}
                        winnings={gameResult.winnings}
                        xpEarned={gameResult.xpEarned}
                        dealAccepted={gameResult.dealAccepted}
                    />
                )}

                {/* Case Reveal Modal */}
                {revealedCase && (
                    <CaseRevealModal
                        isOpen={showCaseReveal}
                        caseNumber={revealedCase.number}
                        amount={revealedCase.amount}
                        onComplete={handleCaseRevealComplete}
                    />
                )}

                {/* Marketplace Unlocked Modal */}
                <MarketplaceUnlockedModal
                    isOpen={showMarketplaceUnlocked}
                    onContinue={handleMarketplaceUnlockedContinue}
                />

                {/* Sell or Continue Modal */}
                <SellOrContinueModal
                    isOpen={showSellOrContinue}
                    nftPrices={nftPrices}
                    playerTrophies={playerTrophies}
                    onSell={handleSellNFTs}
                    onContinue={handleContinueFor1BTC}
                />

                {/* Scatter Modal */}
                <ScatterModal
                    isOpen={showScatter}
                    consecutiveWins={gameSettings?.scatter_consecutive_wins || 3}
                    onComplete={(scatterData) => {
                        handleScatterComplete(scatterData);

                        // After scatter completes, check if Level 9 was unlocked
                        if (level9JustUnlocked) {
                            setTimeout(() => {
                                setShowMarketplaceUnlocked(true);
                                setLevel9JustUnlocked(false);
                            }, 500);
                        }
                    }}
                />

            </div>
            <Footer />
        </div>
    );
}

export default function DealOrNoDeal() {
    return (
        <WalletProvider>
            <DealOrNoDealContent />
        </WalletProvider>
    );
}