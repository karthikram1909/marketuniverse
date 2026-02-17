import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PoolAddressVerifier() {
    const [txHash, setTxHash] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const { data: allPoolSettings = [] } = useQuery({
        queryKey: ['allPoolSettings'],
        queryFn: () => base44.entities.PoolSettings.list(),
        staleTime: 60000
    });

    const handleVerifyTransaction = async () => {
        if (!txHash || txHash.length < 10) {
            setVerificationResult({
                status: 'error',
                message: 'Please enter a valid transaction hash'
            });
            return;
        }

        setIsVerifying(true);
        setVerificationResult(null);

        try {
            // Fetch pending transaction
            const pendingTxs = await base44.entities.PendingTransaction.filter({ tx_hash: txHash });
            
            if (pendingTxs.length === 0) {
                setVerificationResult({
                    status: 'error',
                    message: 'Transaction not found in PendingTransaction records'
                });
                setIsVerifying(false);
                return;
            }

            const pendingTx = pendingTxs[0];

            // Fetch blockchain data
            const rpcResponse = await fetch('https://bsc-dataseed.binance.org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                    id: 1
                })
            });

            const rpcData = await rpcResponse.json();

            if (!rpcData.result) {
                setVerificationResult({
                    status: 'error',
                    message: 'Transaction not found on blockchain (may be pending or invalid)'
                });
                setIsVerifying(false);
                return;
            }

            const receipt = rpcData.result;

            // Find USDT transfer event
            const TRANSFER_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
            const transferLog = receipt.logs.find(log => log.topics[0] === TRANSFER_SIGNATURE);

            if (!transferLog) {
                setVerificationResult({
                    status: 'error',
                    message: 'No USDT transfer found in transaction'
                });
                setIsVerifying(false);
                return;
            }

            const toAddress = ('0x' + transferLog.topics[2].slice(26)).toLowerCase();
            const expectedRecipient = pendingTx.pool_address?.toLowerCase();

            // Fetch corresponding pool settings
            const poolSettings = allPoolSettings.find(s => s.pool_type === pendingTx.pool_type);

            setVerificationResult({
                status: toAddress === expectedRecipient ? 'success' : 'mismatch',
                pendingTx: {
                    id: pendingTx.id,
                    pool_type: pendingTx.pool_type,
                    pool_address: expectedRecipient,
                    status: pendingTx.status,
                    expected_amount: pendingTx.expected_amount,
                    error_message: pendingTx.error_message
                },
                blockchain: {
                    to_address: toAddress,
                    status: receipt.status === '0x1' ? 'Success' : 'Failed',
                    block: parseInt(receipt.blockNumber, 16)
                },
                poolSettings: {
                    configured_address: poolSettings?.pool_address?.toLowerCase(),
                    exists: !!poolSettings
                },
                match: {
                    sent_to_correct_pool: toAddress === expectedRecipient,
                    db_matches_settings: expectedRecipient === poolSettings?.pool_address?.toLowerCase()
                }
            });
        } catch (error) {
            setVerificationResult({
                status: 'error',
                message: error.message || 'Failed to verify transaction'
            });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/5 via-black/40 to-cyan-500/5 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 mb-8"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Pool Address Diagnostic Tool</h2>
            </div>

            {/* Current Pool Settings Overview */}
            <div className="mb-6 space-y-3">
                <h3 className="text-white font-semibold">Current Pool Wallet Addresses:</h3>
                {allPoolSettings.map(setting => (
                    <div key={setting.id} className="bg-black/30 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-cyan-400 font-semibold capitalize">{setting.pool_type} Pool</span>
                            <span className="text-xs text-gray-400">ID: {setting.id}</span>
                        </div>
                        <div className="font-mono text-xs text-white bg-black/40 p-2 rounded break-all">
                            {setting.pool_address || <span className="text-red-400">NOT CONFIGURED</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Transaction Verification */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-4">
                <h3 className="text-white font-semibold mb-3">Verify Deposit Transaction</h3>
                <div className="flex gap-2 mb-4">
                    <Input
                        placeholder="Enter transaction hash (0x...)"
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        className="bg-white/5 border-white/10 text-white font-mono text-sm"
                    />
                    <Button
                        onClick={handleVerifyTransaction}
                        disabled={isVerifying || !txHash}
                        className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap"
                    >
                        {isVerifying ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            'Verify TX'
                        )}
                    </Button>
                </div>

                {verificationResult && (
                    <div className={`border rounded-xl p-4 ${
                        verificationResult.status === 'success' ? 'bg-green-500/10 border-green-500/30' :
                        verificationResult.status === 'mismatch' ? 'bg-red-500/10 border-red-500/30' :
                        'bg-yellow-500/10 border-yellow-500/30'
                    }`}>
                        {verificationResult.status === 'error' ? (
                            <div className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-yellow-400" />
                                <p className="text-yellow-400 font-semibold">{verificationResult.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Status Header */}
                                <div className="flex items-center gap-3">
                                    {verificationResult.status === 'success' ? (
                                        <>
                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                            <p className="text-green-400 font-bold text-lg">✅ Address Match - Valid Transaction</p>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-6 h-6 text-red-400" />
                                            <p className="text-red-400 font-bold text-lg">❌ Address Mismatch - Invalid Transaction</p>
                                        </>
                                    )}
                                </div>

                                {/* Database Record */}
                                <div className="bg-black/40 rounded-lg p-3">
                                    <p className="text-cyan-400 font-semibold mb-2">📝 Database Record (PendingTransaction):</p>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-300">Pool Type: <span className="text-white font-semibold">{verificationResult.pendingTx.pool_type}</span></p>
                                        <p className="text-gray-300">Expected Recipient: <span className="text-white font-mono text-xs break-all">{verificationResult.pendingTx.pool_address || 'NOT SET'}</span></p>
                                        <p className="text-gray-300">Status: <span className="text-white font-semibold">{verificationResult.pendingTx.status}</span></p>
                                        <p className="text-gray-300">Amount: <span className="text-white font-semibold">${verificationResult.pendingTx.expected_amount}</span></p>
                                        {verificationResult.pendingTx.error_message && (
                                            <p className="text-red-400 text-xs mt-2">Error: {verificationResult.pendingTx.error_message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Blockchain Data */}
                                <div className="bg-black/40 rounded-lg p-3">
                                    <p className="text-purple-400 font-semibold mb-2">⛓️ Blockchain Data:</p>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-300">Actual Recipient: <span className="text-white font-mono text-xs break-all">{verificationResult.blockchain.to_address}</span></p>
                                        <p className="text-gray-300">TX Status: <span className="text-white font-semibold">{verificationResult.blockchain.status}</span></p>
                                        <p className="text-gray-300">Block: <span className="text-white font-semibold">{verificationResult.blockchain.block}</span></p>
                                    </div>
                                </div>

                                {/* Pool Settings */}
                                <div className="bg-black/40 rounded-lg p-3">
                                    <p className="text-yellow-400 font-semibold mb-2">⚙️ Pool Settings:</p>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-300">Configured Address: <span className="text-white font-mono text-xs break-all">{verificationResult.poolSettings.configured_address || 'NOT SET'}</span></p>
                                        <p className="text-gray-300">Settings Exist: {verificationResult.poolSettings.exists ? <span className="text-green-400">✅ Yes</span> : <span className="text-red-400">❌ No</span>}</p>
                                    </div>
                                </div>

                                {/* Comparison Results */}
                                <div className="bg-black/40 rounded-lg p-3">
                                    <p className="text-white font-semibold mb-3">🔍 Validation Results:</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            {verificationResult.match.sent_to_correct_pool ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-400" />
                                            )}
                                            <p className={`text-sm ${verificationResult.match.sent_to_correct_pool ? 'text-green-400' : 'text-red-400'}`}>
                                                Blockchain recipient matches PendingTransaction.pool_address
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {verificationResult.match.db_matches_settings ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-400" />
                                            )}
                                            <p className={`text-sm ${verificationResult.match.db_matches_settings ? 'text-green-400' : 'text-red-400'}`}>
                                                PendingTransaction.pool_address matches PoolSettings.pool_address
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Diagnosis */}
                                {verificationResult.status === 'mismatch' && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                        <p className="text-red-400 font-bold mb-2">🚨 Problem Diagnosis:</p>
                                        <div className="text-sm text-gray-300 space-y-1">
                                            {!verificationResult.match.sent_to_correct_pool && (
                                                <p>• Funds were sent to <span className="text-red-400 font-mono">{verificationResult.blockchain.to_address}</span> instead of <span className="text-green-400 font-mono">{verificationResult.pendingTx.pool_address}</span></p>
                                            )}
                                            {!verificationResult.match.db_matches_settings && (
                                                <p>• PendingTransaction has wrong pool_address. Expected: <span className="text-green-400 font-mono">{verificationResult.poolSettings.configured_address}</span></p>
                                            )}
                                            <p className="mt-2 text-yellow-400">→ This transaction will be rejected as fraudulent by the verification system</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}