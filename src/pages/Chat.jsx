import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, Radio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ChatMessages from '../components/chat/ChatMessages';
import MessageInput from '../components/chat/MessageInput';
import YouTubeLiveEmbed from '../components/chat/YouTubeLiveEmbed';
import { useChatMessageStore } from '../components/chat/ChatMessageStore';
import { useGlobalChatCatchUp } from '../components/chat/useGlobalChatCatchUp';
import { Users, Search, Settings, ChevronDown, Image as ImageIcon, Pin, Upload, Loader2, Save } from 'lucide-react';

export default function ChatRoom() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const messageStore = useChatMessageStore();
    const [authChecked, setAuthChecked] = useState(false);
    const [user, setUser] = useState(null);
    const [chatProfile, setChatProfile] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [isApproved, setIsApproved] = useState(false);
    const [showLiveModal, setShowLiveModal] = useState(false);
    // Persistent Unread Counts (Fetched via RPC)
    const { data: unreadCounts = {} } = useQuery({
        queryKey: ['unreadCounts', user?.email],
        queryFn: async () => {
            if (!user?.email) return {};
            const { data, error } = await supabase.rpc('get_user_unread_counts', {
                p_email: user.email
            });
            if (error) {
                console.error('Error fetching unread counts:', error);
                return {};
            }
            // Transform array [{room_id, count}] to object { [room_id]: count }
            return (data || []).reduce((acc, curr) => ({
                ...acc,
                [curr.room_id]: curr.count
            }), {});
        },
        enabled: !!user?.email,
        staleTime: 60000, // Refresh every minute
        refetchOnWindowFocus: true
    });
    const globalChatUnsubscribeRef = useRef(null);
    const catchUpLocksRef = useRef({});
    const catchUpTimersRef = useRef({});
    const notificationRefetchThrottleRef = useRef(0);
    const retryCountRef = useRef({}); // Track retry attempts per clientMessageId

    // Profile Editing State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [editFormData, setEditFormData] = useState({ avatar_url: '', bio: '' });
    const [avatarPreview, setAvatarPreview] = useState(null);

    const handleOpenProfile = () => {
        if (chatProfile) {
            setEditFormData({
                avatar_url: chatProfile.avatar_url || '',
                bio: chatProfile.bio || ''
            });
            setAvatarPreview(chatProfile.avatar_url || null);
        }
        setShowProfileModal(true);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target?.result);
        reader.readAsDataURL(file);

        setIsUploadingAvatar(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setEditFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        } catch (err) {
            console.error('Avatar upload failed:', err);
            // Revert preview
            setAvatarPreview(editFormData.avatar_url || null);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user || !chatProfile) return;
        setIsSavingProfile(true);
        try {
            const { error } = await supabase
                .from('chat_profiles')
                .update({
                    avatar_url: editFormData.avatar_url,
                    bio: editFormData.bio,
                    updated_at: new Date().toISOString()
                })
                .eq('id', chatProfile.id);

            if (error) throw error;

            // Update local state
            setChatProfile(prev => ({
                ...prev,
                avatar_url: editFormData.avatar_url,
                bio: editFormData.bio
            }));
            queryClient.invalidateQueries({ queryKey: ['chatProfilesOnline'] });
            setShowProfileModal(false);
        } catch (err) {
            console.error('Failed to save profile:', err);
        } finally {
            setIsSavingProfile(false);
        }
    };


    // Messages come from the store (React tracks messagesByRoom changes)
    const messages = messageStore.messagesByRoom[selectedRoomId] || [];

    // NOTE: Removed deprecated base44 references. 
    // Remaining todos:
    // - Ensure ChatMessageStore and GlobalChatCatchUp are also Supabase-compatible or updated.

    // Fetch user and check auth
    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (!currentUser) {
                    navigate('/');
                    return;
                }

                // Get profile data to attach wallet/role info 
                const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();

                // Enrich user object with profile data for compatibility
                const enrichedUser = {
                    ...currentUser,
                    role: userProfile?.role || 'user',
                    wallet_address: userProfile?.wallet_address,
                };
                setUser(enrichedUser);

                // Check if user has chat profile
                const { data: profiles, error } = await supabase
                    .from('chat_profiles')
                    .select('*')
                    .eq('user_id', currentUser.id);

                if (error || !profiles || profiles.length === 0) {
                    navigate('/ChatProfileSetup', { replace: true });
                    return;
                }

                // Profile found - clean up just_created param if present
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('just_created')) {
                    navigate('/Chat', { replace: true });
                }

                const profile = profiles[0];

                // HARD GATE: Approval check
                if (profile.is_blocked === true) {
                    navigate('/ChatProfileSetup', { replace: true });
                    return;
                }

                if (profile.is_approved !== true) {
                    navigate('/ChatProfileSetup', { replace: true });
                    return;
                }

                // APPROVED - set state and proceed
                setIsApproved(true);
                setChatProfile(profile);

                // ONLY after approval: Update status to online
                await supabase.from('chat_profiles').update({
                    status: 'online',
                    last_seen: new Date().toISOString()
                }).eq('id', profile.id);

                setChatProfile(prev => ({ ...prev, status: 'online' }));

                // Heartbeat
                const heartbeatInterval = setInterval(async () => {
                    try {
                        await supabase.from('chat_profiles').update({
                            last_seen: new Date().toISOString()
                        }).eq('id', profile.id);
                    } catch (err) {
                        console.error('Heartbeat failed:', err);
                    }
                }, 30000);

                window.chatHeartbeat = heartbeatInterval;
            } catch (err) {
                console.error('Auth check failed:', err);
                navigate('/');
            } finally {
                setAuthChecked(true);
            }
        };

        loadUser();

        return () => {
            if (window.chatHeartbeat) clearInterval(window.chatHeartbeat);
            if (chatProfile?.id) {
                supabase.from('chat_profiles').update({
                    status: 'offline',
                    last_seen: new Date().toISOString()
                }).eq('id', chatProfile.id);
            }
        };
    }, [navigate, chatProfile?.id]); // Depend on chatProfile.id for cleanup

    // Fetch chat rooms
    const { data: rooms = [] } = useQuery({
        queryKey: ['chatRooms'],
        queryFn: async () => {
            const { data } = await supabase
                .from('chat_rooms')
                .select('*')
                .eq('is_active', true)
                .order('order', { ascending: true });
            return data || [];
        },
        enabled: isApproved && !!chatProfile,
    });

    // Realtime subscription for rooms
    useEffect(() => {
        if (!chatProfile) return;
        const channel = supabase
            .channel('public:chat_rooms')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => {
                queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [queryClient, chatProfile]);

    const liveStreamRoom = useMemo(() => {
        if (!rooms.length) return null;
        return rooms.find(r => r.name.toLowerCase().includes('live streaming')) || null;
    }, [rooms]);

    useEffect(() => {
        if (rooms.length > 0 && !selectedRoomId) {
            setSelectedRoomId(rooms[0].id);
        }
    }, [rooms, selectedRoomId]);

    // Fetch messages (initial load)
    const messagesQuery = useQuery({
        queryKey: ['chatMessages', selectedRoomId],
        queryFn: async () => {
            if (!selectedRoomId) return [];
            const { data } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('room_id', selectedRoomId)
                .order('created_at', { ascending: false }) // Get latest 200
                .limit(200);
            // Return reversed for chronological order if needed, or store handles separate sorting
            return data ? data.reverse() : [];
        },
        enabled: isApproved && !!selectedRoomId && !!chatProfile,
        staleTime: Infinity,
    });

    useEffect(() => {
        if (!messagesQuery.data || !selectedRoomId) return;
        // Simple merge for now - store handles dedup
        messageStore.mergeMessages(selectedRoomId, messagesQuery.data, 'server');
    }, [messagesQuery.data, selectedRoomId, messageStore]);

    // Notifications
    // Removed redundant polling of 'chatNotifications' table directly
    // logic is now handled by 'get_user_unread_counts' RPC above
    // Realtime subscription for Notifications
    useEffect(() => {
        if (!user?.email) return;
        const channel = supabase
            .channel('public:chat_notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_notifications',
                filter: `recipient_email=eq.${user.email.toLowerCase()}`
            }, () => {
                queryClient.invalidateQueries({ queryKey: ['chatNotifications'] });
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [queryClient, user?.email]);

    // Online members
    const { data: allProfiles = [] } = useQuery({
        queryKey: ['chatProfilesOnline'],
        queryFn: async () => {
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
            const { data } = await supabase
                .from('chat_profiles')
                .select('*')
                .eq('status', 'online')
                .gte('last_seen', twoMinutesAgo);
            return (data || []).map(profile => ({
                ...profile,
                displayId: profile.wallet_address || profile.user_id || profile.username
            }));
        },
        enabled: isApproved && !!chatProfile,
        refetchInterval: 30000
    });

    // YouTube Settings
    const { data: youtubeSettings } = useQuery({
        queryKey: ['globalYoutubeSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('youtube_settings').select('*').limit(1).maybeSingle();
            return data;
        },
        enabled: isApproved && !!chatProfile,
    });

    // NEW: Realtime Global Message Subscription via Supabase
    useEffect(() => {
        if (!chatProfile?.id) return;

        const channel = supabase
            .channel('public:chat_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
                const newMessage = payload.new;
                // Merge into store
                messageStore.mergeMessages(newMessage.room_id, [newMessage], 'realtime');

                // Unread handling
                const isActiveRoom = newMessage.room_id === selectedRoomId || (showLiveModal && liveStreamRoom?.id === newMessage.room_id);
                // Update Unread Counts Query Cache
                if (!isActiveRoom && user?.email) {
                    queryClient.setQueryData(['unreadCounts', user.email], (old = {}) => ({
                        ...old,
                        [newMessage.room_id]: (old[newMessage.room_id] || 0) + 1
                    }));
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, payload => {
                // We need room_id to delete from store efficiently, but DELETE payloads usually only have ID (unless replica identity full)
                // Assuming we scan or store has global index. If not, this might be tricky.
                // Store deleteMessage usually takes room_id. 
                // Currently suppression might fail if room_id missing in delete payload.
                // For now, we ignore or try to find it.
                // Actually, let's just use ID to delete from currently viewed room if applicable.
                if (payload.old && payload.old.id) {
                    messageStore.deleteMessage(null, payload.old.id); // Updated store to maybe handle null room_id?
                    // Or iterate all rooms in store?
                    // Ideally we set REPLICA IDENTITY FULL on chat_messages table to get room_id in delete payload
                    if (payload.old.room_id) {
                        messageStore.deleteMessage(payload.old.room_id, payload.old.id);
                    } else {
                        // Fallback: try deleting from selectedRoomId
                        messageStore.deleteMessage(selectedRoomId, payload.old.id);
                    }
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [chatProfile?.id, messageStore, selectedRoomId, liveStreamRoom, showLiveModal, user?.email, queryClient]);

    // Send Message
    const sendMessageMutation = useMutation({
        mutationFn: async ({ content, imageUrls, roomId, clientMessageId }) => {
            if (!user?.id) throw new Error('User not loaded');

            // Optimistic update handled in onMutate
            const { data, error } = await supabase.from('chat_messages').insert({
                room_id: roomId,
                client_message_id: clientMessageId,
                sender_user_id: user.id,
                sender_profile_id: chatProfile.id,
                sender_wallet: user.wallet_address?.toLowerCase(),
                sender_username: chatProfile.username,
                content: content,
                image_urls: imageUrls || [],
                reaction_emojis: {}
            }).select().single();

            if (error) throw error;
            return data;
        },
        onMutate: async ({ content, imageUrls, roomId, clientMessageId }) => {
            const optimisticMessage = {
                id: null,
                client_message_id: clientMessageId,
                room_id: roomId,
                sender_wallet: user.wallet_address?.toLowerCase(),
                sender_user_id: user.id,
                sender_username: chatProfile.username,
                content: content,
                image_urls: imageUrls,
                status: 'sending',
                created_at: new Date().toISOString(),
                created_date: new Date().toISOString()
            };
            messageStore.addOptimisticMessage(roomId, optimisticMessage);
            return { clientMessageId, roomId };
        },
        onError: (err, vars, context) => {
            messageStore.updateMessage(context.roomId, context.clientMessageId, {
                status: 'failed',
                error: err.message
            });
        },
        onSuccess: (data, vars, context) => {
            messageStore.updateMessage(data.room_id, context.clientMessageId, {
                ...data,
                status: 'sent',
                id: data.id
            });
        }
    });

    const reactionMutation = useMutation({
        mutationFn: async ({ messageId, emoji }) => {
            // Fetch current reactions
            const { data: msg } = await supabase.from('chat_messages').select('reaction_emojis').eq('id', messageId).single();
            const reactions = msg.reaction_emojis || {};
            const userIdentifier = user.wallet_address ? user.wallet_address.toLowerCase() : user.id;

            if (!reactions[emoji]) reactions[emoji] = [];
            const list = reactions[emoji];
            const idx = list.indexOf(userIdentifier);
            if (idx > -1) {
                list.splice(idx, 1);
                if (list.length === 0) delete reactions[emoji];
            } else {
                list.push(userIdentifier);
            }

            const { data, error } = await supabase
                .from('chat_messages')
                .update({ reaction_emojis: reactions })
                .eq('id', messageId)
                .select()
                .single();

            if (error) throw error;
            return { messageId, reaction_emojis: reactions };
        },
        onSuccess: (data) => {
            messageStore.updateMessage(selectedRoomId, data.messageId, {
                reaction_emojis: data.reaction_emojis
            });
        }
    });

    const deleteMessageMutation = useMutation({
        mutationFn: async (messageId) => {
            await supabase.from('chat_messages').delete().eq('id', messageId);
        },
        onMutate: (messageId) => {
            messageStore.deleteMessage(selectedRoomId, messageId);
        }
    });

    // Mark room as read when selected
    useEffect(() => {
        if (selectedRoomId && user?.email) {
            // 1. Optimistic local update
            queryClient.setQueryData(['unreadCounts', user.email], (old = {}) => {
                const newState = { ...old };
                delete newState[selectedRoomId];
                return newState;
            });

            // 2. Persistent server update
            supabase.rpc('mark_room_read', {
                p_room_id: selectedRoomId,
                p_email: user.email
            }).then(({ error }) => {
                if (error) console.error('Failed to mark room read:', error);
            });
        }
    }, [selectedRoomId, user?.email, queryClient]);

    if (!authChecked) {
        return <div className="min-h-screen flex items-center justify-center bg-black text-gray-500">Loading chat...</div>;
    }

    if (!user || !chatProfile || !isApproved) return null;

    const currentRoom = rooms.find(r => r.id === selectedRoomId);
    const isAdmin = user?.role === 'admin' || chatProfile?.is_admin === true;
    const canWriteInReadOnly = isAdmin;
    const isReadOnly = currentRoom?.permission === 'read_only' && !canWriteInReadOnly;

    return (
        <div className="h-screen bg-black flex overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-64 bg-gradient-to-b from-white/5 via-black to-black border-r border-red-700/40 flex flex-col overflow-hidden backdrop-blur-xl">
                <div className="p-4 border-b border-red-700/30 bg-gradient-to-r from-red-950/50 to-black">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-white">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Channels</h3>
                        <div className="space-y-2">
                            {rooms.map(room => (
                                <button
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${room.id === selectedRoomId
                                        ? 'bg-gradient-to-r from-red-700/40 to-red-800/30 border border-red-600/50'
                                        : 'hover:bg-white/10'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-red-900 flex items-center justify-center text-white font-bold relative">
                                        {room.channel_avatar_url ? <img src={room.channel_avatar_url} className="w-full h-full rounded-lg object-cover" /> : '#'}
                                        {(unreadCounts[room.id] > 0) && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-white truncate">{room.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{room.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Online</h3>
                        {allProfiles.map(p => (
                            <div key={p.id} className="flex items-center gap-2 px-3 py-2 text-white">
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                                        {p.avatar_url ? (
                                            <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Users className="w-4 h-4 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                                </div>
                                <span className="text-sm truncate font-medium">{p.username}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-red-700/30">
                    <Button onClick={() => navigate('/')} className="w-full bg-red-800 hover:bg-red-700 mb-2">Back Home</Button>
                    <Button
                        onClick={handleOpenProfile}
                        variant="outline"
                        className="w-full border-red-700/50 text-red-200 hover:bg-red-900/30 flex items-center justify-center gap-2"
                    >
                        <Settings className="w-4 h-4" /> Edit Profile
                    </Button>
                </div>
            </div>

            {/* Profile Edit Modal */}
            <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
                <DialogContent className="bg-gradient-to-br from-slate-900 to-black border-red-800/50 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            Edit Chat Profile
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 mb-4">
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-red-500/50 bg-black">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                                            <Users className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-1.5 bg-red-600 hover:bg-red-500 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={isUploadingAvatar || isSavingProfile}
                                        className="hidden"
                                    />
                                    {isUploadingAvatar ? (
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4 text-white" />
                                    )}
                                </label>
                            </div>
                            <p className="text-xs text-gray-400">Click icon to upload new avatar</p>
                        </div>

                        {/* Bio Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Bio</label>
                            <textarea
                                value={editFormData.bio}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder="Tell us about yourself..."
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500/50 resize-none"
                                disabled={isSavingProfile}
                            />
                        </div>

                        {/* Save Button */}
                        <Button
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile || isUploadingAvatar}
                            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white"
                        >
                            {isSavingProfile ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Chat */}
            <div className="flex-1 flex flex-col bg-black h-full relative">
                <div className="border-b border-red-700/30 px-6 py-4 bg-gradient-to-r from-red-950/50 to-black backdrop-blur-xl flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white">#{currentRoom?.name || 'Loading...'}</h1>

                    {/* Live Stream Button */}
                    <Button
                        onClick={() => setShowLiveModal(true)}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 animate-pulse"
                    >
                        <Radio className="w-4 h-4" />
                        Live Streaming
                    </Button>
                </div>

                {/* Live Stream Embed - Above Chat */}
                {showLiveModal && (
                    <div className="w-full bg-black border-b border-red-900/30 shadow-2xl relative shrink-0">
                        <div className="absolute top-2 right-2 z-10">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowLiveModal(false)}
                                className="text-white/50 hover:text-white bg-black/50 hover:bg-red-900/50 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="max-w-4xl mx-auto">
                            <YouTubeLiveEmbed
                                roomId={liveStreamRoom?.id}
                                youtubeUrl={youtubeSettings?.youtube_url}
                                isAutoLive={youtubeSettings?.is_live}
                            />
                        </div>
                    </div>
                )}

                <ChatMessages
                    messages={messages.map(msg => ({
                        ...msg,
                        avatar_url: allProfiles.find(p => p.id === msg.sender_profile_id)?.avatar_url
                    }))}
                    currentUserId={user.id}
                    canDelete={isAdmin}
                    onDeleteMessage={(msg) => deleteMessageMutation.mutate(msg.id)}
                    onAddReaction={(msgId, emoji) => reactionMutation.mutate({ messageId: msgId, emoji })}
                />

                <div className="p-4 border-t border-red-700/30 bg-black">
                    <MessageInput
                        roomId={selectedRoomId}
                        disabled={isReadOnly || sendMessageMutation.isPending}
                        onSendMessage={(msg, imgs) => {
                            sendMessageMutation.mutate({
                                content: msg,
                                imageUrls: imgs,
                                roomId: selectedRoomId,
                                clientMessageId: crypto.randomUUID()
                            });
                        }}
                    />
                </div>
            </div>
        </div>
    );
}