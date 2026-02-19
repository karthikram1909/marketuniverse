import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TrendingUp, Flame } from 'lucide-react';

export default function NewsTape() {
    const scrollRef = useRef(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['newsTape'],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('fetch-market-news');
            if (error) throw error;
            return data;
        },
        staleTime: 300000,
        refetchInterval: 300000
    });

    const news = data?.news?.slice(0, 15) || [];

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationId;
        let scrollPosition = 0;

        const scroll = () => {
            scrollPosition += 0.5;
            if (scrollPosition >= scrollContainer.scrollWidth / 2) {
                scrollPosition = 0;
            }
            scrollContainer.scrollLeft = scrollPosition;
            animationId = requestAnimationFrame(scroll);
        };

        animationId = requestAnimationFrame(scroll);

        return () => cancelAnimationFrame(animationId);
    }, [news.length]);

    if (isLoading) {
        return (
            <div className="fixed top-[72px] left-0 right-0 z-40 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border-y border-red-500/30 py-4 backdrop-blur-sm">
                <div className="text-center text-gray-400 text-sm">Loading hot news...</div>
            </div>
        );
    }

    if (error || news.length === 0) {
        console.log('News tape error or no news:', error, news.length);
        return null;
    }

    return (
        <div className="fixed top-[72px] left-0 right-0 z-40 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border-y border-red-500/30 py-3 overflow-hidden backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2 px-4">
                <Flame className="w-4 h-4 text-red-500" />
                <span className="text-red-500 font-bold text-sm uppercase tracking-wider">Hot News</span>
            </div>
            <div ref={scrollRef} className="relative w-full overflow-x-hidden flex" style={{ scrollBehavior: 'auto' }}>
                <div className="flex gap-6 flex-shrink-0">
                    {[...news, ...news, ...news].map((article, idx) => (
                        <a
                            key={idx}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group flex-shrink-0"
                        >
                            <TrendingUp className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            <span className="text-white text-sm group-hover:text-cyan-400 transition-colors whitespace-nowrap">
                                {article.headline}
                            </span>
                            <span className="text-gray-500 text-xs whitespace-nowrap">• {article.source}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}