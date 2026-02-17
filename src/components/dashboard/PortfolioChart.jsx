import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

const generateData = (days) => {
    const data = [];
    let value = 10000;
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        value = value * (1 + (Math.random() - 0.45) * 0.05);
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(value * 100) / 100
        });
    }
    return data;
};

const timeframes = [
    { label: '24H', days: 1 },
    { label: '7D', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '1Y', days: 365 },
];

export default function PortfolioChart() {
    const [selectedTimeframe, setSelectedTimeframe] = useState('7D');
    const [data] = useState(() => {
        const tf = timeframes.find(t => t.label === selectedTimeframe);
        return generateData(tf.days);
    });

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1f2e] border border-white/10 rounded-lg p-3">
                    <p className="text-white font-semibold">${payload[0].value.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">{payload[0].payload.date}</p>
                </div>
            );
        }
        return null;
    };

    const isPositive = data[data.length - 1]?.value >= data[0]?.value;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                    <h3 className="text-gray-400 text-xs sm:text-sm font-medium mb-1">Portfolio Value</h3>
                    <div className="flex items-baseline gap-2 sm:gap-3">
                        <span className="text-xl sm:text-3xl font-bold text-white">
                            ${data[data.length - 1]?.value.toLocaleString()}
                        </span>
                        <span className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{((data[data.length - 1]?.value / data[0]?.value - 1) * 100).toFixed(2)}%
                        </span>
                    </div>
                </div>

                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {timeframes.map((tf) => (
                        <Button
                            key={tf.label}
                            variant="ghost"
                            size="sm"
                            className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs rounded-md ${
                                selectedTimeframe === tf.label 
                                    ? 'bg-white/10 text-white' 
                                    : 'text-gray-400 hover:text-white hover:bg-transparent'
                            }`}
                            onClick={() => setSelectedTimeframe(tf.label)}
                        >
                            {tf.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis 
                            hide
                            domain={['dataMin - 500', 'dataMax + 500']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? "#22c55e" : "#ef4444"}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}