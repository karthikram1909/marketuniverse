import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, DollarSign, Calendar } from 'lucide-react';
import Pagination from '../common/Pagination';

export default function PaymentHistory({ withdrawals }) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter and sort paid withdrawals
    const paidWithdrawals = withdrawals
        .filter(w => w.status === 'paid')
        .sort((a, b) => new Date(b.paid_date) - new Date(a.paid_date));

    const totalPages = Math.ceil(paidWithdrawals.length / itemsPerPage);
    const paginatedWithdrawals = paidWithdrawals.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (paidWithdrawals.length === 0) {
        return (
            <div className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No payment history yet</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6 led-glow-green"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    Payment History
                </h3>
                <span className="text-gray-400 text-sm">{paidWithdrawals.length} total payments</span>
            </div>

            <div className="space-y-3 mb-6">
                {paginatedWithdrawals.map((withdrawal, index) => (
                    <motion.div
                        key={withdrawal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 hover:bg-green-500/10 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">{withdrawal.name_surname}</p>
                                    <p className="text-gray-400 text-sm">{withdrawal.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-green-400 font-bold text-lg">
                                    {withdrawal.amount.toFixed(2)} {withdrawal.crypto_type || 'USDT'}
                                </p>
                                <span className="text-xs text-gray-400 capitalize">
                                    {withdrawal.pool_type}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(withdrawal.paid_date).toLocaleString()}</span>
                            </div>
                            <span className="text-gray-500 font-mono text-xs">
                                {withdrawal.wallet_address.slice(0, 6)}...{withdrawal.wallet_address.slice(-4)}
                            </span>
                        </div>

                        {withdrawal.admin_notes && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                                <p className="text-gray-400 text-xs">{withdrawal.admin_notes}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </motion.div>
    );
}