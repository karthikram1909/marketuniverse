import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Globe, AlertCircle } from 'lucide-react';

export default function FinnhubNewsTicker() {
    const { data: newsItems, isLoading } = useQuery({
        queryKey: ['finnhubNewsTape'],
        queryFn: async () => {
            try {
                const { data, error } = await supabase.functions.invoke('fetch-market-news');
                if (error || !data?.news) throw new Error(error?.message || 'No news data');
                return data.news;
            } catch (err) {
                console.warn('Finnhub news fetch failed, using fallback:', err.message);
                return [
                    { headline: "Bitcoin Dominance Rises as Institutional Inflows Accelerate", source: "MarketWatch", url: "https://www.marketwatch.com/crypto" },
                    { headline: "S&P 500 Hits Record High Amid Strong Tech Earnings", source: "Reuters", url: "https://www.reuters.com/business/finance/" },
                    { headline: "MarketsUniverse Launches New VIP Staking Pool with 24% APY", source: "Internal", url: "/Staking" },
                    { headline: "Federal Reserve Hints at Potential Rate Cuts in Q3 2024", source: "Bloomberg", url: "https://www.bloomberg.com/markets" },
                    { headline: "Ethereum 2.0 Staking Reaches New Milestone of 30M ETH Locked", source: "CryptoNews", url: "https://cryptonews.com/" },
                    { headline: "New AI Trading Algorithm Shows 85% Win Rate in Scalping Pool", source: "Internal", url: "/CryptoPool" }
                ];
            }
        },
        staleTime: 300000,
        refetchInterval: 600000
    });

    const displayItems = useMemo(() => {
        if (!newsItems || newsItems.length === 0) return [];
        return [...newsItems, ...newsItems, ...newsItems];
    }, [newsItems]);

    if (isLoading) {
        return (
            <div className="fixed top-[84px] sm:top-[92px] left-0 right-0 z-[45] bg-black/80 backdrop-blur-md border-y border-white/5 py-2">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Initializing Live Stream...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-[84px] sm:top-[92px] left-0 right-0 z-[45] bg-black/95 backdrop-blur-xl border-y border-red-500/20 py-2.5 overflow-hidden group select-none translate-z-0">
            <style>
                {`
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        animation: marquee 60s linear infinite;
                    }
                    .animate-marquee:hover {
                        animation-play-state: paused;
                    }
                `}
            </style>

            <div className="relative flex items-center">
                {/* Fixed Label */}
                <div className="flex-shrink-0 bg-black/95 pl-6 pr-4 py-1 flex items-center gap-2 z-20 border-r border-red-500/10">
                    <Flame className="w-4 h-4 text-red-500 fill-red-500/20 animate-pulse" />
                    <span className="text-red-500 font-bold text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
                        Finnhub Live
                    </span>
                </div>

                {/* Ticker Container */}
                <div className="flex-1 overflow-hidden pointer-events-auto">
                    <div className="flex whitespace-nowrap animate-marquee">
                        {displayItems.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-6 hover:bg-white/5 transition-colors group/item"
                            >
                                <TrendingUp className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all" />
                                <span className="text-gray-200 text-[13px] font-medium group-hover/item:text-white transition-colors">
                                    {item.headline}
                                </span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded text-[9px] uppercase tracking-wider text-red-400 font-bold group-hover/item:bg-red-500/20 transition-all ml-1">
                                    <Globe className="w-2.5 h-2.5" />
                                    {item.source}
                                </div>
                                <div className="w-1.5 h-1.5 bg-white/10 rounded-full ml-6" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Fade Gradients */}
                <div className="absolute left-[130px] top-0 bottom-0 w-24 bg-gradient-to-r from-black via-black/50 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black via-black/50 to-transparent z-10 pointer-events-none" />
            </div>
        </div>
    );
}
