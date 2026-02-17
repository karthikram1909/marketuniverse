import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { FileText, Download, Calendar, DollarSign, TrendingUp, Receipt, Briefcase, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';

export default function TaxReportModal({ isOpen, onClose, walletAddress }) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [user, setUser] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    React.useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                    setUser({ ...user, ...profile });
                }
            } catch (error) {
                console.log('User not authenticated');
            }
        };
        loadUser();
    }, []);

    // Fetch all data
    const { data: scalpingInvestor } = useQuery({
        queryKey: ['investor', 'scalping', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*').eq('pool_type', 'scalping').eq('wallet_address', walletAddress?.toLowerCase());
            return data?.[0] || null;
        },
        enabled: !!walletAddress
    });

    const { data: vipInvestor } = useQuery({
        queryKey: ['investor', 'vip', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*').eq('pool_type', 'vip').eq('wallet_address', walletAddress?.toLowerCase());
            return data?.[0] || null;
        },
        enabled: !!walletAddress
    });

    const { data: traditionalInvestor } = useQuery({
        queryKey: ['investor', 'traditional', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('pool_investors').select('*').eq('pool_type', 'traditional').eq('wallet_address', walletAddress?.toLowerCase());
            return data?.[0] || null;
        },
        enabled: !!walletAddress
    });

    const { data: scalpingTrades = [] } = useQuery({
        queryKey: ['trades', 'scalping'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*').eq('pool_type', 'scalping');
            return data || [];
        },
        enabled: !!walletAddress
    });

    const { data: vipTrades = [] } = useQuery({
        queryKey: ['trades', 'vip'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*').eq('pool_type', 'vip');
            return data || [];
        },
        enabled: !!walletAddress
    });

    const { data: traditionalTrades = [] } = useQuery({
        queryKey: ['trades', 'traditional'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_trades').select('*').eq('pool_type', 'traditional');
            return data || [];
        },
        enabled: !!walletAddress
    });

    const { data: scalpingSettings } = useQuery({
        queryKey: ['poolSettings', 'scalping'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', 'scalping');
            return data?.[0] || { profit_share_rate: 0 };
        }
    });

    const { data: vipSettings } = useQuery({
        queryKey: ['poolSettings', 'vip'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', 'vip');
            return data?.[0] || { profit_share_rate: 0.20 };
        }
    });

    const { data: traditionalSettings } = useQuery({
        queryKey: ['poolSettings', 'traditional'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', 'traditional');
            return data?.[0] || { profit_share_rate: 0.20 };
        }
    });

    const { data: stakingContracts = [] } = useQuery({
        queryKey: ['stakingContracts', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('staking_contracts').select('*').eq('wallet_address', walletAddress?.toLowerCase());
            return data || [];
        },
        enabled: !!walletAddress
    });

    const { data: withdrawals = [] } = useQuery({
        queryKey: ['withdrawals', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*').eq('wallet_address', walletAddress?.toLowerCase());
            return data || [];
        },
        enabled: !!walletAddress
    });

    const { data: games = [] } = useQuery({
        queryKey: ['games', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('deal_or_no_deal_games').select('*').eq('wallet_address', walletAddress?.toLowerCase());
            return data || [];
        },
        enabled: !!walletAddress
    });

    const { data: profile } = useQuery({
        queryKey: ['profile', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('player_profiles').select('*').eq('wallet_address', walletAddress?.toLowerCase());
            return data?.[0] || null;
        },
        enabled: !!walletAddress
    });

    const calculatePoolStats = (investor, trades, settings) => {
        if (!investor) return null;

        const totalInvested = investor.invested_amount || 0;
        const grossPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalFees = trades.reduce((sum, t) => sum + (t.fee || 0), 0);

        const profitShare = trades.reduce((sum, t) => {
            const cleanPnl = (t.pnl || 0) - (t.fee || 0);
            if (cleanPnl > 0) {
                return sum + (cleanPnl * (settings?.profit_share_rate || 0));
            }
            return sum;
        }, 0);

        const netPnl = grossPnl - totalFees - profitShare;

        return { totalInvested, grossPnl, totalFees, profitShare, netPnl };
    };

    const cryptoStats = calculatePoolStats(scalpingInvestor, scalpingTrades, scalpingSettings);
    const vipStats = calculatePoolStats(vipInvestor, vipTrades, vipSettings);
    const traditionalStats = calculatePoolStats(traditionalInvestor, traditionalTrades, traditionalSettings);

    // Filter data by selected year
    const filterByYear = (items, dateField) => {
        return items.filter(item => {
            const date = new Date(item[dateField]);
            return date.getFullYear() === selectedYear;
        });
    };

    const yearDeposits = {
        crypto: scalpingInvestor?.deposit_transactions?.filter(d => new Date(d.date).getFullYear() === selectedYear) || [],
        vip: vipInvestor?.deposit_transactions?.filter(d => new Date(d.date).getFullYear() === selectedYear) || [],
        traditional: traditionalInvestor?.deposit_transactions?.filter(d => new Date(d.date).getFullYear() === selectedYear) || []
    };

    const yearWithdrawals = filterByYear(withdrawals.filter(w => w.status === 'paid'), 'paid_date');
    const yearStakingContracts = filterByYear(stakingContracts, 'start_date');
    const yearGames = filterByYear(games, 'created_date');

    const downloadPDF = () => {
        setIsGenerating(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;

            // Header
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('MarketsUniverse', pageWidth / 2, yPos, { align: 'center' });

            yPos += 10;
            doc.setFontSize(16);
            doc.text('Annual Financial Report', pageWidth / 2, yPos, { align: 'center' });

            yPos += 10;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Report Period: ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
            doc.text(`Generated: ${format(new Date(), 'PPP p')}`, pageWidth / 2, yPos, { align: 'center' });

            yPos += 10;
            doc.text(`User: ${user?.full_name || user?.email || 'N/A'}`, 15, yPos);
            yPos += 5;
            doc.text(`Wallet: ${walletAddress}`, 15, yPos);

            yPos += 15;

            // Pool Investments
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Pool Investments', 15, yPos);
            yPos += 8;

            [
                { name: 'Crypto Pool (Scalping)', stats: cryptoStats, deposits: yearDeposits.crypto },
                { name: 'VIP Pool', stats: vipStats, deposits: yearDeposits.vip },
                { name: 'Traditional Pool', stats: traditionalStats, deposits: yearDeposits.traditional }
            ].forEach(pool => {
                if (!pool.stats) return;

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text(pool.name, 15, yPos);
                yPos += 6;

                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                const lines = [
                    `Total Invested: $${pool.stats.totalInvested.toFixed(2)}`,
                    `Gross PNL: $${pool.stats.grossPnl.toFixed(2)}`,
                    `Trading Fees: $${pool.stats.totalFees.toFixed(2)}`,
                    `Profit Share: $${pool.stats.profitShare.toFixed(2)}`,
                    `Net PNL: $${pool.stats.netPnl.toFixed(2)}`
                ];

                lines.forEach(line => {
                    doc.text(line, 20, yPos);
                    yPos += 4;
                });

                if (pool.deposits.length > 0) {
                    yPos += 2;
                    doc.setFont(undefined, 'bold');
                    doc.text('Deposits:', 20, yPos);
                    yPos += 4;
                    doc.setFont(undefined, 'normal');
                    pool.deposits.forEach(d => {
                        doc.text(`  $${d.amount.toFixed(2)} - ${format(new Date(d.date), 'PPP p')}`, 20, yPos);
                        yPos += 4;
                    });
                }

                yPos += 6;
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }
            });

            // Staking Contracts
            if (yearStakingContracts.length > 0) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Staking Contracts', 15, yPos);
                yPos += 8;

                yearStakingContracts.forEach((contract, idx) => {
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text(`${contract.crypto_type} Staking - ${contract.status.toUpperCase()}`, 15, yPos);
                    yPos += 5;

                    doc.setFontSize(9);
                    doc.setFont(undefined, 'normal');
                    doc.text(`Started: ${format(new Date(contract.start_date), 'PPP p')}`, 20, yPos);
                    yPos += 4;
                    doc.text(`Staked: ${contract.staked_amount.toFixed(6)} ${contract.crypto_type}`, 20, yPos);
                    yPos += 4;
                    doc.text(`Current Value: ${contract.current_value.toFixed(6)} ${contract.crypto_type}`, 20, yPos);
                    yPos += 4;
                    doc.text(`Earned: +${contract.total_earned.toFixed(6)} ${contract.crypto_type}`, 20, yPos);
                    yPos += 4;
                    doc.text(`APY: ${(contract.apy_rate * 100).toFixed(2)}%`, 20, yPos);
                    yPos += 6;

                    if (yPos > 260) {
                        doc.addPage();
                        yPos = 20;
                    }
                });
            }

            // Deal or No Deal
            if (yearGames.length > 0) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Deal or No Deal', 15, yPos);
                yPos += 8;

                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.text(`Games Played: ${yearGames.length}`, 20, yPos);
                yPos += 4;
                doc.text(`Total Entry Fees: $${yearGames.reduce((s, g) => s + (g.entry_fee || 0), 0).toFixed(2)}`, 20, yPos);
                yPos += 4;
                doc.text(`XP Points Earned: ${yearGames.reduce((s, g) => s + (g.xp_earned || 0), 0).toLocaleString()} XP`, 20, yPos);
                yPos += 8;

                yearGames.forEach(game => {
                    doc.text(`${format(new Date(game.created_date), 'PPP p')} - Entry: $${game.entry_fee.toFixed(2)}, Won: ${game.xp_earned || 0} XP`, 20, yPos);
                    yPos += 4;
                });
                yPos += 6;
            }

            // Withdrawals
            if (yearWithdrawals.length > 0) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Withdrawals', 15, yPos);
                yPos += 8;

                yearWithdrawals.forEach(w => {
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'normal');
                    doc.text(`${w.pool_type.charAt(0).toUpperCase() + w.pool_type.slice(1)} - $${w.amount.toFixed(2)} - ${format(new Date(w.paid_date), 'PPP p')}`, 20, yPos);
                    yPos += 4;
                });
                yPos += 4;
                doc.setFont(undefined, 'bold');
                doc.text(`Total Withdrawn: $${yearWithdrawals.reduce((s, w) => s + w.amount, 0).toFixed(2)}`, 20, yPos);
            }

            // Footer
            yPos = doc.internal.pageSize.getHeight() - 20;
            doc.setFontSize(8);
            doc.setFont(undefined, 'italic');
            doc.text('This report is for informational purposes only. Consult a tax professional for accurate filing.', pageWidth / 2, yPos, { align: 'center' });

            doc.save(`Tax_Report_${selectedYear}_${walletAddress.slice(0, 8)}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#1f2937] to-[#0f172a] border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        Annual Tax Report
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-bold text-white mb-2">MarketsUniverse</h2>
                            <p className="text-gray-400">Annual Financial Report</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                            <div>
                                <p className="text-sm text-gray-400">Report Period</p>
                                <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                                    <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026].map(year => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">User</p>
                                <p className="text-white font-mono">{user?.full_name || user?.email || 'N/A'}</p>
                                <p className="text-xs text-gray-500 font-mono">{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Generated</p>
                                <p className="text-white">{format(new Date(), 'PPP')}</p>
                            </div>
                            <div>
                                <Button
                                    onClick={downloadPDF}
                                    disabled={isGenerating}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Pool Investments */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-cyan-400" />
                            Pool Investments
                        </h3>

                        {[
                            { name: 'Crypto Pool (Scalping)', stats: cryptoStats, deposits: yearDeposits.crypto, color: 'from-red-500/20 to-pink-500/20 border-red-500/30' },
                            { name: 'VIP Pool', stats: vipStats, deposits: yearDeposits.vip, color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
                            { name: 'Traditional Pool', stats: traditionalStats, deposits: yearDeposits.traditional, color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' }
                        ].map((pool, idx) => pool.stats && (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`bg-gradient-to-br ${pool.color} border rounded-xl p-4`}
                            >
                                <h4 className="text-lg font-bold text-white mb-3">{pool.name}</h4>
                                <div className="grid md:grid-cols-5 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-400">Total Invested</p>
                                        <p className="text-white font-bold">${pool.stats.totalInvested.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Gross PNL</p>
                                        <p className={`font-bold ${pool.stats.grossPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${pool.stats.grossPnl.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Trading Fees</p>
                                        <p className="text-orange-400 font-bold">${pool.stats.totalFees.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Profit Share</p>
                                        <p className="text-yellow-400 font-bold">${pool.stats.profitShare.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Net PNL</p>
                                        <p className={`font-bold ${pool.stats.netPnl >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                            ${pool.stats.netPnl.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                {pool.deposits.length > 0 && (
                                    <div className="border-t border-white/10 pt-3">
                                        <p className="text-xs text-gray-400 mb-2">Deposits in {selectedYear}</p>
                                        <div className="space-y-1">
                                            {pool.deposits.map((deposit, i) => (
                                                <div key={i} className="flex justify-between text-xs bg-white/5 rounded p-2">
                                                    <span className="text-gray-400">{format(new Date(deposit.date), 'PPP p')}</span>
                                                    <span className="text-white font-bold">${deposit.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Staking Contracts */}
                    {yearStakingContracts.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-purple-400" />
                                Staking Contracts
                            </h3>
                            {yearStakingContracts.map((contract, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-white font-bold">{contract.crypto_type} Staking</p>
                                            <p className="text-xs text-gray-400">Started: {format(new Date(contract.start_date), 'PPP p')}</p>
                                            {contract.end_date && (
                                                <p className="text-xs text-gray-400">Ends: {format(new Date(contract.end_date), 'PPP p')}</p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs ${contract.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                            contract.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {contract.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Staked Amount</p>
                                            <p className="text-white font-bold">{contract.staked_amount.toFixed(6)} {contract.crypto_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Current Value</p>
                                            <p className="text-white font-bold">{contract.current_value.toFixed(6)} {contract.crypto_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Total Earned</p>
                                            <p className="text-green-400 font-bold">+{contract.total_earned.toFixed(6)} {contract.crypto_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">APY Rate</p>
                                            <p className="text-cyan-400 font-bold">{(contract.apy_rate * 100).toFixed(2)}%</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Deal or No Deal Games */}
                    {yearGames.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-yellow-400" />
                                Deal or No Deal Activity
                            </h3>
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4">
                                <div className="grid md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-400">Games Played</p>
                                        <p className="text-white font-bold">{yearGames.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Total Entry Fees</p>
                                        <p className="text-white font-bold">${yearGames.reduce((sum, g) => sum + (g.entry_fee || 0), 0).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">XP Points Earned</p>
                                        <p className="text-green-400 font-bold">{yearGames.reduce((sum, g) => sum + (g.xp_earned || 0), 0).toLocaleString()} XP</p>
                                    </div>
                                </div>
                                <div className="border-t border-white/10 pt-3">
                                    <p className="text-xs text-gray-400 mb-2">Game History</p>
                                    <div className="space-y-1">
                                        {yearGames.map((game, i) => (
                                            <div key={i} className="flex justify-between text-xs bg-white/5 rounded p-2">
                                                <span className="text-gray-400">{format(new Date(game.created_date), 'PPP p')}</span>
                                                <span className="text-white">Entry: ${game.entry_fee.toFixed(2)}</span>
                                                <span className="text-green-400 font-bold">
                                                    Won: {game.xp_earned || 0} XP
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Withdrawals */}
                    {yearWithdrawals.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-green-400" />
                                Withdrawals
                            </h3>
                            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                                <div className="space-y-2">
                                    {yearWithdrawals.map((withdrawal, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm bg-white/5 rounded p-3">
                                            <div>
                                                <p className="text-white font-semibold">{withdrawal.pool_type.charAt(0).toUpperCase() + withdrawal.pool_type.slice(1)} Pool</p>
                                                <p className="text-xs text-gray-400">{format(new Date(withdrawal.paid_date), 'PPP p')}</p>
                                            </div>
                                            <p className="text-green-400 font-bold">${withdrawal.amount.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-white/10 pt-3 mt-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Withdrawn</span>
                                        <span className="text-green-400 font-bold text-lg">
                                            ${yearWithdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Financial Summary</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-400 text-sm">Total Pool Investments</p>
                                <p className="text-white font-bold text-2xl">
                                    ${[(cryptoStats?.totalInvested || 0), (vipStats?.totalInvested || 0), (traditionalStats?.totalInvested || 0)]
                                        .reduce((sum, val) => sum + val, 0).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Net Pool Income</p>
                                <p className={`font-bold text-2xl ${[(cryptoStats?.netPnl || 0), (vipStats?.netPnl || 0), (traditionalStats?.netPnl || 0)]
                                    .reduce((sum, val) => sum + val, 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    ${[(cryptoStats?.netPnl || 0), (vipStats?.netPnl || 0), (traditionalStats?.netPnl || 0)]
                                        .reduce((sum, val) => sum + val, 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 pt-4 border-t border-white/10">
                        <p>This report is generated for informational purposes only and should not be considered as financial advice.</p>
                        <p className="mt-1">Please consult with a tax professional for accurate tax filing.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}