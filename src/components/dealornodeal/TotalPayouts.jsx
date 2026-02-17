import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

export default function TotalPayouts() {
    // Fetch paid scatter wins
    const { data: paidScatters = [] } = useQuery({
        queryKey: ['paidScatters'],
        queryFn: async () => {
            const { data } = await supabase.from('scatter_wins').select('*').eq('status', 'paid');
            return data || [];
        },
        staleTime: 30000
    });

    // Fetch paid NFT sales
    const { data: paidNFTSales = [] } = useQuery({
        queryKey: ['paidNFTSales'],
        queryFn: async () => {
            const { data } = await supabase.from('nft_sale_requests').select('*').eq('status', 'paid');
            return data || [];
        },
        staleTime: 30000
    });

    // Fetch paid leaderboard periods
    const { data: paidPeriods = [] } = useQuery({
        queryKey: ['paidLeaderboards'],
        queryFn: async () => {
            const { data } = await supabase.from('leaderboard_periods').select('*').eq('status', 'paid');
            return data || [];
        },
        staleTime: 30000
    });

    // Fetch manual payouts
    const { data: manualPayouts = [] } = useQuery({
        queryKey: ['manualPayouts'],
        queryFn: async () => {
            const { data } = await supabase.from('manual_payouts').select('*');
            return data || [];
        },
        staleTime: 30000
    });

    // Calculate totals
    const totalPayouts = useMemo(() => {
        const scatterTotal = paidScatters.reduce((sum, scatter) => sum + (scatter.total_winnings || 0), 0);
        const nftTotal = paidNFTSales.reduce((sum, sale) => sum + (sale.total_usdt_value || 0), 0);
        const leaderboardTotal = paidPeriods.reduce((sum, period) => sum + (period.total_paid_usd || 0), 0);
        const manualTotal = manualPayouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);

        return scatterTotal + nftTotal + leaderboardTotal + manualTotal;
    }, [paidScatters, paidNFTSales, paidPeriods, manualPayouts]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{
                scale: 1.01,
                boxShadow: '0 8px 40px rgba(220,38,38,0.3)'
            }}
            className="mb-8"
        >
            <div className="relative backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                }}
            >
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
                    style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)'
                    }}
                />
                <motion.div
                    className="absolute inset-0 rounded-3xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(220,38,38,0.4), rgba(255,255,255,0.3))',
                        filter: 'blur(20px)',
                        zIndex: 0
                    }}
                    animate={{
                        opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <DollarSign className="w-6 h-6 text-gray-300" />
                        <p className="text-gray-300 text-sm uppercase tracking-wider">Total Payouts</p>
                    </div>
                    <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent">
                        ${totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-400 text-sm mt-3">
                        Scatter Wins • NFT Sales • Leaderboard Prizes
                    </p>
                </div>
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dc2626]/20 to-transparent"
                    style={{
                        transform: 'skewX(-20deg)'
                    }}
                    animate={{
                        x: ['-200%', '200%'],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: "easeInOut"
                    }}
                />
            </div>
        </motion.div>
    );
}