import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default function WithdrawalHistory({ walletAddress }) {
    const { data: withdrawals = [] } = useQuery({
        queryKey: ['withdrawals', walletAddress],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*').eq('wallet_address', walletAddress?.toLowerCase());
            return data || [];
        },
        enabled: !!walletAddress
    });

    const sortedWithdrawals = [...withdrawals].sort((a, b) => {
        const dateA = new Date(a.created_date || a.created_at || 0);
        const dateB = new Date(b.created_date || b.created_at || 0);
        return dateB - dateA;
    });

    if (sortedWithdrawals.length === 0) {
        return null;
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-400" />;
            case 'paid':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-400" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'paid':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
        >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                Withdrawal History
            </h3>

            <div className="space-y-3">
                {sortedWithdrawals.map((withdrawal) => (
                    <div
                        key={withdrawal.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(withdrawal.status)} flex items-center gap-2`}>
                                {getStatusIcon(withdrawal.status)}
                                {withdrawal.status.toUpperCase()}
                            </span>
                            <span className="text-gray-400 text-sm">
                                {new Date(withdrawal.created_date || withdrawal.created_at || Date.now()).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-400">Pool:</span>
                                <span className="text-white ml-2 capitalize">{withdrawal.pool_type}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Amount:</span>
                                <span className="text-white ml-2 font-bold">
                                    {withdrawal.amount.toFixed(6)} {withdrawal.crypto_type || 'USDT'}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-400">Address:</span>
                                <span className="text-white ml-2 text-xs break-all">
                                    {withdrawal.payment_address}
                                </span>
                            </div>
                            {withdrawal.admin_notes && (
                                <div className="col-span-2">
                                    <span className="text-gray-400">Admin Note:</span>
                                    <span className="text-white ml-2">{withdrawal.admin_notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}