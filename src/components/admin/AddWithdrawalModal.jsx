import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddWithdrawalModal({ isOpen, onClose, onCreate }) {
    const [walletAddress, setWalletAddress] = useState('');
    const [email, setEmail] = useState('');
    const [paymentAddress, setPaymentAddress] = useState('');
    const [nameSurname, setNameSurname] = useState('');
    const [poolType, setPoolType] = useState('scalping');
    const [amount, setAmount] = useState('');
    const [userBalance, setUserBalance] = useState('');
    const [cryptoType, setCryptoType] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!walletAddress || !email || !paymentAddress || !nameSurname || !amount || !userBalance) return;
        
        setIsCreating(true);
        try {
            await onCreate({
                wallet_address: walletAddress.toLowerCase(),
                email: email,
                payment_address: paymentAddress,
                name_surname: nameSurname,
                amount: parseFloat(amount),
                pool_type: poolType,
                status: 'pending',
                user_balance_at_request: parseFloat(userBalance),
                crypto_type: poolType === 'staking' ? cryptoType : undefined
            });
            setWalletAddress('');
            setEmail('');
            setPaymentAddress('');
            setNameSurname('');
            setAmount('');
            setUserBalance('');
            setCryptoType('');
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
            <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Withdrawal Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
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
                            <Label htmlFor="email" className="text-gray-400">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="bg-white/5 border-white/10 text-white mt-2"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="name" className="text-gray-400">Full Name</Label>
                        <Input
                            id="name"
                            value={nameSurname}
                            onChange={(e) => setNameSurname(e.target.value)}
                            placeholder="John Doe"
                            className="bg-white/5 border-white/10 text-white mt-2"
                        />
                    </div>
                    <div>
                        <Label htmlFor="payment" className="text-gray-400">Payment Address (BEP-20)</Label>
                        <Input
                            id="payment"
                            value={paymentAddress}
                            onChange={(e) => setPaymentAddress(e.target.value)}
                            placeholder="0x..."
                            className="bg-white/5 border-white/10 text-white mt-2"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                                    <SelectItem value="staking">Staking</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {poolType === 'staking' && (
                            <div>
                                <Label htmlFor="crypto" className="text-gray-400">Crypto Type</Label>
                                <Input
                                    id="crypto"
                                    value={cryptoType}
                                    onChange={(e) => setCryptoType(e.target.value)}
                                    placeholder="BTC, ETH, etc."
                                    className="bg-white/5 border-white/10 text-white mt-2"
                                />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="amount" className="text-gray-400">Withdrawal Amount</Label>
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
                        <div>
                            <Label htmlFor="balance" className="text-gray-400">User Balance at Request</Label>
                            <Input
                                id="balance"
                                type="number"
                                step="0.01"
                                value={userBalance}
                                onChange={(e) => setUserBalance(e.target.value)}
                                placeholder="5000.00"
                                className="bg-white/5 border-white/10 text-white mt-2"
                            />
                        </div>
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
                        disabled={isCreating || !walletAddress || !email || !paymentAddress || !nameSurname || !amount || !userBalance}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
                    >
                        {isCreating ? 'Creating...' : 'Add Withdrawal'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}