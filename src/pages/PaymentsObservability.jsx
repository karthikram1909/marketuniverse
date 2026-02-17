import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    CheckCircle2, Clock, AlertTriangle, XCircle, ChevronDown, ChevronRight,
    Search, Filter, TrendingUp, Loader2, RefreshCw
} from 'lucide-react';
import PaymentLifecycleDetail from '../components/observability/PaymentLifecycleDetail';

export default function PaymentsObservability() {
    const [searchTerm, setSearchTerm] = useState('');
    const [poolFilter, setPoolFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedPayment, setExpandedPayment] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const queryClient = useQueryClient();

    // Fetch all entities
    const { data: depositIntents = [], isLoading: loadingIntents } = useQuery({
        queryKey: ['depositIntents'],
        queryFn: () => base44.entities.DepositIntent.list('-created_at', 1000),
        refetchInterval: 30000 // Refresh every 30s
    });

    const { data: pendingTxs = [], isLoading: loadingPending } = useQuery({
        queryKey: ['pendingTransactions'],
        queryFn: () => base44.entities.PendingTransaction.list('-created_at', 1000),
        refetchInterval: 30000
    });

    const { data: poolInvestors = [], isLoading: loadingInvestors } = useQuery({
        queryKey: ['poolInvestors'],
        queryFn: () => base44.entities.PoolInvestor.list('-created_at', 1000),
        refetchInterval: 30000
    });

    // Manual refresh handler
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            queryClient.refetchQueries(['depositIntents']),
            queryClient.refetchQueries(['pendingTransactions']),
            queryClient.refetchQueries(['poolInvestors'])
        ]);
        setIsRefreshing(false);
    };

    // Group payments by tx_hash or fallback grouping
    const unifiedPayments = useMemo(() => {
        if (loadingIntents || loadingPending || loadingInvestors) return [];

        const paymentMap = new Map();

        // Process PendingTransactions first (primary key: tx_hash)
        pendingTxs.forEach(ptx => {
            const key = ptx.tx_hash;
            paymentMap.set(key, {
                tx_hash: ptx.tx_hash,
                wallet_address: ptx.wallet_address,
                pool_type: ptx.pool_type,
                pool_address: ptx.pool_address,
                expected_amount: ptx.expected_amount,
                verified_amount: ptx.verified_amount,
                pendingTx: ptx,
                depositIntent: null,
                poolInvestor: null,
                pathType: null,
                currentState: ptx.status,
                healthStatus: deriveHealthStatus(null, ptx, null),
                createdAt: new Date(ptx.created_at || ptx.first_seen_at)
            });
        });

        // Match DepositIntents
        depositIntents.forEach(intent => {
            if (intent.matched_tx_hash) {
                // Matched intent
                const existing = paymentMap.get(intent.matched_tx_hash);
                if (existing) {
                    existing.depositIntent = intent;
                    existing.pathType = 'Scanner / Recovery';
                } else {
                    // Matched but no PendingTransaction (DIAGNOSTIC FLAG)
                    paymentMap.set(intent.matched_tx_hash, {
                        tx_hash: intent.matched_tx_hash,
                        wallet_address: intent.wallet_address,
                        pool_type: intent.pool_type,
                        pool_address: intent.pool_address,
                        expected_amount: intent.expected_amount,
                        depositIntent: intent,
                        pendingTx: null,
                        poolInvestor: null,
                        pathType: 'Scanner / Recovery',
                        currentState: 'matched_no_pending',
                        healthStatus: 'delayed',
                        createdAt: new Date(intent.created_at)
                    });
                }
            } else if (intent.status === 'initiated') {
                // Initiated but not matched yet
                const fallbackKey = `${intent.wallet_address}_${intent.expected_amount}_${intent.pool_address}_${intent.created_at}`;
                if (!paymentMap.has(fallbackKey)) {
                    paymentMap.set(fallbackKey, {
                        tx_hash: null,
                        wallet_address: intent.wallet_address,
                        pool_type: intent.pool_type,
                        pool_address: intent.pool_address,
                        expected_amount: intent.expected_amount,
                        depositIntent: intent,
                        pendingTx: null,
                        poolInvestor: null,
                        pathType: 'Frontend / Happy',
                        currentState: 'initiated',
                        healthStatus: 'processing',
                        createdAt: new Date(intent.created_at)
                    });
                }
            }
        });

        // Match PoolInvestors (check deposit_transactions)
        poolInvestors.forEach(investor => {
            if (investor.deposit_transactions) {
                investor.deposit_transactions.forEach(dt => {
                    const existing = paymentMap.get(dt.tx_hash);
                    if (existing) {
                        existing.poolInvestor = investor;
                        existing.creditedAt = dt.date;
                        existing.creditedAmount = dt.amount;
                    }
                });
            }
        });

        // Infer pathType for entries without depositIntent
        paymentMap.forEach((payment, key) => {
            if (!payment.pathType && payment.pendingTx) {
                payment.pathType = payment.pendingTx.first_seen_at ? 'Scanner / Recovery' : 'Frontend / Happy';
            }
            
            // Recalculate health status with full context
            payment.healthStatus = deriveHealthStatus(payment.depositIntent, payment.pendingTx, payment.poolInvestor);
            payment.totalTime = calculateTotalTime(payment);
        });

        return Array.from(paymentMap.values()).sort((a, b) => b.createdAt - a.createdAt);
    }, [depositIntents, pendingTxs, poolInvestors, loadingIntents, loadingPending, loadingInvestors]);

    // Calculate status buckets
    const statusBuckets = useMemo(() => {
        return {
            initiated: unifiedPayments.filter(p => p.currentState === 'initiated').length,
            matched_no_pending: unifiedPayments.filter(p => p.currentState === 'matched_no_pending').length,
            pending_verifying: unifiedPayments.filter(p => ['pending', 'verifying'].includes(p.currentState)).length,
            processing: unifiedPayments.filter(p => p.currentState === 'processing').length,
            completed: unifiedPayments.filter(p => p.currentState === 'completed').length,
            failed: unifiedPayments.filter(p => p.currentState === 'failed').length
        };
    }, [unifiedPayments]);

    // Filter payments
    const filteredPayments = useMemo(() => {
        return unifiedPayments.filter(payment => {
            const matchesSearch = !searchTerm || 
                payment.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.pool_address?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesPool = poolFilter === 'all' || payment.pool_type === poolFilter;
            const matchesStatus = statusFilter === 'all' || payment.healthStatus === statusFilter;

            return matchesSearch && matchesPool && matchesStatus;
        });
    }, [unifiedPayments, searchTerm, poolFilter, statusFilter]);

    if (loadingIntents || loadingPending || loadingInvestors) {
        return (
            <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Payment Observability</h1>
                        <p className="text-gray-300">Read-only diagnostic view of all deposit lifecycles</p>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
                    </Button>
                </div>

                {/* Status Buckets - High Contrast */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <StatusCard
                        title="Initiated"
                        count={statusBuckets.initiated}
                        icon={<Clock className="w-6 h-6" />}
                        color="blue"
                        onClick={() => setStatusFilter('processing')}
                    />
                    <StatusCard
                        title="Matched (No PT)"
                        count={statusBuckets.matched_no_pending}
                        icon={<AlertTriangle className="w-6 h-6" />}
                        color="orange"
                        onClick={() => setStatusFilter('delayed')}
                    />
                    <StatusCard
                        title="Pending/Verify"
                        count={statusBuckets.pending_verifying}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="cyan"
                        onClick={() => setStatusFilter('processing')}
                    />
                    <StatusCard
                        title="Processing"
                        count={statusBuckets.processing}
                        icon={<Loader2 className="w-6 h-6" />}
                        color="cyan"
                        onClick={() => setStatusFilter('processing')}
                    />
                    <StatusCard
                        title="Completed"
                        count={statusBuckets.completed}
                        icon={<CheckCircle2 className="w-6 h-6" />}
                        color="green"
                        onClick={() => setStatusFilter('settled')}
                    />
                    <StatusCard
                        title="Failed"
                        count={statusBuckets.failed}
                        icon={<XCircle className="w-6 h-6" />}
                        color="red"
                        onClick={() => setStatusFilter('failed')}
                    />
                </div>

                {/* Filters - High Contrast */}
                <Card className="bg-gray-900 border-gray-700 p-5 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <Input
                                placeholder="Search wallet, tx hash, or pool address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                            />
                        </div>
                        <Select value={poolFilter} onValueChange={setPoolFilter}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                <SelectValue placeholder="All Pools" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Pools</SelectItem>
                                <SelectItem value="scalping">Scalping</SelectItem>
                                <SelectItem value="traditional">Traditional</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="settled">✅ Settled</SelectItem>
                                <SelectItem value="processing">⏳ Processing</SelectItem>
                                <SelectItem value="delayed">⚠️ Delayed</SelectItem>
                                <SelectItem value="failed">❌ Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                {/* Payment Timeline - Investigation Friendly */}
                <div className="space-y-4">
                    {filteredPayments.map((payment, idx) => {
                        const isRecentlyUpdated = checkRecentUpdate(payment);
                        const diagnosticFlags = getDiagnosticFlags(payment);
                        
                        return (
                            <Card
                                key={payment.tx_hash || `payment-${idx}`}
                                className={`bg-gray-900 border-gray-700 p-5 hover:bg-gray-850 transition-colors cursor-pointer ${isRecentlyUpdated ? 'ring-2 ring-cyan-500/50' : ''}`}
                                onClick={() => setExpandedPayment(expandedPayment === idx ? null : idx)}
                            >
                                <div className="space-y-4">
                                    {/* Main Info Row */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-6">
                                            <div>
                                                <p className="text-xs text-gray-300 mb-1.5 font-medium">Wallet</p>
                                                <p className="text-sm text-white font-mono" title={payment.wallet_address}>
                                                    {payment.wallet_address?.slice(0, 6)}...{payment.wallet_address?.slice(-4)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-300 mb-1.5 font-medium">Pool</p>
                                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                                    {payment.pool_type || 'Unknown'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-300 mb-1.5 font-medium">Amount</p>
                                                <p className="text-sm text-white font-bold">
                                                    {payment.expected_amount?.toFixed(2) || '—'} USDT
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-300 mb-1.5 font-medium">TX Hash</p>
                                                <p className="text-sm text-white font-mono" title={payment.tx_hash}>
                                                    {payment.tx_hash ? `${payment.tx_hash.slice(0, 10)}...` : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-300 mb-1.5 font-medium">Path</p>
                                                <Badge className={getPathBadgeColor(payment.pathType)}>
                                                    {payment.pathType || 'Unknown'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-300 mb-1.5 font-medium">Time Elapsed</p>
                                                <p className="text-sm text-white">
                                                    {payment.totalTime ? `${payment.totalTime} min` : calculateTimeSince(payment.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-300 mb-1.5 font-medium">Status</p>
                                                    {renderHealthBadge(payment.healthStatus)}
                                                </div>
                                                {expandedPayment === idx ? (
                                                    <ChevronDown className="w-5 h-5 text-gray-300" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-300" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Diagnostic Flags Preview */}
                                    {diagnosticFlags.length > 0 && !expandedPayment && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                                            <span className="text-orange-300">{diagnosticFlags.length} diagnostic flag{diagnosticFlags.length > 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                    
                                    {/* Last Updated Indicator */}
                                    {isRecentlyUpdated && (
                                        <div className="flex items-center gap-2 text-xs text-cyan-300">
                                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                            <span>Updated recently</span>
                                        </div>
                                    )}
                                </div>

                                {/* Expandable Lifecycle Detail */}
                                {expandedPayment === idx && (
                                    <div className="mt-6 pt-6 border-t border-gray-700">
                                        <PaymentLifecycleDetail payment={payment} />
                                    </div>
                                )}
                            </Card>
                        );
                    })}

                    {filteredPayments.length === 0 && (
                        <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
                            <p className="text-gray-400">No payments found matching filters</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusCard({ title, count, icon, color, onClick }) {
    const colorClasses = {
        blue: 'border-blue-500/40 bg-blue-600/20 text-blue-200',
        orange: 'border-orange-500/40 bg-orange-600/20 text-orange-200',
        cyan: 'border-cyan-500/40 bg-cyan-600/20 text-cyan-200',
        green: 'border-green-500/40 bg-green-600/20 text-green-200',
        red: 'border-red-500/40 bg-red-600/20 text-red-200'
    };

    return (
        <Card
            className={`${colorClasses[color]} border-2 p-5 cursor-pointer hover:scale-105 transition-transform`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-3">
                {icon}
                <span className="text-3xl font-bold">{count}</span>
            </div>
            <p className="text-xs font-semibold">{title}</p>
        </Card>
    );
}

function renderHealthBadge(status) {
    const badges = {
        settled: <Badge className="bg-green-600/30 text-green-200 border-green-500/50 font-semibold">✅ Settled</Badge>,
        processing: <Badge className="bg-cyan-600/30 text-cyan-200 border-cyan-500/50 font-semibold">⏳ Processing</Badge>,
        delayed: <Badge className="bg-orange-600/30 text-orange-200 border-orange-500/50 font-semibold">⚠️ Delayed</Badge>,
        failed: <Badge className="bg-red-600/30 text-red-200 border-red-500/50 font-semibold">❌ Failed</Badge>
    };
    return badges[status] || <Badge className="bg-gray-600/30 text-gray-200 border-gray-500/50">Unknown</Badge>;
}

function deriveHealthStatus(intent, pendingTx, poolInvestor) {
    // If credited to PoolInvestor, it's settled
    if (poolInvestor) return 'settled';
    
    // If PendingTransaction completed
    if (pendingTx?.status === 'completed') return 'settled';
    
    // If PendingTransaction failed
    if (pendingTx?.status === 'failed') return 'failed';
    
    // If intent matched but no PendingTransaction (DIAGNOSTIC FLAG)
    if (intent?.status === 'matched' && !pendingTx) return 'delayed';
    
    // If PendingTransaction stuck for > 15 minutes
    if (pendingTx && ['pending', 'verifying', 'processing'].includes(pendingTx.status)) {
        const createdAt = new Date(pendingTx.created_at || pendingTx.first_seen_at);
        const ageMinutes = (Date.now() - createdAt.getTime()) / 60000;
        if (ageMinutes > 15) return 'delayed';
    }
    
    return 'processing';
}

function calculateTotalTime(payment) {
    const start = payment.depositIntent?.created_at || payment.pendingTx?.created_at || payment.pendingTx?.first_seen_at;
    const end = payment.creditedAt || (payment.pendingTx?.status === 'completed' ? payment.pendingTx.updated_at : null);
    
    if (!start || !end) return null;
    
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return Math.floor(diffMs / 60000); // minutes
}

function calculateTimeSince(timestamp) {
    if (!timestamp) return '—';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function checkRecentUpdate(payment) {
    const latestUpdate = payment.pendingTx?.updated_at || payment.depositIntent?.updated_at || payment.createdAt;
    if (!latestUpdate) return false;
    const ageMs = Date.now() - new Date(latestUpdate).getTime();
    return ageMs < 120000; // 2 minutes
}

function getDiagnosticFlags(payment) {
    const flags = [];
    
    if (payment.depositIntent?.status === 'matched' && !payment.pendingTx) {
        flags.push('matched_no_pending');
    }
    
    if (payment.pendingTx && ['pending', 'verifying', 'processing'].includes(payment.pendingTx.status)) {
        const createdAt = new Date(payment.pendingTx.created_at || payment.pendingTx.first_seen_at);
        const ageMinutes = (Date.now() - createdAt.getTime()) / 60000;
        if (ageMinutes > 15) {
            flags.push('stuck');
        }
    }
    
    if (payment.pendingTx?.status === 'failed') {
        flags.push('failed');
    }
    
    return flags;
}

function getPathBadgeColor(pathType) {
    if (pathType === 'Frontend / Happy') return 'bg-blue-600/30 text-blue-200 border-blue-500/50';
    if (pathType === 'Scanner / Recovery') return 'bg-purple-600/30 text-purple-200 border-purple-500/50';
    if (pathType === 'Reconciled') return 'bg-orange-600/30 text-orange-200 border-orange-500/50';
    return 'bg-gray-600/30 text-gray-200 border-gray-500/50';
}