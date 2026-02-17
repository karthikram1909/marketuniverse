import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../wallet/WalletContext';
import { motion } from 'framer-motion';
import { Coins, Calendar, TrendingUp, Clock, XCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import CancelContractModal from '../staking/CancelContractModal';

const STAKING_PLANS = [
    { months: 3, apy: 0.06, penaltyRate: 0.30 },
    { months: 6, apy: 0.07, penaltyRate: 0.40 },
    { months: 12, apy: 0.08, penaltyRate: 0.50 }
];

export default function StakingContracts() {
    const { account } = useWallet();
    const queryClient = useQueryClient();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [contractToCancel, setContractToCancel] = useState(null);

    const { data: contracts = [], isLoading } = useQuery({
        queryKey: ['stakingContracts', account],
        queryFn: async () => {
            if (!account) return [];
            const { data } = await supabase.from('staking_contracts')
                .select('*')
                .eq('wallet_address', account.toLowerCase())
                .eq('status', 'active');
            return data || [];
        },
        enabled: !!account
    });

    // Fetch staking settings for withdrawal lock check
    const { data: settings } = useQuery({
        queryKey: ['stakingSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('staking_settings').select('*');
            return data?.[0] || null;
        }
    });

    // Cancel contract mutation
    const cancelContractMutation = useMutation({
        mutationFn: async (contract) => {
            const now = new Date();
            const startDate = new Date(contract.start_date);
            const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
            const plan = STAKING_PLANS.find(p => p.months === contract.duration_months);

            let penalty;
            if (daysSinceStart <= 7) {
                // First week: penalty on principal only
                penalty = contract.staked_amount * plan.penaltyRate;
            } else if (daysSinceStart <= 28) {
                // Weeks 2-4: penalty on both principal AND gains
                penalty = (contract.staked_amount + contract.total_earned) * plan.penaltyRate;
            } else {
                // After 4 weeks: penalty on gains only
                penalty = contract.total_earned * plan.penaltyRate;
            }

            const finalValue = contract.staked_amount + contract.total_earned - penalty;


            const { error } = await supabase.from('staking_contracts').update({
                status: 'cancelled',
                cancelled_date: now.toISOString(),
                penalty_paid: penalty,
                current_value: finalValue,
                total_earned: contract.total_earned
            }).eq('id', contract.id);

            if (error) throw error;
            return { id: contract.id };
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['stakingContracts']);
        }
    });

    const CRYPTO_LOGOS = {
        BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
        USDC: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
        XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.png'
    };

    const handleCancelClick = (contract) => {
        setContractToCancel(contract);
        setCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (contractToCancel) {
            await cancelContractMutation.mutateAsync(contractToCancel);
            setCancelModalOpen(false);
            setContractToCancel(null);
        }
    };

    const handleCancelModal = () => {
        setCancelModalOpen(false);
        setContractToCancel(null);
    };

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
            >
                <div className="text-center py-8 text-gray-400">Loading contracts...</div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 overflow-hidden"
            style={{
                boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.1)'
            }}
        >
            <motion.div
                className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-transparent rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, -30, 0],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    >
                        <Coins className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Active Staking</h2>
                        <p className="text-gray-400 text-sm">Your current contracts</p>
                    </div>
                </div>
                <Link to={createPageUrl('Staking')}>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl shadow-lg"
                        >
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="mr-2"
                            >
                                <Coins className="w-4 h-4" />
                            </motion.div>
                            New Contract
                        </Button>
                    </motion.div>
                </Link>
            </div>

            {contracts.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No active staking contracts</p>
                    <Link to={createPageUrl('Staking')}>
                        <Button
                            variant="outline"
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
                        >
                            Start Staking
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {contracts.map((contract) => {
                        const totalDays = differenceInDays(new Date(contract.end_date), new Date(contract.start_date));
                        const daysRemaining = differenceInDays(new Date(contract.end_date), new Date());
                        const daysPassed = totalDays - daysRemaining;
                        const progress = (daysPassed / totalDays) * 100;

                        return (
                            <div
                                key={contract.id}
                                className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/10 p-2">
                                            <img
                                                src={CRYPTO_LOGOS[contract.crypto_type]}
                                                alt={contract.crypto_type}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{contract.crypto_type}</h3>
                                            <p className="text-gray-400 text-sm">{contract.duration_months} months</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">{contract.staked_amount.toFixed(4)}</p>
                                        <p className="text-gray-400 text-sm">{contract.crypto_type}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-3">
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">APY</p>
                                        <p className="text-green-400 font-semibold text-sm">
                                            {(contract.apy_rate * 100).toFixed(2)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Earned</p>
                                        <p className="text-white font-semibold text-sm">
                                            ${contract.total_earned?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Days Left</p>
                                        <p className="text-white font-semibold text-sm flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {daysRemaining}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Progress</span>
                                        <span>{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Ends {format(new Date(contract.end_date), 'MMM dd, yyyy')}
                                            </p>
                                            {contract.tx_hash && (
                                                <a
                                                    href={`https://bscscan.com/tx/${contract.tx_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-cyan-400 text-xs hover:underline"
                                                >
                                                    View TX
                                                </a>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleCancelClick(contract)}
                                            disabled={cancelContractMutation.isLoading || settings?.withdrawals_locked}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-7 px-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            {settings?.withdrawals_locked ? 'Locked' : 'Cancel'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {contracts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Total Staked Value</span>
                        <span className="font-bold text-white">
                            ${contracts.reduce((sum, c) => sum + (c.current_value || c.staked_amount), 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            {/* Cancel Contract Modal */}
            <CancelContractModal
                contract={contractToCancel}
                plan={contractToCancel ? STAKING_PLANS.find(p => p.months === contractToCancel.duration_months) : null}
                onConfirm={handleConfirmCancel}
                onCancel={handleCancelModal}
                isOpen={cancelModalOpen}
            />
        </motion.div>
    );
}