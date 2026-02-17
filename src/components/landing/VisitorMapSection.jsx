import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import TrafficMap from '../analytics/TrafficMap';

export default function VisitorMapSection() {
    return (
        <section className="relative py-24 px-6">
            <div className="absolute inset-0 bg-black" />
            
            <motion.div 
                className="absolute inset-0"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.08) 0%, transparent 60%)',
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 led-glow-cyan">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 p-0.5">
                                    <div className="w-full h-full rounded-xl bg-[#0a0f1a] flex items-center justify-center">
                                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-2xl font-bold text-white">Global Visitor Activity</h3>
                                    <p className="text-gray-400 text-xs sm:text-sm">Real-time visitor locations</p>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
                                    <span className="text-gray-400">New</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                                    <span className="text-gray-400">Returning</span>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-white/10">
                            <TrafficMap />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}