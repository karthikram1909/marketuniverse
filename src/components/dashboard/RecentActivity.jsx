import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink } from 'lucide-react';

const activities = [
    { type: 'send', token: 'ETH', amount: '0.5', to: '0x1234...5678', time: '2 hours ago', hash: '0xabc...' },
    { type: 'receive', token: 'USDC', amount: '500', from: '0x8765...4321', time: '5 hours ago', hash: '0xdef...' },
    { type: 'swap', from: '1.2 ETH', to: '4,200 USDC', time: '1 day ago', hash: '0xghi...' },
    { type: 'send', token: 'UNI', amount: '25', to: '0xabcd...efgh', time: '2 days ago', hash: '0xjkl...' },
    { type: 'receive', token: 'LINK', amount: '15', from: '0xijkl...mnop', time: '3 days ago', hash: '0xmno...' },
];

const getIcon = (type) => {
    switch (type) {
        case 'send': return ArrowUpRight;
        case 'receive': return ArrowDownLeft;
        case 'swap': return RefreshCw;
        default: return ArrowUpRight;
    }
};

const getColor = (type) => {
    switch (type) {
        case 'send': return 'text-red-400 bg-red-400/10';
        case 'receive': return 'text-green-400 bg-green-400/10';
        case 'swap': return 'text-purple-400 bg-purple-400/10';
        default: return 'text-gray-400 bg-gray-400/10';
    }
};

export default function RecentActivity() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
            <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white text-sm sm:text-base font-semibold">Recent Activity</h3>
                <button className="text-cyan-400 text-xs sm:text-sm hover:text-cyan-300 transition-colors">
                    View All
                </button>
            </div>

            <div className="divide-y divide-white/5">
                {activities.map((activity, index) => {
                    const Icon = getIcon(activity.type);
                    const colorClass = getColor(activity.type);
                    
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.05 }}
                            className="flex items-center justify-between p-3 sm:p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div>
                                    <p className="text-white text-xs sm:text-sm font-medium capitalize">
                                        {activity.type === 'swap' 
                                            ? `Swapped ${activity.from} → ${activity.to}`
                                            : `${activity.type} ${activity.amount} ${activity.token}`
                                        }
                                    </p>
                                    <p className="text-gray-400 text-[10px] sm:text-xs">
                                        {activity.type === 'send' && `To: ${activity.to}`}
                                        {activity.type === 'receive' && `From: ${activity.from}`}
                                        {activity.type === 'swap' && 'Via Uniswap'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-gray-400 text-[10px] sm:text-xs hidden sm:inline">{activity.time}</span>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white">
                                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}