import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddDepositModal({ isOpen, onClose, onCreate }) {
    const [walletAddress, setWalletAddress] = useState('');
    const [poolType, setPoolType] = useState('scalping');
    const [amount, setAmount] = useState('');
    const [investorName, setInvestorName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!walletAddress || !amount) return;
        
        setIsCreating(true);
        try {
            await onCreate({
                wallet_address: walletAddress.toLowerCase(),
                pool_type: poolType,
                invested_amount: parseFloat(amount),
                investor_name: investorName || undefined
            });
            setWalletAddress('');
            setAmount('');
            setInvestorName('');
            setPoolType('scalping');
            onClose();
        } catch (error) {
            console.error('Error creating:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1f2e] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Add New Deposit</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="wallet" className="text-gray-400">Wallet Address</Label>
                        <Input
                            id="wallet"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            placeholder="0x..."
                            className="bg-white/5 border-white/10 text-white mt-2"
                        />
                    </div>
                    <div>
                        <Label htmlFor="name" className="text-gray-400">Investor Name (Optional)</Label>
                        <Input
                            id="name"
                            value={investorName}
                            onChange={(e) => setInvestorName(e.target.value)}
                            placeholder="John Doe"
                            className="bg-white/5 border-white/10 text-white mt-2"
                        />
                    </div>
                    <div>
                        <Label className="text-gray-400 mb-2">Pool Type</Label>
                        <Select value={poolType} onValueChange={setPoolType}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1f2e] border-white/10">
                                <SelectItem value="scalping">Scalping Pool</SelectItem>
                                <SelectItem value="main">Main Pool</SelectItem>
                                <SelectItem value="traditional">Traditional Pool</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="amount" className="text-gray-400">Amount (USDT)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="1000.00"
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
                        onClick={handleCreate}
                        disabled={isCreating || !walletAddress || !amount}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    >
                        {isCreating ? 'Creating...' : 'Add Deposit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}