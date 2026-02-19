import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export default function YouTubeLiveEmbed({ roomId, youtubeUrl, isAutoLive }) {
    const [checking, setChecking] = useState(false);

    // Fetch global YouTube settings (fallback if props not provided or for polling)
    const { data: settings, refetch, isLoading } = useQuery({
        queryKey: ['globalYoutubeSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('youtube_settings').select('*').limit(1).maybeSingle();
            return data || null;
        },
        refetchInterval: 30000,
        enabled: !youtubeUrl // Only fetch if we don't have a direct URL
    });

    const activeSettings = settings || {};
    const effectiveUrl = youtubeUrl || activeSettings.youtube_video_url || activeSettings.video_url;

    // Check live status (only for public mode and if we don't have a direct verified URL yet)
    const checkLiveStatus = async () => {
        if (checking || !activeSettings.stream_type) return;

        // Only auto-check for public mode where channel_id is set
        if (activeSettings.stream_type !== 'public') return;

        setChecking(true);
        try {
            const { data, error } = await supabase.functions.invoke('check-youtube-live-status', {
                body: {
                    stream_type: activeSettings.stream_type,
                    channel_id: activeSettings.channel_id,
                    video_url: activeSettings.video_url
                }
            });

            if (data) {
                console.log('YouTube status:', data);
            }
            await refetch();
        } catch (error) {
            console.error('Failed to check live status:', error);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        if (activeSettings.stream_type === 'public' && !youtubeUrl) {
            checkLiveStatus();
            const interval = setInterval(checkLiveStatus, 30000);
            return () => clearInterval(interval);
        }
    }, [activeSettings.stream_type, youtubeUrl]);

    if (isLoading && !youtubeUrl) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Loading stream...</p>
            </div>
        );
    }

    // Determine if we have enough config to show anything
    const hasConfig = effectiveUrl || (activeSettings.channel_id);

    if (!hasConfig) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No stream configured</p>
            </div>
        );
    }

    if (checking && !effectiveUrl) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Checking for live stream...</p>
            </div>
        );
    }

    // Extract video ID from URL
    const getVideoId = (url) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com')) {
                return urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                return urlObj.pathname.slice(1);
            }
        } catch (e) { return null; }
        return null;
    };

    const videoId = getVideoId(effectiveUrl);

    if (!videoId) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No live stream currently</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-red-500/30 rounded-xl overflow-hidden"
        >
            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border-b border-red-500/30 px-4 py-3 flex items-center gap-2">
                <div className="relative">
                    <Radio className="w-5 h-5 text-red-500" />
                    <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
                <span className="text-white font-semibold text-sm">LIVE NOW</span>
            </div>
            <div className="relative bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1`}
                    title="YouTube Live Stream"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="eager"
                />
            </div>
        </motion.div>
    );
}