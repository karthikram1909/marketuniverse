import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import {
    DollarSign, CheckCircle, XCircle, Clock,
    Copy, AlertCircle, Trash2
} from 'lucide-react';
import ConfirmPaymentModal from './ConfirmPaymentModal';
import Pagination from '../common/Pagination';

export default function WithdrawalManagement({ poolType }) {
    const queryClient = useQueryClient();
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, withdrawal: null });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch withdrawals for this pool
    const { data: withdrawals = [], isPending } = useQuery({
        queryKey: ['withdrawals', poolType],
        queryFn: async () => {
            const { data } = await supabase.from('withdrawal_requests').select('*').eq('pool_type', poolType);
            return data || [];
        },
        refetchInterval: 10000,
        refetchOnMount: true
    });

    // Update withdrawal status mutation
    // Delete withdrawal mutation
    const deleteWithdrawalMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('withdrawal_requests').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
        }
    });

    const updateWithdrawalMutation = useMutation({
        mutationFn: async ({ id, status, notes, withdrawal, txHash }) => {
            // Create notifications when marking as paid
            if (status === 'paid') {
                const cryptoLabel = withdrawal.crypto_type || 'USDT';
                const paidAmount = withdrawal.net_amount || withdrawal.amount;

                let userNotifType, adminNotifType, poolName;

                if (withdrawal.pool_type === 'vip') {
                    userNotifType = 'vip_withdrawal';
                    adminNotifType = 'admin_vip_withdrawal';
                    poolName = 'VIP Pool';
                } else if (withdrawal.pool_type === 'traditional') {
                    userNotifType = 'traditional_withdrawal';
                    adminNotifType = 'admin_traditional_withdrawal';
                    poolName = 'Traditional Pool';
                } else if (withdrawal.pool_type === 'scalping') {
                    userNotifType = 'crypto_withdrawal';
                    adminNotifType = 'admin_crypto_withdrawal';
                    poolName = 'Crypto Pool';
                } else if (withdrawal.pool_type === 'staking') {
                    userNotifType = 'staking_withdrawal';
                    adminNotifType = 'admin_staking_withdrawal';
                    poolName = 'Staking';
                }

                // Deduct from investor balance
                const { data: currentInvestor, error: fetchError } = await supabase
                    .from('pool_investors')
                    .select('invested_amount')
                    .eq('wallet_address', withdrawal.wallet_address)
                    .eq('pool_type', withdrawal.pool_type)
                    .single();

                if (currentInvestor && !fetchError) {
                    const newBalance = Math.max(0, (currentInvestor.invested_amount || 0) - withdrawal.amount);
                    await supabase
                        .from('pool_investors')
                        .update({ invested_amount: newBalance })
                        .eq('wallet_address', withdrawal.wallet_address)
                        .eq('pool_type', withdrawal.pool_type);
                }

                await supabase.from('notifications').insert([
                    {
                        wallet_address: withdrawal.wallet_address,
                        email: withdrawal.email,
                        type: userNotifType,
                        title: `${poolName} Withdrawal Payment Sent`,
                        message: `Your withdrawal of ${paidAmount} ${cryptoLabel} has been paid! ${txHash ? `TX: ${txHash}` : ''}`,
                        amount: paidAmount,
                        read: false,
                        is_admin: false
                    },
                    {
                        wallet_address: withdrawal.wallet_address,
                        email: withdrawal.email,
                        type: adminNotifType,
                        title: `${poolName} Withdrawal Payment Confirmed`,
                        message: `Payment of ${paidAmount} ${cryptoLabel} has been confirmed for ${withdrawal.name_surname}. ${txHash ? `TX: ${txHash}` : ''}`,
                        amount: paidAmount,
                        read: false,
                        is_admin: true
                    }
                ]);
            }

            const updateData = {
                status: status,
                admin_notes: notes,
                tx_hash: txHash
            };

            if (status === 'paid') {
                updateData.paid_date = new Date().toISOString();
            }

            const { data, error } = await supabase.from('withdrawal_requests').update(updateData).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setSelectedWithdrawal(null);
            setAdminNotes('');
        }
    });

    const handleApprove = (withdrawal) => {
        setConfirmModal({ isOpen: true, withdrawal });
    };

    const handleConfirmPayment = (txHash) => {
        updateWithdrawalMutation.mutate({
            id: confirmModal.withdrawal.id,
            status: 'paid',
            notes: adminNotes || 'Payment completed',
            withdrawal: confirmModal.withdrawal,
            txHash: txHash
        });
        setConfirmModal({ isOpen: false, withdrawal: null });
    };

    const handleReject = (withdrawal) => {
        const reason = window.prompt('Enter rejection reason:');
        if (reason) {
            updateWithdrawalMutation.mutate({
                id: withdrawal.id,
                status: 'rejected',
                notes: reason,
                withdrawal: withdrawal
            });
        }
    };

    const handleDelete = (withdrawal) => {
        if (window.confirm(`Are you sure you want to delete this withdrawal request for ${withdrawal.amount} ${withdrawal.crypto_type || 'USDT'}?`)) {
            deleteWithdrawalMutation.mutate(withdrawal.id);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const sortedWithdrawals = [...withdrawals].sort((a, b) => {
        // Pending first
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        // Then by date
        return new Date(b.created_date || b.created_at || 0) - new Date(a.created_date || a.created_at || 0);
    });

    const totalPages = Math.ceil(sortedWithdrawals.length / itemsPerPage);
    const paginatedWithdrawals = sortedWithdrawals.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-400" />;
            case 'paid':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-400" />;
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

    if (sortedWithdrawals.length === 0) {
        return (
            <div className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6 text-center">
                <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No withdrawal requests</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    Withdrawal Requests
                </h3>
                {pendingCount > 0 && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold">
                        {pendingCount} Pending
                    </span>
                )}
            </div>

            <div className="space-y-4 mb-6">
                {paginatedWithdrawals.map((withdrawal) => (
                    <div
                        key={withdrawal.id}
                        className={`border rounded-xl p-4 ${withdrawal.status === 'pending'
                            ? 'bg-yellow-500/5 border-yellow-500/30'
                            : 'bg-white/5 border-white/10'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${getStatusColor(withdrawal.status)}`}>
                                {getStatusIcon(withdrawal.status)}
                                {withdrawal.status.toUpperCase()}
                            </span>
                            <span className="text-gray-400 text-sm">
                                {new Date(withdrawal.created_date || withdrawal.created_at || Date.now()).toLocaleString()}
                            </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">User</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold">{withdrawal.name_surname}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-gray-400 text-sm">{withdrawal.email}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Wallet</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-white text-sm font-mono">
                                        {withdrawal.wallet_address.slice(0, 10)}...{withdrawal.wallet_address.slice(-8)}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(withdrawal.wallet_address)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Amount</label>
                                <div className="flex flex-col">
                                    <span className="text-white text-lg font-bold">
                                        {withdrawal.amount.toFixed(2)} {withdrawal.crypto_type || 'USDT'}
                                    </span>
                                    {withdrawal.penalty_amount > 0 && (
                                        <span className="text-red-400 text-xs font-medium">
                                            Penalty: -{withdrawal.penalty_amount.toFixed(2)}
                                        </span>
                                    )}
                                    {withdrawal.net_amount && (
                                        <span className="text-green-400 text-sm font-bold border-t border-white/5 mt-1 pt-1">
                                            Net to Pay: {withdrawal.net_amount.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1">
                                    Pool Balance at request: {withdrawal.user_balance_at_request?.toFixed(2) || 'N/A'}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Payment Address (BEP-20)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-white text-sm font-mono break-all">
                                        {withdrawal.payment_address}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(withdrawal.payment_address)}
                                        className="text-gray-400 hover:text-white flex-shrink-0"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Admin Notes */}
                        {withdrawal.admin_notes && (
                            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <label className="text-xs text-gray-400 mb-1 block">Admin Notes</label>
                                <p className="text-white text-sm">{withdrawal.admin_notes}</p>
                            </div>
                        )}

                        {withdrawal.paid_date && (
                            <div className="mb-4 text-sm text-gray-400">
                                Paid on: {new Date(withdrawal.paid_date).toLocaleString()} (local time)
                            </div>
                        )}

                        {/* Actions */}
                        {withdrawal.status === 'pending' && (
                            <div className="space-y-3">
                                <Textarea
                                    placeholder="Add admin notes (optional)"
                                    value={selectedWithdrawal?.id === withdrawal.id ? adminNotes : ''}
                                    onChange={(e) => {
                                        setSelectedWithdrawal(withdrawal);
                                        setAdminNotes(e.target.value);
                                    }}
                                    className="bg-white/5 border-white/10 text-white"
                                    rows={2}
                                />
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => handleApprove(withdrawal)}
                                        disabled={updateWithdrawalMutation.isPending || deleteWithdrawalMutation.isPending}
                                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-xl"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark as Paid
                                    </Button>
                                    <Button
                                        onClick={() => handleReject(withdrawal)}
                                        disabled={updateWithdrawalMutation.isPending || deleteWithdrawalMutation.isPending}
                                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-xl"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(withdrawal)}
                                        disabled={updateWithdrawalMutation.isPending || deleteWithdrawalMutation.isPending}
                                        className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border border-gray-500/50 rounded-xl"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300">
                        Review withdrawal details carefully before marking as paid.
                        Make sure the payment has been sent to the correct BEP-20 address.
                    </p>
                </div>
            </div>

            {/* Confirm Payment Modal */}
            <ConfirmPaymentModal
                isOpen={confirmModal.isOpen}
                withdrawal={confirmModal.withdrawal}
                onConfirm={handleConfirmPayment}
                onCancel={() => setConfirmModal({ isOpen: false, withdrawal: null })}
                isLoading={updateWithdrawalMutation.isPending}
            />
        </motion.div>
    );
}