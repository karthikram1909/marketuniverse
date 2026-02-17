import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Flame } from 'lucide-react';

export default function TradingHeatmap() {
    const { data: trades = [] } = useQuery({
        queryKey: ['allTrades'],
        queryFn: async () => {
            const [scalping, traditional, vip] = await Promise.all([
                base44.entities.PoolTrade.filter({ pool_type: 'scalping' }),
                base44.entities.PoolTrade.filter({ pool_type: 'traditional' }),
                base44.entities.PoolTrade.filter({ pool_type: 'vip' })
            ]);
            return [...scalping, ...traditional, ...vip];
        },
        staleTime: 60000
    });

    const heatmapData = useMemo(() => {
        const pairStats = {};
        
        trades.forEach(trade => {
            if (!pairStats[trade.pair]) {
                pairStats[trade.pair] = {
                    pair: trade.pair,
                    volume: 0,
                    totalPnl: 0,
                    trades: 0,
                    wins: 0
                };
            }
            pairStats[trade.pair].volume += trade.size || 0;
            pairStats[trade.pair].totalPnl += trade.pnl || 0;
            pairStats[trade.pair].trades += 1;
            if (trade.result === 'win') pairStats[trade.pair].wins += 1;
        });

        return Object.values(pairStats)
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 12);
    }, [trades]);

    const getHeatGradient = (pnl, maxPnl) => {
        const intensity = Math.abs(pnl) / maxPnl;
        if (pnl > 0) {
            // Gold gradient for profits
            return `linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(212,175,55,${0.3 + intensity * 0.4}) 50%, rgba(255,215,0,${0.2 + intensity * 0.3}) 100%)`;
        } else {
            // Silver/dark gradient for losses
            return `linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(64,64,64,${0.3 + intensity * 0.3}) 50%, rgba(128,128,128,${0.2 + intensity * 0.2}) 100%)`;
        }
    };

    const maxPnl = Math.max(...heatmapData.map(d => Math.abs(d.totalPnl)));

    return (
        <div className="w-full py-24 px-4 sm:px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/5 to-black" />
            
            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Flame className="w-8 h-8 text-red-500" />
                        <motion.h2 
                            className="text-4xl sm:text-5xl font-bold relative"
                            style={{
                                background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(251,146,60,0.3) 50%, rgba(239,68,68,0.2) 100%)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '20px',
                                padding: '20px 40px',
                                boxShadow: '0 8px 32px rgba(239,68,68,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(239,68,68,0.2)',
                                textShadow: '0 0 40px rgba(239,68,68,0.8), 0 4px 8px rgba(0,0,0,0.5)',
                                WebkitTextFillColor: 'transparent',
                                backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #fb923c 50%, #ef4444 100%)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text'
                            }}
                            animate={{
                                boxShadow: [
                                    '0 8px 32px rgba(239,68,68,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(239,68,68,0.2)',
                                    '0 8px 32px rgba(239,68,68,0.5), inset 0 2px 0 rgba(255,255,255,0.3), 0 20px 60px rgba(239,68,68,0.4)',
                                    '0 8px 32px rgba(239,68,68,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 20px 60px rgba(239,68,68,0.2)'
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            Live Trading Heatmap
                        </motion.h2>
                        <Flame className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-gray-400 text-lg">Most active trading pairs by volume</p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {heatmapData.map((item, index) => {
                        const winRate = item.trades > 0 ? (item.wins / item.trades) * 100 : 0;
                        
                        return (
                            <motion.div
                                key={item.pair}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="relative group cursor-pointer overflow-hidden"
                                style={{
                                    background: getHeatGradient(item.totalPnl, maxPnl),
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '20px',
                                    padding: '20px',
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: item.totalPnl > 0 
                                        ? '0 8px 32px rgba(212,175,55,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' 
                                        : '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                                }}
                                >
                                {/* Glassmorphic overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" 
                                     style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 40%)' }} />

                                {/* Animated shine effect */}
                                <motion.div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                                    style={{
                                        background: item.totalPnl > 0
                                            ? 'linear-gradient(45deg, transparent, rgba(255,215,0,0.3), transparent)'
                                            : 'linear-gradient(45deg, transparent, rgba(192,192,192,0.2), transparent)',
                                        transform: 'translateX(-100%)'
                                    }}
                                    animate={{
                                        translateX: ['translateX(-100%)', 'translateX(100%)']
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        repeatDelay: 3
                                    }}
                                />
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-white font-bold text-lg">{item.pair}</h3>
                                    {item.totalPnl > 0 ? (
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-red-400" />
                                    )}
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Volume</span>
                                        <span className="text-white font-semibold">${item.volume.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">PnL</span>
                                        <span className={item.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            ${item.totalPnl.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Win Rate</span>
                                        <span className="text-cyan-400">{winRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Trades</span>
                                        <span className="text-purple-400">{item.trades}</span>
                                    </div>
                                </div>


                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}