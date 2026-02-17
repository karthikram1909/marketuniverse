import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Clock } from 'lucide-react';
import moment from 'moment';

export default function ActivityStream() {
    const { data: trades = [] } = useQuery({
        queryKey: ['recentTrades'],
        queryFn: async () => {
            const [scalping, traditional, vip] = await Promise.all([
                base44.entities.PoolTrade.filter({ pool_type: 'scalping' }),
                base44.entities.PoolTrade.filter({ pool_type: 'traditional' }),
                base44.entities.PoolTrade.filter({ pool_type: 'vip' })
            ]);
            return [...scalping, ...traditional, ...vip];
        },
        staleTime: 30000,
        refetchInterval: 30000
    });



    const activityFeed = useMemo(() => {
        return trades
            .filter(t => t.result === 'win' && (t.pnl || 0) > 0)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 15)
            .map(trade => ({
                type: 'trade',
                icon: TrendingUp,
                color: 'text-green-400',
                bgColor: 'bg-green-500/10',
                text: `Profitable trade on ${trade.pair}`,
                amount: `+$${(trade.pnl - trade.fee).toFixed(2)}`,
                time: trade.date,
                pool: trade.pool_type
            }));
    }, [trades]);

    return (
        <div className="w-full py-24 px-4 sm:px-6 relative overflow-hidden">
            {/* Animated green gradient background */}
            <motion.div 
                className="absolute inset-0"
                animate={{ 
                    background: [
                        'radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.15) 0%, transparent 50%)',
                        'radial-gradient(ellipse at 80% 50%, rgba(16,185,129,0.15) 0%, transparent 50%)',
                        'radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.15) 0%, transparent 50%)'
                    ]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-green-950/10 to-black" />
            
            {/* Floating green orbs */}
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={`activity-orb-${i}`}
                    className="absolute rounded-full"
                    style={{
                        width: `${Math.random() * 80 + 40}px`,
                        height: `${Math.random() * 80 + 40}px`,
                        background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)',
                        filter: 'blur(30px)',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        x: [0, Math.random() * 40 - 20, 0],
                        y: [0, Math.random() * 40 - 20, 0],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: Math.random() * 8 + 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}
            
            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Activity className="w-8 h-8 text-green-400" />
                        <motion.h2 
                            className="text-4xl sm:text-5xl font-bold relative"
                            style={{
                                background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.3) 50%, rgba(34,197,94,0.2) 100%)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(34,197,94,0.3)',
                                borderRadius: '20px',
                                padding: '20px 40px',
                                boxShadow: '0 8px 32px rgba(34,197,94,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(34,197,94,0.2)',
                                textShadow: '0 0 40px rgba(34,197,94,0.8), 0 4px 8px rgba(0,0,0,0.5)',
                                WebkitTextFillColor: 'transparent',
                                backgroundImage: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #22c55e 100%)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text'
                            }}
                            animate={{
                                boxShadow: [
                                    '0 8px 32px rgba(34,197,94,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(34,197,94,0.2)',
                                    '0 8px 32px rgba(34,197,94,0.5), inset 0 2px 0 rgba(255,255,255,0.3), 0 20px 60px rgba(34,197,94,0.4)',
                                    '0 8px 32px rgba(34,197,94,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(34,197,94,0.2)'
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            Live Activity Feed
                        </motion.h2>
                        <Activity className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-gray-400 text-lg">Recent trades across all pools</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activityFeed.map((activity, index) => {
                        const Icon = activity.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ scale: 1.02, y: -4 }}
                                className="relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(34,197,94,0.1) 50%, rgba(0,0,0,0.8) 100%)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(34,197,94,0.2)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    boxShadow: '0 8px 32px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.1)'
                                }}
                            >
                                {/* Animated shine effect */}
                                <motion.div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                                    style={{
                                        background: 'linear-gradient(45deg, transparent, rgba(34,197,94,0.2), transparent)'
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
                                
                                <div className="flex items-start gap-3 relative z-10">
                                    <motion.div 
                                        className="p-2 rounded-lg"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.2) 100%)',
                                            boxShadow: '0 0 20px rgba(34,197,94,0.3)'
                                        }}
                                        animate={{ 
                                            boxShadow: [
                                                '0 0 20px rgba(34,197,94,0.3)',
                                                '0 0 30px rgba(34,197,94,0.5)',
                                                '0 0 20px rgba(34,197,94,0.3)'
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Icon className="w-5 h-5 text-green-400" />
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium mb-1">{activity.text}</p>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-lg font-bold text-green-400">
                                                {activity.amount}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {moment(activity.time).fromNow()}
                                            </div>
                                        </div>
                                        {activity.pool && (
                                            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                                {activity.pool}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Glassmorphic overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" 
                                     style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 40%)' }} />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}