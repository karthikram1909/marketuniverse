import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useWallet } from '../wallet/WalletContext';
import Pagination from '../common/Pagination';

const POOL_INFO = {
    scalping: { name: 'Crypto Pool', color: 'from-red-500 to-orange-500' },
    traditional: { name: 'Traditional Pool', color: 'from-yellow-500 to-orange-500' },
    vip: { name: 'VIP Pool', color: 'from-purple-500 to-pink-600' }
};

export default function PoolTradesPanel({ poolType }) {
    const { account } = useWallet();
    const [currentPage, setCurrentPage] = useState(1);
    const tradesPerPage = 10;

    const { data: allTrades = [], isLoading } = useQuery({
        queryKey: ['poolTrades', poolType],
        queryFn: async () => {
            const { data } = await supabase
                .from('pool_trades')
                .select('*')
                .eq('pool_type', poolType)
                .order('date', { ascending: false });
            return data || [];
        }
    });

    const totalPages = Math.ceil(allTrades.length / tradesPerPage);
    const trades = allTrades.slice((currentPage - 1) * tradesPerPage, currentPage * tradesPerPage);

    // Fetch user's investment data
    const { data: userInvestment } = useQuery({
        queryKey: ['userInvestment', poolType, account],
        queryFn: async () => {
            if (!account) return null;
            const { data } = await supabase
                .from('pool_investors')
                .select('*')
                .eq('pool_type', poolType)
                .eq('wallet_address', account.toLowerCase());
            return data?.[0] || null;
        },
        enabled: !!account
    });

    // Fetch all investors for ownership calculation
    const { data: allInvestors = [] } = useQuery({
        queryKey: ['allInvestors', poolType],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*').eq('pool_type', poolType);
            return data || [];
        }
    });

    // Use allTrades for calculations
    const allPoolTrades = allTrades;

    // Fetch pool settings for profit share rate
    const { data: poolSettings } = useQuery({
        queryKey: ['poolSettings', poolType],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', poolType);
            return data?.[0] || { profit_share_rate: 0.20 };
        }
    });

    const poolInfo = POOL_INFO[poolType];
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = trades.length > 0
        ? (trades.filter(t => t.result === 'win').length / trades.length * 100)
        : 0;

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 ${poolType === 'scalping' ? 'led-glow-red' :
                        poolType === 'traditional' ? 'led-glow-gold' :
                            'led-glow-purple'
                    }`}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${poolInfo.color} flex items-center justify-center`}>
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{poolInfo.name}</h2>
                            <p className="text-gray-400 text-sm">Recent Trades</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Win Rate</p>
                        <p className="text-lg font-bold text-green-400">{winRate.toFixed(1)}%</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading trades...</div>
                ) : allTrades.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No trades yet</div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {trades.map((trade, index) => {
                                const profitShareRate = poolSettings?.profit_share_rate || 0;
                                const cleanPnl = (trade.pnl || 0) - (trade.fee || 0);
                                const profitShare = cleanPnl > 0 ? cleanPnl * profitShareRate : 0;
                                const netPnl = trade.pnl - trade.fee - profitShare;

                                return (
                                    <div
                                        key={trade.id || index}
                                        className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-semibold">{trade.pair}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.direction === 'long'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {trade.direction.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-gray-400">{trade.leverage}x</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.result === 'win'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {trade.result.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                                            <div>Margin: <span className="text-white">${trade.margin.toFixed(4)}</span></div>
                                            <div>Size: <span className="text-white">${trade.size.toFixed(4)}</span></div>
                                            <div>Leverage: <span className="text-white">{trade.leverage}x</span></div>
                                            <div>Gross PnL: <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>${trade.pnl.toFixed(4)}</span></div>
                                            <div>Fees: <span className="text-orange-400">${trade.fee.toFixed(4)}</span></div>
                                            <div>Profit Share: <span className="text-yellow-400">${profitShare.toFixed(4)}</span></div>
                                            <div>Net PnL: <span className={`font-semibold ${netPnl >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                                ${netPnl.toFixed(4)}
                                            </span></div>
                                            <div className="col-span-2">Date: <span className="text-white">{format(new Date(trade.date), 'MMM dd, HH:mm')}</span></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}

                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Pool P&L (Page Total)</span>
                        <span className={`font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${totalPnl.toFixed(2)}
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}