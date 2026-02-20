import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    TrendingUp, Users, DollarSign, AlertTriangle,
    Shield, Trash2, Clock, Bell, ArrowUpRight, Edit, Plus, UserCog, X, Lock, Unlock, Menu, BarChart3, Home, Settings, Briefcase, Image, Activity, Copy, ExternalLink, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, ShoppingBag, Database, Globe, MapPin, MessageCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import UsersManagement from '../components/admin/UsersManagement';
import ConfirmResetModal from '../components/admin/ConfirmResetModal';
import EditDepositModal from '../components/admin/EditDepositModal';
import AddDepositModal from '../components/admin/AddDepositModal';
import EditWithdrawalModal from '../components/admin/EditWithdrawalModal';
import AddWithdrawalModal from '../components/admin/AddWithdrawalModal';
import SupportMessagesPanel from '../components/admin/SupportMessagesPanel';
import LessonsPanel from '../components/admin/LessonsPanel';
import DealOrNoDealPanel from '../components/admin/DealOrNoDealPanel';
import KYCVerificationPanel from '../components/admin/KYCVerificationPanel';
import ConfirmModal from '../components/common/ConfirmModal';
import Pagination from '../components/common/Pagination';
import BlockWalletModal from '../components/admin/BlockWalletModal';
import AdminNotificationsPanel from '../components/admin/AdminNotificationsPanel';
import VerifyMissingDeposit from '../components/admin/VerifyMissingDeposit';
import TradeSplitter from '../components/admin/TradeSplitter';
import NFTSalesPanel from '../components/admin/NFTSalesPanel';
import BackupRestore from '../components/admin/BackupRestore';
import DebugWalletModal from '../components/admin/DebugWalletModal';
import IPTrackingPanel from '../components/admin/IPTrackingPanel';
import ChatRoomAdmin from '../components/admin/ChatRoomAdmin';
import { calculateTimeBasedBalances } from '../components/pools/TimeBasedCalculations';

import Logo from '../components/common/Logo';
import { AnimatePresence } from 'framer-motion';

const POOL_TYPES = ['scalping', 'traditional', 'vip'];

