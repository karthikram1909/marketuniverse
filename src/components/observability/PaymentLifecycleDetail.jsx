import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function PaymentLifecycleDetail({ payment }) {
    const timeline = buildTimeline(payment);
    
    return (
        <div className="space-y-6">
            {/* Timeline Visualization - High Contrast */}
            <div className="space-y-1">
                <h3 className="text-base font-bold text-white mb-4">Lifecycle Timeline (Ordered Flow)</h3>
                
                {timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.color} shadow-lg`}>
                                {step.icon}
                            </div>
                            {idx < timeline.length - 1 && (
                                <div className="w-1 h-16 bg-gray-600 my-1"></div>
                            )}
                        </div>
                        
                        <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-base font-bold text-white mb-1">{step.title}</p>
                                    <p className="text-sm text-gray-200">{step.description}</p>
                                    {step.source && (
                                        <p className="text-xs text-gray-400 mt-1">Source: {step.source}</p>
                                    )}
                                </div>
                                {step.timestamp && (
                                    <div className="text-right ml-4">
                                        <p className="text-xs text-gray-300 font-mono">
                                            {new Date(step.timestamp).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {calculateTimeSince(step.timestamp)}
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {step.details && (
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2 mt-3">
                                    {step.details.map((detail, didx) => (
                                        <div key={didx} className="flex justify-between text-sm">
                                            <span className="text-gray-300 font-medium">{detail.label}:</span>
                                            <span className="text-white font-mono font-semibold">{detail.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {step.warning && (
                                <div className="flex items-center gap-2 mt-3 p-3 bg-orange-600/20 border border-orange-500/40 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-orange-300" />
                                    <span className="text-sm text-orange-200 font-semibold">{step.warning}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Metrics - High Visibility */}
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                <h3 className="text-base font-bold text-white mb-4">Time Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {payment.totalTime ? (
                        <TimeMetric
                            label="Total Time"
                            value={`${payment.totalTime} min`}
                            status={payment.totalTime < 5 ? 'good' : payment.totalTime < 15 ? 'warning' : 'critical'}
                        />
                    ) : (
                        <TimeMetric
                            label="In Progress"
                            value={calculateTimeSince(payment.createdAt)}
                            status="neutral"
                        />
                    )}
                    {payment.depositIntent && payment.pendingTx && (
                        <TimeMetric
                            label="Intent → Pending"
                            value={calculateTimeDiff(payment.depositIntent.created_at, payment.pendingTx.created_at || payment.pendingTx.first_seen_at)}
                            status="neutral"
                        />
                    )}
                    {payment.pendingTx && (
                        <TimeMetric
                            label="In Current Status"
                            value={calculateTimeSince(payment.pendingTx.updated_at || payment.pendingTx.created_at)}
                            status="neutral"
                        />
                    )}
                    {payment.creditedAt && payment.pendingTx && (
                        <TimeMetric
                            label="Processing → Credit"
                            value={calculateTimeDiff(payment.pendingTx.updated_at, payment.creditedAt)}
                            status="neutral"
                        />
                    )}
                </div>
            </div>

            {/* Diagnostic Flags */}
            {renderDiagnosticFlags(payment)}
        </div>
    );
}

function buildTimeline(payment) {
    const timeline = [];
    
    // Step 1: DepositIntent Created
    if (payment.depositIntent) {
        timeline.push({
            title: '1. Deposit Intent Created',
            description: 'User initiated deposit or scanner detected intent',
            source: payment.depositIntent.start_block ? 'Scanner' : 'Frontend',
            timestamp: payment.depositIntent.created_at,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: 'bg-blue-600/30 text-blue-200 border-2 border-blue-500/50',
            details: [
                { label: 'Status', value: payment.depositIntent.status },
                { label: 'Start Block', value: payment.depositIntent.start_block },
                { label: 'Expected Amount', value: `${payment.depositIntent.expected_amount} USDT` },
                { label: 'Pool Type', value: payment.depositIntent.pool_type }
            ]
        });
        
        // Step 2: Intent Matched (if applicable)
        if (payment.depositIntent.status === 'matched' && payment.depositIntent.matched_tx_hash) {
            timeline.push({
                title: '2. Blockchain Match Found',
                description: 'Scanner matched on-chain transaction to intent',
                source: 'Scanner',
                timestamp: payment.depositIntent.updated_at,
                icon: <CheckCircle2 className="w-5 h-5" />,
                color: 'bg-purple-600/30 text-purple-200 border-2 border-purple-500/50',
                details: [
                    { label: 'TX Hash', value: payment.depositIntent.matched_tx_hash.slice(0, 16) + '...' }
                ],
                warning: !payment.pendingTx ? 'CRITICAL: No PendingTransaction created - reconciliation needed' : null
            });
        }
    }
    
    // Step 3: PendingTransaction Created
    if (payment.pendingTx) {
        const source = payment.pendingTx.first_seen_at ? 
            (payment.depositIntent?.status === 'matched' ? 'Reconciliation' : 'Scanner') : 
            'Frontend';
            
        timeline.push({
            title: '3. Pending Transaction Recorded',
            description: `Created by ${source} - transaction now tracked`,
            source: source,
            timestamp: payment.pendingTx.created_at || payment.pendingTx.first_seen_at,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: 'bg-cyan-600/30 text-cyan-200 border-2 border-cyan-500/50',
            details: [
                { label: 'Status', value: payment.pendingTx.status },
                { label: 'TX Hash', value: payment.pendingTx.tx_hash?.slice(0, 16) + '...' || '—' },
                { label: 'Block Number', value: payment.pendingTx.block_number || '—' },
                { label: 'Verified Amount', value: payment.pendingTx.verified_amount ? `${payment.pendingTx.verified_amount} USDT` : '—' }
            ]
        });
        
        // Step 4: Status Transitions
        if (payment.pendingTx.status === 'processing') {
            const ageMinutes = Math.floor((Date.now() - new Date(payment.pendingTx.updated_at || payment.pendingTx.created_at).getTime()) / 60000);
            timeline.push({
                title: '4. Transaction Processing',
                description: `Awaiting confirmation depth (${ageMinutes} minutes elapsed)`,
                source: 'Settlement Worker',
                timestamp: payment.pendingTx.updated_at,
                icon: <Clock className="w-5 h-5 animate-pulse" />,
                color: 'bg-orange-600/30 text-orange-200 border-2 border-orange-500/50',
                details: [
                    { label: 'Retry Count', value: payment.pendingTx.retry_count || 0 },
                    { label: 'Time in Status', value: `${ageMinutes} minutes` }
                ],
                warning: ageMinutes > 15 ? `STALLED: Processing for ${ageMinutes} minutes` : null
            });
        }
        
        if (payment.pendingTx.status === 'failed') {
            timeline.push({
                title: '4. Transaction Failed',
                description: payment.pendingTx.error_message || 'Processing failed',
                source: 'Settlement Worker',
                timestamp: payment.pendingTx.updated_at,
                icon: <AlertTriangle className="w-5 h-5" />,
                color: 'bg-red-600/30 text-red-200 border-2 border-red-500/50',
                details: [
                    { label: 'Error', value: payment.pendingTx.error_message || 'Unknown' }
                ]
            });
        }
    }
    
    // Step 5: Credited to PoolInvestor
    if (payment.creditedAt) {
        timeline.push({
            title: '5. Funds Credited to Pool',
            description: 'Successfully settled to PoolInvestor balance',
            source: 'Settlement Worker',
            timestamp: payment.creditedAt,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: 'bg-green-600/30 text-green-200 border-2 border-green-500/50',
            details: [
                { label: 'Credited Amount', value: `${payment.creditedAmount} USDT` },
                { label: 'Pool Type', value: payment.pool_type }
            ]
        });
    }
    
    return timeline;
}

function TimeMetric({ label, value, status }) {
    const statusColors = {
        good: 'text-green-300',
        warning: 'text-orange-300',
        critical: 'text-red-300',
        neutral: 'text-cyan-300'
    };
    
    return (
        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-300 mb-2 font-medium">{label}</p>
            <p className={`text-lg font-bold ${statusColors[status]}`}>{value}</p>
        </div>
    );
}

function calculateTimeDiff(start, end) {
    if (!start || !end) return '—';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diffMs / 60000);
    return `${minutes} min`;
}

function calculateTimeSince(timestamp) {
    if (!timestamp) return '—';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diffMs / 60000);
    return `${minutes} min ago`;
}

function renderDiagnosticFlags(payment) {
    const flags = [];
    
    // Flag: Matched but no PendingTransaction
    if (payment.depositIntent?.status === 'matched' && !payment.pendingTx) {
        flags.push({
            severity: 'critical',
            message: '🚨 CRITICAL: DepositIntent matched but no PendingTransaction exists',
            action: 'Reconciliation automation should create PendingTransaction'
        });
    }
    
    // Flag: PendingTransaction stuck > 15 minutes
    if (payment.pendingTx && ['pending', 'verifying', 'processing'].includes(payment.pendingTx.status)) {
        const createdAt = new Date(payment.pendingTx.created_at || payment.pendingTx.first_seen_at);
        const ageMinutes = (Date.now() - createdAt.getTime()) / 60000;
        if (ageMinutes > 15) {
            flags.push({
                severity: 'warning',
                message: `⚠️ STALLED: PendingTransaction stuck in ${payment.pendingTx.status} for ${Math.floor(ageMinutes)} minutes`,
                action: 'Settlement worker should process or fail this transaction'
            });
        }
    }
    
    // Flag: Failed with error
    if (payment.pendingTx?.status === 'failed' && payment.pendingTx.error_message) {
        flags.push({
            severity: 'error',
            message: `❌ FAILED: ${payment.pendingTx.error_message}`,
            action: 'Manual investigation required'
        });
    }
    
    // Flag: Multiple intents
    if (payment.depositIntent && payment.depositIntent.wallet_address) {
        // This would require additional data, placeholder for now
    }
    
    if (flags.length === 0) return null;
    
    return (
        <div className="bg-orange-600/20 border-2 border-orange-500/50 rounded-lg p-5">
            <h3 className="text-base font-bold text-orange-200 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Diagnostic Flags ({flags.length})
            </h3>
            <ul className="space-y-3">
                {flags.map((flag, idx) => (
                    <li key={idx} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                        <p className="text-sm text-white font-semibold mb-1">{flag.message}</p>
                        {flag.action && (
                            <p className="text-xs text-gray-300">→ {flag.action}</p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}