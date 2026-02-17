import React from 'react';
import { motion } from 'framer-motion';
import { Bitcoin, DollarSign, Globe, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function NewsFilter({ selectedCategory, onCategoryChange, searchQuery, onSearchChange }) {
    const categories = [
        { id: 'all', label: 'All News', icon: Globe, color: 'cyan' },
        { id: 'crypto', label: 'Crypto', icon: Bitcoin, color: 'orange' },
        { id: 'forex', label: 'Forex', icon: DollarSign, color: 'green' },
        { id: 'general', label: 'General', icon: Globe, color: 'blue' }
    ];

    const getColorClasses = (color, isSelected) => {
        const colors = {
            cyan: isSelected 
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500' 
                : 'bg-white/5 text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/50',
            orange: isSelected 
                ? 'bg-orange-500/20 text-orange-400 border-orange-500' 
                : 'bg-white/5 text-gray-400 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/50',
            green: isSelected 
                ? 'bg-green-500/20 text-green-400 border-green-500' 
                : 'bg-white/5 text-gray-400 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/50',
            blue: isSelected 
                ? 'bg-blue-500/20 text-blue-400 border-blue-500' 
                : 'bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/50'
        };
        return colors[color];
    };

    return (
        <div className="mb-8 space-y-4">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 justify-center">
                {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;
                    
                    return (
                        <motion.button
                            key={category.id}
                            onClick={() => onCategoryChange(category.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                                getColorClasses(category.color, isSelected)
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="font-semibold">{category.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Search news by keyword..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-400/50"
                />
            </div>
        </div>
    );
}