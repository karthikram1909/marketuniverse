import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Video, Phone, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoVoiceChannel({ roomID, channelName }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [zegoInstance, setZegoInstance] = useState(null);

    const initializeZego = async (isVideo) => {
        try {
            setLoading(true);
            setError(null);

            // Get token from backend
            const { data } = await base44.functions.invoke('generateZegoToken', { 
                roomID: roomID 
            });

            if (!data.token) {
                throw new Error('Failed to generate Zego token');
            }

            // Dynamically import Zego SDK
            const ZegoUIKitPrebuilt = (await import('npm:@zegocloud/zego-uikit-prebuilt@2.9.0')).default;

            const element = document.getElementById(`zego-container-${roomID}`);
            if (!element) {
                throw new Error('Container element not found');
            }

            // Initialize Zego
            const instance = ZegoUIKitPrebuilt.create(data.token);
            await instance.joinRoom({
                container: element,
                scenario: {
                    mode: isVideo ? ZegoUIKitPrebuilt.VideoConference : ZegoUIKitPrebuilt.OneONoneCall,
                },
                showScreenSharingButton: isVideo,
                showPreJoinView: false,
                showRoomTimer: true,
                turnOnCameraWhenJoining: isVideo,
                turnOnMicrophoneWhenJoining: true,
                showMyCameraToggleButton: isVideo,
                showAudioVideoSettingsButton: true,
                showTextChat: false,
                showUserList: true,
                maxUsers: 50,
                layout: "Grid",
                showLayoutButton: isVideo,
            });

            setZegoInstance(instance);
        } catch (err) {
            console.error('Zego initialization error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const leaveChannel = () => {
        if (zegoInstance) {
            zegoInstance.destroy();
            setZegoInstance(null);
        }
    };

    if (zegoInstance) {
        return (
            <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden">
                <div id={`zego-container-${roomID}`} className="w-full h-full" />
                <Button
                    onClick={leaveChannel}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 z-50"
                    size="sm"
                >
                    <X className="w-4 h-4 mr-2" />
                    Leave
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-8">
            <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                        <Video className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-bold text-white">{channelName}</h3>
                        <p className="text-sm text-gray-400">Video & Voice Channel</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-4 justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={() => initializeZego(true)}
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-semibold px-8"
                        >
                            <Video className="w-4 h-4 mr-2" />
                            {loading ? 'Connecting...' : 'Join Video Call'}
                        </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={() => initializeZego(false)}
                            disabled={loading}
                            variant="outline"
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-semibold px-8"
                        >
                            <Phone className="w-4 h-4 mr-2" />
                            {loading ? 'Connecting...' : 'Join Voice Call'}
                        </Button>
                    </motion.div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                    Click to join the channel. Make sure to allow camera and microphone permissions.
                </p>
            </div>
        </div>
    );
}