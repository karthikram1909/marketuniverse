import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import { getXPProgress, getCompletedLevelFromXP } from './XPUtils';

export default function XPProgressBar({ totalXP }) {
    const { current, next, progress, xpToNext } = getXPProgress(totalXP || 0);
    const completedLevel = getCompletedLevelFromXP(totalXP || 0);
    
    if (!current || !next) {
        return null;
    }
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-500/50 rounded-2xl p-6"
        >
            {/* Level Header - Show COMPLETED level, not current */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-[#f5c96a]" />
                    <div>
                        <h3 className="text-2xl font-bold text-white">{completedLevel.name}</h3>
                        <p className="text-sm text-gray-400">Level {completedLevel.level}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Zap className="w-5 h-5" />
                        <span className="text-2xl font-bold">{(totalXP || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-400">Total XP</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-end text-sm">
                    <span className="text-cyan-400 font-semibold">{(xpToNext || 0).toLocaleString()} XP to go</span>
                </div>
                
                <div className="relative h-6 bg-black/40 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-sm drop-shadow-lg">
                            {progress.toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Next Level Info */}
                <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span>Level {current.level}: {(current.xpRequired || 0).toLocaleString()} XP</span>
                    <span>Level {next.level}: {(next.xpRequired || 0).toLocaleString()} XP</span>
                </div>
            </div>

            {/* Zeus Special Message */}
            {completedLevel.level === 12 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg">
                    <p className="text-yellow-400 text-sm font-semibold text-center">
                        🏆 Level 12 completed! Contact admin to claim 1 BTC reward, then earn it again! 🏆
                    </p>
                </div>
            )}
        </motion.div>
    );
}