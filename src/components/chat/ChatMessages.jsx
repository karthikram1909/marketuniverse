import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Download, Trash2, Smile, Clock } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import EmojiPicker from './EmojiPicker';
import FailedMessageRetry from './FailedMessageRetry';

export default function ChatMessages({ messages, currentWallet, currentUserId, canDelete, onDeleteMessage, onAddReaction, failedMessages = [], onRetryMessage }) {
     const [reactionPickerId, setReactionPickerId] = useState(null);
     const [retrySending, setRetrySending] = useState(null);
     const [showScrollButton, setShowScrollButton] = useState(false);
     const [imagePreview, setImagePreview] = useState(null);
     const scrollContainerRef = useRef(null);
     const endRef = useRef(null);
     const isAtBottomRef = useRef(true);

     // Detect if user is at bottom
     const checkIfAtBottom = useCallback(() => {
         const container = scrollContainerRef.current;
         if (!container) return true;
         const threshold = 80; // pixels from bottom - triggers auto-scroll
         const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
         isAtBottomRef.current = isBottom;
         return isBottom;
     }, []);

     // Handle scroll event
     const handleScroll = useCallback(() => {
         const isBottom = checkIfAtBottom();
         setShowScrollButton(!isBottom);
     }, [checkIfAtBottom]);

     // Auto-scroll only if user was already at bottom
     useEffect(() => {
         if (isAtBottomRef.current) {
             endRef.current?.scrollIntoView({ behavior: 'smooth' });
         } else {
             // User is reading old messages - show button
             setShowScrollButton(true);
         }
     }, [messages]);

     // Scroll to bottom button handler
     const scrollToBottom = () => {
         endRef.current?.scrollIntoView({ behavior: 'smooth' });
         setShowScrollButton(false);
         isAtBottomRef.current = true;
     };

     // Handle ESC key to close image preview
     useEffect(() => {
         const handleKeyDown = (e) => {
             if (e.key === 'Escape' && imagePreview) {
                 setImagePreview(null);
             }
         };
         window.addEventListener('keydown', handleKeyDown);
         return () => window.removeEventListener('keydown', handleKeyDown);
     }, [imagePreview]);

    const parseMessageContent = (content) => {
        const parts = [];
        let lastIndex = 0;
        const imageRegex = /\[IMAGE: (.+?)\]/g;
        const videoRegex = /\[VIDEO: (.+?)\]/g;
        const linkRegex = /(https?:\/\/[^\s\]]+)/g;

        const allMatches = [];

        // Find all matches with their positions
        let match;
        while ((match = imageRegex.exec(content)) !== null) {
            allMatches.push({ type: 'image', url: match[1], index: match.index, length: match[0].length });
        }
        while ((match = videoRegex.exec(content)) !== null) {
            allMatches.push({ type: 'video', url: match[1], index: match.index, length: match[0].length });
        }
        while ((match = linkRegex.exec(content)) !== null) {
            allMatches.push({ type: 'link', url: match[1], index: match.index, length: match[0].length });
        }

        // Sort matches by position
        allMatches.sort((a, b) => a.index - b.index);

        // Build parts array
        for (const match of allMatches) {
            if (match.index > lastIndex) {
                const textContent = content.substring(lastIndex, match.index).trim();
                if (textContent) {
                    parts.push({ type: 'text', content: textContent });
                }
            }
            parts.push({ type: match.type, url: match.url });
            lastIndex = match.index + match.length;
        }

        // Add remaining text
        if (lastIndex < content.length) {
            const textContent = content.substring(lastIndex).trim();
            if (textContent) {
                parts.push({ type: 'text', content: textContent });
            }
        }

        return parts.length ? parts : [{ type: 'text', content }];
    };

    const renderMessagePart = (part, idx) => {
        switch (part.type) {
            case 'text':
                return <span key={idx}>{part.content}</span>;
            case 'image':
                return (
                    <img
                        key={idx}
                        src={part.url}
                        alt="message"
                        className="max-w-xs rounded-lg border border-white/10 hover:opacity-80 transition mt-2 cursor-pointer"
                        onClick={() => setImagePreview(part.url)}
                        onError={(e) => (e.target.style.display = 'none')}
                    />
                );
            case 'video':
                return (
                    <video
                        key={idx}
                        src={part.url}
                        controls
                        className="max-w-xs rounded-lg border border-white/10 mt-2"
                    />
                );
            case 'link':
                return (
                    <a
                        key={idx}
                        href={part.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1 inline-flex mt-2"
                    >
                        {part.url.replace(/^https?:\/\//, '').slice(0, 40)}...
                        <ExternalLink className="w-3 h-3" />
                    </a>
                );
            default:
                return null;
        }
    };

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-gray-400 text-center">
                    No messages yet. Be the first to say hello!
                </p>
            </div>
        );
    }

    return (
        <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-b from-transparent via-purple-950/20 to-black relative custom-scrollbar"
            style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.5) rgba(0, 0, 0, 0.3)',
                paddingRight: '20px'
            }}
        >
            <style>{`
                /* Custom Dark Theme Scrollbar - Webkit Browsers (Chrome, Safari, Edge) */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                    margin: 8px 0;
                    border: 2px solid transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.6);
                    border-radius: 10px;
                    border: 2px solid rgba(0, 0, 0, 0.1);
                    transition: background 0.2s ease;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.9);
                }
                /* Firefox Scrollbar */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(156, 163, 175, 0.6) rgba(0, 0, 0, 0.2);
                }
            `}</style>
            {messages.map((msg, idx) => {
                 // Check if message belongs to current user (supports both wallet and user_id)
                 const isOwn = (msg.sender_wallet && msg.sender_wallet === currentWallet) || 
                              (msg.sender_user_id && msg.sender_user_id === currentUserId);
                 const parts = parseMessageContent(msg.message_content);
                 
                 // Only allow delete if message is backend-confirmed (has real ID and not sending)
                 const isBackendConfirmed = Boolean(msg.id) && msg.status !== 'sending';

                let formattedTime = null;

                const rawTime = msg.created_date || msg.client_sent_at;

                if (rawTime && msg.status !== 'sending') {
                    try {
                        let dateString = rawTime;
                        if (typeof rawTime === 'string') {
                            // Only add 'Z' if timestamp doesn't already have timezone info (Z or ±HH:MM offset)
                            const hasTimezoneInfo = /Z$|[+-]\d{2}:\d{2}$/.test(rawTime);
                            dateString = hasTimezoneInfo ? rawTime : rawTime + 'Z';
                        }
                        
                        const utcDate = typeof rawTime === 'string' ? new Date(dateString) : rawTime;

                        if (!isNaN(utcDate.getTime())) {
                            formattedTime = formatInTimeZone(
                                utcDate,
                                Intl.DateTimeFormat().resolvedOptions().timeZone,
                                'HH:mm'
                            );
                        }
                    } catch (err) {
                        console.warn('Invalid message timestamp:', rawTime, 'message:', msg.id);
                    }
                }

                return (
                    <motion.div
                                                key={msg.id || msg.client_message_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex gap-2 group ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                        {!isOwn && (
                                            <img
                                                src={msg.avatar_url || 'https://via.placeholder.com/40'}
                                                alt={msg.sender_username}
                                                className="w-8 h-8 rounded-full flex-shrink-0 mt-1 object-cover"
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                                            />
                                        )}
                                        <div
                                           className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 text-white shadow-lg ${
                                               isOwn
                                                   ? 'bg-red-800/60'
                                                   : 'bg-slate-800/60'
                                           } ${msg.status === 'sending' ? 'opacity-70' : ''}`}
                                        >
                            {!isOwn && (
                                <p className="text-xs font-semibold text-blue-400 mb-1">
                                    {msg.sender_username}
                                </p>
                            )}
                            <div className="text-sm space-y-1">
                                {parts.map((part, partIdx) =>
                                    renderMessagePart(part, partIdx)
                                )}
                                {msg.image_urls && msg.image_urls.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {msg.image_urls.map((url, imgIdx) => (
                                            <img
                                                key={imgIdx}
                                                src={url}
                                                alt="shared image"
                                                className="max-w-xs rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition"
                                                onClick={() => setImagePreview(url)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                                 {msg.status === 'sending' ? (
                                     <>
                                         <Clock className="w-3 h-3 animate-pulse" />
                                         Sending...
                                     </>
                                 ) : msg.status === 'retrying' ? (
                                     <>
                                         <Clock className="w-3 h-3 animate-pulse" />
                                         Retrying...
                                     </>
                                 ) : formattedTime}
                             </p>

                             {/* Failed Message Retry UI */}
                             {msg.status === 'failed' && (
                                 <FailedMessageRetry 
                                     message={msg} 
                                     onRetry={() => {
                                         setRetrySending(msg.client_message_id);
                                         onRetryMessage(msg);
                                         setTimeout(() => setRetrySending(null), 2000);
                                     }}
                                     isRetrying={retrySending === msg.client_message_id}
                                 />
                             )}

                             {/* Reactions */}
                             {msg.reaction_emojis && Object.keys(msg.reaction_emojis).length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-2">
                                     {Object.entries(msg.reaction_emojis).map(([emoji, users]) => {
                                         // Check if current user has reacted (supports both wallet and user_id)
                                         const userHasReacted = users.includes(currentWallet) || users.includes(currentUserId);
                                         return (
                                             <button
                                                       key={emoji}
                                                       onClick={() => onAddReaction(msg.id, emoji)}
                                                       className={`px-2 py-1 rounded text-sm transition duration-300 ${
                                                           userHasReacted
                                                               ? 'bg-gradient-to-r from-pink-500/40 to-purple-500/40 border border-pink-400/60 shadow-lg shadow-pink-500/20'
                                                               : 'bg-white/5 border border-white/10 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20'
                                                       }`}
                                                   >
                                                       {emoji} {users.length}
                                                   </button>
                                         );
                                     })}
                                 </div>
                             )}
                            </div>
                            <div className="flex gap-1 ml-auto">
                            <button
                                onClick={() => setReactionPickerId(reactionPickerId === msg.id ? null : msg.id)}
                                className="self-center p-2 text-gray-400 hover:text-gray-300 hover:bg-white/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                                title="Add reaction"
                            >
                                <Smile className="w-4 h-4" />
                            </button>
                            {canDelete && (
                                <button
                                    onClick={() => onDeleteMessage(msg)}
                                    className="self-center p-2 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition opacity-0 group-hover:opacity-100 hover:bg-red-500/20"
                                    title="Delete message"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            </div>
                            <AnimatePresence>
                            {reactionPickerId === msg.id && (
                                <div className="relative">
                                    <EmojiPicker
                                        onSelect={(emoji) => {
                                            onAddReaction(msg.id, emoji);
                                            setReactionPickerId(null);
                                        }}
                                        onClose={() => setReactionPickerId(null)}
                                    />
                                </div>
                            )}
                            </AnimatePresence>
                            </motion.div>
                            );
                            })}
                            <div ref={endRef} />

                            {/* Scroll to Bottom Button */}
                            <AnimatePresence>
                                {showScrollButton && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        onClick={scrollToBottom}
                                        className="fixed bottom-24 right-8 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-full shadow-lg hover:from-red-700 hover:to-red-800 flex items-center gap-2 z-50 border border-red-500/50"
                                        >
                                        <span className="text-sm font-medium">New Messages</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            {/* Image Preview Modal */}
                            {imagePreview && (
                                <div
                                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
                                    onClick={() => setImagePreview(null)}
                                >
                                    <button
                                        onClick={() => setImagePreview(null)}
                                        className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 hover:bg-black/70 rounded-full p-3 transition z-[101]"
                                        aria-label="Close preview"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}
                            </div>
                            );
                            }