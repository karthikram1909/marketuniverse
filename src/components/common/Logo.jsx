import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function Logo({ size = 'default', showText = true }) {
    const sizes = {
        small: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-lg' },
        default: { container: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-2xl' },
        large: { container: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-3xl' },
        xl: { container: 'w-32 h-32', icon: 'w-16 h-16', text: 'text-5xl' }
    };

    const currentSize = sizes[size] || sizes.default;

    return (
        <div className="flex items-center gap-3">
            <div className={`${currentSize.container} flex items-center justify-center`}>
                <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/db7c6aec3_image.png"
                    alt="MarketsUniverse Logo"
                    className="w-full h-full object-contain"
                />
            </div>

            {showText && (
                <motion.span
                    className={`${currentSize.text} font-bold bg-gradient-to-r from-gray-400 via-red-500 to-gray-400 bg-clip-text text-transparent`}
                    animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        backgroundSize: '200% 100%'
                    }}
                >
                    MarketsUniverse
                </motion.span>
            )}
        </div>
    );
}