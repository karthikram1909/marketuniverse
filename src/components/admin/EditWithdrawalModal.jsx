import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EditWithdrawalModal({ isOpen, onClose, withdrawal, onSave }) {
    const [amount, setAmount] = useState(withdrawal?.amount || 0);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(withdrawal.id, parseFloat(amount));
            onClose();
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1f2e] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Withdrawal Amount</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label className="text-gray-400 mb-2">Wallet Address</Label>
                        <p className="text-white font-mono text-sm">
                            {withdrawal?.wallet_address}
                        </p>
                    </div>
                    <div>
                        <Label className="text-gray-400 mb-2">Pool Type</Label>
                        <p className="text-white capitalize">{withdrawal?.pool_type}</p>
                    </div>
                    <div>
                        <Label className="text-gray-400 mb-2">Status</Label>
                        <p className={`font-bold ${
                            withdrawal?.status === 'paid' ? 'text-green-400' :
                            withdrawal?.status === 'pending' ? 'text-yellow-400' :
                            'text-red-400'
                        }`}>
                            {withdrawal?.status.toUpperCase()}
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="amount" className="text-gray-400">Withdrawal Amount (USDT)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-white/5 border-white/10 text-white mt-2"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-white/10 text-white hover:bg-white/10"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}