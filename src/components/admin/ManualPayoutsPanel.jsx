import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ManualPayoutsPanel() {
    const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        admin_notes: ''
    });

    const { data: manualPayouts = [] } = useQuery({
        queryKey: ['manualPayouts'],
        queryFn: async () => {
            const { data } = await supabase.from('manual_payouts').select('*').order('date', { ascending: false });
            return data || [];
        },
        staleTime: 30000
    });

    const createPayoutMutation = useMutation({
        mutationFn: async (payoutData) => {
            const { data } = await supabase.from('manual_payouts').insert({
                ...payoutData,
                date: new Date(payoutData.date).toISOString()
            }).select().single();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manualPayouts'] });
            toast.success('Manual payout added successfully!');
            setShowAddModal(false);
            setFormData({
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                admin_notes: ''
            });
        },
        onError: (error) => {
            toast.error('Failed to add payout: ' + error.message);
        }
    });

    const deletePayoutMutation = useMutation({
        mutationFn: async (payoutId) => {
            await supabase.from('manual_payouts').delete().eq('id', payoutId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manualPayouts'] });
            toast.success('Payout deleted successfully!');
        },
        onError: (error) => {
            toast.error('Failed to delete payout: ' + error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.description || !formData.amount || !formData.date) {
            toast.error('Please fill in all required fields');
            return;
        }
        createPayoutMutation.mutate(formData);
    };

    const totalManualPayouts = manualPayouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-500/50"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                        <DollarSign className="w-7 h-7 text-blue-400" />
                        Manual Payouts
                    </h3>
                    <p className="text-gray-400">Add custom payouts to display on game page</p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-xl"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payout
                </Button>
            </div>

            {/* Total Manual Payouts */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-6 mb-6">
                <p className="text-gray-400 text-sm mb-1">Total Manual Payouts</p>
                <p className="text-green-400 text-4xl font-bold">
                    ${totalManualPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>

            {/* Payouts List */}
            {manualPayouts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No manual payouts added yet
                </div>
            ) : (
                <div className="space-y-3">
                    {manualPayouts.map((payout) => (
                        <motion.div
                            key={payout.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-white font-bold text-lg">
                                            {payout.description}
                                        </h4>
                                        <span className="text-green-400 font-bold text-xl">
                                            ${payout.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(payout.date).toLocaleDateString()}</span>
                                    </div>
                                    {payout.admin_notes && (
                                        <p className="text-gray-400 text-sm mt-2">
                                            {payout.admin_notes}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        if (confirm(`Delete payout: ${payout.description}?`)) {
                                            deletePayoutMutation.mutate(payout.id);
                                        }
                                    }}
                                    disabled={deletePayoutMutation.isPending}
                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Payout Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-blue-500/50 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-blue-400" />
                            Add Manual Payout
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div>
                            <label className="text-white text-sm font-semibold mb-2 block">
                                Description <span className="text-red-400">*</span>
                            </label>
                            <Input
                                placeholder="e.g., 1 BTC Reward Payment"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-white/10 border-white/20 text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-white text-sm font-semibold mb-2 block">
                                Amount (USD) <span className="text-red-400">*</span>
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g., 95000"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="bg-white/10 border-white/20 text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-white text-sm font-semibold mb-2 block">
                                Date <span className="text-red-400">*</span>
                            </label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="bg-white/10 border-white/20 text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-white text-sm font-semibold mb-2 block">
                                Admin Notes (Optional)
                            </label>
                            <Textarea
                                placeholder="Additional notes..."
                                value={formData.admin_notes}
                                onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                                className="bg-white/10 border-white/20 text-white"
                                rows={3}
                            />
                        </div>
                    </form>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            className="border-white/20 text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createPayoutMutation.isPending || !formData.description || !formData.amount || !formData.date}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50"
                        >
                            {createPayoutMutation.isPending ? 'Adding...' : 'Add Payout'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}