import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ManualDepositIntake() {
    const queryClient = useQueryClient();
    const [searchEmail, setSearchEmail] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [submissionCompleted, setSubmissionCompleted] = useState(false);
    const [submittedDepositId, setSubmittedDepositId] = useState(null);
    const [formData, setFormData] = useState({
        pool_type: 'traditional',
        duration_months: '',
        claimed_amount: '',
        tx_hash: '',
        approximate_timestamp: '',
        reason_for_manual_entry: '',
        admin_notes: ''
    });

    // Fetch current admin user
    const { data: currentAdmin } = useQuery({
        queryKey: ['currentAdmin'],
        queryFn: () => base44.auth.me()
    });

    // Search users by email
    const { data: users = [], isLoading: searchLoading } = useQuery({
        queryKey: ['userSearch', searchEmail],
        queryFn: async () => {
            if (!searchEmail || searchEmail.length < 3) return [];
            const allUsers = await base44.entities.User.list();
            return allUsers.filter(u => u.email?.toLowerCase().includes(searchEmail.toLowerCase()));
        },
        enabled: searchEmail.length >= 3
    });

    // Fetch pool settings for destination addresses
    const { data: poolSettings = [] } = useQuery({
        queryKey: ['poolSettings'],
        queryFn: () => base44.entities.PoolSettings.list()
    });

    const { data: gameSettings } = useQuery({
        queryKey: ['gameSettings'],
        queryFn: async () => {
            const settings = await base44.entities.GameSettings.filter({ game_type: 'dealornodeal' });
            return settings[0] || null;
        }
    });

    const { data: stakingSettings } = useQuery({
        queryKey: ['stakingSettings'],
        queryFn: async () => {
            const settings = await base44.entities.StakingSettings.list();
            return settings[0] || null;
        }
    });

    // Fetch existing manual deposits
    const { data: manualDeposits = [] } = useQuery({
        queryKey: ['manualDeposits'],
        queryFn: () => base44.entities.PendingManualDeposit.list('-created_date', 100)
    });

    const createManualDepositMutation = useMutation({
        mutationFn: async (depositData) => {
            return await base44.entities.PendingManualDeposit.create(depositData);
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries(['manualDeposits']);
            setSubmissionCompleted(true);
            setSubmittedDepositId(response.id);
        },
        onError: (error) => {
            toast.error('Failed to create manual deposit intake: ' + error.message);
        }
    });

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setSearchEmail(user.email);
    };

    const getDestinationWallet = () => {
        if (!formData.pool_type) return '';
        
        switch (formData.pool_type) {
            case 'traditional':
            case 'vip':
            case 'scalping':
                const pool = poolSettings.find(p => p.pool_type === formData.pool_type);
                return pool?.pool_address || '';
            case 'game':
                return gameSettings?.game_wallet_address || '';
            case 'staking':
                return stakingSettings?.company_wallet_address || '';
            default:
                return '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedUser) {
            toast.error('Please select a user first');
            return;
        }

        if (!formData.claimed_amount || parseFloat(formData.claimed_amount) <= 0) {
            toast.error('Please enter a valid claimed amount');
            return;
        }

        if (!formData.reason_for_manual_entry.trim()) {
            toast.error('Please provide a reason for manual entry');
            return;
        }

        // Validate duration_months for traditional pool
        if (formData.pool_type === 'traditional') {
            if (!formData.duration_months || parseFloat(formData.duration_months) <= 0) {
                toast.error('Duration (months) is required for traditional pool');
                return;
            }
        }

        // Validate tx_hash is provided
        if (!formData.tx_hash || !formData.tx_hash.trim()) {
            toast.error('Transaction hash is required');
            return;
        }

        const destinationWallet = getDestinationWallet();
        if (!destinationWallet) {
            toast.error('Could not determine destination wallet for selected pool type');
            return;
        }

        const depositData = {
            user_id: selectedUser.id,
            user_wallet_address: selectedUser.wallet_address?.toLowerCase() || '',
            destination_wallet_address: destinationWallet.toLowerCase(),
            pool_id: formData.pool_type,
            pool_type: formData.pool_type,
            duration_months: formData.pool_type === 'traditional' ? parseFloat(formData.duration_months) : null,
            claimed_amount: parseFloat(formData.claimed_amount),
            token_contract: '0x55d398326f99059fF775485246999027B3197955',
            token_decimals: 18,
            network: 'BSC',
            tx_hash: formData.tx_hash.trim(),
            approximate_timestamp: formData.approximate_timestamp || new Date().toISOString(),
            reason_for_manual_entry: formData.reason_for_manual_entry,
            admin_notes: formData.admin_notes,
            processed_by: currentAdmin?.email || 'unknown'
        };

        await createManualDepositMutation.mutateAsync(depositData);
    };

    const getStatusBadge = (deposit) => {
        const stateMap = {
            'INTAKE_CREATED': { icon: Clock, color: 'bg-yellow-500/20 text-yellow-300', text: 'Awaiting Verification' },
            'ON_CHAIN_MATCHED': { icon: CheckCircle2, color: 'bg-blue-500/20 text-blue-300', text: 'Verified On-Chain' },
            'CREDIT_IN_PROGRESS': { icon: Clock, color: 'bg-cyan-500/20 text-cyan-300', text: 'Crediting...' },
            'BALANCE_APPLIED': { icon: CheckCircle2, color: 'bg-green-500/20 text-green-300', text: 'Balance Applied' },
            'FAILED': { icon: XCircle, color: 'bg-red-500/20 text-red-300', text: 'Failed' },
            'REJECTED': { icon: XCircle, color: 'bg-gray-500/20 text-gray-300', text: 'Rejected' }
        };

        const state = stateMap[deposit.manual_deposit_processing_state] || stateMap['INTAKE_CREATED'];
        const Icon = state.icon;

        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${state.color}`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{state.text}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Manual Deposit Intake</h1>
                        <p className="text-gray-400">Admin-only tool for reporting missing deposits. Requires blockchain verification.</p>
                    </div>
                    <Link to={createPageUrl('GeneralAdmin')}>
                        <Button variant="outline" className="bg-white/5 text-white border-white/20">
                            Back to Admin
                        </Button>
                    </Link>
                </div>

                {/* Pending Confirmation Banner */}
                {!submissionCompleted && manualDeposits.length > 0 && manualDeposits[0]?.manual_deposit_processing_state !== 'BALANCE_APPLIED' && (
                    <div className="mb-6 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-cyan-200">
                            <p className="font-semibold mb-1">⏳ Transaction Under Confirmation</p>
                            <p>A previous transaction is still under blockchain confirmation. Balance will update automatically once confirmed (typically within 5 minutes).</p>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Confirmation Screen */}
                    {submissionCompleted ? (
                        <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
                            <CardContent className="pt-12 pb-12">
                                <div className="text-center space-y-6">
                                    {/* Success Icon */}
                                    <div className="flex justify-center">
                                        <div className="bg-green-500/20 rounded-full p-4">
                                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                                        </div>
                                    </div>

                                    {/* Main Message */}
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Transaction Secured</h2>
                                        <p className="text-gray-300">Your deposit has been submitted for blockchain verification.</p>
                                    </div>

                                    {/* Status Timeline */}
                                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-left">
                                                <p className="text-white font-medium">✅ Transaction is secured on the blockchain</p>
                                                <p className="text-sm text-gray-400">Your deposit transaction is now recorded on-chain.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-left">
                                                <p className="text-white font-medium">⏳ Credit will be completed within the next 5 minutes</p>
                                                <p className="text-sm text-gray-400">Our system is verifying your transaction and will credit your balance automatically.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-left">
                                                <p className="text-white font-medium">🔒 You can safely close this window</p>
                                                <p className="text-sm text-gray-400">No further action is required from you. Balance will update automatically.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-left">
                                                <p className="text-white font-medium">🔁 Balance will update automatically once confirmed</p>
                                                <p className="text-sm text-gray-400">Check your dashboard in a few minutes to see the updated balance.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transaction Reference */}
                                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                        <p className="text-gray-400 text-sm mb-2">Transaction Reference</p>
                                        <p className="text-white font-mono text-lg break-all">{submittedDepositId}</p>
                                    </div>

                                    {/* Action Button */}
                                    <Link to={createPageUrl('GeneralAdmin')}>
                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                            Back to Admin Dashboard
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Intake Form */}
                            <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white">Create Manual Deposit Intake</CardTitle>
                            <CardDescription className="text-gray-400">
                                Report a missing deposit. Balance will only be credited after blockchain verification.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* User Search */}
                                <div>
                                    <Label className="text-white">Search User by Email</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Enter email to search..."
                                            value={searchEmail}
                                            onChange={(e) => setSearchEmail(e.target.value)}
                                            className="pl-10 bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                    {searchLoading && <p className="text-sm text-gray-400 mt-1">Searching...</p>}
                                    {users.length > 0 && !selectedUser && (
                                        <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                                            {users.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => handleUserSelect(user)}
                                                    className="p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-b-0"
                                                >
                                                    <p className="text-white font-medium">{user.email}</p>
                                                    <p className="text-sm text-gray-400">Wallet: {user.wallet_address?.slice(0, 10)}...</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {selectedUser && (
                                        <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                            <p className="text-green-300 font-medium">{selectedUser.email}</p>
                                            <p className="text-sm text-gray-400">Wallet: {selectedUser.wallet_address}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Wallet Address (Read-only) */}
                                <div>
                                    <Label className="text-white">User Wallet Address (Auto-filled)</Label>
                                    <Input
                                        value={selectedUser?.wallet_address || ''}
                                        readOnly
                                        className="bg-gray-900/50 border-gray-700 text-gray-400 cursor-not-allowed"
                                    />
                                </div>

                                {/* Pool Type */}
                                <div>
                                    <Label className="text-white">Pool Type *</Label>
                                    <Select value={formData.pool_type} onValueChange={(value) => setFormData({ ...formData, pool_type: value })}>
                                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="traditional">Traditional Pool</SelectItem>
                                            <SelectItem value="vip">VIP Pool</SelectItem>
                                            <SelectItem value="scalping">Scalping Pool</SelectItem>
                                            <SelectItem value="staking">Staking</SelectItem>
                                            <SelectItem value="game">Game Entry</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Duration (Traditional Pool Only) */}
                                {formData.pool_type === 'traditional' && (
                                    <div>
                                        <Label className="text-white">Lock-in Duration (Months) *</Label>
                                        <Select value={formData.duration_months} onValueChange={(value) => setFormData({ ...formData, duration_months: value })}>
                                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="6">6 Months</SelectItem>
                                                <SelectItem value="12">12 Months</SelectItem>
                                                <SelectItem value="24">24 Months</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Destination Wallet (Read-only) */}
                                <div>
                                    <Label className="text-white">Destination Wallet (Auto-filled)</Label>
                                    <Input
                                        value={getDestinationWallet()}
                                        readOnly
                                        className="bg-gray-900/50 border-gray-700 text-gray-400 cursor-not-allowed"
                                    />
                                </div>

                                {/* Claimed Amount */}
                                <div>
                                    <Label className="text-white">Claimed Amount (USDT) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.claimed_amount}
                                        onChange={(e) => setFormData({ ...formData, claimed_amount: e.target.value })}
                                        className="bg-gray-900 border-gray-700 text-white"
                                    />
                                </div>

                                {/* TX Hash */}
                                <div>
                                    <Label className="text-white">Transaction Hash *</Label>
                                    <Input
                                        placeholder="0x..."
                                        value={formData.tx_hash}
                                        onChange={(e) => setFormData({ ...formData, tx_hash: e.target.value })}
                                        className="bg-gray-900 border-gray-700 text-white"
                                        required
                                    />
                                </div>

                                {/* Approximate Timestamp */}
                                <div>
                                    <Label className="text-white">Approximate Timestamp</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.approximate_timestamp}
                                        onChange={(e) => setFormData({ ...formData, approximate_timestamp: e.target.value })}
                                        className="bg-gray-900 border-gray-700 text-white"
                                    />
                                </div>

                                {/* Reason */}
                                <div>
                                    <Label className="text-white">Reason for Manual Entry *</Label>
                                    <Textarea
                                        placeholder="Explain why this manual intake is necessary..."
                                        value={formData.reason_for_manual_entry}
                                        onChange={(e) => setFormData({ ...formData, reason_for_manual_entry: e.target.value })}
                                        className="bg-gray-900 border-gray-700 text-white min-h-[80px]"
                                    />
                                </div>

                                {/* Admin Notes */}
                                <div>
                                    <Label className="text-white">Admin Notes</Label>
                                    <Textarea
                                        placeholder="Additional notes..."
                                        value={formData.admin_notes}
                                        onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                                        className="bg-gray-900 border-gray-700 text-white min-h-[60px]"
                                    />
                                </div>

                                {/* Warning */}
                                 <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-orange-200">
                                        <p className="font-semibold mb-1">Important</p>
                                        <p>This form creates an intake record only. Balance will NOT be credited until blockchain verification confirms the transaction.</p>
                                    </div>
                                </div>

                                <Button type="submit" disabled={createManualDepositMutation.isPending || submissionCompleted} className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                                    Create Intake Record
                                </Button>
                            </form>
                            </CardContent>
                            </Card>

                            {/* Recent Intakes */}
                            <Card className="bg-gray-800/50 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white">Recent Manual Deposit Intakes</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Showing the last 100 intake records
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {manualDeposits.map((deposit) => (
                                        <div key={deposit.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="text-white font-medium">{deposit.claimed_amount} USDT</p>
                                                    <p className="text-sm text-gray-400">{deposit.pool_type}</p>
                                                </div>
                                                {getStatusBadge(deposit)}
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <p className="text-gray-400">
                                                    <span className="text-gray-500">User:</span> {deposit.user_wallet_address?.slice(0, 10)}...
                                                </p>
                                                {deposit.verified_tx_hash ? (
                                                    <p className="text-gray-400">
                                                        <span className="text-gray-500">TX:</span> {deposit.verified_tx_hash.slice(0, 16)}...
                                                    </p>
                                                ) : deposit.tx_hash ? (
                                                    <p className="text-gray-400">
                                                        <span className="text-gray-500">TX:</span> {deposit.tx_hash.slice(0, 16)}...
                                                    </p>
                                                ) : null}
                                                <p className="text-gray-400">
                                                    <span className="text-gray-500">Reason:</span> {deposit.reason_for_manual_entry}
                                                </p>
                                                {deposit.last_verification_error && (
                                                    <p className="text-red-400 text-xs">
                                                        Error: {deposit.last_verification_error}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {manualDeposits.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">No manual deposit intakes yet</p>
                                    )}
                                </div>
                            </CardContent>
                            </Card>
                            </>
                            )}


                </div>
            </div>
        </div>
    );
}