export default function GeneralAdmin() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [tradePages, setTradePages] = useState({ scalping: 1, traditional: 1, vip: 1 });
    const [resetModal, setResetModal] = useState({ isOpen: false, type: null, title: '', description: '' });
    const [editDepositModal, setEditDepositModal] = useState({ isOpen: false, investor: null });
    const [addDepositModal, setAddDepositModal] = useState(false);
    const [editWithdrawalModal, setEditWithdrawalModal] = useState({ isOpen: false, withdrawal: null });
    const [addWithdrawalModal, setAddWithdrawalModal] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminWallet, setNewAdminWallet] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('main');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [deleteAgreementModal, setDeleteAgreementModal] = useState({ isOpen: false, agreement: null });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newImageTitle, setNewImageTitle] = useState('MarketsUniverse');
    const [newImageDescription, setNewImageDescription] = useState('Collaborative pool trading across crypto and traditional markets');
    const [lockActionCooldown, setLockActionCooldown] = useState({});
    const [allDepositsPage, setAllDepositsPage] = useState(1);
    const [depositSearchQuery, setDepositSearchQuery] = useState('');
    const [apiLogsPage, setApiLogsPage] = useState(1);
    const [blockWalletModal, setBlockWalletModal] = useState({ isOpen: false, wallet: '' });
    const [manualDepositsPage, setManualDepositsPage] = useState(1);
    const [agreementsPage, setAgreementsPage] = useState(1);
    const [agreementsSearchQuery, setAgreementsSearchQuery] = useState('');
    const [depositsSortField, setDepositsSortField] = useState('date');
    const [depositsSortDirection, setDepositsSortDirection] = useState('desc');
    const [debugModal, setDebugModal] = useState({ isOpen: false, data: null });
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { data: allAdmins = [] } = useQuery({
        queryKey: ['allAdmins'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').eq('role', 'admin');
            return data || [];
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                // Check profile role
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

                if (profile?.role !== 'admin') {
                    alert('Access denied. Admin only.');
                    navigate('/');
                    return;
                }

                setUser(user);
                setIsAdmin(true);
            } catch (error) {
                console.error("Admin check failed:", error);
                alert('Access denied. Please login.');
                navigate('/');
            } finally {
                setIsChecking(false);
            }
        };

        checkAdmin();
    }, [navigate]);

    // Fetch all pool investors
    const { data: allInvestors = [] } = useQuery({
        queryKey: ['allPoolInvestors'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch all pool trades
    const { data: allTrades = [] } = useQuery({
        queryKey: ['allPoolTrades'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch all staking contracts
    const { data: allContracts = [] } = useQuery({
        queryKey: ['allStakingContracts'],
        queryFn: async () => {
            const { data } = await supabase.from('staking_contracts').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch all withdrawal requests
    const { data: allWithdrawals = [] } = useQuery({
        queryKey: ['allWithdrawals'],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch all game entries
    const { data: allGames = [] } = useQuery({
        queryKey: ['allGames'],
        queryFn: async () => {
            const { data } = await supabase.from('deal_or_no_deal_games').select('*').order('created_at', { ascending: false }).limit(1000);
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch user agreements
    const { data: userAgreements = [] } = useQuery({
        queryKey: ['userAgreements'],
        queryFn: async () => {
            const { data } = await supabase.from('user_agreements').select('*').order('acceptance_date', { ascending: false });
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch all users
    const { data: allUsers = [] } = useQuery({
        queryKey: ['allUsers'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch pool settings
    const { data: poolSettings = [] } = useQuery({
        queryKey: ['poolSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch API usage logs
    const { data: apiLogs = [] } = useQuery({
        queryKey: ['apiLogs'],
        queryFn: async () => {
            const { data } = await supabase.from('api_usage_logs').select('*').order('created_at', { ascending: false }).limit(100);
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch blocked wallets
    const { data: blockedWallets = [] } = useQuery({
        queryKey: ['blockedWallets'],
        queryFn: async () => {
            const { data } = await supabase.from('blocked_wallets').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch manual deposits
    const { data: manualDeposits = [] } = useQuery({
        queryKey: ['manualDeposits'],
        queryFn: async () => {
            const { data } = await supabase.from('manual_deposits').select('*').order('created_at', { ascending: false });
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch unread admin notifications count
    const { data: unreadNotifications = [] } = useQuery({
        queryKey: ['unreadAdminNotifications'],
        queryFn: async () => {
            const { data } = await supabase.from('notifications')
                .select('*')
                .eq('is_admin', true)
                .eq('read', false);
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    // Fetch API settings
    const { data: apiSettings = [] } = useQuery({
        queryKey: ['apiSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('api_settings').select('*');
            return data || [];
        },
        enabled: isAdmin,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false
    });

    const currentApiSettings = apiSettings[0] || {
        bscscan_enabled: true,
        finnhub_enabled: true,
        mexc_enabled: true,
        rate_limit_threshold: 50,
        rate_limit_window_hours: 24
    };

    // Helper function to batch deletions with delays
    const batchDelete = async (items, tableName, idField = 'id') => {
        const delay = 500;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await supabase.from(tableName).delete().eq(idField, item[idField]);

            if (i < items.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    // Delete all pool data mutation
    const deletePoolDataMutation = useMutation({
        mutationFn: async ({ poolType, includeWithdrawals }) => {
            const { data: investors } = await supabase.from('pool_investors').select('id').eq('pool_type', poolType);
            const { data: trades } = await supabase.from('pool_trades').select('id').eq('pool_type', poolType);

            if (investors) await batchDelete(investors, 'pool_investors');
            if (trades) await batchDelete(trades, 'pool_trades');

            if (includeWithdrawals) {
                const { data: withdrawals } = await supabase.from('withdrawal_requests').select('id').eq('pool_type', poolType).eq('status', 'paid');
                if (withdrawals) await batchDelete(withdrawals, 'withdrawal_requests');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPoolInvestors']);
            queryClient.invalidateQueries(['allPoolTrades']);
            queryClient.invalidateQueries(['allWithdrawals']);
        }
    });

    // Delete all staking data mutation
    const deleteStakingDataMutation = useMutation({
        mutationFn: async (includeWithdrawals) => {
            const { data: contracts } = await supabase.from('staking_contracts').select('id');
            if (contracts) await batchDelete(contracts, 'staking_contracts');

            if (includeWithdrawals) {
                const { data: withdrawals } = await supabase.from('withdrawal_requests').select('id').eq('pool_type', 'staking').eq('status', 'paid');
                if (withdrawals) await batchDelete(withdrawals, 'withdrawal_requests');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allStakingContracts']);
            queryClient.invalidateQueries(['allWithdrawals']);
        }
    });

    // Delete all lessons data mutation
    const deleteLessonsDataMutation = useMutation({
        mutationFn: async () => {
            const { data: bookings } = await supabase.from('lesson_bookings').select('id');
            if (bookings) await batchDelete(bookings, 'lesson_bookings');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['lessonBookings']);
        }
    });

    // Delete all traffic analytics data mutation
    const deleteTrafficDataMutation = useMutation({
        mutationFn: async () => {
            const { data: visits } = await supabase.from('visits').select('id');
            const { data: pageViews } = await supabase.from('page_views').select('id');

            if (visits) await batchDelete(visits, 'visits');
            if (pageViews) await batchDelete(pageViews, 'page_views');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['visits']);
            queryClient.invalidateQueries(['pageViews']);
        }
    });

    // Delete all users mutation
    const deleteUsersDataMutation = useMutation({
        mutationFn: async () => {
            // Delete non-admin profiles
            // Note: This does not delete auth users, only profiles. 
            // Deleting auth users requires admin API or manual cleanup.
            const { data: nonAdmins } = await supabase.from('profiles').select('id').neq('role', 'admin');
            if (nonAdmins) await batchDelete(nonAdmins, 'profiles');

            // Reset admin profiles
            const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
            if (admins) {
                for (const admin of admins) {
                    await supabase.from('profiles').update({
                        full_name: null,
                        telephone: null,
                        discord_name: null,
                        x_profile_link: null,
                        withdrawal_wallet_address: null,
                        country: null,
                        city: null,
                        address: null,
                        avatar_url: null
                    }).eq('id', admin.id);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allUsers']);
        }
    });

    // Delete all game data mutation
    const deleteGameDataMutation = useMutation({
        mutationFn: async () => {
            const { data: games } = await supabase.from('deal_or_no_deal_games').select('id');
            // Assuming trophies table exists and relates to user, but base44 had playerTrophies.
            // If trophies table exists, we delete from it here.

            if (games) await batchDelete(games, 'deal_or_no_deal_games', 'id');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['games']);
            queryClient.invalidateQueries(['playerProfiles']);
            queryClient.invalidateQueries(['playerTrophies']);
        }
    });

    // Delete single user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (userId) => {
            return await supabase.from('profiles').delete().eq('id', userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allUsers']);
        }
    });



    // Update deposit mutation
    const updateDepositMutation = useMutation({
        mutationFn: async ({ id, amount }) => {
            const { data, error } = await supabase
                .from('pool_investors')
                .update({ invested_amount: amount })
                .eq('id', id);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPoolInvestors']);
        }
    });

    // Create deposit mutation
    const createDepositMutation = useMutation({
        mutationFn: async (data) => {
            const { data: result, error } = await supabase
                .from('pool_investors')
                .insert(data);
            if (error) throw error;
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPoolInvestors']);
        }
    });

    // Delete deposit mutation
    const deleteDepositMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('pool_investors')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allPoolInvestors']);
        }
    });

    // Update withdrawal mutation
    const updateWithdrawalMutation = useMutation({
        mutationFn: async ({ id, amount }) => {
            const { data, error } = await supabase
                .from('withdrawal_requests')
                .update({ amount: amount })
                .eq('id', id);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allWithdrawals']);
        }
    });

    // Create withdrawal mutation
    const createWithdrawalMutation = useMutation({
        mutationFn: async (data) => {
            const { data: result, error } = await supabase
                .from('withdrawal_requests')
                .insert(data);
            if (error) throw error;
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allWithdrawals']);
        }
    });

    // Add admin mutation
    const addAdminMutation = useMutation({
        mutationFn: async (data) => {
            const updateData = { role: 'admin' };
            if (data.name) {
                updateData.full_name = data.name;
            }

            const query = supabase.from('profiles').update(updateData);

            if (data.email) {
                query.eq('email', data.email);
            } else if (data.wallet_address) {
                query.eq('wallet_address', data.wallet_address);
            } else {
                throw new Error('Email or wallet address required');
            }

            const { data: result, error } = await query.select();
            if (error) throw error;

            // If no rows were updated, it means the user doesn't exist
            if (!result || result.length === 0) {
                throw new Error('User not found. They must sign up first.');
            }

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allAdmins']);
            setNewAdminEmail('');
            setNewAdminWallet('');
            setNewAdminName('');
            toast.success('Admin added successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to add admin');
        }
    });

    // Remove admin mutation
    const removeAdminMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'user' })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['allAdmins']);
        }
    });

    // Delete user agreement mutation
    const deleteAgreementMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('user_agreements')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onMutate: async (id) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries(['userAgreements']);

            // Snapshot the previous value
            const previousAgreements = queryClient.getQueryData(['userAgreements']);

            // Optimistically update to the new value
            queryClient.setQueryData(['userAgreements'], (old) => {
                return old?.filter(agreement => agreement.id !== id) || [];
            });

            // Return context with the snapshot
            return { previousAgreements };
        },
        onError: (err, id, context) => {
            // Rollback on error
            queryClient.setQueryData(['userAgreements'], context.previousAgreements);
            toast.error('Failed to delete');
        },
        onSettled: () => {
            // Refetch after mutation
            queryClient.invalidateQueries(['userAgreements']);
        }
    });

    // Upload social media image mutation
    const uploadSocialImageMutation = useMutation({
        mutationFn: async ({ file, title, description }) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `social/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('social-media') // Assumption: bucket name
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('social-media')
                .getPublicUrl(filePath);

            // Deactivate all existing images
            await supabase
                .from('social_media_images')
                .update({ is_active: false })
                .eq('is_active', true);

            // Create new image record
            const { data, error } = await supabase
                .from('social_media_images')
                .insert({
                    image_url: publicUrl,
                    title,
                    description,
                    is_active: true
                });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['socialMediaImages']);
            setNewImageTitle('MarketsUniverse');
            setNewImageDescription('Collaborative pool trading across crypto and traditional markets');
        }
    });

    // Delete social media image mutation
    const deleteSocialImageMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('social_media_images')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['socialMediaImages']);
        }
    });

    // Delete manual deposit mutation
    const deleteManualDepositMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('manual_deposits')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['manualDeposits']);
        }
    });

    // Set active social media image mutation
    const setActiveSocialImageMutation = useMutation({
        mutationFn: async (id) => {
            // Deactivate all
            await supabase
                .from('social_media_images')
                .update({ is_active: false })
                .eq('is_active', true);
            // Activate selected
            const { data, error } = await supabase
                .from('social_media_images')
                .update({ is_active: true })
                .eq('id', id);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['socialMediaImages']);
        }
    });

    // Block wallet mutation
    const blockWalletMutation = useMutation({
        mutationFn: async ({ wallet_address, reason }) => {
            const { data, error } = await supabase
                .from('blocked_wallets')
                .insert({ wallet_address, reason });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['blockedWallets']);
            const input = document.getElementById('blockWalletInput');
            if (input) input.value = '';
            alert('✅ Wallet blocked successfully');
        },
        onError: (error) => {
            console.error('Block wallet error:', error);
            alert('❌ Error: ' + error.message);
        }
    });

    // Unblock wallet mutation
    const unblockWalletMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('blocked_wallets')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['blockedWallets']);
            alert('✅ Wallet unblocked successfully');
        },
        onError: (error) => {
            console.error('Unblock wallet error:', error);
            alert('❌ Failed to unblock wallet: ' + error.message);
        }
    });

    // Update API settings mutation
    const updateApiSettingsMutation = useMutation({
        mutationFn: async (updates) => {
            if (apiSettings.length === 0) {
                const { data, error } = await supabase
                    .from('api_settings')
                    .insert(updates);
                if (error) throw error;
                return data;
            }
            const { data, error } = await supabase
                .from('api_settings')
                .update(updates)
                .eq('id', apiSettings[0].id);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['apiSettings']);
        }
    });

    // Delete API logs mutation
    const deleteApiLogsMutation = useMutation({
        mutationFn: async () => {
            // Assuming we just delete all records since it's a log
            const { data, error } = await supabase
                .from('api_usage_logs')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (error) throw error;
            return { deleted_count: data?.length || 'unknown' };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['apiLogs']);
            alert(`✅ API logs cleared successfully`);
        },
        onError: (error) => {
            alert('❌ Failed to reset logs: ' + error.message);
        }
    });

    // Toggle lock mutation with enhanced rate limiting
    const toggleLockMutation = useMutation({
        mutationFn: async ({ poolType, lockType, value }) => {
            const cooldownKey = `${poolType}-${lockType}`;
            const now = Date.now();
            const lastAction = lockActionCooldown[cooldownKey] || 0;

            // Enforce 3 second cooldown to prevent rate limits
            if (now - lastAction < 3000) {
                throw new Error('Please wait before trying again');
            }

            setLockActionCooldown(prev => ({ ...prev, [cooldownKey]: now }));

            // Add delay to prevent rapid fire
            await new Promise(resolve => setTimeout(resolve, 300));

            let settings = poolSettings.find(s => s.pool_type === poolType);

            // Create settings if they don't exist
            if (!settings) {
                const { data, error } = await supabase
                    .from('pool_settings')
                    .insert({
                        pool_type: poolType,
                        pool_address: '0x0000000000000000000000000000000000000000',
                        deposits_locked: lockType === 'deposits' ? value : false,
                        withdrawals_locked: lockType === 'withdrawals' ? value : false
                    });
                if (error) throw error;
                return data;
            }

            const updateData = lockType === 'deposits'
                ? { deposits_locked: value }
                : { withdrawals_locked: value };

            const { data, error } = await supabase
                .from('pool_settings')
                .update(updateData)
                .eq('id', settings.id);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['poolSettings']);
        },
        onError: (error) => {
            console.error('Error toggling lock:', error);
            alert(error.message || 'Failed to update lock status. Please try again.');
        }
    });

    const handleAddAdmin = async () => {
        if (!newAdminEmail && !newAdminWallet) {
            alert('Please provide at least an email or wallet address');
            return;
        }

        await addAdminMutation.mutateAsync({
            email: newAdminEmail || undefined,
            wallet_address: newAdminWallet?.toLowerCase() || undefined,
            name: newAdminName || undefined
        });
    };



    // Calculate basic pool stats by type
    const getPoolStats = (poolType) => {
        const investors = allInvestors.filter(inv => inv.pool_type === poolType);
        const trades = allTrades.filter(t => t.pool_type === poolType);

        const totalInvested = investors.reduce((sum, inv) => sum + (inv.invested_amount || 0), 0);
        const wins = trades.filter(t => t.result === 'win').length;
        const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

        return {
            investors: investors.length,
            totalInvested,
            trades: trades.length,
            winRate
        };
    };

    // Calculate staking stats
    const getStakingStats = () => {
        const activeContracts = allContracts.filter(c => c.status === 'active');
        const totalStaked = allContracts.reduce((sum, c) => sum + (c.staked_amount || 0), 0);
        const totalEarned = allContracts.reduce((sum, c) => sum + (c.total_earned || 0), 0);

        return {
            total: allContracts.length,
            active: activeContracts.length,
            totalStaked,
            totalEarned
        };
    };

    // Get expiring contracts (within 7 days)
    const getExpiringContracts = () => {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return allContracts.filter(contract => {
            if (contract.status !== 'active') return false;
            const endDate = new Date(contract.end_date);
            return endDate <= sevenDaysFromNow && endDate > now;
        });
    };

    const scalpingStats = getPoolStats('scalping');
    const traditionalStats = getPoolStats('traditional');
    const stakingStats = getStakingStats();
    const expiringContracts = getExpiringContracts();

    // Calculate actual pool balances using time-based calculations
    const cryptoPoolBalance = useMemo(() => {
        const scalpingInvestors = allInvestors.filter(inv => inv.pool_type === 'scalping');
        const scalpingTrades = allTrades.filter(t => t.pool_type === 'scalping');
        const scalpingWithdrawals = allWithdrawals.filter(w => w.pool_type === 'scalping' && w.status === 'paid');
        const scalpingSettings = poolSettings.find(s => s.pool_type === 'scalping');
        const { totalPoolValue } = calculateTimeBasedBalances({
            investors: scalpingInvestors,
            trades: scalpingTrades,
            withdrawals: scalpingWithdrawals,
            profitShareRate: scalpingSettings?.profit_share_rate || 0,
            isAdmin: true
        });
        return totalPoolValue;
    }, [allInvestors, allTrades, allWithdrawals, poolSettings]);

    const vipPoolBalance = useMemo(() => {
        const vipInvestors = allInvestors.filter(inv => inv.pool_type === 'vip');
        const vipTrades = allTrades.filter(t => t.pool_type === 'vip');
        const vipWithdrawals = allWithdrawals.filter(w => w.pool_type === 'vip' && w.status === 'paid');
        const vipSettings = poolSettings.find(s => s.pool_type === 'vip');
        const { totalPoolValue } = calculateTimeBasedBalances({
            investors: vipInvestors,
            trades: vipTrades,
            withdrawals: vipWithdrawals,
            profitShareRate: vipSettings?.profit_share_rate || 0,
            isAdmin: true
        });
        return totalPoolValue;
    }, [allInvestors, allTrades, allWithdrawals, poolSettings]);

    const handleResetPool = (poolType) => {
        const poolName = poolType.charAt(0).toUpperCase() + poolType.slice(1);
        setResetModal({
            isOpen: true,
            type: `pool_${poolType}`,
            title: `Delete ${poolName} Pool Data?`,
            description: `This will permanently delete ALL data for the ${poolName} Pool, including all investor records and trade history.`
        });
    };

    const handleResetStaking = () => {
        setResetModal({
            isOpen: true,
            type: 'staking',
            title: 'Delete All Staking Contracts?',
            description: 'This will permanently delete ALL staking contracts, including active, completed, and cancelled contracts.'
        });
    };

    const handleResetLessons = () => {
        setResetModal({
            isOpen: true,
            type: 'lessons',
            title: 'Delete All Lesson Bookings?',
            description: 'This will permanently delete ALL lesson bookings and purchases.'
        });
    };

    const handleResetTraffic = () => {
        setResetModal({
            isOpen: true,
            type: 'traffic',
            title: 'Delete All Traffic Analytics Data?',
            description: 'This will permanently delete ALL visitor tracking data, including visits and page views.'
        });
    };

    const handleResetUsers = () => {
        setResetModal({
            isOpen: true,
            type: 'users',
            title: 'Delete All User Accounts?',
            description: 'This will permanently delete ALL regular user accounts. Admin accounts will be preserved.'
        });
    };

    const handleResetGame = () => {
        setResetModal({
            isOpen: true,
            type: 'game',
            title: 'Delete All Game Data?',
            description: 'This will permanently delete ALL Deal or No Deal game data, including games, player profiles, and trophies.'
        });
    };

    const handleResetAllDatabases = () => {
        setResetModal({
            isOpen: true,
            type: 'all_databases',
            title: '⚠️ Reset ALL Databases?',
            description: 'This will permanently delete ALL data from ALL databases including pools, staking, games, lessons, traffic analytics, and user profiles (except admins). This is an irreversible action!'
        });
    };



    const confirmReset = async (includeWithdrawals) => {
        if (resetModal.type?.startsWith('pool_')) {
            const poolType = resetModal.type.replace('pool_', '');
            await deletePoolDataMutation.mutateAsync({ poolType, includeWithdrawals });
        } else if (resetModal.type === 'staking') {
            await deleteStakingDataMutation.mutateAsync(includeWithdrawals);
        } else if (resetModal.type === 'lessons') {
            await deleteLessonsDataMutation.mutateAsync();
        } else if (resetModal.type === 'traffic') {
            await deleteTrafficDataMutation.mutateAsync();
        } else if (resetModal.type === 'users') {
            await deleteUsersDataMutation.mutateAsync();
        } else if (resetModal.type === 'game') {
            await deleteGameDataMutation.mutateAsync();
        } else if (resetModal.type === 'all_databases') {
            // Use backend function to delete all data
            const { error } = await supabase.functions.invoke('delete-all-data', {});
            if (error) throw error;
            // Invalidate all queries to refresh data
            queryClient.invalidateQueries();
        }
        setResetModal({ isOpen: false, type: null, title: '', description: '' });
    };

    if (isChecking || !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-black flex relative overflow-hidden">
            {/* Animated Red Background */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                    background: [
                        'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                    ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Mobile Menu Button */}
            <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-xl rounded-lg text-white border border-white/20"
            >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {(sidebarOpen || isDesktop) && (
                    <motion.aside
                        initial={isDesktop ? false : { x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        className="fixed top-0 left-0 h-screen w-64 bg-black/40 backdrop-blur-xl border-r border-red-500/30 p-6 z-40 flex flex-col"
                        style={{
                            boxShadow: '0 8px 32px 0 rgba(220, 38, 38, 0.2)'
                        }}
                    >
                        <Link to={createPageUrl('Landing')} className="mb-6 block hover:opacity-80 transition-opacity">
                            <Logo size="default" showText={true} />
                        </Link>

                        <Link to={createPageUrl('Landing')} className="mb-4 block">
                            <Button variant="outline" className="w-full justify-start text-gray-400 hover:text-white border-white/10 hover:bg-white/5">
                                <Home className="w-4 h-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>

                        <nav className="flex-1 space-y-2">
                            <motion.button
                                onClick={() => setActiveSection('main')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden ${activeSection === 'main' ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-white border border-red-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    } transition-all`}
                            >
                                {activeSection === 'main' && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeSection === 'main' ? { rotate: [0, 180, 360] } : {}}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Settings className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Main Admin</span>
                            </motion.button>

                            <motion.button
                                onClick={() => setActiveSection('dealornodeal')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden ${activeSection === 'dealornodeal' ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-white border border-yellow-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    } transition-all`}
                            >
                                {activeSection === 'dealornodeal' && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeSection === 'dealornodeal' ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 0.5, repeat: activeSection === 'dealornodeal' ? Infinity : 0, repeatDelay: 2 }}
                                >
                                    <Briefcase className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Deal or No Deal</span>
                            </motion.button>

                            <motion.button
                                onClick={() => setActiveSection('kyc')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden ${activeSection === 'kyc' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    } transition-all`}
                            >
                                {activeSection === 'kyc' && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeSection === 'kyc' ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Shield className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">KYC Verification</span>
                            </motion.button>

                            <motion.button
                                onClick={() => setActiveSection('apimonitor')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden ${activeSection === 'apimonitor' ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-white border border-red-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    } transition-all`}
                            >
                                {activeSection === 'apimonitor' && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeSection === 'apimonitor' ? { rotate: [0, 360] } : {}}
                                    transition={{ duration: 2, repeat: activeSection === 'apimonitor' ? Infinity : 0 }}
                                >
                                    <Shield className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">API Monitor</span>
                            </motion.button>

                            <motion.button
                                onClick={() => setActiveSection('nftsales')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden ${activeSection === 'nftsales' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    } transition-all`}
                            >
                                {activeSection === 'nftsales' && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeSection === 'nftsales' ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 0.5, repeat: activeSection === 'nftsales' ? Infinity : 0, repeatDelay: 2 }}
                                >
                                    <ShoppingBag className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">NFT Sales</span>
                            </motion.button>

                            <motion.button
                                onClick={() => setActiveSection('notifications')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden ${activeSection === 'notifications' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-white border border-green-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    } transition-all`}
                            >
                                {activeSection === 'notifications' && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={unreadNotifications.length > 0 ? {
                                        rotate: [0, -15, 15, -10, 10, 0],
                                        scale: [1, 1.1, 1]
                                    } : {}}
                                    transition={{ duration: 0.5, repeat: unreadNotifications.length > 0 ? Infinity : 0, repeatDelay: 3 }}
                                >
                                    <Bell className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Notifications</span>
                                {unreadNotifications.length > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                                    >
                                        {unreadNotifications.length}
                                    </motion.span>
                                )}
                            </motion.button>

                            <motion.button
                                onClick={() => setActiveSection('backup')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden ${activeSection === 'backup' ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    } transition-all`}
                            >
                                {activeSection === 'backup' && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeSection === 'backup' ? {
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 180, 360]
                                    } : {}}
                                    transition={{ duration: 2, repeat: activeSection === 'backup' ? Infinity : 0, repeatDelay: 3 }}
                                >
                                    <Database className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Backup & Restore</span>
                            </motion.button>

                            <motion.button
                                onClick={() => setActiveSection('ip')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden ${activeSection === 'ip' ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white border border-orange-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    } transition-all`}
                            >
                                {activeSection === 'ip' && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeSection === 'ip' ? {
                                        scale: [1, 1.15, 1],
                                        rotate: [0, 360]
                                    } : {}}
                                    transition={{ duration: 2, repeat: activeSection === 'ip' ? Infinity : 0, repeatDelay: 2 }}
                                >
                                    <Globe className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">IP Tracking</span>
                            </motion.button>

                            <motion.button
                                onClick={() => setActiveSection('chat')}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left relative overflow-hidden ${activeSection === 'chat' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    } transition-all`}
                            >
                                {activeSection === 'chat' && (
                                    <motion.div
                                        layoutId="activeSidebar"
                                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <motion.div
                                    animate={activeSection === 'chat' ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 0.5, repeat: activeSection === 'chat' ? Infinity : 0, repeatDelay: 2 }}
                                >
                                    <MessageCircle className="w-5 h-5 relative z-10" />
                                </motion.div>
                                <span className="relative z-10 font-medium">Chat Management</span>
                            </motion.button>

                            <Link
                                to={createPageUrl('TrafficAnalytics')}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <BarChart3 className="w-5 h-5" />
                                Traffic Analytics
                            </Link>
                        </nav>

                        <div className="pt-6 border-t border-white/10">
                            <Link to={createPageUrl('Dashboard')}>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-auto relative z-10 transition-all duration-300 ${isDesktop ? 'ml-64' : ''}`}>
                <div className="max-w-7xl mx-auto">
                    {activeSection === 'backup' && (
                        <>
                            <div className="mb-8 pt-12 lg:pt-0">
                                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Database className="w-10 h-10 text-emerald-400" />
                                    Backup & Restore
                                </h1>
                                <p className="text-gray-400">Create and restore complete database backups</p>
                            </div>
                            <BackupRestore />
                        </>
                    )}

                    {activeSection === 'ip' && (
                        <>
                            <div className="mb-8 pt-12 lg:pt-0">
                                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Globe className="w-10 h-10 text-orange-400" />
                                    IP Tracking
                                </h1>
                                <p className="text-gray-400">Monitor IP addresses and countries of all platform visitors</p>
                            </div>
                            <IPTrackingPanel />
                        </>
                    )}

                    {activeSection === 'chat' && (
                        <>
                            <div className="mb-8 pt-12 lg:pt-0">
                                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <MessageCircle className="w-10 h-10 text-cyan-400" />
                                    Chat Management
                                </h1>
                                <p className="text-gray-400">Manage users, approve profiles, and manage chat channels</p>
                            </div>
                            <ChatRoomAdmin />
                        </>
                    )}

                    {activeSection === 'nftsales' && (
                        <>
                            <div className="mb-8 pt-12 lg:pt-0">
                                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <ShoppingBag className="w-10 h-10 text-purple-400" />
                                    NFT Sales Management
                                </h1>
                                <p className="text-gray-400">Process player NFT sales and manage BTC payments</p>
                            </div>
                            <NFTSalesPanel />
                        </>
                    )}

                    {activeSection === 'notifications' && (
                        <>
                            <div className="mb-8 pt-12 lg:pt-0">
                                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Bell className="w-10 h-10 text-green-400" />
                                    Admin Notifications
                                </h1>
                                <p className="text-gray-400">View all platform notifications and alerts</p>
                            </div>
                            <AdminNotificationsPanel />
                        </>
                    )}

                    {activeSection === 'apimonitor' && (
                        <>
                            <div className="mb-8 pt-12 lg:pt-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                            <Shield className="w-10 h-10 text-red-400" />
                                            API Usage Monitor
                                        </h1>
                                        <p className="text-gray-400">Track external API calls and detect anomalies</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={async () => {
                                                try {
                                                    const { error } = await supabase.functions.invoke('test-api-monitoring', {});
                                                    if (error) throw error;
                                                    queryClient.invalidateQueries(['apiLogs']);
                                                } catch (error) {
                                                    alert('Failed to generate test logs: ' + error.message);
                                                }
                                            }}
                                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white"
                                        >
                                            Generate Test Logs
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (confirm('⚠️ Delete all API logs? This action cannot be undone.')) {
                                                    deleteApiLogsMutation.mutate();
                                                }
                                            }}
                                            disabled={deleteApiLogsMutation.isPending}
                                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Reset Logs
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Critical Alerts */}
                            {(() => {
                                const last24h = apiLogs.filter(log => {
                                    const logDate = new Date(log.created_date);
                                    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                                    return logDate > oneDayAgo;
                                });
                                const failureRate = last24h.length > 0 ? ((last24h.filter(l => !l.success).length / last24h.length) * 100) : 0;

                                // Detect suspicious wallet activity
                                const walletCalls = {};
                                last24h.forEach(log => {
                                    if (log.user_wallet) {
                                        walletCalls[log.user_wallet] = (walletCalls[log.user_wallet] || 0) + 1;
                                    }
                                });
                                const suspiciousWallets = Object.entries(walletCalls).filter(([_, count]) => count > 50);

                                return (failureRate > 20 || suspiciousWallets.length > 0) ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-8 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-2xl p-6 led-glow-red"
                                    >
                                        <div className="flex items-start gap-4">
                                            <Bell className="w-8 h-8 text-red-400 flex-shrink-0 mt-1 animate-pulse" />
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-red-400 mb-2">🚨 Security Alerts Detected</h3>
                                                <div className="space-y-3">
                                                    {failureRate > 20 && (
                                                        <div className="bg-black/30 rounded-lg p-4">
                                                            <p className="text-white font-bold mb-1">⚠️ High Failure Rate: {failureRate.toFixed(1)}%</p>
                                                            <p className="text-gray-300 text-sm">API calls are failing at an unusually high rate. Check API keys and service status.</p>
                                                        </div>
                                                    )}
                                                    {suspiciousWallets.map(([wallet, count]) => (
                                                        <div key={wallet} className="bg-black/30 rounded-lg p-4">
                                                            <p className="text-white font-bold mb-1">⚠️ Suspicious Activity: {count} calls in 24h</p>
                                                            <p className="text-gray-300 text-sm">Wallet {wallet.slice(0, 6)}...{wallet.slice(-4)} has made {count} API calls. Possible attack or abuse.</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : null;
                            })()}

                            {/* Security Controls */}
                            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                                {/* API Kill Switches */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-red-400" />
                                        API Controls
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { name: 'BSCSCAN', key: 'bscscan_enabled', color: 'yellow' },
                                            { name: 'FINNHUB', key: 'finnhub_enabled', color: 'blue' },
                                            { name: 'MEXC', key: 'mexc_enabled', color: 'purple' }
                                        ].map(api => (
                                            <div key={api.key} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                                                <span className={`text-${api.color}-400 font-bold`}>{api.name}</span>
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateApiSettingsMutation.mutate({ [api.key]: !currentApiSettings[api.key] })}
                                                    disabled={updateApiSettingsMutation.isPending}
                                                    className={currentApiSettings[api.key]
                                                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50'
                                                        : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50'
                                                    }
                                                >
                                                    {currentApiSettings[api.key] ? 'Enabled' : 'Disabled'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Rate Limit Controls */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4">Rate Limits</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-gray-400 text-sm mb-2 block">Max Calls / 24h</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="number"
                                                    value={currentApiSettings.rate_limit_threshold}
                                                    onChange={(e) => updateApiSettingsMutation.mutate({
                                                        rate_limit_threshold: parseInt(e.target.value) || 50
                                                    })}
                                                    className="bg-white/5 border-white/10 text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                                            <p className="text-orange-400 text-xs">
                                                Current: {currentApiSettings.rate_limit_threshold} calls per wallet
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Block Wallet Quick Action */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4">Block Wallet</h3>
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Wallet address..."
                                            id="blockWalletInput"
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                        <Button
                                            onClick={() => {
                                                const wallet = document.getElementById('blockWalletInput').value.trim();
                                                if (!wallet) {
                                                    alert('Please enter a wallet address');
                                                    return;
                                                }
                                                if (confirm(`Block wallet ${wallet}?`)) {
                                                    blockWalletMutation.mutate({
                                                        wallet_address: wallet,
                                                        reason: 'Manual admin block'
                                                    });
                                                }
                                            }}
                                            disabled={blockWalletMutation.isPending}
                                            className="w-full bg-red-500 hover:bg-red-600 text-white"
                                        >
                                            🚫 Block Wallet
                                        </Button>
                                        <div className="text-gray-400 text-xs">
                                            Blocked: {blockedWallets.length} wallets
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Blocked Wallets List */}
                            {blockedWallets.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8 bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-red-500/30 rounded-2xl p-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-red-400" />
                                        Blocked Wallets ({blockedWallets.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {blockedWallets.map(blocked => (
                                            <div key={blocked.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                                                <div>
                                                    <p className="text-white font-mono text-sm">
                                                        {blocked.wallet_address.slice(0, 8)}...{blocked.wallet_address.slice(-6)}
                                                    </p>
                                                    <p className="text-gray-400 text-xs">{blocked.reason}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => unblockWalletMutation.mutate(blocked.id)}
                                                    disabled={unblockWalletMutation.isPending}
                                                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
                                                >
                                                    Unblock
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Stats Cards */}
                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6"
                                >
                                    <p className="text-gray-400 text-sm mb-1">Total API Calls (24h)</p>
                                    <p className="text-white text-3xl font-bold">
                                        {apiLogs.filter(log => {
                                            const logDate = new Date(log.created_date);
                                            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                                            return logDate > oneDayAgo;
                                        }).length}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6"
                                >
                                    <p className="text-gray-400 text-sm mb-1">Success Rate</p>
                                    <p className="text-white text-3xl font-bold">
                                        {apiLogs.length > 0
                                            ? ((apiLogs.filter(log => log.success).length / apiLogs.length) * 100).toFixed(1)
                                            : 0}%
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6"
                                >
                                    <p className="text-gray-400 text-sm mb-1">Failed Calls (24h)</p>
                                    <p className="text-white text-3xl font-bold">
                                        {apiLogs.filter(log => {
                                            const logDate = new Date(log.created_date);
                                            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                                            return !log.success && logDate > oneDayAgo;
                                        }).length}
                                    </p>
                                </motion.div>
                            </div>

                            {/* API Usage Charts */}
                            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                {/* Calls Over Time */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-400" />
                                        API Calls Timeline (24h)
                                    </h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={(() => {
                                            const hours = {};
                                            const now = new Date();
                                            for (let i = 23; i >= 0; i--) {
                                                const hour = new Date(now - i * 60 * 60 * 1000);
                                                const key = hour.getHours() + 'h';
                                                hours[key] = { hour: key, success: 0, failed: 0 };
                                            }
                                            apiLogs.forEach(log => {
                                                const logDate = new Date(log.created_date);
                                                const hoursDiff = Math.floor((now - logDate) / (1000 * 60 * 60));
                                                if (hoursDiff < 24) {
                                                    const key = logDate.getHours() + 'h';
                                                    if (hours[key]) {
                                                        hours[key][log.success ? 'success' : 'failed']++;
                                                    }
                                                }
                                            });
                                            return Object.values(hours);
                                        })()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="hour" stroke="#9CA3AF" />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Legend />
                                            <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} name="Success" />
                                            <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </motion.div>

                                {/* API Distribution */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4">API Usage by Source</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={(() => {
                                            const apis = { bscscan: 0, finnhub: 0, mexc: 0 };
                                            apiLogs.forEach(log => {
                                                if (apis[log.api_name] !== undefined) apis[log.api_name]++;
                                            });
                                            return Object.entries(apis).map(([name, count]) => ({ name: name.toUpperCase(), calls: count }));
                                        })()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="name" stroke="#9CA3AF" />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="calls" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </motion.div>

                                {/* Function Usage */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4">Top Functions</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={(() => {
                                            const functions = {};
                                            apiLogs.forEach(log => {
                                                functions[log.function_name] = (functions[log.function_name] || 0) + 1;
                                            });
                                            return Object.entries(functions)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 5)
                                                .map(([name, count]) => ({ name, calls: count }));
                                        })()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="calls" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </motion.div>

                                {/* Success vs Failed Pie Chart */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4">Success Rate Distribution</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={(() => {
                                                    const success = apiLogs.filter(l => l.success).length;
                                                    const failed = apiLogs.filter(l => !l.success).length;
                                                    return [
                                                        { name: 'Success', value: success, color: '#10b981' },
                                                        { name: 'Failed', value: failed, color: '#ef4444' }
                                                    ];
                                                })()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {[{ color: '#10b981' }, { color: '#ef4444' }].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            </div>

                            {/* API Logs Table */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Recent API Calls</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Time</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">API</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Function</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">User</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">IP / Location</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">TX Hash</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Error</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const logsPerPage = 20;
                                                const startIndex = (apiLogsPage - 1) * logsPerPage;
                                                const endIndex = startIndex + logsPerPage;
                                                const paginatedLogs = apiLogs.slice(startIndex, endIndex);

                                                return paginatedLogs.map((log, index) => (
                                                    <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="py-3 px-4 text-gray-400 text-sm">
                                                            {new Date(log.created_date).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${log.api_name === 'bscscan' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                log.api_name === 'finnhub' ? 'bg-blue-500/20 text-blue-400' :
                                                                    'bg-purple-500/20 text-purple-400'
                                                                }`}>
                                                                {log.api_name.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-white text-sm">
                                                            {log.function_name}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                                                            {log.user_wallet ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span>{log.user_wallet.slice(0, 6)}...{log.user_wallet.slice(-4)}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(log.user_wallet);
                                                                            alert('✅ Wallet address copied');
                                                                        }}
                                                                        className="text-gray-500 hover:text-white transition-colors"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-400 text-xs">
                                                            {log.ip_address ? (
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-mono">{log.ip_address}</span>
                                                                        <button
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(log.ip_address);
                                                                                alert('✅ IP address copied');
                                                                            }}
                                                                            className="text-gray-500 hover:text-white transition-colors"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                    {log.country && (
                                                                        <div className="text-orange-400 text-xs">
                                                                            {log.city ? `${log.city}, ${log.country}` : log.country}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-cyan-400 font-mono text-xs">
                                                            {log.tx_hash ? (
                                                                <div className="flex items-center gap-2">
                                                                    <a
                                                                        href={`https://bscscan.com/tx/${log.tx_hash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="hover:underline flex items-center gap-1 hover:text-cyan-300"
                                                                    >
                                                                        <span>{log.tx_hash.slice(0, 6)}...{log.tx_hash.slice(-4)}</span>
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {log.success ? (
                                                                <span className="text-green-400 font-bold">✓</span>
                                                            ) : (
                                                                <span className="text-red-400 font-bold">✗</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-red-400 text-xs max-w-xs truncate">
                                                            {log.error_message || '-'}
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                            {apiLogs.length === 0 && (
                                                <tr>
                                                    <td colSpan="8" className="py-8 text-center text-gray-500">
                                                        No API calls recorded yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {apiLogs.length > 20 && (
                                    <Pagination
                                        currentPage={apiLogsPage}
                                        totalPages={Math.ceil(apiLogs.length / 20)}
                                        onPageChange={setApiLogsPage}
                                    />
                                )}
                            </motion.div>

                            {/* Alert Info */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-blue-400 text-sm space-y-2">
                                        <p><strong>Watch for anomalies:</strong></p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Same wallet making 100+ API calls in short time (potential attack)</li>
                                            <li>Sudden spike in failed API calls (possible key issue)</li>
                                            <li>API calls from unknown or suspicious transactions</li>
                                            <li>Unusual access patterns outside normal business hours</li>
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}

                    {activeSection === 'dealornodeal' && (
                        <>
                            <div className="mb-8 pt-12 lg:pt-0">
                                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Briefcase className="w-10 h-10 text-[#f5c96a]" />
                                    Deal or No Deal Admin
                                </h1>
                                <p className="text-gray-400">Track all game transactions and statistics</p>
                            </div>
                            <DealOrNoDealPanel />
                        </>
                    )}

                    {activeSection === 'kyc' && (
                        <>
                            <div className="mb-8 pt-12 lg:pt-0">
                                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Shield className="w-10 h-10 text-cyan-400" />
                                    AML & KYC Verification
                                </h1>
                                <p className="text-gray-400">Review and manage user identity verification submissions</p>
                            </div>
                            <KYCVerificationPanel />
                        </>
                    )}



                    {activeSection === 'main' && (
                        <>
                            {/* Header */}
                            <div className="mb-8 pt-12 lg:pt-0">
                                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Shield className="w-10 h-10 text-[#f5c96a]" />
                                    Admin Panel
                                </h1>
                                <p className="text-gray-400">Monitor and manage all pools and staking contracts</p>
                            </div>
                            {/* Expiring Contracts Alert */}
                            {expiringContracts.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-6 mb-8 led-glow-orange"
                                >
                                    <div className="flex items-start gap-4">
                                        <Bell className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2">
                                                Payment Notifications ({expiringContracts.length})
                                            </h3>
                                            <p className="text-gray-300 mb-4">
                                                The following contracts are expiring within 7 days and require payment:
                                            </p>
                                            <div className="space-y-2">
                                                {expiringContracts.map(contract => {
                                                    const endDate = new Date(contract.end_date);
                                                    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

                                                    return (
                                                        <div key={contract.id} className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
                                                            <div>
                                                                <span className="text-white font-bold">
                                                                    {contract.wallet_address.slice(0, 8)}...{contract.wallet_address.slice(-6)}
                                                                </span>
                                                                <span className="text-gray-400 ml-3">
                                                                    {contract.crypto_type} • {(contract.current_value || 0).toFixed(6)} total
                                                                </span>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${daysLeft <= 1 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                                                                }`}>
                                                                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Overall Stats */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 overflow-hidden"
                                    style={{ boxShadow: '0 8px 32px 0 rgba(34, 211, 238, 0.15)' }}
                                >
                                    <motion.div
                                        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Users className="w-8 h-8 text-cyan-400 mb-3 relative z-10" />
                                    </motion.div>
                                    <p className="text-gray-400 text-sm mb-1 relative z-10">Total Investments</p>
                                    <p className="text-white text-xl sm:text-2xl font-bold relative z-10">
                                        ${(
                                            (scalpingStats?.totalInvested || 0) +
                                            (traditionalStats?.totalInvested || 0) +
                                            (getPoolStats('vip')?.totalInvested || 0)
                                        ).toFixed(2)}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1 relative z-10">Total invested capital</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 overflow-hidden"
                                    style={{ boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.15)' }}
                                >
                                    <motion.div
                                        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <DollarSign className="w-8 h-8 text-green-400 mb-3 relative z-10" />
                                    </motion.div>
                                    <p className="text-gray-400 text-sm mb-1 relative z-10">Total Pool Balance</p>
                                    <p className="text-white text-xl sm:text-2xl font-bold relative z-10">
                                        ${(cryptoPoolBalance + vipPoolBalance + (() => {
                                            const traditionalInvestors = allInvestors.filter(inv => inv.pool_type === 'traditional');
                                            const traditionalTrades = allTrades.filter(t => t.pool_type === 'traditional');
                                            const traditionalWithdrawals = allWithdrawals.filter(w => w.pool_type === 'traditional' && w.status === 'paid');
                                            const traditionalSettings = poolSettings.find(s => s.pool_type === 'traditional');
                                            const { totalPoolValue } = calculateTimeBasedBalances({
                                                investors: traditionalInvestors,
                                                trades: traditionalTrades,
                                                withdrawals: traditionalWithdrawals,
                                                profitShareRate: traditionalSettings?.profit_share_rate || 0,
                                                isAdmin: true
                                            });
                                            return totalPoolValue;
                                        })()).toFixed(2)}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1 relative z-10">Real-time balance across all pools</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="relative bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 overflow-hidden"
                                    style={{ boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.15)' }}
                                >
                                    <motion.div
                                        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Users className="w-8 h-8 text-blue-400 mb-3 relative z-10" />
                                    </motion.div>
                                    <p className="text-gray-400 text-sm mb-1 relative z-10">Active Investors</p>
                                    <p className="text-white text-xl sm:text-2xl font-bold relative z-10">
                                        {new Set([
                                            ...allInvestors.map(inv => inv.wallet_address)
                                        ]).size}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1 relative z-10">Registered participants</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="relative bg-black/40 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 overflow-hidden"
                                    style={{ boxShadow: '0 8px 32px 0 rgba(245, 201, 106, 0.15)' }}
                                >
                                    <motion.div
                                        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                                    />
                                    <motion.div
                                        animate={{ y: [-3, 3, -3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <TrendingUp className="w-8 h-8 text-yellow-400 mb-3 relative z-10" />
                                    </motion.div>
                                    <p className="text-gray-400 text-sm mb-1 relative z-10">Pools Total Net PnL</p>
                                    <p className={`text-xl sm:text-2xl font-bold relative z-10 ${(() => {
                                        const scalpingInvestors = allInvestors.filter(inv => inv.pool_type === 'scalping');
                                        const scalpingTrades = allTrades.filter(t => t.pool_type === 'scalping');
                                        const scalpingWithdrawals = allWithdrawals.filter(w => w.pool_type === 'scalping' && w.status === 'paid');
                                        const scalpingSettings = poolSettings.find(s => s.pool_type === 'scalping');
                                        const scalpingMetrics = calculateTimeBasedBalances({
                                            investors: scalpingInvestors,
                                            trades: scalpingTrades,
                                            withdrawals: scalpingWithdrawals,
                                            profitShareRate: scalpingSettings?.profit_share_rate || 0,
                                            isAdmin: true
                                        });

                                        const traditionalInvestors = allInvestors.filter(inv => inv.pool_type === 'traditional');
                                        const traditionalTrades = allTrades.filter(t => t.pool_type === 'traditional');
                                        const traditionalWithdrawals = allWithdrawals.filter(w => w.pool_type === 'traditional' && w.status === 'paid');
                                        const traditionalSettings = poolSettings.find(s => s.pool_type === 'traditional');
                                        const traditionalMetrics = calculateTimeBasedBalances({
                                            investors: traditionalInvestors,
                                            trades: traditionalTrades,
                                            withdrawals: traditionalWithdrawals,
                                            profitShareRate: traditionalSettings?.profit_share_rate || 0,
                                            isAdmin: true
                                        });

                                        const vipInvestors = allInvestors.filter(inv => inv.pool_type === 'vip');
                                        const vipTrades = allTrades.filter(t => t.pool_type === 'vip');
                                        const vipWithdrawals = allWithdrawals.filter(w => w.pool_type === 'vip' && w.status === 'paid');
                                        const vipSettings = poolSettings.find(s => s.pool_type === 'vip');
                                        const vipMetrics = calculateTimeBasedBalances({
                                            investors: vipInvestors,
                                            trades: vipTrades,
                                            withdrawals: vipWithdrawals,
                                            profitShareRate: vipSettings?.profit_share_rate || 0,
                                            isAdmin: true
                                        });

                                        const totalNetPnl = (scalpingMetrics.totalPoolValue - (scalpingInvestors.reduce((sum, inv) => sum + inv.invested_amount, 0) - scalpingWithdrawals.reduce((sum, w) => sum + w.amount, 0))) +
                                            (traditionalMetrics.totalPoolValue - (traditionalInvestors.reduce((sum, inv) => sum + inv.invested_amount, 0) - traditionalWithdrawals.reduce((sum, w) => sum + w.amount, 0))) +
                                            (vipMetrics.totalPoolValue - (vipInvestors.reduce((sum, inv) => sum + inv.invested_amount, 0) - vipWithdrawals.reduce((sum, w) => sum + w.amount, 0)));
                                        return totalNetPnl >= 0 ? 'text-green-400' : 'text-red-400';
                                    })()
                                        }`}>
                                        ${(() => {
                                            const scalpingInvestors = allInvestors.filter(inv => inv.pool_type === 'scalping');
                                            const scalpingTrades = allTrades.filter(t => t.pool_type === 'scalping');
                                            const scalpingWithdrawals = allWithdrawals.filter(w => w.pool_type === 'scalping' && w.status === 'paid');
                                            const scalpingSettings = poolSettings.find(s => s.pool_type === 'scalping');
                                            const scalpingMetrics = calculateTimeBasedBalances({
                                                investors: scalpingInvestors,
                                                trades: scalpingTrades,
                                                withdrawals: scalpingWithdrawals,
                                                profitShareRate: scalpingSettings?.profit_share_rate || 0,
                                                isAdmin: true
                                            });

                                            const traditionalInvestors = allInvestors.filter(inv => inv.pool_type === 'traditional');
                                            const traditionalTrades = allTrades.filter(t => t.pool_type === 'traditional');
                                            const traditionalWithdrawals = allWithdrawals.filter(w => w.pool_type === 'traditional' && w.status === 'paid');
                                            const traditionalSettings = poolSettings.find(s => s.pool_type === 'traditional');
                                            const traditionalMetrics = calculateTimeBasedBalances({
                                                investors: traditionalInvestors,
                                                trades: traditionalTrades,
                                                withdrawals: traditionalWithdrawals,
                                                profitShareRate: traditionalSettings?.profit_share_rate || 0,
                                                isAdmin: true
                                            });

                                            const vipInvestors = allInvestors.filter(inv => inv.pool_type === 'vip');
                                            const vipTrades = allTrades.filter(t => t.pool_type === 'vip');
                                            const vipWithdrawals = allWithdrawals.filter(w => w.pool_type === 'vip' && w.status === 'paid');
                                            const vipSettings = poolSettings.find(s => s.pool_type === 'vip');
                                            const vipMetrics = calculateTimeBasedBalances({
                                                investors: vipInvestors,
                                                trades: vipTrades,
                                                withdrawals: vipWithdrawals,
                                                profitShareRate: vipSettings?.profit_share_rate || 0,
                                                isAdmin: true
                                            });

                                            const totalNetPnl = (scalpingMetrics.totalPoolValue - (scalpingInvestors.reduce((sum, inv) => sum + inv.invested_amount, 0) - scalpingWithdrawals.reduce((sum, w) => sum + w.amount, 0))) +
                                                (traditionalMetrics.totalPoolValue - (traditionalInvestors.reduce((sum, inv) => sum + inv.invested_amount, 0) - traditionalWithdrawals.reduce((sum, w) => sum + w.amount, 0))) +
                                                (vipMetrics.totalPoolValue - (vipInvestors.reduce((sum, inv) => sum + inv.invested_amount, 0) - vipWithdrawals.reduce((sum, w) => sum + w.amount, 0)));
                                            return Math.abs(totalNetPnl).toFixed(2);
                                        })()}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1 relative z-10">All pools combined</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 overflow-hidden"
                                    style={{ boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.15)' }}
                                >
                                    <motion.div
                                        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Shield className="w-8 h-8 text-purple-400 mb-3 relative z-10" />
                                    </motion.div>
                                    <p className="text-gray-400 text-sm mb-1 relative z-10">Security Score</p>
                                    <p className="text-white text-xl sm:text-2xl font-bold relative z-10">
                                        {(() => {
                                            const totalTrades = allTrades.length;
                                            if (totalTrades === 0) return '100.0%';
                                            const wins = allTrades.filter(t => t.result === 'win').length;
                                            return ((wins / totalTrades) * 100).toFixed(1) + '%';
                                        })()}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1 relative z-10">Trade success rate</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="relative bg-black/40 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 overflow-hidden"
                                    style={{ boxShadow: '0 8px 32px 0 rgba(249, 115, 22, 0.15)' }}
                                >
                                    <motion.div
                                        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                                    />
                                    <motion.div
                                        animate={{
                                            x: [0, 3, 0],
                                            y: [0, -3, 0]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <ArrowUpRight className="w-8 h-8 text-orange-400 mb-3 relative z-10" />
                                    </motion.div>
                                    <p className="text-gray-400 text-sm mb-1 relative z-10">Paid to Investors</p>
                                    <p className="text-white text-xl sm:text-2xl font-bold relative z-10">
                                        ${allWithdrawals
                                            .filter(w => w.status === 'paid' && ['scalping', 'traditional', 'vip'].includes(w.pool_type))
                                            .reduce((sum, w) => sum + w.amount, 0)
                                            .toFixed(2)}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1 relative z-10">Total earnings distributed</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 overflow-hidden"
                                    style={{ boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.15)' }}
                                >
                                    <motion.div
                                        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Clock className="w-8 h-8 text-purple-400 mb-3 relative z-10" />
                                    </motion.div>
                                    <p className="text-gray-400 text-sm mb-1 relative z-10">Active Staking</p>
                                    <p className="text-white text-xl sm:text-2xl font-bold relative z-10">{stakingStats.active}</p>
                                </motion.div>
                            </div>

                            {/* Trade Splitter Calculator */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="mb-8"
                            >
                                <TradeSplitter
                                    cryptoPoolBalance={cryptoPoolBalance}
                                    vipPoolBalance={vipPoolBalance}
                                />
                            </motion.div>

                            {/* Pools Overview */}
                            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                                {[
                                    { type: 'scalping', name: 'Crypto Pool', stats: scalpingStats, color: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/30', adminPage: 'CryptoPoolAdmin' },
                                    { type: 'traditional', name: 'Traditional Pool', stats: traditionalStats, color: 'from-yellow-500/10 to-orange-500/10 border-yellow-500/30', adminPage: 'TraditionalPoolAdmin' },
                                    { type: 'vip', name: 'VIP Pool', stats: getPoolStats('vip'), color: 'from-purple-500/10 to-pink-500/10 border-purple-500/30', adminPage: 'VIPPoolAdmin' }
                                ].map((pool, index) => {
                                    return (
                                        <motion.div
                                            key={pool.type}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + index * 0.05 }}
                                            className={`relative bg-black/40 backdrop-blur-xl border ${index === 0 ? 'border-cyan-500/30' : index === 1 ? 'border-yellow-500/30' : 'border-purple-500/30'
                                                } rounded-2xl p-6 overflow-hidden`}
                                            style={{
                                                boxShadow: index === 0
                                                    ? '0 8px 32px 0 rgba(34, 211, 238, 0.15)'
                                                    : index === 1
                                                        ? '0 8px 32px 0 rgba(245, 201, 106, 0.15)'
                                                        : '0 8px 32px 0 rgba(168, 85, 247, 0.15)'
                                            }}
                                        >
                                            <motion.div
                                                className={`absolute top-0 right-0 w-40 h-40 ${index === 0 ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10' :
                                                    index === 1 ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10' :
                                                        'bg-gradient-to-br from-purple-500/20 to-pink-500/10'
                                                    } rounded-full blur-3xl`}
                                                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                                transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
                                            />
                                            <h3 className="text-xl font-bold text-white mb-4 relative z-10">{pool.name}</h3>
                                            <div className="space-y-2 mb-4 text-sm relative z-10">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Investors</span>
                                                    <span className="text-white font-bold">{pool.stats.investors}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Deposited</span>
                                                    <span className="text-white font-bold">${(pool.stats?.totalInvested || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Current Balance</span>
                                                    <span className="text-cyan-400 font-bold">${(() => {
                                                        const investors = allInvestors.filter(inv => inv.pool_type === pool.type);
                                                        const trades = allTrades.filter(t => t.pool_type === pool.type);
                                                        const withdrawals = allWithdrawals.filter(w => w.pool_type === pool.type && w.status === 'paid');
                                                        const settings = poolSettings.find(s => s.pool_type === pool.type);
                                                        const { totalPoolValue } = calculateTimeBasedBalances({
                                                            investors,
                                                            trades,
                                                            withdrawals,
                                                            profitShareRate: settings?.profit_share_rate || 0,
                                                            isAdmin: true
                                                        });
                                                        return totalPoolValue.toFixed(2);
                                                    })()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Payouts</span>
                                                    <span className="text-orange-400 font-bold">${allWithdrawals
                                                        .filter(w => w.pool_type === pool.type && w.status === 'paid')
                                                        .reduce((sum, w) => sum + w.amount, 0)
                                                        .toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Trades</span>
                                                    <span className="text-white font-bold">{pool.stats?.trades || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Win Rate</span>
                                                    <span className="text-green-400 font-bold">{(pool.stats?.winRate || 0).toFixed(2)}%</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 relative z-10">
                                                <Link to={createPageUrl(pool.adminPage)} className="flex-1">
                                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                        <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-0 rounded-xl">
                                                            Manage
                                                        </Button>
                                                    </motion.div>
                                                </Link>
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Button
                                                        onClick={() => handleResetPool(pool.type)}
                                                        disabled={deletePoolDataMutation.isPending}
                                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Staking Overview */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                />
                                <h3 className="text-xl font-bold text-white mb-4 relative z-10">Staking Overview</h3>
                                <div className="grid md:grid-cols-4 gap-6 mb-4 relative z-10">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Total Contracts</p>
                                        <p className="text-white text-2xl font-bold">{stakingStats.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Active Contracts</p>
                                        <p className="text-green-400 text-2xl font-bold">{stakingStats.active}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Total Staked</p>
                                        <p className="text-white text-2xl font-bold">${(stakingStats?.totalStaked || 0).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Total Earned</p>
                                        <p className="text-green-400 text-2xl font-bold">${(stakingStats?.totalEarned || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 relative z-10">
                                    <Link to={createPageUrl('StakingAdmin')} className="flex-1">
                                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white border-0 rounded-xl">
                                                Manage Staking
                                            </Button>
                                        </motion.div>
                                    </Link>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={handleResetStaking}
                                            disabled={deleteStakingDataMutation.isPending}
                                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Reset All
                                        </Button>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* User Agreements Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.68 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                />
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Shield className="w-6 h-6 text-green-400" />
                                    </motion.div>
                                    Terms Acceptance ({userAgreements.length} Users)
                                </h2>

                                {/* Search Bar */}
                                <div className="mb-4 relative z-10">
                                    <Input
                                        placeholder="🔍 Search by wallet address..."
                                        value={agreementsSearchQuery}
                                        onChange={(e) => {
                                            setAgreementsSearchQuery(e.target.value);
                                            setAgreementsPage(1);
                                        }}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                    />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">User Details</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet Address</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Terms</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Privacy</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Cookies</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Acceptance Date</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                // Filter by search query
                                                let filteredAgreements = userAgreements;
                                                if (agreementsSearchQuery.trim()) {
                                                    const query = agreementsSearchQuery.toLowerCase();
                                                    filteredAgreements = userAgreements.filter(agreement =>
                                                        agreement.wallet_address?.toLowerCase().includes(query)
                                                    );
                                                }

                                                // Paginate
                                                const agreementsPerPage = 10;
                                                const totalPages = Math.ceil(filteredAgreements.length / agreementsPerPage);
                                                const paginatedAgreements = filteredAgreements.slice(
                                                    (agreementsPage - 1) * agreementsPerPage,
                                                    agreementsPage * agreementsPerPage
                                                );

                                                return paginatedAgreements.map((agreement, index) => {
                                                    // Match by wallet address or email from agreement
                                                    const matchedUser = allUsers.find(u => {
                                                        const walletMatch = u.wallet_address?.toLowerCase() === agreement.wallet_address?.toLowerCase();
                                                        const emailMatch = u.email?.toLowerCase() === agreement.email?.toLowerCase();
                                                        return walletMatch || emailMatch;
                                                    });

                                                    return (
                                                        <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                                            <td className="py-3 px-4">
                                                                <div className="space-y-1">
                                                                    {matchedUser?.full_name ? (
                                                                        <p className="text-white font-medium">{matchedUser.full_name}</p>
                                                                    ) : (
                                                                        <p className="text-gray-500 text-sm">No user data</p>
                                                                    )}
                                                                    {matchedUser?.email && (
                                                                        <p className="text-gray-400 text-sm">{matchedUser.email}</p>
                                                                    )}
                                                                    {matchedUser?.role && (
                                                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${matchedUser.role === 'admin'
                                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                                            : 'bg-blue-500/20 text-blue-400'
                                                                            }`}>
                                                                            {matchedUser.role}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-white font-mono text-sm">
                                                                {agreement.wallet_address ? (
                                                                    `${agreement.wallet_address.slice(0, 6)}...${agreement.wallet_address.slice(-4)}`
                                                                ) : (
                                                                    <span className="text-gray-500">Not connected</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {agreement.terms_accepted ? (
                                                                    <span className="text-green-400">✓</span>
                                                                ) : (
                                                                    <span className="text-red-400">✗</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {agreement.privacy_accepted ? (
                                                                    <span className="text-green-400">✓</span>
                                                                ) : (
                                                                    <span className="text-red-400">✗</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {agreement.cookies_accepted ? (
                                                                    <span className="text-green-400">✓</span>
                                                                ) : (
                                                                    <span className="text-red-400">✗</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-400 text-sm">
                                                                {new Date(agreement.acceptance_date).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => setDeleteAgreementModal({ isOpen: true, agreement })}
                                                                    disabled={deleteAgreementMutation.isPending}
                                                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                            {userAgreements.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="py-8 text-center text-gray-500">
                                                        No user agreements recorded yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {(() => {
                                    const filteredAgreements = agreementsSearchQuery.trim()
                                        ? userAgreements.filter(a => a.wallet_address?.toLowerCase().includes(agreementsSearchQuery.toLowerCase()))
                                        : userAgreements;
                                    const totalPages = Math.ceil(filteredAgreements.length / 10);

                                    return totalPages > 1 ? (
                                        <div className="mt-6 relative z-10">
                                            <Pagination
                                                currentPage={agreementsPage}
                                                totalPages={totalPages}
                                                onPageChange={setAgreementsPage}
                                            />
                                        </div>
                                    ) : null;
                                })()}
                            </motion.div>

                            {/* Verify Missing Deposits Tool */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.71 }}
                                className="mt-8"
                            >
                                <VerifyMissingDeposit />
                            </motion.div>

                            {/* Auto Scanner for Missing Deposits */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.712 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                />
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                                    <Activity className="w-6 h-6 text-green-400" />
                                    Automatic Deposit Scanner
                                </h2>
                                <p className="text-gray-300 text-sm mb-6 relative z-10">
                                    Automatically scan blockchain for missing deposits and create records for any transactions not found in the database.
                                </p>
                                <Button
                                    onClick={async () => {
                                        if (confirm('Scan all pool addresses for missing deposits? This will check the last 30 days of transactions.')) {
                                            try {
                                                const { data: results, error } = await supabase.functions.invoke('scan-missing-deposits', {});
                                                if (error) throw error;
                                                alert(`✅ Scan Complete!\n\nPools Scanned: ${results.scanned}\nMissing Deposits Found: ${results.found}\nNew Records Created: ${results.created}\n\n${results.errors.length > 0 ? `Errors: ${results.errors.map(e => e.error).join(', ')}` : ''}`);
                                                queryClient.invalidateQueries(['allPoolInvestors']);
                                            } catch (error) {
                                                alert('❌ Scanner failed: ' + error.message);
                                            }
                                        }
                                    }}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white relative z-10"
                                >
                                    <Activity className="w-4 h-4 mr-2 animate-pulse" />
                                    Run Automatic Scan Now
                                </Button>
                                <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 relative z-10">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div className="text-blue-400 text-sm">
                                            <p className="font-bold mb-2">How it works:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Scans BSCScan for all USDT transactions to each pool wallet</li>
                                                <li>Compares with existing database records</li>
                                                <li>Auto-creates missing deposits with user notifications</li>
                                                <li>Only scans last 30 days to prevent overload</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* All Manual Deposits Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.715 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(34, 211, 238, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 0.8 }}
                                />
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                                    </motion.div>
                                    All Manual Deposits ({manualDeposits.length})
                                </h2>

                                {manualDeposits.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No manual deposits recorded yet
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Pool Type</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">TX Hash</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Verified By</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const depositsPerPage = 10;
                                                    const totalPages = Math.ceil(manualDeposits.length / depositsPerPage);
                                                    const paginatedDeposits = manualDeposits.slice(
                                                        (manualDepositsPage - 1) * depositsPerPage,
                                                        manualDepositsPage * depositsPerPage
                                                    );

                                                    return (
                                                        <>
                                                            {paginatedDeposits.map((deposit) => (
                                                                <tr key={deposit.id} className="border-b border-white/5 hover:bg-white/5">
                                                                    <td className="py-3 px-4 text-white font-mono text-sm">
                                                                        {deposit.wallet_address.slice(0, 8)}...{deposit.wallet_address.slice(-6)}
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <span className={`capitalize px-2 py-1 rounded text-xs font-bold ${deposit.pool_type === 'scalping' ? 'bg-cyan-500/20 text-cyan-400' :
                                                                            deposit.pool_type === 'traditional' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                deposit.pool_type === 'vip' ? 'bg-purple-500/20 text-purple-400' :
                                                                                    'bg-pink-500/20 text-pink-400'
                                                                            }`}>
                                                                            {deposit.pool_type === 'scalping' ? 'Crypto' : deposit.pool_type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-green-400 font-bold">
                                                                        ${deposit.amount.toFixed(2)}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-cyan-400 font-mono text-sm">
                                                                        <a
                                                                            href={`https://bscscan.com/tx/${deposit.tx_hash}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="hover:underline hover:text-cyan-300 flex items-center gap-1"
                                                                        >
                                                                            {deposit.tx_hash.slice(0, 6)}...{deposit.tx_hash.slice(-4)}
                                                                            <ExternalLink className="w-3 h-3" />
                                                                        </a>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-gray-400 text-sm">
                                                                        {deposit.verified_by_admin}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-gray-400 text-sm">
                                                                        {new Date(deposit.created_date).toLocaleString()}
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                if (confirm(`Delete manual deposit record for ${deposit.wallet_address.slice(0, 6)}...${deposit.wallet_address.slice(-4)}?\n\nThis will only delete the manual deposit record, NOT the actual PoolInvestor data.`)) {
                                                                                    deleteManualDepositMutation.mutate(deposit.id);
                                                                                }
                                                                            }}
                                                                            disabled={deleteManualDepositMutation.isPending}
                                                                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </>
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                        {(() => {
                                            const depositsPerPage = 10;
                                            const totalPages = Math.ceil(manualDeposits.length / depositsPerPage);

                                            return totalPages > 1 ? (
                                                <div className="mt-6">
                                                    <Pagination
                                                        currentPage={manualDepositsPage}
                                                        totalPages={totalPages}
                                                        onPageChange={setManualDepositsPage}
                                                    />
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}
                            </motion.div>

                            {/* Deposits Management - All Platform Deposits */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.72 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                                />
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <motion.div
                                            animate={{ scale: [1, 1.15, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <DollarSign className="w-6 h-6 text-green-400" />
                                        </motion.div>
                                        All Platform Deposits ({allInvestors.length + allContracts.length + (allGames?.length || 0)})
                                    </h2>
                                    <Button
                                        onClick={() => setAddDepositModal(true)}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Pool Deposit
                                    </Button>
                                </div>

                                {/* Search Bar */}
                                <div className="mb-4 relative z-10">
                                    <Input
                                        placeholder="🔍 Search by wallet address..."
                                        value={depositSearchQuery}
                                        onChange={(e) => {
                                            setDepositSearchQuery(e.target.value);
                                            setAllDepositsPage(1);
                                        }}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                                    />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">TX Hash</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">
                                                    <button
                                                        onClick={() => {
                                                            if (depositsSortField === 'amount') {
                                                                setDepositsSortDirection(depositsSortDirection === 'desc' ? 'asc' : 'desc');
                                                            } else {
                                                                setDepositsSortField('amount');
                                                                setDepositsSortDirection('desc');
                                                            }
                                                            setAllDepositsPage(1);
                                                        }}
                                                        className="flex items-center gap-1 hover:text-white transition-colors"
                                                    >
                                                        Amount
                                                        {depositsSortField === 'amount' ? (
                                                            depositsSortDirection === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
                                                        ) : (
                                                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                        )}
                                                    </button>
                                                </th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                // Combine all deposits
                                                let allDepositsData = [
                                                    ...allInvestors.map(investor => ({
                                                        type: 'pool',
                                                        investor,
                                                        date: investor.created_date,
                                                        amount: investor.invested_amount || 0
                                                    })),
                                                    ...allContracts.map(contract => ({
                                                        type: 'staking',
                                                        contract,
                                                        date: contract.created_date,
                                                        amount: contract.staked_amount || 0
                                                    })),
                                                    ...(allGames || []).map(game => ({
                                                        type: 'game',
                                                        game,
                                                        date: game.created_date,
                                                        amount: game.entry_fee || 0
                                                    }))
                                                ];

                                                // Filter by search query
                                                if (depositSearchQuery.trim()) {
                                                    const query = depositSearchQuery.toLowerCase();
                                                    allDepositsData = allDepositsData.filter(item => {
                                                        const wallet = item.type === 'pool' ? item.investor.wallet_address :
                                                            item.type === 'staking' ? item.contract.wallet_address :
                                                                item.game.wallet_address;
                                                        return wallet.toLowerCase().includes(query);
                                                    });
                                                }

                                                // Sort deposits
                                                allDepositsData.sort((a, b) => {
                                                    let comparison = 0;
                                                    if (depositsSortField === 'amount') {
                                                        comparison = b.amount - a.amount;
                                                    } else if (depositsSortField === 'date') {
                                                        comparison = new Date(b.date) - new Date(a.date);
                                                    }
                                                    return depositsSortDirection === 'desc' ? comparison : -comparison;
                                                });

                                                const depositsPerPage = 10;
                                                const totalPages = Math.ceil(allDepositsData.length / depositsPerPage);
                                                const paginatedData = allDepositsData.slice(
                                                    (allDepositsPage - 1) * depositsPerPage,
                                                    allDepositsPage * depositsPerPage
                                                );

                                                return (
                                                    <>
                                                        {paginatedData.map((item, idx) => {
                                                            if (item.type === 'pool') {
                                                                const investor = item.investor;
                                                                const latestTxHash = investor.deposit_transactions?.[investor.deposit_transactions.length - 1]?.tx_hash || 'N/A';
                                                                return (
                                                                    <tr key={`pool-${investor.id}`} className="border-b border-white/5 hover:bg-white/5">
                                                                        <td className="py-3 px-4 text-white font-mono text-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                <span>{investor.wallet_address.slice(0, 8)}...{investor.wallet_address.slice(-6)}</span>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        navigator.clipboard.writeText(investor.wallet_address);
                                                                                        alert('✅ Wallet address copied');
                                                                                    }}
                                                                                    className="text-gray-500 hover:text-white transition-colors"
                                                                                >
                                                                                    <Copy className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <span className="text-white capitalize">{investor.pool_type} Pool</span>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-cyan-400 font-mono text-sm">
                                                                            {latestTxHash !== 'N/A' ? (
                                                                                <a
                                                                                    href={`https://bscscan.com/tx/${latestTxHash}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="hover:underline hover:text-cyan-300"
                                                                                >
                                                                                    {latestTxHash.slice(0, 6)}...{latestTxHash.slice(-4)}
                                                                                </a>
                                                                            ) : 'N/A'}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-green-400 font-bold">
                                                                            ${(investor.invested_amount || 0).toFixed(2)}
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => setEditDepositModal({ isOpen: true, investor })}
                                                                                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                                                                                >
                                                                                    <Edit className="w-3 h-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        if (confirm(`Delete deposit for ${investor.wallet_address.slice(0, 6)}...${investor.wallet_address.slice(-4)}? This will permanently delete this investor record.`)) {
                                                                                            deleteDepositMutation.mutate(investor.id);
                                                                                        }
                                                                                    }}
                                                                                    disabled={deleteDepositMutation.isPending}
                                                                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            } else if (item.type === 'staking') {
                                                                const contract = item.contract;
                                                                return (
                                                                    <tr key={`staking-${contract.id}`} className="border-b border-white/5 hover:bg-white/5">
                                                                        <td className="py-3 px-4 text-white font-mono text-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                <span>{contract.wallet_address.slice(0, 8)}...{contract.wallet_address.slice(-6)}</span>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        navigator.clipboard.writeText(contract.wallet_address);
                                                                                        alert('✅ Wallet address copied');
                                                                                    }}
                                                                                    className="text-gray-500 hover:text-white transition-colors"
                                                                                >
                                                                                    <Copy className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <span className="text-purple-400">Staking ({contract.crypto_type})</span>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-cyan-400 font-mono text-sm">
                                                                            {contract.tx_hash ? (
                                                                                <a
                                                                                    href={`https://bscscan.com/tx/${contract.tx_hash}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="hover:underline hover:text-cyan-300"
                                                                                >
                                                                                    {contract.tx_hash.slice(0, 6)}...{contract.tx_hash.slice(-4)}
                                                                                </a>
                                                                            ) : 'N/A'}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-green-400 font-bold">
                                                                            {(contract.staked_amount || 0).toFixed(6)} {contract.crypto_type}
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <span className="text-gray-500 text-xs">View only</span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            } else if (item.type === 'game') {
                                                                const game = item.game;
                                                                return (
                                                                    <tr key={`game-${game.id}`} className="border-b border-white/5 hover:bg-white/5">
                                                                        <td className="py-3 px-4 text-white font-mono text-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                <span>{game.wallet_address.slice(0, 8)}...{game.wallet_address.slice(-6)}</span>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        navigator.clipboard.writeText(game.wallet_address);
                                                                                        alert('✅ Wallet address copied');
                                                                                    }}
                                                                                    className="text-gray-500 hover:text-white transition-colors"
                                                                                >
                                                                                    <Copy className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <span className="text-yellow-400">Deal or No Deal</span>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-cyan-400 font-mono text-sm">
                                                                            {game.tx_hash ? (
                                                                                <a
                                                                                    href={`https://bscscan.com/tx/${game.tx_hash}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="hover:underline hover:text-cyan-300"
                                                                                >
                                                                                    {game.tx_hash.slice(0, 6)}...{game.tx_hash.slice(-4)}
                                                                                </a>
                                                                            ) : 'N/A'}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-green-400 font-bold">
                                                                            ${(game.entry_fee || 0).toFixed(2)}
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <span className="text-gray-500 text-xs">View only</span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                                {(() => {
                                    let allDepositsData = [
                                        ...allInvestors.map(investor => ({
                                            type: 'pool',
                                            investor,
                                            date: investor.created_date,
                                            amount: investor.invested_amount || 0
                                        })),
                                        ...allContracts.map(contract => ({
                                            type: 'staking',
                                            contract,
                                            date: contract.created_date,
                                            amount: contract.staked_amount || 0
                                        })),
                                        ...(allGames || []).map(game => ({
                                            type: 'game',
                                            game,
                                            date: game.created_date,
                                            amount: game.entry_fee || 0
                                        }))
                                    ];

                                    if (depositSearchQuery.trim()) {
                                        const query = depositSearchQuery.toLowerCase();
                                        allDepositsData = allDepositsData.filter(item => {
                                            const wallet = item.type === 'pool' ? item.investor.wallet_address :
                                                item.type === 'staking' ? item.contract.wallet_address :
                                                    item.game.wallet_address;
                                            return wallet.toLowerCase().includes(query);
                                        });
                                    }

                                    const depositsPerPage = 10;
                                    const totalPages = Math.ceil(allDepositsData.length / depositsPerPage);

                                    return totalPages > 1 ? (
                                        <div className="mt-6 relative z-10">
                                            <Pagination
                                                currentPage={allDepositsPage}
                                                totalPages={totalPages}
                                                onPageChange={setAllDepositsPage}
                                            />
                                        </div>
                                    ) : null;
                                })()}
                            </motion.div>

                            {/* Withdrawals List */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.74 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(249, 115, 22, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                                />
                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <motion.div
                                            animate={{ y: [-3, 3, -3], rotate: [0, 10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <ArrowUpRight className="w-6 h-6 text-orange-400" />
                                        </motion.div>
                                        All Platform Withdrawals ({allWithdrawals.length})
                                    </h2>
                                    <Button
                                        onClick={() => setAddWithdrawalModal(true)}
                                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Withdrawal
                                    </Button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allWithdrawals.map((withdrawal) => (
                                                <tr key={withdrawal.id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="py-3 px-4 text-white font-mono text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span>{withdrawal.wallet_address.slice(0, 8)}...{withdrawal.wallet_address.slice(-6)}</span>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(withdrawal.wallet_address);
                                                                    alert('✅ Wallet address copied');
                                                                }}
                                                                className="text-gray-500 hover:text-white transition-colors"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`capitalize ${withdrawal.pool_type === 'staking' ? 'text-purple-400' :
                                                            withdrawal.pool_type === 'scalping' ? 'text-cyan-400' :
                                                                withdrawal.pool_type === 'traditional' ? 'text-yellow-400' :
                                                                    withdrawal.pool_type === 'vip' ? 'text-pink-400' :
                                                                        'text-white'
                                                            }`}>
                                                            {withdrawal.pool_type === 'scalping' ? 'Crypto Pool' :
                                                                withdrawal.pool_type === 'traditional' ? 'Traditional Pool' :
                                                                    withdrawal.pool_type === 'vip' ? 'VIP Pool' :
                                                                        withdrawal.pool_type === 'staking' ? `Staking${withdrawal.crypto_type ? ` (${withdrawal.crypto_type})` : ''}` :
                                                                            withdrawal.pool_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-orange-400 font-bold">
                                                        {withdrawal.pool_type === 'staking' && withdrawal.crypto_type
                                                            ? `${(withdrawal.amount || 0).toFixed(6)} ${withdrawal.crypto_type}`
                                                            : `$${(withdrawal.amount || 0).toFixed(2)}`
                                                        }
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${withdrawal.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                                            withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {withdrawal.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setEditWithdrawalModal({ isOpen: true, withdrawal })}
                                                            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>

                            {/* Admin Management */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.69 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(245, 201, 106, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
                                />
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                    <motion.div
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <UserCog className="w-6 h-6 text-[#f5c96a]" />
                                    </motion.div>
                                    Admin Management ({allAdmins.length})
                                </h2>

                                <div className="bg-white/5 rounded-xl p-4 mb-6">
                                    <h3 className="text-white font-semibold mb-3">Add New Admin</h3>
                                    <div className="grid md:grid-cols-4 gap-3">
                                        <Input
                                            placeholder="Admin Name"
                                            value={newAdminName}
                                            onChange={(e) => setNewAdminName(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                        <Input
                                            placeholder="Email Address"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                        <Input
                                            placeholder="Wallet Address (optional)"
                                            value={newAdminWallet}
                                            onChange={(e) => setNewAdminWallet(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                        <Button
                                            onClick={handleAddAdmin}
                                            disabled={addAdminMutation.isPending}
                                            className="bg-gradient-to-r from-[#f5c96a] to-yellow-600 text-black font-bold"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Admin
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Name</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Email</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet Address</th>
                                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allAdmins.map((admin) => (
                                                <tr key={admin.id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="py-3 px-4 text-white font-medium">
                                                        {admin.full_name || 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-300">
                                                        {admin.email || 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-300 font-mono text-sm">
                                                        {admin.wallet_address ?
                                                            `${admin.wallet_address.slice(0, 8)}...${admin.wallet_address.slice(-6)}` :
                                                            'N/A'
                                                        }
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => removeAdminMutation.mutate(admin.id)}
                                                            disabled={removeAdminMutation.isPending || allAdmins.length === 1}
                                                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {allAdmins.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="py-8 text-center text-gray-500">
                                                        No admins configured. Add the first admin above.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-gray-400 text-sm mt-4">
                                    ⚠️ At least one admin must remain. The last admin cannot be removed.
                                </p>
                            </motion.div>

                            {/* Users Management */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 2 }}
                                />
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Users className="w-6 h-6 text-blue-400" />
                                        </motion.div>
                                        All Users
                                    </h3>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={handleResetUsers}
                                            disabled={deleteUsersDataMutation.isPending}
                                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Reset Users
                                        </Button>
                                    </motion.div>
                                </div>
                                <div className="relative z-10">
                                    <UsersManagement onDeleteUser={(userId) => deleteUserMutation.mutate(userId)} />
                                </div>
                            </motion.div>

                            {/* Support Messages */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.76 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 2.5 }}
                                />
                                <div className="relative z-10">
                                    <SupportMessagesPanel />
                                </div>
                            </motion.div>

                            {/* Lesson Bookings */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.78 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 3 }}
                                />
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <motion.div
                                            animate={{ y: [-2, 2, -2] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Briefcase className="w-6 h-6 text-indigo-400" />
                                        </motion.div>
                                        Lesson Bookings
                                    </h3>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={handleResetLessons}
                                            disabled={deleteLessonsDataMutation.isPending}
                                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Reset Lessons
                                        </Button>
                                    </motion.div>
                                </div>
                                <div className="relative z-10">
                                    <LessonsPanel />
                                </div>
                            </motion.div>

                            {/* Traffic Analytics Management */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="mt-8 relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 overflow-hidden"
                                style={{ boxShadow: '0 8px 32px 0 rgba(34, 211, 238, 0.15)' }}
                            >
                                <motion.div
                                    className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 3.5 }}
                                />
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                <BarChart3 className="w-6 h-6 text-cyan-400" />
                                            </motion.div>
                                            Traffic Analytics Data
                                        </h3>
                                        <p className="text-gray-400 text-sm mt-1">Manage visitor tracking and analytics data</p>
                                    </div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={handleResetTraffic}
                                            disabled={deleteTrafficDataMutation.isPending}
                                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Reset Traffic Data
                                        </Button>
                                    </motion.div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 relative z-10">
                                    <p className="text-gray-300 text-sm">
                                        This will delete all visitor tracking data including visit records and page view analytics.
                                        The tracking system will continue to collect new data after reset.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Debug User Wallet */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.805 }}
                                className="mt-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-2xl p-6 led-glow-blue"
                            >
                                <div className="flex items-start gap-4">
                                    <Activity className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-blue-400 mb-2">🔍 Debug User Wallet Data</h3>
                                        <p className="text-white mb-4">
                                            Check what's actually in the database for a specific wallet address. This shows ALL users and their data.
                                        </p>
                                        <div className="flex gap-2 mb-4">
                                            <Input
                                                id="debugWalletInput"
                                                placeholder="Enter wallet address..."
                                                className="bg-white/10 border-white/20 text-white"
                                            />
                                            <Button
                                                onClick={async () => {
                                                    const wallet = document.getElementById('debugWalletInput').value.trim();
                                                    if (!wallet) {
                                                        alert('Please enter a wallet address');
                                                        return;
                                                    }
                                                    try {
                                                        const { data, error } = await supabase.functions.invoke('debug-user-wallet-address', { body: { wallet_address: wallet } });
                                                        if (error) throw error;
                                                        setDebugModal({ isOpen: true, data: data });
                                                    } catch (error) {
                                                        alert('❌ Debug failed: ' + error.message);
                                                    }
                                                }}
                                                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:opacity-90 text-white"
                                            >
                                                <Activity className="w-5 h-5 mr-2" />
                                                Debug Wallet
                                            </Button>
                                        </div>
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                            <p className="text-blue-300 text-sm">
                                                This will show you ALL users and check if data exists for the searched wallet.
                                                If users can't see their data, this will tell you why.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Fix Wallet Case Sensitivity */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.81 }}
                                className="mt-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-2xl p-6 led-glow-red"
                            >
                                <div className="flex items-start gap-4">
                                    <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-red-400 mb-2">🚨 CRITICAL: Fix Wallet Addresses</h3>
                                        <p className="text-white mb-4">
                                            Users can't see their data because wallet addresses are stored in different cases (mixed vs lowercase).
                                            This will normalize ALL wallet addresses to lowercase across ALL entities.
                                            <strong className="block mt-2 text-red-300">⚠️ RUN THIS IMMEDIATELY to restore user access to their data!</strong>
                                        </p>
                                        <Button
                                            onClick={async () => {
                                                if (confirm('🚨 NORMALIZE ALL WALLET ADDRESSES?\n\nThis will:\n• Convert all wallet addresses to lowercase\n• Fix user access to their data\n• Update 13+ entities\n• Force all users to refresh their sessions\n\nThis is SAFE and RECOMMENDED.\n\nContinue?')) {
                                                    try {
                                                        const { data: results, error } = await supabase.functions.invoke('normalize-wallet-addresses', {});
                                                        if (error) throw error;
                                                        alert(`✅ Normalization Complete!\n\nWallet Addresses Fixed: ${results.normalized}\nErrors: ${results.errors.length}\n\n⚠️ IMPORTANT: All users (including you) must DISCONNECT WALLET and RECONNECT to refresh their sessions!\n\nYou will be logged out now.`);
                                                        queryClient.invalidateQueries();
                                                        // Force logout to refresh session
                                                        setTimeout(async () => {
                                                            await supabase.auth.signOut();
                                                            navigate('/');
                                                        }, 2000);
                                                    } catch (error) {
                                                        alert('❌ Normalization failed: ' + error.message);
                                                    }
                                                }
                                            }}
                                            className="bg-gradient-to-r from-red-500 to-orange-600 hover:opacity-90 text-white border-0 rounded-xl px-6 py-3 font-bold animate-pulse"
                                        >
                                            <AlertTriangle className="w-5 h-5 mr-2" />
                                            Fix All Wallet Addresses NOW
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Fix Player Profiles & Trophies */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.815 }}
                                className="mt-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 rounded-2xl p-6 led-glow-cyan"
                            >
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-cyan-400 mb-2">🔧 Fix Player Profiles & Trophies</h3>
                                        <p className="text-white mb-4">
                                            Recalculate all player profiles to ensure correct god names and levels based on completed XP thresholds.
                                            This will also award any missing trophies for completed levels.
                                            <strong className="block mt-2 text-cyan-300">Run this after changing the XP/trophy logic to fix existing data.</strong>
                                        </p>
                                        <Button
                                            onClick={async () => {
                                                if (confirm('⚠️ Recalculate all player profiles and award missing trophies?\n\nThis will:\n• Update god names and levels for all players\n• Award missing trophies for completed levels\n• Cannot be undone\n\nContinue?')) {
                                                    try {
                                                        const { data: results, error } = await supabase.functions.invoke('backfill-player-profiles', {});
                                                        if (error) throw error;
                                                        alert(`✅ Backfill Complete!\n\nProfiles Updated: ${results.updated}\nTrophies Awarded: ${results.trophiesAwarded}\n\n${results.errors.length > 0 ? `Errors: ${results.errors.length}` : 'No errors!'}`);
                                                        queryClient.invalidateQueries(['playerProfiles']);
                                                        queryClient.invalidateQueries(['playerTrophies']);
                                                    } catch (error) {
                                                        alert('❌ Backfill failed: ' + error.message);
                                                    }
                                                }
                                            }}
                                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white border-0 rounded-xl px-6 py-3 font-bold"
                                        >
                                            <CheckCircle2 className="w-5 h-5 mr-2" />
                                            Fix All Player Data
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Reset All Databases Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.82 }}
                                className="mt-8 bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500/50 rounded-2xl p-6 led-glow-red"
                            >
                                <div className="flex items-start gap-4">
                                    <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-red-400 mb-2">⚠️ Danger Zone</h3>
                                        <p className="text-white mb-4">
                                            Reset ALL databases at once. This will delete all data from pools, staking, games, lessons, traffic, and user profiles.
                                            <strong className="block mt-2 text-red-300">Admin accounts will be preserved.</strong>
                                        </p>
                                        <Button
                                            onClick={handleResetAllDatabases}
                                            disabled={deletePoolDataMutation.isPending || deleteStakingDataMutation.isPending || deleteGameDataMutation.isPending}
                                            className="bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 text-white border-0 rounded-xl px-6 py-3 font-bold"
                                        >
                                            <Trash2 className="w-5 h-5 mr-2" />
                                            Reset ALL Databases
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Warning */}
                            <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-400 text-sm">
                                        <strong>Warning:</strong> Reset buttons will permanently delete all data for the selected pool or staking.
                                        This action cannot be undone. Use with extreme caution.
                                    </p>
                                </div>
                            </div>

                            {/* Modals */}
                            <ConfirmResetModal
                                isOpen={resetModal.isOpen}
                                onClose={() => setResetModal({ isOpen: false, type: null, title: '', description: '' })}
                                onConfirm={confirmReset}
                                title={resetModal.title}
                                description={resetModal.description}
                                isLoading={deletePoolDataMutation.isPending || deleteStakingDataMutation.isPending || deleteLessonsDataMutation.isPending || deleteTrafficDataMutation.isPending || deleteUsersDataMutation.isPending || deleteGameDataMutation.isPending}
                            />

                            <EditDepositModal
                                isOpen={editDepositModal.isOpen}
                                onClose={() => setEditDepositModal({ isOpen: false, investor: null })}
                                investor={editDepositModal.investor}
                                onSave={(id, amount) => updateDepositMutation.mutateAsync({ id, amount })}
                            />

                            <AddDepositModal
                                isOpen={addDepositModal}
                                onClose={() => setAddDepositModal(false)}
                                onCreate={(data) => createDepositMutation.mutateAsync(data)}
                            />

                            <EditWithdrawalModal
                                isOpen={editWithdrawalModal.isOpen}
                                onClose={() => setEditWithdrawalModal({ isOpen: false, withdrawal: null })}
                                withdrawal={editWithdrawalModal.withdrawal}
                                onSave={(id, amount) => updateWithdrawalMutation.mutateAsync({ id, amount })}
                            />

                            <AddWithdrawalModal
                                isOpen={addWithdrawalModal}
                                onClose={() => setAddWithdrawalModal(false)}
                                onCreate={(data) => createWithdrawalMutation.mutateAsync(data)}
                            />

                            <ConfirmModal
                                isOpen={deleteAgreementModal.isOpen}
                                onClose={() => setDeleteAgreementModal({ isOpen: false, agreement: null })}
                                onConfirm={() => {
                                    if (deleteAgreementModal.agreement) {
                                        deleteAgreementMutation.mutate(deleteAgreementModal.agreement.id);
                                        setDeleteAgreementModal({ isOpen: false, agreement: null });
                                    }
                                }}
                                title="Delete Terms Acceptance"
                                description={deleteAgreementModal.agreement
                                    ? `Delete terms acceptance for ${deleteAgreementModal.agreement.wallet_address.slice(0, 8)}...${deleteAgreementModal.agreement.wallet_address.slice(-6)}? User will need to accept again on next login.`
                                    : ''
                                }
                                confirmText="Delete"
                                variant="danger"
                                isLoading={deleteAgreementMutation.isPending}
                            />

                            <DebugWalletModal
                                isOpen={debugModal.isOpen}
                                onClose={() => setDebugModal({ isOpen: false, data: null })}
                                debugData={debugModal.data}
                            />


                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
