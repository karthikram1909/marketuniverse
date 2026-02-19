import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Smile, Upload, Send, Loader2 } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { supabase } from '@/lib/supabaseClient';

export default function MessageInput({ roomId, onSendMessage, disabled, isReadOnly }) {
    const [message, setMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);
    const [imageUrls, setImageUrls] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleEmojiSelect = (emoji) => {
        setMessage(prev => prev + emoji);
    };

    const handleFileUpload = async (filesOrEvent) => {
        // Support both event (from file input) and direct files array (from paste)
        const files = Array.isArray(filesOrEvent)
            ? filesOrEvent
            : Array.from(filesOrEvent.target.files || []);

        if (files.length === 0) return;

        setUploading(true);
        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `chat-uploads/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-assets')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('chat-assets')
                    .getPublicUrl(filePath);

                if (publicUrl && file.type.startsWith('image')) {
                    setImageUrls(prev => [...prev, publicUrl]);
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setError('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePaste = async (e) => {
        if (!e.clipboardData) return;

        const items = Array.from(e.clipboardData.items);
        const imageFiles = items
            .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
            .map(item => item.getAsFile())
            .filter(file => file !== null);

        if (imageFiles.length > 0) {
            e.preventDefault();
            await handleFileUpload(imageFiles);
        }
    };

    const handleSend = async () => {
        if (!message.trim() && imageUrls.length === 0 || !roomId) return;
        if (isReadOnly) {
            setError('This channel is read-only. You cannot send messages.');
            return;
        }

        setSending(true);
        setError('');
        try {
            await onSendMessage(message, imageUrls);
            setMessage('');
            setImageUrls([]);
        } catch (err) {
            setError(err.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-red-700/30 bg-gradient-to-t from-red-950/20 to-transparent backdrop-blur-xl p-4 space-y-3">
            {/* Image Previews */}
            {imageUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {imageUrls.map((url, idx) => (
                        <div key={idx} className="relative">
                            <img src={url} alt="preview" className="max-w-xs h-20 object-cover rounded-lg border border-red-700/30" />
                            <button
                                type="button"
                                onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 rounded-full p-1 text-white transition"
                            >
                                <span className="text-xs">✕</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Message textarea */}
            <div className="relative">
                {isReadOnly && (
                    <p className="text-xs text-yellow-500 mb-2">This channel is read-only</p>
                )}
                {error && (
                    <p className="text-xs text-red-400 mb-2">{error}</p>
                )}
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (isReadOnly) e.preventDefault();
                        else handleKeyDown(e);
                    }}
                    onPaste={handlePaste}
                    placeholder={isReadOnly ? "This channel is read-only" : "Type a message... (Shift+Enter for new line)"}
                    disabled={disabled || uploading || sending || isReadOnly}
                    rows="3"
                    className="w-full bg-black/60 border border-red-700/40 rounded-xl p-3 text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600/60 backdrop-blur-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <button
                        onClick={() => setShowEmoji(!showEmoji)}
                        disabled={disabled || uploading || sending}
                        className="p-2 hover:bg-red-700/20 rounded-lg transition text-gray-400 hover:text-white"
                        title="Add emoji"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                        {showEmoji && (
                            <EmojiPicker
                                onSelect={handleEmojiSelect}
                                onClose={() => setShowEmoji(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading || sending}
                    className="p-2 hover:bg-red-700/20 rounded-lg transition text-gray-400 hover:text-white"
                    title="Upload images/videos"
                >
                    {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Upload className="w-5 h-5" />
                    )}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                <div className="flex-1" />

                <Button
                    onClick={handleSend}
                    disabled={(!message.trim() && imageUrls.length === 0) || disabled || uploading || sending}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white gap-2 shadow-lg shadow-red-600/30"
                >
                    {sending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Send
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}