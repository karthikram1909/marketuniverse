import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, CheckCircle2, X, Clock, ExternalLink, Copy, Trash2, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NFTSalesPanel() {
    const queryClient = useQueryClient();
    const [processingPayments, setProcessingPayments] = useState(new Set());
    const [editingPrices, setEditingPrices] = useState({});

    // Fetch all NFT sale requests
    const { data: saleRequests = [] } = useQuery({
        queryKey: ['nftSaleRequests'],
        queryFn: async () => {
            const { data } = await supabase.from('nft_sale_requests').select('*').order('created_date', { ascending: false });
            return data || [];
        },
        refetchInterval: 10000
    });

    // Fetch all trophies
    const { data: trophies = [] } = useQuery({
        queryKey: ['trophies'],
        queryFn: async () => {
            const { data } = await supabase.from('trophies').select('*').order('level', { ascending: true });
            return data || [];
        }
    });

    // Mark as paid mutation
    const markAsPaidMutation = useMutation({
        mutationFn: async ({ requestId, notes }) => {
            const { data } = await supabase.from('nft_sale_requests').update({
                status: 'paid',
                paid_date: new Date().toISOString(),
                admin_notes: notes
            }).eq('id', requestId).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nftSaleRequests'] });
            toast.success('NFT sale marked as paid!');
        }
    });

    // Cancel request mutation
    const cancelRequestMutation = useMutation({
        mutationFn: async (requestId) => {
            const { data } = await supabase.from('nft_sale_requests').update({
                status: 'cancelled'
            }).eq('id', requestId).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nftSaleRequests'] });
            toast.success('NFT sale request cancelled');
        }
    });

    // Delete request mutation (permanent)
    const deleteRequestMutation = useMutation({
        mutationFn: async (requestId) => {
            await supabase.from('nft_sale_requests').delete().eq('id', requestId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nftSaleRequests'] });
            toast.success('NFT sale request permanently deleted');
        }
    });

    // Update trophy price mutation
    const updateTrophyPriceMutation = useMutation({
        mutationFn: async ({ trophyId, btcPrice }) => {
            const { data } = await supabase.from('trophies').update({
                btc_sale_price: parseFloat(btcPrice)
            }).eq('id', trophyId).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trophies'] });
            toast.success('Trophy price updated!');
        },
        onError: (error) => {
            toast.error('Failed to update price: ' + error.message);
        }
    });

    const handleMarkAsPaid = async (request) => {
        const notes = prompt('Add payment notes (e.g., TX hash, payment method):');
        if (notes === null) return;

        setProcessingPayments(prev => new Set([...prev, request.id]));
        try {
            await markAsPaidMutation.mutateAsync({ requestId: request.id, notes });
        } finally {
            setProcessingPayments(prev => {
                const newSet = new Set(prev);
                newSet.delete(request.id);
                return newSet;
            });
        }
    };

    const pendingRequests = saleRequests.filter(r => r.status === 'pending');
    const paidRequests = saleRequests.filter(r => r.status === 'paid');
    const cancelledRequests = saleRequests.filter(r => r.status === 'cancelled');

    const handlePriceEdit = (trophyId, currentPrice) => {
        setEditingPrices(prev => ({
            ...prev,
            [trophyId]: currentPrice || 0
        }));
    };

    const handlePriceSave = (trophyId) => {
        const newPrice = editingPrices[trophyId];
        if (newPrice === undefined || newPrice === null || newPrice < 0) {
            toast.error('Invalid price');
            return;
        }
        updateTrophyPriceMutation.mutate({ trophyId, btcPrice: newPrice });
        setEditingPrices(prev => {
            const newState = { ...prev };
            delete newState[trophyId];
            return newState;
        });
    };

    const handlePriceChange = (trophyId, value) => {
        setEditingPrices(prev => ({
            ...prev,
            [trophyId]: value
        }));
    };

    return (
        <div className="space-y-6">
            {/* NFT Marketplace Price Management */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-2xl p-6 led-glow-purple"
            >
                <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="w-7 h-7 text-purple-400" />
                    <div>
                        <h3 className="text-2xl font-bold text-white">💰 NFT Marketplace Prices</h3>
                        <p className="text-gray-300 text-sm">Set BTC sale prices for each trophy level</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-purple-500/30">
                                <th className="text-left py-3 px-4 text-purple-300 font-semibold">Level</th>
                                <th className="text-left py-3 px-4 text-purple-300 font-semibold">God Trophy</th>
                                <th className="text-left py-3 px-4 text-purple-300 font-semibold">Sale Price (BTC)</th>
                                <th className="text-left py-3 px-4 text-purple-300 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trophies.map((trophy) => (
                                <tr key={trophy.id} className="border-b border-purple-500/10 hover:bg-purple-500/5">
                                    <td className="py-3 px-4 text-cyan-400 font-bold">
                                        Level {trophy.level}
                                    </td>
                                    <td className="py-3 px-4 text-yellow-400 font-bold">
                                        {trophy.god_name}
                                    </td>
                                    <td className="py-3 px-4">
                                        {editingPrices[trophy.id] !== undefined ? (
                                            <Input
                                                type="number"
                                                step="0.000001"
                                                value={editingPrices[trophy.id]}
                                                onChange={(e) => handlePriceChange(trophy.id, e.target.value)}
                                                className="w-40 bg-black/40 border-purple-500/50 text-white"
                                                placeholder="Enter BTC price"
                                            />
                                        ) : (
                                            <span className="text-green-400 font-bold text-lg">
                                                {trophy.btc_sale_price ? `${trophy.btc_sale_price.toFixed(6)} BTC` : '❌ Not Set'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        {editingPrices[trophy.id] !== undefined ? (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePriceSave(trophy.id)}
                                                    disabled={updateTrophyPriceMutation.isPending}
                                                    className="bg-green-500 hover:bg-green-600 text-white"
                                                >
                                                    <Save className="w-4 h-4 mr-1" />
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingPrices(prev => {
                                                            const newState = { ...prev };
                                                            delete newState[trophyId];
                                                            return newState;
                                                        });
                                                    }}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handlePriceEdit(trophy.id, trophy.btc_sale_price)}
                                                className="bg-purple-500 hover:bg-purple-600 text-white"
                                            >
                                                <Edit2 className="w-4 h-4 mr-1" />
                                                Edit Price
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Pending Requests - Priority */}
            {pendingRequests.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-2xl p-6 led-glow-orange"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Clock className="w-7 h-7 text-orange-400 animate-pulse" />
                        <div>
                            <h3 className="text-2xl font-bold text-white">⚠️ Pending Payments ({pendingRequests.length})</h3>
                            <p className="text-gray-300 text-sm">These players are waiting for their BTC payment</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pendingRequests.map((request) => (
                            <motion.div
                                key={request.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-black/40 backdrop-blur-sm border border-orange-500/30 rounded-xl p-4"
                            >
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">Player</p>
                                        <p className="text-white font-bold text-lg mb-2">{request.player_name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-gray-300 font-mono text-sm">
                                                {request.wallet_address.slice(0, 10)}...{request.wallet_address.slice(-8)}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(request.wallet_address);
                                                    toast.success('Wallet address copied');
                                                }}
                                                className="text-gray-500 hover:text-white transition-colors"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-gray-400 text-xs mt-2">
                                            Requested: {new Date(request.created_date).toLocaleString()}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-gray-400 text-sm mb-2">Payment Due</p>
                                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-2">
                                            <p className="text-green-400 text-2xl font-bold">
                                                {request.total_btc_value.toFixed(6)} BTC
                                            </p>
                                            <p className="text-gray-300 text-sm">
                                                ≈ ${request.total_usdt_value.toLocaleString()} USDT
                                            </p>
                                        </div>
                                        <p className="text-gray-400 text-xs">
                                            NFTs Sold: {request.nfts_sold.length} (Levels 0-9)
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button
                                        onClick={() => handleMarkAsPaid(request)}
                                        disabled={processingPayments.has(request.id)}
                                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        {processingPayments.has(request.id) ? 'Processing...' : 'Mark as Paid'}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (confirm('Cancel this NFT sale request?')) {
                                                cancelRequestMutation.mutate(request.id);
                                            }
                                        }}
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (confirm('⚠️ PERMANENTLY DELETE this NFT sale request from database?\n\nThis action CANNOT be undone!')) {
                                                deleteRequestMutation.mutate(request.id);
                                            }
                                        }}
                                        className="bg-red-600/30 hover:bg-red-600/40 text-red-300 border border-red-600/60"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* All Requests Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 border border-white/10 rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-purple-400" />
                    All NFT Sale Requests ({saleRequests.length})
                </h3>

                {saleRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No NFT sale requests yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Player</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">NFTs Sold</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">BTC Value</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">USDT Value</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Notes</th>
                                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {saleRequests.map((request) => (
                                    <tr key={request.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-gray-300 text-sm">
                                            {new Date(request.created_date).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-white font-medium">
                                            {request.player_name}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 font-mono text-sm">
                                            <div className="flex items-center gap-2">
                                                <span>{request.wallet_address.slice(0, 6)}...{request.wallet_address.slice(-4)}</span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(request.wallet_address);
                                                        toast.success('Wallet copied');
                                                    }}
                                                    className="text-gray-500 hover:text-white transition-colors"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-purple-400 font-medium">
                                            {request.nfts_sold.length} NFTs
                                        </td>
                                        <td className="py-3 px-4 text-green-400 font-bold">
                                            {request.total_btc_value.toFixed(6)} BTC
                                        </td>
                                        <td className="py-3 px-4 text-cyan-400 font-bold">
                                            ${request.total_usdt_value.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${request.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                                                request.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-400 text-xs max-w-xs truncate">
                                            {request.admin_notes || '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm(`⚠️ PERMANENTLY DELETE request from ${request.player_name}?\n\nThis will remove it from the database forever!\n\nContinue?`)) {
                                                        deleteRequestMutation.mutate(request.id);
                                                    }
                                                }}
                                                disabled={deleteRequestMutation.isPending}
                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Statistics */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Pending Payments</p>
                    <p className="text-orange-400 text-2xl font-bold">{pendingRequests.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Paid Requests</p>
                    <p className="text-green-400 text-2xl font-bold">{paidRequests.length}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Total BTC Owed</p>
                    <p className="text-purple-400 text-2xl font-bold">
                        {pendingRequests.reduce((sum, r) => sum + r.total_btc_value, 0).toFixed(6)} BTC
                    </p>
                </div>
            </div>
        </div>
    );
}