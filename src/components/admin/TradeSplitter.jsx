import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TradeSplitter({ cryptoPoolBalance, vipPoolBalance }) {
    const queryClient = useQueryClient();
    const [tradeData, setTradeData] = useState({
        pair: '',
        direction: 'long',
        margin: '',
        leverage: '',
        size: '',
        fee: '',
        pnl: ''
    });

    const totalBalance = cryptoPoolBalance + vipPoolBalance;
    const cryptoRatio = totalBalance > 0 ? cryptoPoolBalance / totalBalance : 0;
    const vipRatio = totalBalance > 0 ? vipPoolBalance / totalBalance : 0;

    const cryptoPortion = tradeData.pnl ? parseFloat(tradeData.pnl) * cryptoRatio : 0;
    const vipPortion = tradeData.pnl ? parseFloat(tradeData.pnl) * vipRatio : 0;
    const cryptoFee = tradeData.fee ? parseFloat(tradeData.fee) * cryptoRatio : 0;
    const vipFee = tradeData.fee ? parseFloat(tradeData.fee) * vipRatio : 0;
    const cryptoMargin = tradeData.margin ? parseFloat(tradeData.margin) * cryptoRatio : 0;
    const vipMargin = tradeData.margin ? parseFloat(tradeData.margin) * vipRatio : 0;
    const cryptoSize = tradeData.size ? parseFloat(tradeData.size) * cryptoRatio : 0;
    const vipSize = tradeData.size ? parseFloat(tradeData.size) * vipRatio : 0;

    const createTradesMutation = useMutation({
        mutationFn: async () => {
            const result = cryptoPortion > 0 ? 'win' : 'lose';

            // Create crypto pool trade
            const { error: cryptoError } = await supabase.from('pool_trades').insert({
                pool_type: 'scalping',
                date: new Date().toISOString(),
                pair: tradeData.pair,
                direction: tradeData.direction,
                margin: cryptoMargin,
                leverage: parseFloat(tradeData.leverage),
                size: cryptoSize,
                fee: cryptoFee,
                pnl: cryptoPortion,
                result
            });

            if (cryptoError) throw cryptoError;

            // Create VIP pool trade
            const { error: vipError } = await supabase.from('pool_trades').insert({
                pool_type: 'vip',
                date: new Date().toISOString(),
                pair: tradeData.pair,
                direction: tradeData.direction,
                margin: vipMargin,
                leverage: parseFloat(tradeData.leverage),
                size: vipSize,
                fee: vipFee,
                pnl: vipPortion,
                result
            });

            if (vipError) throw vipError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allPoolsTrades'] });
            queryClient.invalidateQueries({ queryKey: ['trades', 'scalping'] });
            queryClient.invalidateQueries({ queryKey: ['trades', 'vip'] });
            alert('✅ Trades created successfully for both pools!');
            setTradeData({
                pair: '',
                direction: 'long',
                margin: '',
                leverage: '',
                size: '',
                fee: '',
                pnl: ''
            });
        },
        onError: (error) => {
            alert('❌ Failed to create trades: ' + error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!tradeData.pair || !tradeData.margin || !tradeData.leverage || !tradeData.size || !tradeData.fee || !tradeData.pnl) {
            alert('Please fill in all fields');
            return;
        }

        if (totalBalance === 0) {
            alert('No balance in Crypto or VIP pools to split trade');
            return;
        }

        if (confirm(`Create 2 trades:\n\nCrypto Pool: ${cryptoPortion.toFixed(2)} USDT\nVIP Pool: ${vipPortion.toFixed(2)} USDT\n\nContinue?`)) {
            createTradesMutation.mutate();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-[#f5c96a]/30 rounded-2xl p-6"
        >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-[#f5c96a]" />
                Trade Splitter Calculator
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <p className="text-cyan-400 text-sm mb-1">Crypto Pool Balance</p>
                    <p className="text-white text-2xl font-bold">${cryptoPoolBalance.toFixed(2)}</p>
                    <p className="text-cyan-400 text-xs mt-1">{(cryptoRatio * 100).toFixed(2)}% of total</p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-purple-400 text-sm mb-1">VIP Pool Balance</p>
                    <p className="text-white text-2xl font-bold">${vipPoolBalance.toFixed(2)}</p>
                    <p className="text-purple-400 text-xs mt-1">{(vipRatio * 100).toFixed(2)}% of total</p>
                </div>

                <div className="bg-[#f5c96a]/10 border border-[#f5c96a]/30 rounded-xl p-4">
                    <p className="text-[#f5c96a] text-sm mb-1">Total Balance</p>
                    <p className="text-white text-2xl font-bold">${totalBalance.toFixed(2)}</p>
                    <p className="text-[#f5c96a] text-xs mt-1">Combined pools</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Trading Pair</label>
                        <Input
                            placeholder="BTC/USDT"
                            value={tradeData.pair}
                            onChange={(e) => setTradeData({ ...tradeData, pair: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Direction</label>
                        <Select
                            value={tradeData.direction}
                            onValueChange={(value) => setTradeData({ ...tradeData, direction: value })}
                        >
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="long">Long</SelectItem>
                                <SelectItem value="short">Short</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Total Margin (USDT)</label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="1000.00"
                            value={tradeData.margin}
                            onChange={(e) => {
                                const margin = e.target.value;
                                const size = margin && tradeData.leverage ? (parseFloat(margin) * parseFloat(tradeData.leverage)).toFixed(2) : '';
                                setTradeData({ ...tradeData, margin, size });
                            }}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Leverage</label>
                        <Input
                            type="number"
                            step="1"
                            placeholder="10"
                            value={tradeData.leverage}
                            onChange={(e) => {
                                const leverage = e.target.value;
                                const size = tradeData.margin && leverage ? (parseFloat(tradeData.margin) * parseFloat(leverage)).toFixed(2) : '';
                                setTradeData({ ...tradeData, leverage, size });
                            }}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block truncate">Total Size (USDT) - Auto calculated</label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="10000.00"
                            value={tradeData.size}
                            readOnly
                            className="bg-white/5 border-white/10 text-white opacity-75 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Total Fee (USDT)</label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="10.00"
                            value={tradeData.fee}
                            onChange={(e) => setTradeData({ ...tradeData, fee: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Total P&L (USDT) - Positive for profit, Negative for loss</label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="500.00"
                        value={tradeData.pnl}
                        onChange={(e) => setTradeData({ ...tradeData, pnl: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>

                {tradeData.pnl && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid md:grid-cols-2 gap-4"
                    >
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                            <h4 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Crypto Pool Trade
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Margin:</span>
                                    <span className="text-white font-bold">${cryptoMargin.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Size:</span>
                                    <span className="text-white font-bold">${cryptoSize.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Fee:</span>
                                    <span className="text-white font-bold">${cryptoFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-cyan-500/30 pt-2">
                                    <span className="text-gray-400">P&L:</span>
                                    <span className={`font-bold ${cryptoPortion >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${cryptoPortion.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                            <h4 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                VIP Pool Trade
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Margin:</span>
                                    <span className="text-white font-bold">${vipMargin.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Size:</span>
                                    <span className="text-white font-bold">${vipSize.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Fee:</span>
                                    <span className="text-white font-bold">${vipFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-purple-500/30 pt-2">
                                    <span className="text-gray-400">P&L:</span>
                                    <span className={`font-bold ${vipPortion >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${vipPortion.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <Button
                    type="submit"
                    disabled={createTradesMutation.isPending}
                    className="w-full bg-gradient-to-r from-[#f5c96a] to-yellow-600 hover:opacity-90 text-black font-bold"
                >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {createTradesMutation.isPending ? 'Creating Trades...' : 'Create Split Trades'}
                </Button>
            </form>

            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-400 text-xs">
                    <strong>How it works:</strong> Enter the total trade details. The calculator will automatically split margin, size, fee, and P&L proportionally between Crypto Pool ({(cryptoRatio * 100).toFixed(2)}%) and VIP Pool ({(vipRatio * 100).toFixed(2)}%) based on their current balances.
                </p>
            </div>
        </motion.div>
    );
}