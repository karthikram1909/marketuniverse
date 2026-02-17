import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function ZegoLiveChat({ roomId }) {
    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const zegoInstance = useRef(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!isInitialized.current && roomId) {
            initializeChat();
        }
        return () => {
            if (zegoInstance.current) {
                try {
                    zegoInstance.current.leaveRoom(roomId);
                    zegoInstance.current.destroy();
                } catch (err) {
                    console.error('Cleanup error:', err);
                }
            }
        };
    }, [roomId]);

    const initializeChat = async () => {
        try {
            setLoading(true);
            setError(null);
            isInitialized.current = true;

            console.log('🟢 Starting chat initialization for room:', roomId);

            // Try to get authenticated user, fallback to guest
            let currentUser = null;
            try {
                currentUser = await base44.auth.me();
            } catch (err) {
                console.log('🟡 No authenticated user, using guest mode');
            }

            // Generate guest user if not authenticated
            const guestId = `guest_${Math.random().toString(36).substring(7)}`;
            const displayName = currentUser?.full_name || currentUser?.email || `Guest${Math.floor(Math.random() * 9999)}`;
            
            setUser(currentUser || { full_name: displayName, email: guestId });

            // Generate Zego token
            console.log('🟢 Requesting Zego token...');
            const tokenResponse = await base44.functions.invoke('generateZegoToken', {
                roomID: roomId,
                role: 1,
                guestMode: !currentUser,
                guestId: guestId,
                guestName: displayName
            });

            console.log('🟢 Token response received:', {
                hasData: !!tokenResponse.data,
                hasToken: !!tokenResponse.data?.token,
                hasAppID: !!tokenResponse.data?.appID,
                hasUserID: !!tokenResponse.data?.userID
            });

            if (tokenResponse.data?.error) {
                throw new Error(tokenResponse.data.error);
            }

            const { token, appID, userID, userName } = tokenResponse.data;

            if (!token || !appID || !userID) {
                throw new Error('Invalid token response from server');
            }

            // Load Zego ZIM SDK from CDN
            if (!window.ZIM) {
                console.log('🟢 Loading Zego ZIM SDK...');
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/zego-zim-web@2.15.0/index.js';
                script.crossOrigin = 'anonymous';
                
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load Zego ZIM SDK'));
                    document.head.appendChild(script);
                });

                await new Promise(resolve => setTimeout(resolve, 200));
            }

            if (!window.ZIM) {
                throw new Error('Zego ZIM SDK not available');
            }

            console.log('🟢 Creating ZIM instance, appID:', appID);
            const zim = window.ZIM.create(parseInt(appID));
            zegoInstance.current = zim;

            console.log('🟢 Logging in user:', userID);
            const loginConfig = { userID, userName: userName || currentUser.full_name || 'User' };
            await zim.login(loginConfig, token);

            console.log('🟢 Joining room:', roomId);
            const roomInfo = { roomID: roomId, roomName: 'Live Stream Chat' };
            const roomConfig = { maxMemberCount: 1000 };
            await zim.enterRoom(roomInfo, roomConfig);

            // Listen for Zego room messages
            zim.on('receiveRoomMessage', (zim, data) => {
                console.log('🟢 Room messages:', data.messageList);
                const newMsgs = data.messageList.map(msg => ({
                    id: msg.messageID,
                    sender: msg.senderUserID,
                    senderId: msg.senderUserID,
                    content: msg.type === 1 ? msg.message : '[Media]',
                    timestamp: msg.timestamp
                }));
                setMessages(prev => [...prev, ...newMsgs]);
            });

            console.log('✅ Chat initialized successfully');
            setLoading(false);

        } catch (error) {
            console.error('❌ Chat initialization error:', error);
            setError(error.message || 'Failed to initialize chat');
            setLoading(false);
            isInitialized.current = false;
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || sending || !zegoInstance.current) return;

        setSending(true);
        const messageContent = newMessage;
        
        try {
            const messageTextObj = { type: 1, message: messageContent, priority: 1 };
            await zegoInstance.current.sendMessage(messageTextObj, roomId, 2, { priority: 1 });
            
            // Add to local state immediately for instant feedback
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: user?.full_name || user?.email || 'You',
                senderId: user?.wallet_address || user?.email,
                content: messageContent,
                timestamp: Date.now()
            }]);

            setNewMessage('');
        } catch (error) {
            console.error('Send failed:', error);
            setError('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="w-6 h-6 text-red-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Connecting to chat...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-400 mb-2">Chat Error</p>
                    <p className="text-xs text-gray-400">{error}</p>
                    <Button
                        onClick={() => {
                            isInitialized.current = false;
                            initializeChat();
                        }}
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-black via-red-950/10 to-black border border-red-500/20 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600/30 to-red-700/20 border-b border-red-500/30 px-4 py-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Live Chat
                </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                    {messages.map((msg) => {
                        const isCurrentUser = msg.senderId === user?.id;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                                        isCurrentUser
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                                            : 'bg-white/10 text-gray-200'
                                    }`}
                                >
                                    {!isCurrentUser && (
                                        <p className="text-xs text-red-400 font-semibold mb-1">
                                            {msg.sender}
                                        </p>
                                    )}
                                    <p className="text-sm break-words">{msg.content}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-red-500/30 p-3 bg-black/50">
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message... (everyone can chat)"
                        className="flex-1 bg-white/5 border-red-500/30 text-white placeholder:text-gray-500 focus:border-red-500/50"
                        disabled={sending}
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                    >
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}