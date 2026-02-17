import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2, ZoomIn, ZoomOut, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FullscreenChart({ icon: Icon, title, children }) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoom, setZoom] = useState(1);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.2, 2));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.2, 0.6));
    };

    const resetZoom = () => {
        setZoom(1);
    };

    return (
        <>
            {/* Regular Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative overflow-hidden rounded-2xl group"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(139,92,246,0.12) 30%, rgba(6,182,212,0.12) 70%, rgba(0,0,0,0.8) 100%)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    padding: '16px',
                    boxShadow: '0 8px 32px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
            >
                {/* Animated shine effect */}
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{
                        background: 'linear-gradient(45deg, transparent, rgba(139,92,246,0.2), transparent)'
                    }}
                    animate={{
                        x: ['-100%', '200%']
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut"
                    }}
                />

                {/* Glassmorphic overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" 
                     style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 40%)' }} />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ 
                                    boxShadow: [
                                        '0 0 10px rgba(139,92,246,0.3)',
                                        '0 0 20px rgba(139,92,246,0.5)',
                                        '0 0 10px rgba(139,92,246,0.3)'
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="p-1.5 rounded-lg"
                                style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(139,92,246,0.3))' }}
                            >
                                <Icon className="w-4 h-4 text-cyan-400" />
                            </motion.div>
                            <h4 className="text-sm font-bold text-white">{title}</h4>
                        </div>
                        <Button
                            onClick={() => setIsFullscreen(true)}
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-white/10"
                        >
                            <Maximize2 className="w-4 h-4 text-gray-400" />
                        </Button>
                    </div>
                    {children}
                </div>
            </motion.div>

            {/* Fullscreen Dialog */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] bg-black/95 border-white/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleZoomOut}
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-white/10"
                                disabled={zoom <= 0.6}
                            >
                                <ZoomOut className="w-4 h-4 text-gray-400" />
                            </Button>
                            <Button
                                onClick={resetZoom}
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 hover:bg-white/10 text-gray-400 text-xs"
                            >
                                {Math.round(zoom * 100)}%
                            </Button>
                            <Button
                                onClick={handleZoomIn}
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-white/10"
                                disabled={zoom >= 2}
                            >
                                <ZoomIn className="w-4 h-4 text-gray-400" />
                            </Button>
                            <Button
                                onClick={() => setIsFullscreen(false)}
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-white/10 ml-2"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </Button>
                        </div>
                    </div>
                    <div 
                        className="overflow-auto"
                        style={{ 
                            height: 'calc(95vh - 140px)',
                            minHeight: '500px',
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            width: `${100 / zoom}%`
                        }}
                    >
                        <div style={{ width: '100%', height: '100%' }}>
                            {React.cloneElement(children, { height: zoom === 1 ? undefined : 600 })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}