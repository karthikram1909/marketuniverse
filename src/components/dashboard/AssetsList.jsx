import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const assets = [
    { symbol: 'ETH', name: 'Ethereum', balance: '2.4521', value: 7960.23, change: 2.45, icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', balance: '1,250.00', value: 1250.00, change: 0.01, icon: '$' },
    { symbol: 'UNI', name: 'Uniswap', balance: '45.67', value: 412.34, change: -1.23, icon: '🦄' },
    { symbol: 'LINK', name: 'Chainlink', balance: '23.45', value: 328.45, change: 3.45, icon: '⬡' },
    { symbol: 'AAVE', name: 'Aave', balance: '2.34', value: 234.56, change: 1.87, icon: '👻' },
];

export default function AssetsList() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
            <div className="p-4 sm:p-6 border-b border-white/10">
                <h3 className="text-white text-sm sm:text-base font-semibold">Assets</h3>
            </div>

            <div className="divide-y divide-white/5">
                {assets.map((asset, index) => (
                    <motion.div
                        key={asset.symbol}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-center justify-between p-3 sm:p-4 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-base sm:text-xl">
                                {asset.icon}
                            </div>
                            <div>
                                <p className="text-white text-sm sm:text-base font-medium">{asset.symbol}</p>
                                <p className="text-gray-400 text-xs sm:text-sm">{asset.name}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-white text-sm sm:text-base font-medium">${asset.value.toLocaleString()}</p>
                            <div className="flex items-center justify-end gap-1">
                                <span className="text-gray-400 text-xs sm:text-sm">{asset.balance}</span>
                                <span className={`flex items-center text-[10px] sm:text-xs ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {asset.change >= 0 ? <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />}
                                    {Math.abs(asset.change)}%
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}