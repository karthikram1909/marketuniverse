import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, DollarSign, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BankerOffer({ isOpen, offer, onDeal, onNoDeal }) {
    const [showOffer, setShowOffer] = useState(false);
    const audioRef = useRef(null);
    const [audioLoaded, setAudioLoaded] = useState(false);

    useEffect(() => {
        // Preload audio on mount
        const audio = new Audio('https://www.soundjay.com/phone/sounds/telephone-ring-04.mp3');
        audio.volume = 0.7;
        audio.preload = 'auto';
        audio.addEventListener('canplaythrough', () => setAudioLoaded(true), { once: true });
        audio.load();
        audioRef.current = audio;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setShowOffer(false);
            
            // Play telephone ringing sound
            if (audioRef.current && audioLoaded) {
                audioRef.current.currentTime = 0;
                const playPromise = audioRef.current.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.log('Audio autoplay prevented:', err);
                    });
                }
            }
            
            const timer = setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                setShowOffer(true);
            }, 3000);

            return () => {
                clearTimeout(timer);
                if (audioRef.current) {
                    audioRef.current.pause();
                }
            };
        }
    }, [isOpen, audioLoaded]);

    return (
        <Dialog open={isOpen}>
            <DialogContent 
                className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-[#f5c96a] text-white max-w-2xl [&>button]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">Banker's Offer</DialogTitle>
                <DialogDescription className="sr-only">The banker is calling with an offer for you</DialogDescription>
                <div className="py-8 text-center">
                    {!showOffer ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-6"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 10, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
                            >
                                <Phone className="w-12 h-12 text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-white">The Banker is calling...</h2>
                            <p className="text-gray-400">Get ready for the offer!</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">The Banker's Offer</h2>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: 'spring' }}
                                    className="text-6xl font-bold text-[#f5c96a] mb-6"
                                >
                                    ${(offer || 0).toFixed(2)}
                                </motion.div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    onClick={onDeal}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl py-8 text-2xl"
                                >
                                    <DollarSign className="w-8 h-8 mr-2" />
                                    DEAL
                                </Button>

                                <Button
                                    onClick={onNoDeal}
                                    className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:opacity-90 text-white border-0 rounded-xl py-8 text-2xl"
                                >
                                    <X className="w-8 h-8 mr-2" />
                                    NO DEAL
                                </Button>
                            </div>

                            <p className="text-gray-400 text-sm">
                                Accept the banker's offer to end the game, or keep playing!
                            </p>
                        </motion.div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}