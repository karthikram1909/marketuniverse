import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, TrendingUp, Calendar, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import NewsTape from '../components/news/NewsTape';
import NewsFilter from '../components/news/NewsFilter';

export default function News() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['marketNews'],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('fetch-market-news');
            if (error) throw error;
            return data;
        },
        staleTime: 300000,
        refetchInterval: false,
        refetchOnWindowFocus: false
    });

    const news = data?.news || [];

    // Filter news by category and search query
    const filteredNews = news.filter(article => {
        const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
        const searchMatch = searchQuery === '' ||
            article.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.summary?.toLowerCase().includes(searchQuery.toLowerCase());
        return categoryMatch && searchMatch;
    });

    return (
        <div className="min-h-screen bg-black">
            <Navbar />
            <NewsTape />

            {/* Animated Background */}
            <motion.div
                className="fixed inset-0 pointer-events-none"
                animate={{
                    background: [
                        'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)',
                    ]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />


            <div className="relative z-10 pt-44 pb-16 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Newspaper className="w-12 h-12 text-cyan-400" />
                            </motion.div>
                            <h1 className="relative text-5xl font-bold text-white inline-block">
                                <motion.div
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.6) 50%, transparent 100%)',
                                        height: '4px',
                                        filter: 'blur(2px)'
                                    }}
                                    animate={{
                                        x: ['-100%', '200%'],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                        ease: "linear"
                                    }}
                                />
                                Market News
                            </h1>
                        </div>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Stay updated with the latest financial and market news
                        </p>
                        {data?.fetched_at && (
                            <p className="text-sm text-cyan-400 mt-4">
                                Last updated: {new Date(data.fetched_at).toLocaleString()}
                            </p>
                        )}
                    </motion.div>

                    {/* Filters */}
                    {!isLoading && !error && news.length > 0 && (
                        <NewsFilter
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        />
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                            <p className="text-gray-400">Loading latest market news...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-2xl mx-auto"
                        >
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-400 mb-2">Failed to Load News</h3>
                            <p className="text-gray-300 mb-4">{error.message}</p>
                            <button
                                onClick={() => refetch()}
                                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </motion.div>
                    )}

                    {/* News Grid */}
                    {!isLoading && !error && filteredNews.length > 0 && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredNews.map((article, index) => (
                                <motion.article
                                    key={article.id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300 group"
                                >
                                    {/* Article Image */}
                                    {article.image && (
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={article.image}
                                                alt={article.headline}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        </div>
                                    )}

                                    <div className="p-6">
                                        {/* Source & Date */}
                                        <div className="flex items-center gap-3 mb-3 text-sm">
                                            <span className="text-cyan-400 font-semibold">{article.source || 'Market News'}</span>
                                            <span className="text-gray-500">•</span>
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(article.datetime * 1000).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Headline */}
                                        <h3 className="text-white font-bold text-lg mb-3 line-clamp-3 group-hover:text-cyan-400 transition-colors">
                                            {article.headline}
                                        </h3>

                                        {/* Summary */}
                                        {article.summary && (
                                            <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                                {article.summary}
                                            </p>
                                        )}

                                        {/* Read More Link */}
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-semibold"
                                        >
                                            Read Full Article
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {!isLoading && !error && news.length > 0 && filteredNews.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">No articles match your filters.</p>
                        </motion.div>
                    )}

                    {/* No News */}
                    {!isLoading && !error && news.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">No news articles available at the moment.</p>
                        </motion.div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}