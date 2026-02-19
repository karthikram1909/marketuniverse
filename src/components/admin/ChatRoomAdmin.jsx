import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Plus, Trash2, Shield, Ban, Crown, Lock, Unlock, Upload, Loader2, Edit2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import ManagePermissionsModal from './ManagePermissionsModal';
import DeleteProfileModal from './DeleteProfileModal';

export default function ChatRoomAdmin() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('users'); // users, rooms, youtube
    const [syncing, setSyncing] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', description: '', category: '', order: 0, permission: 'read_write', channel_avatar_url: '', youtube_url: '' });
    const [youtubeConfig, setYoutubeConfig] = useState({
        stream_type: 'public',
        channel_id: '',
        video_url: ''
    });
    const [checkingLive, setCheckingLive] = useState(false);
    const [liveStatus, setLiveStatus] = useState(null);
    const [showNewRoomForm, setShowNewRoomForm] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [editingAvatar, setEditingAvatar] = useState(null);
    const [uploadingAvatarId, setUploadingAvatarId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved
    const [selectedProfileForPermissions, setSelectedProfileForPermissions] = useState(null);
    const [selectedProfileForDelete, setSelectedProfileForDelete] = useState(null);
    const [pendingApprovalId, setPendingApprovalId] = useState(null);
    const [pendingMutationIds, setPendingMutationIds] = useState({
        blocking: null,
        unblocking: null,
        adminSetup: null,
        userSetup: null
    });

    // Fetch all chat profiles (single source of truth for approval)
    const { data: chatProfiles = [] } = useQuery({
        queryKey: ['allChatProfiles'],
        queryFn: async () => {
            const { data } = await supabase.from('chat_profiles').select('*');
            return data || [];
        }
    });

    // Sync users to chat profiles on load
    const handleSyncUsers = async () => {
        setSyncing(true);
        try {
            const { error } = await supabase.functions.invoke('sync-users-to-chat');
            if (error) {
                console.warn("Edge function sync failed, using fallback...");
                const { data: allUsers } = await supabase.from('profiles').select('id, username, wallet_address, avatar_url');
                const { data: existingChatProfiles } = await supabase.from('chat_profiles').select('user_id');

                const existingUserIds = new Set(existingChatProfiles?.map(p => p.user_id));
                const newProfiles = allUsers
                    ?.filter(u => !existingUserIds.has(u.id))
                    .map(u => ({
                        user_id: u.id,
                        username: u.username || `User_${u.id.slice(0, 6)}`,
                        wallet_address: u.wallet_address,
                        avatar_url: u.avatar_url,
                        created_date: new Date()
                    }));

                if (newProfiles && newProfiles.length > 0) {
                    await supabase.from('chat_profiles').insert(newProfiles);
                }
            }
            queryClient.invalidateQueries({ queryKey: ['allChatProfiles'] });
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setSyncing(false);
        }
    };

    // Use ChatProfile as single source of truth
    const profiles = chatProfiles.map(chatProfile => ({
        chat_profile_id: chatProfile.id,
        id: chatProfile.user_id,
        wallet_address: chatProfile.wallet_address?.toLowerCase() || '',
        username: chatProfile.username,
        avatar_url: chatProfile.avatar_url,
        bio: chatProfile.bio,
        status: chatProfile.status,
        is_approved: chatProfile.is_approved,
        is_blocked: chatProfile.is_blocked,
        is_admin: chatProfile.is_admin,
        is_moderator: chatProfile.is_moderator,
        last_seen: chatProfile.last_seen,
        created_date: chatProfile.created_date,
        has_chat_profile: true
    })).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    // Fetch all chat rooms
    const { data: rooms = [] } = useQuery({
        queryKey: ['allChatRooms'],
        queryFn: async () => {
            const { data } = await supabase.from('chat_rooms').select('*').order('order', { ascending: true });
            return data || [];
        }
    });

    // Fetch YouTube settings
    const { data: youtubeSettings = [] } = useQuery({
        queryKey: ['youtubeSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('youtube_settings').select('*');
            return data || [];
        }
    });

    // Fetch global YouTube settings (not room-specific)
    const { data: globalYoutubeSettings, refetch: refetchYoutubeSettings } = useQuery({
        queryKey: ['globalYoutubeSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('youtube_settings').select('*').is('chat_room_id', null).maybeSingle();
            return data || null;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async (profile) => {
            const { data, error } = await supabase
                .from('chat_profiles')
                .update({ is_approved: true })
                .eq('id', profile.chat_profile_id)
                .select();
            if (error) throw error;
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allChatProfiles'] });
        },
        onSettled: () => {
            setPendingApprovalId(null);
        }
    });

    const blockMutation = useMutation({
        mutationFn: async (profile) => {
            const { data, error } = await supabase
                .from('chat_profiles')
                .update({ is_blocked: true })
                .eq('id', profile.chat_profile_id)
                .select();
            if (error) throw error;
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allChatProfiles'] });
        },
        onSettled: () => {
            setPendingMutationIds(prev => ({ ...prev, blocking: null }));
        }
    });

    const unblockMutation = useMutation({
        mutationFn: async (profile) => {
            const { data, error } = await supabase
                .from('chat_profiles')
                .update({ is_blocked: false })
                .eq('id', profile.chat_profile_id)
                .select();
            if (error) throw error;
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allChatProfiles'] });
        },
        onSettled: () => {
            setPendingMutationIds(prev => ({ ...prev, unblocking: null }));
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (profileId) => {
            const { error } = await supabase.from('chat_profiles').delete().eq('id', profileId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allChatProfiles'] });
        }
    });

    const setAsAdminMutation = useMutation({
        mutationFn: async (profile) => {
            const { data, error } = await supabase
                .from('chat_profiles')
                .update({ is_admin: true })
                .eq('id', profile.chat_profile_id)
                .select();
            if (error) throw error;
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allChatProfiles'] });
        },
        onSettled: () => {
            setPendingMutationIds(prev => ({ ...prev, adminSetup: null }));
        }
    });

    const setAsUserMutation = useMutation({
        mutationFn: async (profile) => {
            const { data, error } = await supabase
                .from('chat_profiles')
                .update({ is_admin: false })
                .eq('id', profile.chat_profile_id)
                .select();
            if (error) throw error;
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allChatProfiles'] });
        },
        onSettled: () => {
            setPendingMutationIds(prev => ({ ...prev, userSetup: null }));
        }
    });

    const createRoomMutation = useMutation({
        mutationFn: async (roomData) => {
            // Remove youtube_url as it's not in the chat_rooms table
            // eslint-disable-next-line no-unused-vars
            const { youtube_url, ...safeRoomData } = roomData;

            const { data, error } = await supabase.from('chat_rooms').insert({
                ...safeRoomData,
                created_by: 'admin',
                is_active: true
            }).select();
            if (error) throw error;
            return data[0];
        },
        onSuccess: () => {
            setNewRoom({ name: '', description: '', category: '', order: 0, permission: 'read_write', channel_avatar_url: '', youtube_url: '' });
            setShowNewRoomForm(false);
            queryClient.invalidateQueries({ queryKey: ['allChatRooms'] });
        }
    });

    const updateRoomMutation = useMutation({
        mutationFn: async ({ roomId, updates }) => {
            const { error } = await supabase.from('chat_rooms').update(updates).eq('id', roomId);
            if (error) throw error;
        },
        onSuccess: () => {
            setEditingRoomId(null);
            setEditingAvatar(null);
            queryClient.invalidateQueries({ queryKey: ['allChatRooms'] });
        }
    });

    const deleteRoomMutation = useMutation({
        mutationFn: async (roomId) => {
            const { error } = await supabase.from('chat_rooms').delete().eq('id', roomId);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allChatRooms'] })
    });

    const updateYoutubeMutation = useMutation({
        mutationFn: async ({ roomId, youtubeUrl }) => {
            const existing = youtubeSettings.find(s => s.chat_room_id === roomId);
            if (existing) {
                const { error } = await supabase.from('youtube_settings').update({
                    youtube_video_url: youtubeUrl
                }).eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('youtube_settings').insert({
                    chat_room_id: roomId,
                    youtube_video_url: youtubeUrl
                });
                if (error) throw error;
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['youtubeSettings'] })
    });

    const saveYoutubeSettingsMutation = useMutation({
        mutationFn: async (settings) => {
            if (globalYoutubeSettings?.id) {
                const { error } = await supabase.from('youtube_settings').update(settings).eq('id', globalYoutubeSettings.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('youtube_settings').insert(settings);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['globalYoutubeSettings'] });
            refetchYoutubeSettings();
        }
    });

    const handleCheckLiveStatus = async () => {
        setCheckingLive(true);
        try {
            const { data, error } = await supabase.functions.invoke('check-youtube-live-status', {
                body: {
                    stream_type: youtubeConfig.stream_type,
                    channel_id: youtubeConfig.channel_id,
                    video_url: youtubeConfig.video_url
                }
            });
            if (error) throw error;
            setLiveStatus(data);
        } catch (error) {
            console.error('Failed to check live status:', error);
            setLiveStatus({ error: error.message });
        } finally {
            setCheckingLive(false);
        }
    };

    const handleSaveYoutubeConfig = async () => {
        await saveYoutubeSettingsMutation.mutate({
            stream_type: youtubeConfig.stream_type,
            channel_id: youtubeConfig.stream_type === 'public' ? youtubeConfig.channel_id : null,
            video_url: youtubeConfig.stream_type === 'unlisted' ? youtubeConfig.video_url : null
        });
        await handleCheckLiveStatus();
    };

    const handleCreateRoom = () => {
        if (!newRoom.name || !newRoom.category) {
            alert('Room name and category are required');
            return;
        }
        createRoomMutation.mutate(newRoom);
    };

    const handleAvatarUpload = async (e, roomId = null) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatarId(roomId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `chat-avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-assets')
                .getPublicUrl(filePath);

            if (roomId) {
                updateRoomMutation.mutate({
                    roomId,
                    updates: { channel_avatar_url: publicUrl }
                });
            } else {
                setNewRoom(prev => ({ ...prev, channel_avatar_url: publicUrl }));
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploadingAvatarId(null);
        }
    };

    const roomsByCategory = rooms.reduce((acc, room) => {
        if (!acc[room.category]) acc[room.category] = [];
        acc[room.category].push(room);
        return acc;
    }, {});

    Object.keys(roomsByCategory).forEach(category => {
        roomsByCategory[category].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    const isUserOnline = (profile) => {
        if (!profile.last_seen) return false;
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        return profile.last_seen >= twoMinutesAgo;
    };

    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = profile.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            profile.wallet_address?.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterStatus === 'pending') {
            return matchesSearch && !profile.is_approved && !profile.is_blocked;
        }
        if (filterStatus === 'approved') {
            return matchesSearch && profile.is_approved;
        }
        return matchesSearch; // 'all'
    });

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 font-semibold transition ${activeTab === 'users'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`px-4 py-2 font-semibold transition ${activeTab === 'rooms'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Channels & Categories
                </button>
                <button
                    onClick={() => setActiveTab('youtube')}
                    className={`px-4 py-2 font-semibold transition ${activeTab === 'youtube'
                        ? 'text-red-400 border-b-2 border-red-400'
                        : 'text-gray-400 hover:text-gray-300'
                        }`}
                >
                    YouTube Live
                </button>
            </div>

            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Chat User Management</h3>
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-400">
                                Total: {profiles.length} | Showing: {filteredProfiles.length}
                            </div>
                            <Button
                                size="sm"
                                onClick={handleSyncUsers}
                                disabled={syncing}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            >
                                {syncing ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Syncing...
                                    </>
                                ) : (
                                    'Sync Users'
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by username or wallet address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all" className="bg-gray-900">All Users</option>
                            <option value="pending" className="bg-gray-900">Pending Approval</option>
                            <option value="approved" className="bg-gray-900">Approved</option>
                        </select>
                    </div>

                    <div className="grid gap-4">
                        {filteredProfiles.length === 0 ? (
                            <p className="text-gray-400">No users found</p>
                        ) : (
                            filteredProfiles.map(profile => (
                                <motion.div
                                    key={profile.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-white font-semibold">
                                                {profile.username}
                                            </h4>
                                            <p className="text-xs text-gray-400 break-all">
                                                {profile.wallet_address}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isUserOnline(profile) ? (
                                                <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-500/20 text-green-400 flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                    Online
                                                </span>
                                            ) : (
                                                <span className="text-xs px-3 py-1 rounded-full font-semibold bg-gray-500/20 text-gray-400">
                                                    Offline
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {profile.bio && (
                                        <p className="text-sm text-gray-300">{profile.bio}</p>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {profile.is_admin && (
                                            <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1">
                                                <Crown className="w-3 h-3" />
                                                Chat Admin
                                            </span>
                                        )}
                                        {profile.is_approved && (
                                            <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                Approved
                                            </span>
                                        )}
                                        {profile.is_blocked && (
                                            <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1">
                                                <Ban className="w-3 h-3" />
                                                Blocked
                                            </span>
                                        )}
                                        {!profile.is_approved && !profile.is_blocked && (
                                            <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                                                Pending
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => setSelectedProfileForPermissions(profile)}
                                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1"
                                        >
                                            <Shield className="w-3 h-3" />
                                            Manage Permissions
                                        </Button>

                                        {profile.is_admin && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setPendingMutationIds(p => ({ ...p, userSetup: profile.id }));
                                                    setAsUserMutation.mutate(profile);
                                                }}
                                                disabled={setAsUserMutation.isPending && pendingMutationIds.userSetup === profile.id}
                                                className="bg-gray-600 hover:bg-gray-700 text-white text-xs gap-1"
                                            >
                                                {setAsUserMutation.isPending && pendingMutationIds.userSetup === profile.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Shield className="w-3 h-3" />
                                                )}
                                                Make User
                                            </Button>
                                        )}
                                        {!profile.is_approved && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setPendingApprovalId(profile.id);
                                                    approveMutation.mutate(profile);
                                                }}
                                                disabled={approveMutation.isPending && pendingApprovalId === profile.id}
                                                className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                                            >
                                                {approveMutation.isPending && pendingApprovalId === profile.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Check className="w-3 h-3" />
                                                )}
                                                Approve
                                            </Button>
                                        )}
                                        {!profile.is_blocked && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setPendingMutationIds(p => ({ ...p, blocking: profile.id }));
                                                    blockMutation.mutate(profile);
                                                }}
                                                disabled={blockMutation.isPending && pendingMutationIds.blocking === profile.id}
                                                variant="outline"
                                                className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs gap-1"
                                            >
                                                {blockMutation.isPending && pendingMutationIds.blocking === profile.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Ban className="w-3 h-3" />
                                                )}
                                                Block
                                            </Button>
                                        )}
                                        {profile.is_blocked && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setPendingMutationIds(p => ({ ...p, unblocking: profile.id }));
                                                    unblockMutation.mutate(profile);
                                                }}
                                                disabled={unblockMutation.isPending && pendingMutationIds.unblocking === profile.id}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
                                            >
                                                {unblockMutation.isPending && pendingMutationIds.unblocking === profile.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Shield className="w-3 h-3" />
                                                )}
                                                Unblock
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={() => setSelectedProfileForDelete(profile)}
                                            variant="outline"
                                            className="border-red-600/50 text-red-500 hover:bg-red-600/20 text-xs gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'rooms' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">
                            Channels & Categories
                        </h3>
                        <Button
                            onClick={() => setShowNewRoomForm(!showNewRoomForm)}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Channel
                        </Button>
                    </div>

                    {showNewRoomForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3"
                        >
                            <Input
                                placeholder="Channel name (e.g., general, trading)"
                                value={newRoom.name}
                                onChange={(e) =>
                                    setNewRoom({ ...newRoom, name: e.target.value })
                                }
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                                placeholder="Category (e.g., General, Trading/Crypto)"
                                value={newRoom.category}
                                onChange={(e) =>
                                    setNewRoom({ ...newRoom, category: e.target.value })
                                }
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Textarea
                                placeholder="Description (optional)"
                                value={newRoom.description}
                                onChange={(e) =>
                                    setNewRoom({ ...newRoom, description: e.target.value })
                                }
                                className="bg-white/5 border-white/10 text-white h-20"
                            />
                            <div className="flex items-center gap-3">
                                {newRoom.channel_avatar_url && (
                                    <img src={newRoom.channel_avatar_url} alt="Channel avatar" className="w-12 h-12 rounded-full object-cover" />
                                )}
                                <label className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleAvatarUpload(e)}
                                        className="hidden"
                                    />
                                    <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm cursor-pointer hover:bg-white/10 transition flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        Upload Avatar
                                    </div>
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-2">Order</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={newRoom.order}
                                        onChange={(e) =>
                                            setNewRoom({ ...newRoom, order: parseInt(e.target.value) || 0 })
                                        }
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-2">User Permission</label>
                                    <select
                                        value={newRoom.permission}
                                        onChange={(e) =>
                                            setNewRoom({ ...newRoom, permission: e.target.value })
                                        }
                                        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm"
                                    >
                                        <option value="read_write">Read & Write</option>
                                        <option value="read_only">Read Only</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCreateRoom}
                                    disabled={createRoomMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Create
                                </Button>
                                <Button
                                    onClick={() => setShowNewRoomForm(false)}
                                    variant="outline"
                                    className="border-white/20 text-white"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {Object.keys(roomsByCategory).length === 0 ? (
                        <p className="text-gray-400">No channels created yet</p>
                    ) : (
                        Object.entries(roomsByCategory).map(([category, categoryRooms]) => (
                            <div key={category} className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-400 px-3">
                                    {category}
                                </h4>
                                <div className="space-y-2">
                                    {categoryRooms.map(room => (
                                        <motion.div
                                            key={room.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="bg-white/5 border border-white/10 rounded-lg p-3"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    {room.channel_avatar_url && (
                                                        <img src={room.channel_avatar_url} alt={room.name} className="w-10 h-10 rounded-full object-cover" />
                                                    )}
                                                    <div>
                                                        <h5 className="text-white font-semibold">
                                                            #{room.name}
                                                        </h5>
                                                        {room.description && (
                                                            <p className="text-xs text-gray-400">
                                                                {room.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setEditingRoomId(editingRoomId === room.id ? null : room.id)}
                                                        variant="outline"
                                                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            deleteRoomMutation.mutate(room.id)
                                                        }
                                                        disabled={deleteRoomMutation.isPending}
                                                        variant="outline"
                                                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {editingRoomId === room.id && (
                                                <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                                                    <Input
                                                        placeholder="Channel name"
                                                        value={editingAvatar?.name || room.name}
                                                        onChange={(e) =>
                                                            setEditingAvatar({ ...editingAvatar || room, name: e.target.value })
                                                        }
                                                        className="bg-white/5 border-white/10 text-white text-sm"
                                                    />
                                                    <Input
                                                        placeholder="Category"
                                                        value={editingAvatar?.category || room.category}
                                                        onChange={(e) =>
                                                            setEditingAvatar({ ...editingAvatar || room, category: e.target.value })
                                                        }
                                                        className="bg-white/5 border-white/10 text-white text-sm"
                                                    />
                                                    <Textarea
                                                        placeholder="Description"
                                                        value={editingAvatar?.description || room.description || ''}
                                                        onChange={(e) =>
                                                            setEditingAvatar({ ...editingAvatar || room, description: e.target.value })
                                                        }
                                                        className="bg-white/5 border-white/10 text-white h-16 text-sm"
                                                    />
                                                    <Input
                                                        placeholder="YouTube Video URL (for live streaming - supports unlisted)"
                                                        value={editingAvatar?.youtube_url || youtubeSettings.find(s => s.chat_room_id === room.id)?.youtube_video_url || ''}
                                                        onChange={(e) =>
                                                            setEditingAvatar({ ...editingAvatar || room, youtube_url: e.target.value })
                                                        }
                                                        className="bg-white/5 border-white/10 text-white text-sm"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        {(editingAvatar?.channel_avatar_url || room.channel_avatar_url) && (
                                                            <img src={editingAvatar?.channel_avatar_url || room.channel_avatar_url} alt={room.name} className="w-12 h-12 rounded-full object-cover" />
                                                        )}
                                                        <label className="flex-1">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleAvatarUpload(e, room.id)}
                                                                className="hidden"
                                                            />
                                                            <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-xs cursor-pointer hover:bg-white/10 transition flex items-center gap-2">
                                                                {uploadingAvatarId === room.id ? (
                                                                    <>
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                        Uploading...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Upload className="w-3 h-3" />
                                                                        Change Avatar
                                                                    </>
                                                                )}
                                                            </div>
                                                        </label>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={async () => {
                                                                await updateRoomMutation.mutate({
                                                                    roomId: room.id,
                                                                    updates: {
                                                                        name: editingAvatar?.name || room.name,
                                                                        category: editingAvatar?.category || room.category,
                                                                        description: editingAvatar?.description || room.description
                                                                    }
                                                                });
                                                                if (editingAvatar?.youtube_url !== undefined) {
                                                                    await updateYoutubeMutation.mutate({
                                                                        roomId: room.id,
                                                                        youtubeUrl: editingAvatar.youtube_url
                                                                    });
                                                                }
                                                                setEditingAvatar(null);
                                                            }}
                                                            disabled={updateRoomMutation.isPending || updateYoutubeMutation.isPending}
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setEditingAvatar(null)}
                                                            variant="outline"
                                                            className="border-white/20 text-white"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-3 items-center">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-gray-400">Order:</label>
                                                    <input
                                                        type="number"
                                                        value={room.order || 0}
                                                        onChange={(e) =>
                                                            updateRoomMutation.mutate({
                                                                roomId: room.id,
                                                                updates: { order: parseInt(e.target.value) || 0 }
                                                            })
                                                        }
                                                        disabled={updateRoomMutation.isPending}
                                                        className="w-12 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm text-center"
                                                    />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        updateRoomMutation.mutate({
                                                            roomId: room.id,
                                                            updates: { permission: room.permission === 'read_only' ? 'read_write' : 'read_only' }
                                                        })
                                                    }
                                                    disabled={updateRoomMutation.isPending}
                                                    variant="outline"
                                                    className={`text-xs gap-1 ${room.permission === 'read_only' ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10' : 'border-green-500/50 text-green-400 hover:bg-green-500/10'}`}
                                                >
                                                    {room.permission === 'read_only' ? (
                                                        <>
                                                            <Lock className="w-3 h-3" />
                                                            Read Only
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Unlock className="w-3 h-3" />
                                                            Read & Write
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'youtube' && (
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-red-900/20 to-black/50 border border-red-500/30 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">YouTube Live Integration</h3>
                                <p className="text-sm text-gray-400">Configure live streaming for chat rooms</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-sm font-semibold text-white mb-3 block">Stream Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setYoutubeConfig({ ...youtubeConfig, stream_type: 'public' })}
                                    className={`px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${youtubeConfig.stream_type === 'public'
                                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Public (Auto-Detection)
                                </button>
                                <button
                                    onClick={() => setYoutubeConfig({ ...youtubeConfig, stream_type: 'unlisted' })}
                                    className={`px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${youtubeConfig.stream_type === 'unlisted'
                                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Unlisted (Manual URL)
                                </button>
                            </div>
                        </div>

                        {youtubeConfig.stream_type === 'public' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="text-sm font-semibold text-white mb-2 block">YouTube Channel ID</label>
                                    <Input
                                        placeholder="UCb0aw0bsTGv-YPTN_tv83DA"
                                        value={youtubeConfig.channel_id}
                                        onChange={(e) => setYoutubeConfig({ ...youtubeConfig, channel_id: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                    <p className="text-xs text-gray-400 mt-2">
                                        Find your Channel ID: YouTube Studio → Settings → Channel → Advanced
                                    </p>
                                </div>

                                {liveStatus && (
                                    <div className="grid grid-cols-3 gap-3 p-4 bg-black/30 rounded-lg border border-white/10">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Mode:</p>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                                                </svg>
                                                <span className="text-sm font-semibold text-green-400">Public</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Status:</p>
                                            <div className="flex items-center gap-2">
                                                {liveStatus.is_live ? (
                                                    <>
                                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                        <span className="text-sm font-semibold text-red-400">LIVE</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                                                        <span className="text-sm font-semibold text-gray-400">Offline</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Video ID:</p>
                                            <span className="text-sm font-mono text-white">{liveStatus.video_id || 'N/A'}</span>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={handleSaveYoutubeConfig}
                                    disabled={!youtubeConfig.channel_id || saveYoutubeSettingsMutation.isPending || checkingLive}
                                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3 text-base shadow-lg"
                                >
                                    {checkingLive ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Checking Live Status...
                                        </>
                                    ) : (
                                        'Save & Check Live'
                                    )}
                                </Button>

                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs text-blue-300 leading-relaxed">
                                            <strong>Auto-Polling:</strong> Live status checks every 30 seconds. When your channel goes live, it will automatically appear in the chat room.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {youtubeConfig.stream_type === 'unlisted' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="text-sm font-semibold text-white mb-2 block">YouTube Unlisted Video URL</label>
                                    <Input
                                        placeholder="https://youtube.com/live/siraWhJYpvo?feature=share"
                                        value={youtubeConfig.video_url}
                                        onChange={(e) => setYoutubeConfig({ ...youtubeConfig, video_url: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                    <p className="text-xs text-gray-400 mt-2">
                                        Paste the full unlisted video URL (no auto-detection needed)
                                    </p>
                                </div>

                                {liveStatus && (
                                    <div className="grid grid-cols-2 gap-3 p-4 bg-black/30 rounded-lg border border-white/10">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Mode:</p>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-semibold text-orange-400">Unlisted</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Unlisted URL:</p>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-semibold text-green-400">Set</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={handleSaveYoutubeConfig}
                                    disabled={!youtubeConfig.video_url || saveYoutubeSettingsMutation.isPending}
                                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-3 text-base shadow-lg"
                                >
                                    {saveYoutubeSettingsMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save URL'
                                    )}
                                </Button>

                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs text-yellow-300 leading-relaxed">
                                            <strong>Manual Mode:</strong> Unlisted URLs display immediately without auto-detection. Update the URL each time you start a new unlisted stream.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}

            {selectedProfileForPermissions && (
                <ManagePermissionsModal
                    profile={selectedProfileForPermissions}
                    isOpen={!!selectedProfileForPermissions}
                    onClose={() => setSelectedProfileForPermissions(null)}
                />
            )}

            {selectedProfileForDelete && (
                <DeleteProfileModal
                    profile={selectedProfileForDelete}
                    isOpen={!!selectedProfileForDelete}
                    onClose={() => setSelectedProfileForDelete(null)}
                    onConfirm={() => {
                        deleteUserMutation.mutate(selectedProfileForDelete.chat_profile_id);
                        setSelectedProfileForDelete(null);
                    }}
                    isDeleting={deleteUserMutation.isPending}
                />
            )}
        </div>
    );
}