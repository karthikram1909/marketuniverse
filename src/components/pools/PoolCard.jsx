import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function PoolCard({ pool, index }) {
    const { title, subtitle, icon: Icon, badges, description, stats, color, gradient } = pool;
    
    const getPoolLink = () => {
        if (pool.path) return createPageUrl(pool.path);
        if (title === 'Crypto Pool') return createPageUrl('CryptoPool');
        if (title === 'Traditional Pool') return createPageUrl('TraditionalPool');
        if (title === 'VIP Pool') return createPageUrl('VIPPool');
        return '#';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group"
        >
            <Link to={getPoolLink()}>
                <div className={`relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl h-full flex flex-col ${
                    index === 0 ? 'border-red-500/30 hover:border-red-500/50' : 
                    index === 1 ? 'border-yellow-500/30 hover:border-yellow-500/50' : 
                    'border-purple-500/30 hover:border-purple-500/50'
                }`}>
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity rounded-2xl`} />
                    
                    {/* Header */}
                    <div className="relative flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{title}</h3>
                                <p className="text-xs text-gray-400">{subtitle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {badges.map((badge, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">
                                {badge}
                            </span>
                        ))}
                    </div>

                    {/* Chart Line */}
                    <div className="h-12 mb-4 rounded-lg bg-black/30 border border-white/5 overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                            <motion.path
                                d={pool.pathData}
                                fill="none"
                                stroke={color}
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            />
                        </svg>
                    </div>

                    {/* Description - Fixed Height */}
                    <p className="text-gray-400 text-sm mb-6 line-clamp-1">{description}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-auto mb-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                                <p className="text-sm font-bold text-white">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <button className={`w-full py-3 rounded-xl font-semibold transition-all bg-gradient-to-r ${gradient} text-white hover:shadow-lg hover:shadow-${color}/20`}>
                        View Details
                    </button>
                </div>
            </Link>
        </motion.div>
    );
}