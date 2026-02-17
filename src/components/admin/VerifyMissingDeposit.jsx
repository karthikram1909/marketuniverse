import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VerifyMissingDeposit() {
    const [txHash, setTxHash] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [poolType, setPoolType] = useState('traditional');
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState(null);

    const handleVerify = async () => {
        if (!txHash || !walletAddress) {
            setResult({
                success: false,
                message: 'Please enter both transaction hash and wallet address'
            });
            return;
        }

        setIsVerifying(true);
        setResult(null);

        try {
            const response = await base44.functions.invoke('verifyMissingDeposit', {
                txHash: txHash.trim(),
                walletAddress: walletAddress.trim(),
                poolType
            });

            if (response.data.success) {
                setResult({
                    success: true,
                    message: response.data.message,
                    data: response.data.data
                });
                setTxHash('');
                setWalletAddress('');
            } else {
                setResult({
                    success: false,
                    message: response.data.error || 'Verification failed'
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.error || error.message || 'Failed to verify deposit'
            });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-cyan-500/5 via-black/40 to-blue-600/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl">
                    <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Verify Missing Deposit</h2>
                    <p className="text-sm text-gray-400">Manually verify and record deposits that didn't get saved</p>
                </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-200">
                        <p className="font-semibold mb-1">When to use this tool:</p>
                        <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                            <li>User reports money sent but not showing in dashboard</li>
                            <li>Transaction succeeded on blockchain but failed to save in database</li>
                            <li>Browser closed during deposit process</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Pool Type</label>
                    <select
                        value={poolType}
                        onChange={(e) => setPoolType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3"
                        disabled={isVerifying}
                    >
                        <option value="scalping">Crypto Pool</option>
                        <option value="traditional">Traditional Pool</option>
                        <option value="vip">VIP Pool</option>
                    </select>
                </div>

                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Wallet Address</label>
                    <Input
                        type="text"
                        placeholder="0x..."
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                        disabled={isVerifying}
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Transaction Hash</label>
                    <Input
                        type="text"
                        placeholder="0x..."
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                        disabled={isVerifying}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Get this from <a href="https://bscscan.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">BSCScan</a> or from the user
                    </p>
                </div>

                <Button
                    onClick={handleVerify}
                    disabled={isVerifying || !txHash || !walletAddress}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                >
                    {isVerifying ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying on Blockchain...
                        </>
                    ) : (
                        <>
                            <Search className="w-4 h-4 mr-2" />
                            Verify & Record Deposit
                        </>
                    )}
                </Button>
            </div>

            {result && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mt-6 p-4 rounded-xl border ${
                        result.success
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        {result.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                {result.success ? 'Success!' : 'Verification Failed'}
                            </p>
                            <p className="text-sm text-gray-300 mt-1">{result.message}</p>
                            {result.data && (
                                <div className="mt-3 space-y-1 text-xs text-gray-400">
                                    <p>Amount: <span className="text-green-400 font-semibold">${result.data.amount.toFixed(2)} USDT</span></p>
                                    <p>Timestamp: <span className="text-white">{new Date(result.data.timestamp).toLocaleString()}</span></p>
                                    <p>Investor: <span className="text-white">{result.data.investorName}</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}