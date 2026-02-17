import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const actions = [
    { icon: ArrowUpRight, label: 'Send', color: 'from-blue-500 to-cyan-500' },
    { icon: ArrowDownLeft, label: 'Receive', color: 'from-green-500 to-emerald-500' },
    { icon: RefreshCw, label: 'Swap', color: 'from-purple-500 to-pink-500' },
    { icon: PlusCircle, label: 'Buy', color: 'from-orange-500 to-amber-500' },
];

export default function QuickActions() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6"
        >
            <h3 className="text-white text-sm sm:text-base font-semibold mb-3 sm:mb-4">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {actions.map((action, index) => (
                    <motion.div
                        key={action.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                    >
                        <Button
                            variant="ghost"
                            className="w-full h-auto flex flex-col items-center gap-1 sm:gap-2 py-2 sm:py-4 hover:bg-white/5"
                        >
                            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${action.color} p-0.5`}>
                                <div className="w-full h-full rounded-lg sm:rounded-xl bg-[#0a0f1a] flex items-center justify-center">
                                    <action.icon className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                                </div>
                            </div>
                            <span className="text-gray-400 text-[10px] sm:text-sm">{action.label}</span>
                        </Button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}