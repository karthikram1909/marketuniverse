import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Radio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatMessages from '../components/chat/ChatMessages';
import MessageInput from '../components/chat/MessageInput';
import YouTubeLiveEmbed from '../components/chat/YouTubeLiveEmbed';
import FailedMessageRetry from '../components/chat/FailedMessageRetry';
import { Users, Search, Settings, ChevronDown, Image as ImageIcon, Pin } from 'lucide-react';
import { useChatMessageStore } from '../components/chat/ChatMessageStore';
import { useGlobalChatCatchUp } from '../components/chat/useGlobalChatCatchUp';

export default function ChatRoom() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const messageStore = useChatMessageStore();
    const [authChecked, setAuthChecked] = useState(false);
    const [user, setUser] = useState(null);
    const [chatProfile, setChatProfile] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [onlineMembers, setOnlineMembers] = useState([]);
    const [isApproved, setIsApproved] = useState(false);
    const [showLiveModal, setShowLiveModal] = useState(false);
    const [inMemoryUnread, setInMemoryUnread] = useState({});
    const globalChatUnsubscribeRef = useRef(null);
    const catchUpLocksRef = useRef({});
    const catchUpTimersRef = useRef({});
    const notificationRefetchThrottleRef = useRef(0);
    const retryCountRef = useRef({}); // Track retry attempts per clientMessageId

    // Messages come from the store (React tracks messagesByRoom changes)
    const messages = messageStore.messagesByRoom[selectedRoomId] || [];
    
    // Mount tracking
    useEffect(() => {
        console.log('🔵 ChatRoom MOUNTED');
        console.log(`📊 Messages in store for room ${selectedRoomId}:`, messages.length);
        return () => console.log('🔴 ChatRoom UNMOUNTED');
    }, []);

    // Fetch user and check auth
         useEffect(() => {
             const loadUser = async () => {
                 try {
                     const currentUser = await base44.auth.me();
                     if (!currentUser) {
                         navigate('/');
                         return;
                     }
                     setUser(currentUser);

                     // Check if user has chat profile - lookup by email (canonical identity)
                     const profiles = await base44.entities.ChatProfile.filter({
                         email: currentUser.email.toLowerCase()
                     });
                     console.log("🔍 PROFILE QUERY RESULT", profiles);

                     if (profiles.length === 0) {
                         navigate('/ChatProfileSetup', { replace: true });
                         return;
                     }

                     // Profile found - clean up just_created param if present
                     const urlParams = new URLSearchParams(window.location.search);
                     if (urlParams.has('just_created')) {
                         navigate('/Chat', { replace: true });
                     }

                 const profile = profiles[0];
                 console.log("✅ PROFILE FOUND", profile?.id, profile?.email);
                 console.log("🔐 PROFILE STATUS", {
                     email: profile.email,
                     approved: profile.is_approved,
                     blocked: profile.is_blocked
                 });

                 // HARD GATE: Approval check (only source of truth)
                 if (profile.is_blocked === true) {
                    navigate('/ChatProfileSetup', { replace: true });
                    return;
                 }

                 if (profile.is_approved !== true) {
                    navigate('/ChatProfileSetup', { replace: true });
                    return;
                 }

                 // APPROVED - set state and proceed
                 console.log("✅ APPROVAL PASSED");
                 setIsApproved(true);
                 setChatProfile(profile);
                
                // ONLY after approval: Update status to online (non-blocking)
                base44.entities.ChatProfile.update(profile.id, {
                    status: 'online',
                    last_seen: new Date().toISOString()
                }).then(() => {
                    // Update local state to reflect online status
                    setChatProfile(prev => ({ ...prev, status: 'online' }));
                }).catch(e => console.error("❌ PRESENCE FAIL", e));

                // ONLY after approval: Heartbeat: Update last_seen every 30 seconds
                const heartbeatInterval = setInterval(async () => {
                    try {
                        await base44.entities.ChatProfile.update(profile.id, {
                            last_seen: new Date().toISOString()
                        });
                    } catch (err) {
                        console.error('Heartbeat failed:', err);
                    }
                }, 30000);

                // Store interval ID for cleanup
                window.chatHeartbeat = heartbeatInterval;
            } catch (err) {
                console.error('Auth check failed:', err);
                navigate('/');
            } finally {
                setAuthChecked(true);
            }
        };

        loadUser();

        // Cleanup: set user offline when leaving
        return () => {
            // Clear heartbeat
            if (window.chatHeartbeat) {
                clearInterval(window.chatHeartbeat);
            }
            
            if (chatProfile?.id) {
                base44.entities.ChatProfile.update(chatProfile.id, {
                    status: 'offline',
                    last_seen: new Date().toISOString()
                }).catch(err => console.error('Error setting offline:', err));
            }
        };
    }, [navigate]);

    // Fetch chat rooms with real-time updates
    const { data: rooms = [] } = useQuery({
        queryKey: ['chatRooms'],
        queryFn: async () => {
            console.log("🚦 QUERY ENABLED?", { isApproved, query: "rooms" });
            const data = await base44.entities.ChatRoom.filter({ is_active: true });
            return data.sort((a, b) => (a.order || 0) - (b.order || 0));
        },
        enabled: isApproved && !!chatProfile,
        staleTime: Infinity // Never auto-refetch, rely on real-time subscription
    });
    console.log("🏠 ROOMS LOADED", rooms);

    // Memoize live stream room lookup (avoid repeated array scans)
    const liveStreamRoom = useMemo(() => {
        if (!rooms.length) return null;
        return rooms.find(r => r.name.toLowerCase().includes('live streaming')) || null;
    }, [rooms]);

    // Subscribe to room changes
    useEffect(() => {
        if (!chatProfile) return;
        const unsubscribe = base44.entities.ChatRoom.subscribe((event) => {
            queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        });
        return unsubscribe;
    }, [queryClient, chatProfile]);

    // Set first room as default
    useEffect(() => {
        if (rooms.length === 0) console.log("🚫 NO ROOMS FOUND");
        if (rooms.length > 0 && selectedRoomId) console.log("ℹ️ ROOM ALREADY SELECTED", selectedRoomId);
        if (rooms.length > 0 && !selectedRoomId) {
            console.log("📌 SETTING DEFAULT ROOM", rooms[0]?.id);
            setSelectedRoomId(rooms[0].id);
        }
    }, [rooms, selectedRoomId]);



    // ARCHITECTURAL INVARIANT:
    // Chat rooms are intentionally capped to ≤200 messages.
    // Pagination is NOT implemented.
    // Cursor-based reconciliation assumes full room hydration.
    // DO NOT increase fetch limits or room size without adding pagination.
    const messagesQuery = useQuery({
         queryKey: ['chatMessages', selectedRoomId],
         queryFn: async () => {
             if (!selectedRoomId) return [];
             console.log('🚦 QUERY ENABLED?', { isApproved, query: "messages" });
             console.log('📥 Fetching messages from server...');
             return await base44.entities.ChatMessage.filter(
                 { room_id: selectedRoomId },
                 'created_date',
                 200
             );
         },
         enabled: isApproved && !!selectedRoomId && !!chatProfile,
         staleTime: Infinity,
         refetchOnWindowFocus: false,
         refetchOnReconnect: false,
         refetchInterval: false,
         retry: false
     });

    // Merge server messages into store (guard against stale query data)
    useEffect(() => {
        if (!messagesQuery.data || !selectedRoomId) return;

        // Skip merge if reconciliation has already fetched newer data (cursor exists)
        const cursor = messageStore.getLastServerCursor(selectedRoomId);
        if (cursor && messagesQuery.data.length > 0) {
            // INVARIANT: Use composite cursor to prevent message loss
            // Include message if: created_date > cursor.created_date OR (created_date === cursor.created_date AND id > cursor.id)
            const hasNewerMessage = messagesQuery.data.some(m =>
                (m.created_date > cursor.created_date) ||
                (m.created_date === cursor.created_date && m.id > cursor.id)
            );

            if (!hasNewerMessage) {
                return;
            }
        }

        messageStore.mergeMessages(selectedRoomId, messagesQuery.data, 'server');
    }, [messagesQuery.data, selectedRoomId, messageStore]);

    // Fetch notifications with real-time updates
    const { data: notifications = [] } = useQuery({
        queryKey: ['chatNotifications', user?.email?.toLowerCase()],
        queryFn: async () => {
            if (!user?.email) return [];
            console.log('🚦 QUERY ENABLED?', { isApproved, query: "notifications" });
            const data = await base44.entities.ChatNotification.filter({
                recipient_email: user.email.toLowerCase()
            });
            console.log(`📬 NOTIF_FETCH for ${user.email.toLowerCase()}: fetched ${data.length} notifications`);
            return data;
        },
        enabled: isApproved && !!user && !!chatProfile,
        staleTime: 60000, // Cache for 60s to reduce refetch frequency
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false
    });

    // Real-time subscription for notifications
    useEffect(() => {
        if (!user || !chatProfile) return;
        const unsubscribe = base44.entities.ChatNotification.subscribe((event) => {
            // Guard: skip if document hidden (page not visible)
            if (document.hidden) {
                console.log('📵 Notification event ignored (document hidden)');
                return;
            }
            // Throttle: refetch at most once per second to prevent rate limiting
            const now = Date.now();
            if (now - notificationRefetchThrottleRef.current >= 1000) {
                notificationRefetchThrottleRef.current = now;
                console.log('🔄 Throttled notification refetch');
                queryClient.refetchQueries({ queryKey: ['chatNotifications', user.email?.toLowerCase()] });
            }
        });
        return unsubscribe;
    }, [user, queryClient, chatProfile]);

    // Fetch online members (active within last 2 minutes)
      const { data: allProfiles = [] } = useQuery({
          queryKey: ['chatProfiles'],
          queryFn: async () => {
              const data = await base44.entities.ChatProfile.filter({ status: 'online' });
              const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
              // Filter to only show users active in last 2 minutes (skip invalid timestamps)
              return data.filter(profile => {
                  if (!profile.last_seen || !isValidDate(profile.last_seen)) return false;
                  try {
                      return new Date(profile.last_seen).getTime() >= new Date(twoMinutesAgo).getTime();
                  } catch {
                      return false;
                  }
              }).map(profile => ({
                  ...profile,
                  // Fallback for display: use username as primary, wallet as secondary
                  displayId: profile.wallet_address || profile.user_id || profile.username
              }));
          },
          enabled: isApproved && !!chatProfile,
          staleTime: 30000, // Refetch every 30s for online status
          refetchInterval: 30000
          });

         // Validate date strings to avoid "Invalid time value" errors
         const isValidDate = (dateString) => {
         if (!dateString) return false;
         try {
             const time = new Date(dateString).getTime();
             return !isNaN(time);
         } catch {
             return false;
         }
         };

    // Fetch YouTube settings
    const { data: youtubeSettings } = useQuery({
        queryKey: ['globalYoutubeSettings'],
        queryFn: async () => {
            const settings = await base44.entities.YouTubeSettings.filter({});
            return settings[0] || null;
        },
        enabled: isApproved && !!chatProfile,
        staleTime: 60000, // Refetch every 60s
        refetchInterval: 60000
    });

    // Global ChatMessage subscription - listens to ALL rooms
    useEffect(() => {
        if (!chatProfile?.id) return;

        // Server-authoritative reconciliation per room
         const triggerReconciliation = (roomId) => {
             // Check lock BEFORE scheduling - if already locked, do not schedule another
             if (catchUpLocksRef.current[roomId]) {
                 return;
             }

             // Acquire lock immediately before scheduling
             catchUpLocksRef.current[roomId] = true;

             // Clear existing timer for this room
             if (catchUpTimersRef.current[roomId]) {
                 clearTimeout(catchUpTimersRef.current[roomId]);
             }

             // Active-room fast path: bypass debounce for current room
             const delay = roomId === selectedRoomId ? 0 : 1500;

             // Debounce: wait 1500ms before fetching (or 0ms for active room)
             catchUpTimersRef.current[roomId] = setTimeout(async () => {
                 try {
                     const cursor = messageStore.getLastServerCursor(roomId);

                     console.log(`🔄 Server reconciliation for room ${roomId} after cursor:`, cursor || 'initial');

                     // INVARIANT: Build query with composite cursor to prevent message loss
                     // Never rely on created_date alone - always pair with id for disambiguation
                     let query = { room_id: roomId };
                     if (cursor) {
                         // Fetch messages where created_date > cursor OR (created_date == cursor AND id > cursor.id)
                         // This prevents messages with identical timestamps but higher IDs from being dropped
                         query = {
                             room_id: roomId,
                             $or: [
                                 { created_date: { $gt: cursor.created_date } },
                                 {
                                     created_date: cursor.created_date,
                                     id: { $gt: cursor.id }
                                 }
                             ]
                         };
                     }

                     // ARCHITECTURAL INVARIANT:
                     // Chat rooms are intentionally capped to ≤200 messages.
                     // Pagination is NOT implemented.
                     // Cursor-based reconciliation assumes full room hydration.
                     // DO NOT increase fetch limits or room size without adding pagination.
                     const serverMessages = await base44.entities.ChatMessage.filter(
                         query,
                         'created_date',
                         200
                     );

                     if (serverMessages.length > 0) {
                         console.log(`✅ Reconciled ${serverMessages.length} messages for room ${roomId}`);
                         messageStore.mergeMessages(roomId, serverMessages);
                     } else {
                         console.log(`✓ No new messages for room ${roomId}`);
                     }
                 } catch (err) {
                     console.error(`❌ Reconciliation failed for room ${roomId}:`, err);
                 } finally {
                     // Release lock only after async operation completes
                     catchUpLocksRef.current[roomId] = false;
                 }
             }, delay);
             };

        // Subscribe ONCE to all ChatMessage events
        console.log('📡 Starting global ChatMessage subscription');
        globalChatUnsubscribeRef.current = base44.entities.ChatMessage.subscribe((event) => {
            if (event.type === 'create' && event.data) {
                const roomId = event.data.room_id;
                const messageId = event.data.id;
                
                // Validate backend contract
                if (!roomId || !messageId) {
                    console.warn(`⚠️ Create event missing room_id or id - ignoring`);
                    return;
                }
                
                // Check if message already exists (guards against duplicate CREATE events)
                const roomMessages = messageStore.messagesByRoom[roomId] || [];
                const messageAlreadyExists = roomMessages.some(m => m.id === messageId || m.client_message_id === messageId);
                
                // IMMEDIATE: Merge event payload into store without waiting for reconciliation
                // This ensures all clients see the message instantly, without relying on delayed reconciliation
                // CRITICAL: Only use fallback timestamp for DISPLAY, mark as unconfirmed for cursor tracking
                const hasRealTimestamp = !!(event.data.created_date || event.data.created_at);
                const normalizedMessage = {
                    ...event.data,
                    status: event.data.status || 'sent',
                    created_date:
                        event.data.created_date ||
                        event.data.created_at ||
                        new Date().toISOString(),
                    _timestamp_is_fallback: !hasRealTimestamp  // Flag: cursor tracking should ignore this
                };
                console.log(`⚡ Realtime CREATE - immediate merge for room ${roomId}, message ${messageId}${!hasRealTimestamp ? ' (fallback timestamp)' : ''}`);
                messageStore.mergeMessages(roomId, [normalizedMessage], 'realtime');
                
                // SAFETY NET: Trigger reconciliation ONLY if this is a new message AND inactive room
                // Active room trusts realtime; background rooms reconcile to catch missed messages
                const isActiveRoom = roomId === selectedRoomId || (showLiveModal && liveStreamRoom?.id === roomId);
                if (!messageAlreadyExists && !isActiveRoom) {
                    triggerReconciliation(roomId);
                }

                // Unread tracking: increment ONLY if this is a new message and inactive room
                if (!isActiveRoom && !messageAlreadyExists) {
                    setInMemoryUnread(prev => ({
                        ...prev,
                        [roomId]: (prev[roomId] || 0) + 1
                    }));
                    console.log('📬 Incremented unread for room:', roomId);
                }
            } else if (event.type === 'delete' && event.id) {
                // Handle message deletion - immediately remove from all clients
                // Deletions are authoritative and must propagate without refetch
                const messageId = event.id;
                
                if (!event.data?.room_id) {
                    // Backend contract violation: delete events MUST include room_id
                    console.warn(`⚠️ Delete event missing room_id for message ${messageId} - ignoring`);
                    return;
                }
                
                console.log(`🗑️ Realtime delete signal for message ${messageId} in room ${event.data.room_id}`);
                messageStore.deleteMessage(event.data.room_id, messageId);
            }
        });

        return () => {
            if (globalChatUnsubscribeRef.current) {
                console.log('🔌 Cleanup: Unsubscribing from global ChatMessage subscription');
                globalChatUnsubscribeRef.current();
                globalChatUnsubscribeRef.current = null;
            }
            // Clear all pending timers and release all locks
            Object.keys(catchUpTimersRef.current).forEach(roomId => {
                clearTimeout(catchUpTimersRef.current[roomId]);
            });
            catchUpTimersRef.current = {};
            catchUpLocksRef.current = {};
        };
    }, [chatProfile?.id, messageStore]);

    // Live stream room hydration (fetch initial messages when modal opens)
    // Uses same pattern as regular channels: fetch on-demand via query
    useEffect(() => {
        if (!showLiveModal || !liveStreamRoom) return;

        // Fetch messages via query - let React Query handle caching and consistency
        base44.entities.ChatMessage.filter(
            { room_id: liveStreamRoom.id },
            'created_date',
            100
        ).then(messages => {
            console.log(`🎬 Live stream room fetch: ${messages.length} messages`);
            messageStore.mergeMessages(liveStreamRoom.id, messages, 'server');
        }).catch(err => console.error('Live stream fetch failed:', err));
    }, [showLiveModal, liveStreamRoom, messageStore]);

    // Send message mutation with retry logic
    const sendMessageMutation = useMutation({
         mutationFn: async ({ content, imageUrls, roomId, clientMessageId }) => {
              if (!user?.email) throw new Error('User email not available');

              // Diagnostic: Log input parameters
              console.log('📤 sendMessageMutation.mutationFn START', {
                  roomId,
                  userEmail: user.email,
                  userId: user.id,
                  chatProfileId: chatProfile.id,
                  chatProfileIsAdmin: chatProfile.is_admin,
                  userRole: user.role
              });

              // Defensive check: Verify profile hasn't been blocked/unapproved mid-session
              const freshProfile = await base44.entities.ChatProfile.filter({ 
                  email: user.email.toLowerCase() 
              });
             if (freshProfile.length === 0 || freshProfile[0].is_blocked || !freshProfile[0].is_approved) {
                 console.log('❌ BLOCKED: Chat access revoked', {
                     profileCount: freshProfile.length,
                     isBlocked: freshProfile[0]?.is_blocked,
                     isApproved: freshProfile[0]?.is_approved
                 });
                 throw new Error('Your chat access has been revoked. Please refresh the page.');
             }

             // Fetch fresh room data to check permission
             const roomData = await base44.entities.ChatRoom.filter({ id: roomId });
             const room = roomData[0];

             console.log('📍 Room fetched', {
                 roomId,
                 roomFound: !!room,
                 permission: room?.permission
             });

             if (!room) {
                 console.log('❌ BLOCKED: Room not found');
                 throw new Error('Room not found');
             }

             // CRITICAL: Block ALL non-admin users from sending in read_only rooms
             if (room.permission === 'read_only') {
                 // Only system admins (user.role === 'admin') or chat admins (chatProfile.is_admin) can write
                 const canWrite = user?.role === 'admin' || chatProfile?.is_admin === true;
                 if (!canWrite) {
                     console.log('❌ BLOCKED: Read-only room, user not admin', {
                         permission: room.permission,
                         userRole: user.role,
                         chatProfileIsAdmin: chatProfile.is_admin
                     });
                     throw new Error('This channel is read-only. Only admins can write here.');
                 }
             }

             // Create message with wallet if available, otherwise use user_id
             let message;
             try {
                 message = await base44.entities.ChatMessage.create({
                     room_id: roomId,
                     client_message_id: clientMessageId,
                     sender_wallet: user.wallet_address ? user.wallet_address.toLowerCase() : null,
                     sender_user_id: user.id,
                     sender_username: chatProfile.username,
                     message_content: content,
                     image_urls: imageUrls,
                     reaction_emojis: {}
                 });
                 console.log('✅ CHATMESSAGE CREATED', {
                     messageId: message.id,
                     createdDate: message.created_date,
                     clientMessageId
                 });
                 // Clear retry count on success
                 retryCountRef.current[clientMessageId] = 0;
             } catch (error) {
                 console.error('❌ CHATMESSAGE CREATE FAILED', error);
                 throw error;
             }

             // Fire-and-forget notification creation (don't await)
             // Message is marked as sent immediately, notifications happen asynchronously
             base44.functions.invoke('createChatNotifications', {
                 message_id: message.id,
                 room_id: roomId,
                 sender_email: user.email.toLowerCase()
             }).catch(err => console.error('Notification creation failed:', err));

             return message;
             },
            onMutate: async ({ content, imageUrls, roomId, clientMessageId }) => {
            // RETRY GUARD: Check if message already exists (prevents duplicate bubbles on retry)
            const existingMessages = messageStore.getMessagesForRoom(roomId);
            const existingMessage = existingMessages.find(m => m.client_message_id === clientMessageId);

            if (existingMessage) {
                // Retry path: update existing message status to 'retrying'
                console.log(`♻️ Retry: Reusing existing message ${clientMessageId}`);
                messageStore.updateMessage(roomId, clientMessageId, { status: 'retrying' });
            } else {
                // First send: add new optimistic message
                const optimisticMessage = {
                    id: null, // Explicitly null until server confirms
                    client_message_id: clientMessageId,
                    room_id: roomId,
                    sender_wallet: user.wallet_address ? user.wallet_address.toLowerCase() : null,
                    sender_user_id: user.id,
                    sender_username: chatProfile.username,
                    message_content: content,
                    image_urls: imageUrls,
                    reaction_emojis: {},
                    client_sent_at: new Date().toISOString(),
                    created_date: null,
                    status: 'sending'
                };
                messageStore.addOptimisticMessage(roomId, optimisticMessage);
            }
            return { clientMessageId, roomId };
            },
            onError: (err, variables, context) => {
            console.log(`❌ Send failed: ${context.clientMessageId}`);
            // DO NOT DELETE - mark as failed instead
            messageStore.updateMessage(context.roomId, context.clientMessageId, {
                status: 'failed',
                error: err.message
            });
            },
            onSuccess: (backendMessage, variables, context) => {
            const clientMessageId = context.clientMessageId;
            console.log(`✓ Server confirmed: ${clientMessageId} → ${backendMessage.id}`);

            messageStore.updateMessage(backendMessage.room_id, clientMessageId, {
                ...backendMessage,
                id: backendMessage.id,
                created_date: backendMessage.created_date,
                status: 'sent'
            });

            markRoomAsRead(backendMessage.room_id);
            }
            });

    // Retry failed message with exponential backoff (max 3 retries)
    const retryFailedMessage = React.useCallback(async (failedMessage) => {
        const clientMessageId = failedMessage.client_message_id;
        const retryCount = retryCountRef.current[clientMessageId] || 0;
        const MAX_RETRIES = 3;

        if (retryCount >= MAX_RETRIES) {
            console.warn(`❌ Max retries (${MAX_RETRIES}) exceeded for ${clientMessageId}`);
            return;
        }

        // Exponential backoff: 1s → 2s → 4s
        const delayMs = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Retry attempt ${retryCount + 1}/${MAX_RETRIES} for ${clientMessageId} (delay: ${delayMs}ms)`);

        // Update UI to show retrying state
        messageStore.updateMessage(failedMessage.room_id, clientMessageId, {
            status: 'retrying'
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Increment retry count and retry
        retryCountRef.current[clientMessageId] = retryCount + 1;
        sendMessageMutation.mutate({
            content: failedMessage.message_content,
            imageUrls: failedMessage.image_urls || [],
            roomId: failedMessage.room_id,
            clientMessageId
        });
    }, [sendMessageMutation, messageStore]);

    // Helper function to mark any room as read (both in-memory and durable)
    const markRoomAsRead = React.useCallback(async (roomId) => {
        if (!roomId) return;
        
        // Find notification for this room
        const notification = notifications.find(n => n.room_id === roomId);
        if (notification) {
            await base44.entities.ChatNotification.update(notification.id, {
                unread_count: 0,
                last_read_timestamp: new Date().toISOString()
            });
            // Throttled refetch instead of immediate invalidation
            const now = Date.now();
            if (now - notificationRefetchThrottleRef.current >= 1000) {
                notificationRefetchThrottleRef.current = now;
                queryClient.refetchQueries({ queryKey: ['chatNotifications', user.email?.toLowerCase()] });
            }
        }
    }, [notifications, queryClient, user?.email]);

    // Mark as read when room changes (only if approved)
     useEffect(() => {
         if (isApproved && selectedRoomId && chatProfile) {
             // Clear in-memory unread immediately
             setInMemoryUnread(prev => ({
                 ...prev,
                 [selectedRoomId]: 0
             }));
             // Mark durable ChatNotification as read
             markRoomAsRead(selectedRoomId);
         }
     }, [selectedRoomId, isApproved, markRoomAsRead, chatProfile]);

    // Edge case: Auto-clear unread if room is empty but shows unread badge
    // (message was deleted or never persisted)
    useEffect(() => {
        if (!isApproved || !selectedRoomId || !chatProfile) return;

        const currentMessages = messageStore.messagesByRoom[selectedRoomId] || [];
        const notification = notifications.find(n => n.room_id === selectedRoomId);

        // Detect edge case: unread > 0 but no messages
        if (notification && notification.unread_count > 0 && currentMessages.length === 0) {
            console.log(`🧹 Clearing unread for empty room ${selectedRoomId}`);
            base44.entities.ChatNotification.update(notification.id, {
                unread_count: 0
            }).catch(err => console.error('Failed to clear unread for empty room:', err));
        }
    }, [selectedRoomId, isApproved, chatProfile, messageStore.messagesByRoom, notifications]);


    // Mark live chat as read when modal opens (only if approved)
    useEffect(() => {
        if (isApproved && showLiveModal && liveStreamRoom?.id && chatProfile) {
            // Clear in-memory unread immediately
            setInMemoryUnread(prev => ({
                ...prev,
                [liveStreamRoom.id]: 0
            }));
            // Mark durable ChatNotification as read
            markRoomAsRead(liveStreamRoom.id);
            }
            }, [showLiveModal, liveStreamRoom?.id, isApproved, markRoomAsRead, chatProfile]);

    // Global catch-up: fetches missed messages for all rooms on focus/visibility restore
    // Skip rooms with active reconciliation locks to avoid concurrent fetches
    useGlobalChatCatchUp({ isApproved, chatProfile, rooms, messageStore, activeReconciliationLocks: catchUpLocksRef.current });

     // Delete message mutation
     const deleteMessageMutation = useMutation({
         mutationFn: async (messageId) => {
             // Absolute safety - refuse bad IDs
             if (!messageId || typeof messageId !== 'string') {
                 console.error('❌ DELETE_BLOCKED: invalid backend id', messageId);
                 throw new Error('DELETE_BLOCKED: invalid backend id');
             }
             await base44.entities.ChatMessage.delete(messageId);
         },
         onMutate: (messageId) => {
             console.log(`🗑️ Optimistic delete: ${messageId}`);
             messageStore.deleteMessage(selectedRoomId, messageId);
         }
     });

     // Add/remove reaction mutation
     const reactionMutation = useMutation({
         mutationFn: async ({ messageId, emoji }) => {
             const message = messages.find(m => m.id === messageId);
             const reactions = message.reaction_emojis || {};
             // Use wallet if available, otherwise use user_id
             const userIdentifier = user.wallet_address ? user.wallet_address.toLowerCase() : user.id;

             if (!reactions[emoji]) reactions[emoji] = [];

             const reactionList = reactions[emoji];
             const index = reactionList.indexOf(userIdentifier);

             if (index > -1) {
                 reactionList.splice(index, 1);
                 if (reactionList.length === 0) delete reactions[emoji];
             } else {
                 reactionList.push(userIdentifier);
             }

             await base44.entities.ChatMessage.update(messageId, { reaction_emojis: reactions });
             return { messageId, reaction_emojis: reactions };
         },
         onSuccess: (data) => {
             console.log(`👍 Reaction updated for: ${data.messageId}`);
             messageStore.updateMessage(selectedRoomId, data.messageId, {
                 reaction_emojis: data.reaction_emojis
             });
         }
     });







    // Block rendering until auth is resolved
    if (!authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading chat…</p>
            </div>
        );
    }

    // Post-auth guard: Only render if fully authenticated and approved
    if (!user || !chatProfile || !isApproved) {
        return null;
    }

    const currentRoom = rooms.find(r => r.id === selectedRoomId);
    
    // Shared helper: Can user write in read-only rooms?
    const canWriteInReadOnly = user?.role === 'admin' || chatProfile?.is_admin === true;
    const isReadOnly = currentRoom?.permission === 'read_only' && !canWriteInReadOnly;

     return (
        <div className="h-screen bg-black flex overflow-hidden">
            {/* Left Sidebar - Users List */}
            <div className="w-64 bg-gradient-to-b from-white/5 via-black to-black border-r border-red-700/40 flex flex-col overflow-hidden backdrop-blur-xl">
                {/* Logo */}
                <div className="p-4 border-b border-red-700/30 bg-gradient-to-r from-red-950/50 to-black">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-white">Messages</h2>
                </div>

                {/* Channels/Rooms and Members List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {/* Channels Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Channels</h3>
                        <div className="space-y-2">
                            {rooms.map((room) => {
                                const isSelected = room.id === selectedRoomId;
                                const roomNotif = notifications.find(n => n.room_id === room.id);
                                // Hybrid unread: use in-memory if key exists, otherwise ChatNotification
                                const unreadCount = inMemoryUnread.hasOwnProperty(room.id)
                                    ? inMemoryUnread[room.id]
                                    : (roomNotif?.unread_count || 0);
                                console.log(`🔔 Room ${room.name}: unread=${unreadCount}, notif=`, roomNotif);
                                return (
                                    <button
                                        key={room.id}
                                        onClick={() => setSelectedRoomId(room.id)}
                                        className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-red-700/40 to-red-800/30 border border-red-600/50 shadow-lg shadow-red-600/30'
                                                : 'hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-600/40 relative">
                                            {room.channel_avatar_url ? (
                                                <img src={room.channel_avatar_url} alt={room.name} className="w-full h-full rounded-lg object-cover" />
                                            ) : (
                                                <span className="text-white font-bold text-xs">#</span>
                                            )}
                                            {unreadCount > 0 && (
                                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-black animate-pulse">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{room.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{room.description || 'No description'}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Online Members Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Members Online</h3>
                        <div className="space-y-2">
                            {allProfiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
                                >
                                    <img
                                        src={profile.avatar_url || 'https://via.placeholder.com/40'}
                                        alt={profile.username}
                                        className="w-10 h-10 rounded-full flex-shrink-0 object-cover border-2 border-red-600/60 shadow-lg shadow-red-600/30"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{profile.username}</p>
                                        <p className="text-xs text-red-400 truncate">● Online</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Live Streaming & Back to Home */}
                <div className="p-4 border-t border-red-700/30 bg-gradient-to-t from-red-950/20 to-transparent space-y-2">
                    <Button
                        onClick={() => setShowLiveModal(true)}
                        disabled={!youtubeSettings?.is_live || !youtubeSettings?.video_id}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {youtubeSettings?.is_live && youtubeSettings?.video_id ? (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                                <Radio className="w-5 h-5 animate-pulse" />
                                <span className="font-bold">Live Streaming</span>
                            </>
                        ) : (
                            <>
                                <Radio className="w-5 h-5" />
                                <span className="font-bold">No Stream</span>
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/30"
                    >
                        ← Back to Home
                    </Button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-black h-full relative pointer-events-auto">
                {/* Header */}
                <div className="border-b border-red-700/30 px-6 py-4 bg-gradient-to-r from-red-950/50 to-black backdrop-blur-xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {currentRoom?.channel_avatar_url && (
                            <img src={currentRoom.channel_avatar_url} alt={currentRoom.name} className="w-8 h-8 rounded-full object-cover border border-red-600/50 shadow-lg shadow-red-600/20" />
                        )}
                        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-red-400">
                            {currentRoom?.name ? `#${currentRoom.name}` : 'Select a room'}
                        </h1>
                    </div>
                </div>



                {/* Messages Area */}
                <ChatMessages
                    messages={messages.map(msg => ({
                        ...msg,
                        // Find avatar by wallet first, then by user_id (supports both)
                        avatar_url: allProfiles.find(p => 
                            (msg.sender_wallet && p.wallet_address === msg.sender_wallet) || 
                            (msg.sender_user_id && p.user_id === msg.sender_user_id)
                        )?.avatar_url
                    }))}
                    currentWallet={user?.wallet_address?.toLowerCase()}
                    currentUserId={user?.id}
                    canDelete={user?.role === 'admin' || user?.is_chat_admin || user?.is_chat_moderator}
                    onDeleteMessage={(message) => {
                        // Must exist
                        if (!message) {
                            console.warn('🚫 DELETE BLOCKED: no message');
                            return;
                        }
                        // Must be persisted (backend-only field)
                        if (!message.created_date) {
                            console.warn('🚫 DELETE BLOCKED: message not persisted', message);
                            return;
                        }
                        // Must have real backend ID
                        if (!message.id || message.id === message.client_message_id) {
                            console.warn('🚫 DELETE BLOCKED: not a backend id', message);
                            return;
                        }
                        // Must not be optimistic
                        if (message.status === 'sending') {
                            console.warn('🚫 DELETE BLOCKED: optimistic message', message);
                            return;
                        }
                        console.log('🗑️ Deleting persisted message:', message.id);
                        deleteMessageMutation.mutate(message.id);
                    }}
                    onAddReaction={(msgId, emoji) => reactionMutation.mutate({ messageId: msgId, emoji })}
                    failedMessages={messages.filter(m => m.status === 'failed' || m.status === 'retrying')}
                    onRetryMessage={retryFailedMessage}
                />

                {/* Input Area */}
                <div className="bg-gradient-to-t from-red-950/20 to-transparent border-t border-red-700/30 p-4 backdrop-blur-xl flex-shrink-0">
                    <MessageInput
                         roomId={selectedRoomId}
                         onSendMessage={(msg, imageUrls) => {
                             const clientMessageId = crypto.randomUUID();
                             sendMessageMutation.mutate({ 
                                 content: msg, 
                                 imageUrls, 
                                 roomId: selectedRoomId, 
                                 clientMessageId 
                             });
                         }}
                         disabled={sendMessageMutation.isPending || isReadOnly}
                         isReadOnly={isReadOnly}
                     />
                </div>
            </div>

            {/* Live Streaming Modal */}
            <Dialog open={showLiveModal} onOpenChange={setShowLiveModal}>
                <DialogContent className="max-w-7xl w-full bg-gradient-to-br from-black via-red-950/20 to-black border border-red-500/30 text-white">
                    <button
                        onClick={() => setShowLiveModal(false)}
                        className="absolute right-4 top-4 rounded-full p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 transition-all group z-50"
                    >
                        <X className="w-5 h-5 text-red-400 group-hover:text-white" />
                    </button>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <div className="relative">
                                <Radio className="w-6 h-6 text-red-500" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            </div>
                            <span className="bg-gradient-to-r from-red-400 via-white to-red-400 bg-clip-text text-transparent">
                                Live Streaming
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 grid grid-cols-3 gap-4" style={{ height: '70vh' }}>
                        <div className="col-span-2">
                            <YouTubeLiveEmbed />
                        </div>
                        <div className="col-span-1 flex flex-col bg-gradient-to-b from-black via-red-950/10 to-black border border-red-500/20 rounded-lg overflow-hidden">
                            {(() => {
                                 if (!liveStreamRoom) {
                                     return (
                                         <div className="flex items-center justify-center h-full text-gray-400">
                                             Live streaming channel not found
                                         </div>
                                     );
                                 }
                                 const liveMessages = messageStore.messagesByRoom[liveStreamRoom.id] || [];
                                 return (
                                    <>
                                        <div className="bg-gradient-to-r from-red-600/30 to-red-700/20 border-b border-red-500/30 px-4 py-3">
                                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                Live Chat
                                            </h3>
                                        </div>
                                        <ChatMessages
                                            messages={liveMessages.map(msg => ({
                                                ...msg,
                                                // Find avatar by wallet first, then by user_id (supports both)
                                                avatar_url: allProfiles.find(p => 
                                                    (msg.sender_wallet && p.wallet_address === msg.sender_wallet) || 
                                                    (msg.sender_user_id && p.user_id === msg.sender_user_id)
                                                )?.avatar_url
                                            }))}
                                            currentWallet={user?.wallet_address?.toLowerCase()}
                                            currentUserId={user?.id}
                                            canDelete={user?.role === 'admin' || user?.is_chat_admin || user?.is_chat_moderator}
                                            onDeleteMessage={(message) => {
                                                // Must exist
                                                if (!message) {
                                                    console.warn('🚫 DELETE BLOCKED: no message');
                                                    return;
                                                }
                                                // Must be persisted (backend-only field)
                                                if (!message.created_date) {
                                                    console.warn('🚫 DELETE BLOCKED: message not persisted', message);
                                                    return;
                                                }
                                                // Must have real backend ID
                                                if (!message.id || message.id === message.client_message_id) {
                                                    console.warn('🚫 DELETE BLOCKED: not a backend id', message);
                                                    return;
                                                }
                                                // Must not be optimistic
                                                if (message.status === 'sending') {
                                                    console.warn('🚫 DELETE BLOCKED: optimistic message', message);
                                                    return;
                                                }
                                                console.log('🗑️ Deleting persisted message:', message.id);
                                                deleteMessageMutation.mutate(message.id);
                                            }}
                                            onAddReaction={(msgId, emoji) => reactionMutation.mutate({ messageId: msgId, emoji })}
                                            failedMessages={liveMessages.filter(m => m.status === 'failed' || m.status === 'retrying')}
                                            onRetryMessage={retryFailedMessage}
                                        />
                                        <div className="border-t border-red-500/30 p-3 bg-black/50">
                                            <MessageInput
                                                roomId={liveStreamRoom.id}
                                                onSendMessage={(msg, imageUrls) => {
                                                    const clientMessageId = crypto.randomUUID();
                                                    sendMessageMutation.mutate({ 
                                                        content: msg, 
                                                        imageUrls, 
                                                        roomId: liveStreamRoom.id, 
                                                        clientMessageId 
                                                    });
                                                }}
                                                disabled={sendMessageMutation.isPending}
                                                isReadOnly={false}
                                            />
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Right Sidebar - Profile/Attachments */}
            <div className="w-72 bg-gradient-to-b from-white/5 via-black to-black border-l border-red-700/40 flex flex-col p-4 overflow-hidden backdrop-blur-xl shadow-2xl shadow-red-600/20 pointer-events-auto">
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-white mb-4">Profile Info</h3>

                {/* User Profile Card */}
                <div className="bg-gradient-to-br from-red-800/30 to-red-900/20 rounded-xl p-4 mb-6 border border-red-700/40 backdrop-blur-xl shadow-lg shadow-red-600/20">
                    <img 
                        src={chatProfile?.avatar_url || 'https://via.placeholder.com/64'} 
                        alt={chatProfile?.username}
                        className="w-16 h-16 rounded-full mb-3 object-cover border-2 border-red-600/60 shadow-lg shadow-red-600/30"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/64'; }}
                    />
                    <p className="text-white font-semibold">{chatProfile?.username}</p>
                    <p className="text-xs text-red-400 mt-1">{chatProfile?.status}</p>
                </div>

                {/* Attachments */}
                <div className="flex-1 overflow-y-auto">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Attachments</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className={`aspect-square rounded-lg ${
                                    ['bg-gradient-to-br from-orange-500 to-red-600',
                                     'bg-gradient-to-br from-pink-500 to-rose-600',
                                     'bg-gradient-to-br from-purple-600 to-pink-600',
                                     'bg-gradient-to-br from-blue-600 to-cyan-600',
                                     'bg-gradient-to-br from-green-500 to-teal-600',
                                     'bg-gradient-to-br from-yellow-500 to-orange-600'][i]
                                } flex items-center justify-center cursor-pointer hover:opacity-80 transition`}
                            >
                                <ImageIcon className="w-6 h-6 text-white" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
    }