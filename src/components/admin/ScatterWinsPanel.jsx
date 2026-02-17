import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, CheckCircle2, DollarSign, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ScatterWinsPanel() {
    const queryClient = useQueryClient();
    const [processingPayments, setProcessingPayments] = useState(new Set());
    const [consecutiveWins, setConsecutiveWins] = useState(3);

    const { data: scatterWins = [] } = useQuery({
        queryKey: ['scatterWins'],
        queryFn: async () => {
            const { data } = await supabase.from('scatter_wins').select('*').order('created_date', { ascending: false }).limit(1000);
            return data || [];
        },
        refetchInterval: 30000
    });

    const { data: gameSettings } = useQuery({
        queryKey: ['gameSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('game_settings').select('*').eq('game_type', 'dealornodeal');
            return data?.[0] || { scatter_consecutive_wins: 3 };
        }
    });

    React.useEffect(() => {
        if (gameSettings?.scatter_consecutive_wins) {
            setConsecutiveWins(gameSettings.scatter_consecutive_wins);
        }
    }, [gameSettings]);

    const markAsPaidMutation = useMutation({
        mutationFn: async (winId) => {
            const { data } = await supabase.from('scatter_wins').update({
                status: 'paid',
                paid_date: new Date().toISOString()
            }).eq('id', winId).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scatterWins'] });
            toast.success('Scatter payment marked as paid');
        }
    });

    const deleteScatterMutation = useMutation({
        mutationFn: async (winId) => {
            await supabase.from('scatter_wins').delete().eq('id', winId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scatterWins'] });
            toast.success('Scatter payment deleted permanently');
        }
    });

    const updateConsecutiveWinsMutation = useMutation({
        mutationFn: async (value) => {
            if (!gameSettings?.id) {
                const { data } = await supabase.from('game_settings').insert({
                    game_type: 'dealornodeal',
                    scatter_consecutive_wins: value,
                    purchases_locked: false
                }).select().single();
                return data;
            }
            const { data } = await supabase.from('game_settings').update({
                scatter_consecutive_wins: value
            }).eq('id', gameSettings.id).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gameSettings'] });
            toast.success(`Scatter trigger updated! Now requires ${consecutiveWins} consecutive $1M wins.`);
        },
        onError: (error) => {
            toast.error('Failed to update: ' + error.message);
        }
    });

    const handleMarkAsPaid = (win) => {
        if (!confirm(`Mark scatter payment of $${win.total_winnings.toFixed(2)} to ${win.player_name} as paid?`)) {
            return;
        }

        setProcessingPayments(prev => new Set([...prev, win.id]));
        markAsPaidMutation.mutate(win.id, {
            onSettled: () => {
                setProcessingPayments(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(win.id);
                    return newSet;
                });
            }
        });
    };

    const handleDeleteScatter = (win) => {
        if (!confirm(`⚠️ PERMANENTLY DELETE scatter payment of $${win.total_winnings.toFixed(2)} to ${win.player_name}?\n\nThis action CANNOT be undone!`)) {
            return;
        }

        setProcessingPayments(prev => new Set([...prev, win.id]));
        deleteScatterMutation.mutate(win.id, {
            onSettled: () => {
                setProcessingPayments(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(win.id);
                    return newSet;
                });
            }
        });
    };

    const pendingWins = scatterWins.filter(w => w.status === 'pending');
    const paidWins = scatterWins.filter(w => w.status === 'paid');

    const totalPending = pendingWins.reduce((sum, w) => sum + w.total_winnings, 0);
    const totalPaid = paidWins.reduce((sum, w) => sum + w.total_winnings, 0);

    return (
        <div className="space-y-6">
            {/* Scatter Settings */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-xl font-bold text-white">Scatter Trigger Settings</h3>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-gray-400 text-sm mb-2 block">
                            Consecutive $1M Wins Required to Trigger Scatter
                        </label>
                        <Input
                            type="number"
                            min="1"
                            max="10"
                            value={consecutiveWins}
                            onChange={(e) => setConsecutiveWins(parseInt(e.target.value) || 1)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <Button
                        onClick={() => updateConsecutiveWinsMutation.mutate(consecutiveWins)}
                        disabled={updateConsecutiveWinsMutation.isPending || consecutiveWins === gameSettings?.scatter_consecutive_wins}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 mt-6"
                    >
                        {updateConsecutiveWinsMutation.isPending ? 'Saving...' : 'Update'}
                    </Button>
                </div>
                <p className="text-gray-400 text-xs mt-3">
                    Currently set to: <span className="text-cyan-400 font-bold">{gameSettings?.scatter_consecutive_wins || 3}</span> consecutive $1,000,000 wins
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-gray-400 text-sm">Pending Payments</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{pendingWins.length}</div>
                    <div className="text-yellow-400 text-sm">${totalPending.toFixed(2)}</div>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="text-gray-400 text-sm">Paid</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{paidWins.length}</div>
                    <div className="text-green-400 text-sm">${totalPaid.toFixed(2)}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-purple-400" />
                        <span className="text-gray-400 text-sm">Total Scatter Wins</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{scatterWins.length}</div>
                    <div className="text-purple-400 text-sm">${(totalPending + totalPaid).toFixed(2)}</div>
                </div>
            </div>

            {/* Pending Payments */}
            {pendingWins.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        Pending Scatter Payments ({pendingWins.length})
                    </h3>

                    <div className="space-y-4">
                        {pendingWins.map((win) => (
                            <div
                                key={win.id}
                                className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/30 rounded-xl p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-white font-bold text-lg">{win.player_name}</span>
                                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold">
                                                PENDING
                                            </span>
                                        </div>
                                        <div className="text-gray-400 text-sm font-mono mb-1">
                                            {win.wallet_address}
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                            {new Date(win.created_date).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-yellow-400">
                                            ${win.total_winnings.toFixed(2)}
                                        </div>
                                        <div className="text-gray-400 text-xs">Scatter Winnings</div>
                                    </div>
                                </div>

                                <div className="bg-black/30 rounded-lg p-4 mb-4">
                                    <div className="text-gray-400 text-sm mb-2">Boxes Picked:</div>
                                    <div className="flex gap-2 mb-3">
                                        {win.boxes_picked.map((boxNum, idx) => (
                                            <div key={idx} className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-3 py-2">
                                                <div className="text-white font-bold">Box {boxNum + 1}</div>
                                                <div className="text-cyan-400 text-sm">${win.box_amounts[boxNum]}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => handleMarkAsPaid(win)}
                                        disabled={processingPayments.has(win.id)}
                                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        {processingPayments.has(win.id) ? 'Processing...' : 'Mark as Paid'}
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteScatter(win)}
                                        disabled={processingPayments.has(win.id)}
                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 text-white"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Scatter Wins History */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">All Scatter Wins ({scatterWins.length})</h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Player</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Wallet</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Winnings</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Boxes Picked</th>
                                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scatterWins.map((win) => (
                                <tr key={win.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 px-4 text-gray-300 text-sm">
                                        {new Date(win.created_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4 text-white font-medium">
                                        {win.player_name}
                                    </td>
                                    <td className="py-3 px-4 text-gray-300 font-mono text-xs">
                                        {win.wallet_address.slice(0, 6)}...{win.wallet_address.slice(-4)}
                                    </td>
                                    <td className="py-3 px-4 text-yellow-400 font-bold">
                                        ${win.total_winnings.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-1">
                                            {win.boxes_picked.map((boxNum, idx) => (
                                                <span key={idx} className="text-cyan-400 text-xs">
                                                    #{boxNum + 1} (${win.box_amounts[boxNum]})
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${win.status === 'paid'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {win.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}