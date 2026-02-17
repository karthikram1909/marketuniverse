import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export default function YouTubeLiveEmbed({ roomId }) {
    const [checking, setChecking] = useState(false);

    // Fetch global YouTube settings
    const { data: settings, refetch, isLoading } = useQuery({
        queryKey: ['globalYoutubeSettings'],
        queryFn: async () => {
            const results = await base44.entities.YouTubeSettings.filter({});
            console.log('YouTube Settings:', results[0]);
            return results[0] || null;
        },
        refetchInterval: 30000 // Check every 30 seconds
    });

    // Check live status (only for public mode)
    const checkLiveStatus = async () => {
        if (checking || !settings) return;
        
        // Only auto-check for public mode
        if (settings.stream_type !== 'public') return;
        
        setChecking(true);
        try {
            const response = await base44.functions.invoke('checkYoutubeLiveStatus', {
                stream_type: settings.stream_type,
                channel_id: settings.channel_id,
                video_url: settings.video_url
            });
            if (response.data) {
                console.log('YouTube status:', response.data);
            }
            await refetch();
        } catch (error) {
            console.error('Failed to check live status:', error);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        if (settings?.stream_type === 'public') {
            checkLiveStatus();
            const interval = setInterval(checkLiveStatus, 30000); // Check every 30 seconds for public
            return () => clearInterval(interval);
        }
    }, [settings]);

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Loading stream...</p>
            </div>
        );
    }

    if (!settings || (!settings.channel_id && !settings.video_url)) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No stream configured</p>
            </div>
        );
    }

    if (checking && !settings.current_live_video_id) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Checking for live stream...</p>
            </div>
        );
    }

    if (!settings.is_live || !settings.video_id) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No live stream currently</p>
                <p className="text-xs text-gray-500 mt-1">is_live: {String(settings?.is_live)}, video_id: {settings?.video_id || 'none'}</p>
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
                    src={`https://www.youtube.com/embed/${settings.video_id}?autoplay=1&mute=0&enablejsapi=1`}
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