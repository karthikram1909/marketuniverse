import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '../wallet/WalletContext';
import { Wallet, AlertCircle } from 'lucide-react';
import PaymentModal from '../staking/PaymentModal';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { logInitialized, logPending, logTransactionRound, logSuccess, logFailure } from '../utils/transactionLogger';
import { poolPaymentService } from '@/api/poolPaymentService';

// Pool deposit form component - handles USDT BEP-20 deposits
const BSC_PARAMS = {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
};

const ERC20_ABI = [
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)'
];

export default function DepositForm({ poolAddress, poolType, depositsLocked, onDepositSuccess, userInvestment, minAmount, maxAmount }) {
    const { account, connectWallet, isConnecting } = useWallet();
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState('0');
    const [isDepositing, setIsDepositing] = useState(false);
    const [provider, setProvider] = useState(null);
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: 'success', message: '' });
    const [durationMonths, setDurationMonths] = useState(userInvestment?.duration_months || 3);
    const [existingDuration, setExistingDuration] = useState(null);
    const [pendingTxHash, setPendingTxHash] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [confirmations, setConfirmations] = useState(0);
    const [targetConfirmations, setTargetConfirmations] = useState(2);
    const [usdtContract, setUsdtContract] = useState(null);
    const [user, setUser] = useState(null);
    const [intentId, setIntentId] = useState(null); // Add state for intent tracking

    // Fetch USDT contract address from PoolSettings
    const { data: poolSettings } = useQuery({
        queryKey: ['poolSettings', poolType],
        queryFn: async () => {
            const { data } = await supabase
                .from('pool_settings')
                .select('*')
                .eq('pool_type', poolType)
                .single();
            return data;
        },
        enabled: !!poolType,
        staleTime: 300000
    });

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    setUser({ ...user, ...profile });
                }
            } catch (error) {
                console.log('User not authenticated');
            }
        };
        loadUser();
    }, []);

    // Known BSC USDT Contract Address
    const BSC_USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';

    useEffect(() => {
        if (poolSettings?.usdt_contract) {
            // Intelligent check: If the configured contract matches the pool address, it's a configuration error.
            // Fallback to the known BSC USDT address in that case.
            if (poolAddress && poolSettings.usdt_contract.toLowerCase() === poolAddress.toLowerCase()) {
                console.warn("Configuration Error: USDT contract matches pool address. Using default BSC USDT contract.");
                setUsdtContract(BSC_USDT_CONTRACT);
            } else {
                setUsdtContract(poolSettings.usdt_contract);
            }
        } else {
            // Fallback if not configured
            setUsdtContract(BSC_USDT_CONTRACT);
        }
    }, [poolSettings, poolAddress]);

    // Initialize provider when account connects
    useEffect(() => {
        if (account && window.ethereum) {
            initProvider();
        }
    }, [account]);

    // Fetch balance when provider AND usdtContract are both available
    useEffect(() => {
        if (provider && usdtContract && account) {
            refreshBalance(provider);
        }
    }, [provider, usdtContract]);

    useEffect(() => {
        if (userInvestment && poolType === 'traditional') {
            const endDate = new Date(userInvestment.investment_end_date);
            const now = new Date();
            if (endDate > now) {
                setExistingDuration(userInvestment.duration_months);
                setDurationMonths(userInvestment.duration_months);
            } else {
                setExistingDuration(null);
            }
        }
    }, [userInvestment, poolType]);

    // Poll for active intent status
    useEffect(() => {
        if (!intentId) return;

        let isMounted = true;
        const interval = setInterval(async () => {
            try {
                const statusData = await poolPaymentService.checkPaymentStatus(intentId);

                if (!isMounted) return;

                if (statusData.status === 'CONFIRMED' || statusData.status === 'COMPLETED') {
                    // Finalize if confirmed (idempotent)
                    clearInterval(interval);
                    setVerifying(false);

                    // If already completed in DB (COMPLETED), just success
                    if (statusData.status === 'COMPLETED') {
                        setPaymentModal({
                            isOpen: true,
                            type: 'success',
                            message: 'Your deposit has been confirmed and credited!'
                        });
                        setIntentId(null);
                        setPendingTxHash(null);
                        if (onDepositSuccess) onDepositSuccess();
                        return;
                    }

                    setPaymentModal({
                        isOpen: true,
                        type: 'processing',
                        message: 'Payment confirmed! Finalizing deposit...'
                    });

                    try {
                        await poolPaymentService.finalizeDeposit(intentId);
                        setPaymentModal({
                            isOpen: true,
                            type: 'success',
                            message: 'Your deposit has been successfully credited!'
                        });
                        if (onDepositSuccess) onDepositSuccess();
                    } catch (err) {
                        console.error('Finalize error:', err);
                        // If error is "already processed", treat as success
                        if (err.message && err.message.includes('already processed')) {
                            setPaymentModal({
                                isOpen: true,
                                type: 'success',
                                message: 'Your deposit has been successfully credited!'
                            });
                        } else {
                            setPaymentModal({
                                isOpen: true,
                                type: 'error',
                                message: 'Deposit confirmed but finalization failed. Please contact support.'
                            });
                        }
                    }
                    setIntentId(null);
                    setPendingTxHash(null);

                } else if (statusData.status === 'CONFIRMING') {
                    setConfirmations(statusData.confirmations || 0);
                    if (statusData.target_confirmations) setTargetConfirmations(statusData.target_confirmations);
                    setVerifying(true);
                } else if (statusData.status === 'FAILED') {
                    clearInterval(interval);
                    setVerifying(false);
                    setPaymentModal({
                        isOpen: true,
                        type: 'error',
                        message: 'Payment verification failed on blockchain.'
                    });
                    setIntentId(null);
                }

                if (statusData.tx_hash && !pendingTxHash) {
                    setPendingTxHash(statusData.tx_hash);
                }

            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000); // 3 seconds

        return () => { isMounted = false; clearInterval(interval); };
    }, [intentId, onDepositSuccess]);

    // Check for active intent on mount (Recovery)
    useEffect(() => {
        if (!user?.id || !poolType) return;

        const checkActive = async () => {
            try {
                const activeIntent = await poolPaymentService.getActiveIntent(user.id, poolType);
                if (activeIntent) {
                    console.log('✅ Recovered active intent:', activeIntent.id);
                    setIntentId(activeIntent.id);
                    setVerifying(true);
                    if (activeIntent.tx_hash) setPendingTxHash(activeIntent.tx_hash);

                    setPaymentModal({
                        isOpen: true,
                        type: 'processing',
                        message: 'Resuming verification for previous deposit...'
                    });
                }
            } catch (e) {
                console.error('Error recovering intent:', e);
            }
        };

        checkActive();
    }, [user, poolType]);

    const initProvider = async () => {
        try {
            // Load ethers dynamically if not available
            if (!window.ethers) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const { ethers } = window;
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            // Don't fetch balance here - let the effect handle it
        } catch (error) {
            console.error('Provider init error:', error);
        }
    };

    const refreshBalance = async (web3Provider) => {
        try {
            if (!usdtContract) return;
            const { ethers } = window;
            const signer = web3Provider.getSigner();
            const token = new ethers.Contract(usdtContract, ERC20_ABI, signer);
            const decimals = await token.decimals();
            const bal = await token.balanceOf(account);
            const formatted = ethers.utils.formatUnits(bal, decimals);
            // Display balance in decimal form for user
            setBalance(parseFloat(formatted).toFixed(2));
        } catch (error) {
            console.error('Balance refresh error:', error);
        }
    };

    const verifyPendingTransaction = async (txHash) => {
        let pendingTx = null;
        try {
            // Fetch the pending transaction to check current status
            const { data: pendingTxs } = await supabase
                .from('pending_transactions')
                .select('*')
                .eq('tx_hash', txHash)
                .eq('wallet_address', account.toLowerCase())
                .eq('pool_type', poolType);

            pendingTx = pendingTxs.length > 0 ? pendingTxs[0] : null;

            // RACE CONDITION FIX: If status is 'processing', stop calling verifyBscTransaction
            // Backend automation (processConfirmedPoolPayments) now owns the transaction
            if (pendingTx?.status === 'processing') {
                setPaymentModal({
                    isOpen: true,
                    type: 'processing',
                    message: 'Deposit received and secured on blockchain. Final credit will complete within 5 minutes. You may safely close this window.'
                });
                return; // Exit early - no further verification needed
            }

            // If completed, stop verifying and notify success
            if (pendingTx?.status === 'completed') {
                setVerifying(false);
                setPendingTxHash(null);
                setPaymentModal({
                    isOpen: true,
                    type: 'success',
                    message: 'Your deposit has been confirmed and credited!'
                });
                if (onDepositSuccess) onDepositSuccess();
                return;
            }

            // MULTI-TAB FIX: Use stored expected_amount, not React state
            const effectiveAmount = pendingTx?.expected_amount;

            // Only call verifyBscTransaction for 'pending' or 'verifying' status
            logTransactionRound(txHash, {
                roundNumber: confirmations + 1,
                txHash,
                confirmations,
                currentStatus: 'verifying',
                expectedAmount: effectiveAmount  // ✅ SAFE: Uses database value
            });

            const pendingTxId = pendingTx?.id || null;

            // MULTI-TAB FIX: Always use database stored value when available
            const verificationAmount = effectiveAmount || parseFloat(amount);

            if (!verificationAmount || verificationAmount <= 0) {
                throw new Error('Expected amount not available for verification');
            }

            const { data: result, error } = await supabase.rpc('confirm_bsc_deposit', {
                p_tx_hash: txHash,
                p_amount: verificationAmount,
                p_wallet_address: account,
                p_pool_type: poolType,
                p_pool_address: poolAddress,
                p_duration_months: poolType === 'traditional' ? durationMonths : null,
                p_pending_tx_id: pendingTxId
            });

            if (error) throw error;

            if (result.status === 'success' && result.verified) {
                // Transaction has been verified and moved to 'processing'
                // Backend automation now handles final confirmation and crediting
                setPaymentModal({
                    isOpen: true,
                    type: 'processing',
                    message: 'Deposit received and secured on blockchain. Final credit will complete shortly.'
                });
            } else if (result.status === 'error' || !result.verified) {
                setVerifying(false);
                setPendingTxHash(null);

                logFailure(txHash, {
                    txHash,
                    failureReason: result.message || 'Transaction verification failed',
                    status: 'failed',
                    poolType,
                    attemptedRounds: confirmations
                });

                setPaymentModal({
                    isOpen: true,
                    type: 'error',
                    message: result.message || 'Transaction verification failed'
                });
            }
        } catch (error) {
            console.error('Verification error:', error);
            const effectiveAmount = pendingTx?.expected_amount;  // ✅ SAFE: Use database value in catch block
            logFailure(txHash, {
                txHash,
                failureReason: error.message || 'Verification request failed',
                status: 'failed',
                poolType,
                attemptedRounds: confirmations,
                expectedAmount: effectiveAmount  // ✅ SAFE: Added for logging completeness
            });
        }
    };

    const ensureBSC = async () => {
        if (!window.ethereum) throw new Error('MetaMask not found');
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BSC_PARAMS.chainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BSC_PARAMS.chainId }]
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [BSC_PARAMS]
                    });
                } else {
                    throw switchError;
                }
            }
        }
    };



    const handleDeposit = async () => {
        // Validate prerequisites first
        if (!usdtContract) {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: 'Unable to load USDT contract address. Please try again.'
            });
            return;
        }

        if (!account) {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: 'Wallet not connected. Please connect your wallet first.'
            });
            return;
        }

        if (!poolAddress) {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: 'Pool address not available. Please refresh the page.'
            });
            return;
        }

        // Basic validations
        if (!amount || parseFloat(amount) <= 0) {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: 'Please enter a valid amount to deposit.'
            });
            return;
        }

        if (minAmount && parseFloat(amount) < minAmount) {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: `Minimum deposit amount is ${minAmount} USDT.`
            });
            return;
        }

        if (maxAmount && parseFloat(amount) > maxAmount) {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: `Maximum deposit amount is ${maxAmount} USDT.`
            });
            return;
        }

        // Balance check
        if (parseFloat(amount) > parseFloat(balance) && user?.role !== 'admin') {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: `Insufficient balance. You have ${balance} USDT, but trying to deposit ${amount} USDT.`
            });
            return;
        }

        // Lock check
        if (depositsLocked && user?.role !== 'admin') {
            setPaymentModal({
                isOpen: true,
                type: 'warning',
                message: 'Deposits are currently locked by admin. Please try again later.'
            });
            return;
        }

        setIsDepositing(true);
        setPaymentModal({
            isOpen: true,
            type: 'processing',
            message: 'Initializing deposit. Please confirm in MetaMask...'
        });

        try {
            await ensureBSC();

            // 1. Create Payment Intent FIRST (DB state)
            const intent = await poolPaymentService.createPaymentIntent({
                amount: parseFloat(amount),
                poolType,
                userAddress: account,
                poolAddress,
                durationMonths: poolType === 'traditional' ? durationMonths : null
            });

            console.log('✅ Payment Intent Created:', intent.id);
            setIntentId(intent.id);

            // 2. Perform Blockchain Transaction
            const { ethers } = window;
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = web3Provider.getSigner();

            // Validate pool address
            let targetAddress = poolAddress;
            if (targetAddress === '0xScalpingPoolAddress123' || targetAddress === '0xVipPoolAddress456') {
                // Fallback for demo environment
                targetAddress = '0x508D61ad3f1559679BfAe3942508B4cf7767935A';
            }
            const validPoolAddress = ethers.utils.getAddress(targetAddress);
            const token = new ethers.Contract(usdtContract, ERC20_ABI, signer);
            const decimals = await token.decimals();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            const tx = await token.transfer(validPoolAddress, amountWei);
            const txHash = tx.hash;
            console.log('✅ Transaction Sent:', txHash);

            // 3. Link TxHash to Intent
            await poolPaymentService.updateTxHash(intent.id, txHash);

            // 4. Update UI to Verifying State
            setPendingTxHash(txHash);
            setVerifying(true);
            setPaymentModal({
                isOpen: true,
                type: 'processing',
                message: 'Transaction sent! Verifying on blockchain...'
            });

            setAmount(''); // Clear input

        } catch (error) {
            console.error('Deposit error:', error);

            const isUserRejection = error?.code === 4001 || error?.message?.includes('user rejected');

            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: isUserRejection
                    ? 'Payment cancelled by user.'
                    : (error?.data?.message || error?.message || 'Deposit failed. Please try again.')
            });
        } finally {
            setIsDepositing(false);
        }
    };

    if (!account) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/60 border border-red-500/20 rounded-2xl p-4 sm:p-8 backdrop-blur-xl w-full"
            >
                <div className="text-center w-full">
                    <Wallet className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-400 mb-6">
                        Connect your MetaMask wallet to view your stats and make deposits
                    </p>
                    <Button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className="relative px-12 py-6 text-xl font-bold rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        {/* Glass reflection */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)'
                            }}
                        />

                        {/* Button text with gradient */}
                        <span className="relative z-10 flex items-center gap-3 font-semibold tracking-wide bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent">
                            <Wallet className="w-5 h-5" style={{ color: '#dc2626' }} />
                            {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
                        </span>
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 border border-red-500/20 rounded-2xl p-4 sm:p-8 backdrop-blur-xl"
        >
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Deposit USDT (BEP-20)</h3>

            <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Your Balance</span>
                    <span className="text-white font-semibold">{balance} USDT</span>
                </div>
                {poolAddress && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Pool Address</span>
                        <a
                            href={`https://bscscan.com/address/${poolAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:underline text-xs"
                        >
                            {poolAddress.slice(0, 6)}...{poolAddress.slice(-4)}
                        </a>
                    </div>
                )}
            </div>

            {depositsLocked && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-400">
                        {user?.role === 'admin' ? 'Admin mode: Deposits allowed for testing' : 'Deposits are currently locked'}
                    </p>
                </div>
            )}

            {verifying && pendingTxHash && (
                <div className="mb-6 p-6 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/30 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-bold">Verifying Payment</p>
                                <p className="text-xs text-blue-400/80">Blockchain Finality check</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-mono font-bold text-white">{confirmations}<span className="text-gray-500 text-sm">/{targetConfirmations}</span></p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Confirmations</p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((confirmations / targetConfirmations) * 100, 100)}%` }}
                                transition={{ type: "spring", bounce: 0, duration: 1 }}
                            />
                        </div>
                    </div>

                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>TRANSACTION HASH</span>
                            <a
                                href={`https://bscscan.com/tx/${pendingTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:underline flex items-center gap-1"
                            >
                                VIEW ON BSCSCAN
                                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mt-1 break-all select-all">
                            {pendingTxHash}
                        </p>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center mt-4 italic">
                        🔒 Your funds are secured on-chain. Finalizing once 6 confirmations are reached.
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {poolType === 'traditional' && (
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Investment Duration</label>
                        {existingDuration ? (
                            <>
                                <div className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-3 flex items-center justify-between">
                                    <span>{existingDuration} Month{existingDuration > 1 ? 's' : ''}</span>
                                    <span className="text-xs text-yellow-400">Locked</span>
                                </div>
                                <p className="text-xs text-yellow-500 mt-2">
                                    You already have an active investment. You must wait until {new Date(userInvestment.investment_end_date).toLocaleDateString()} to change your duration.
                                </p>
                            </>
                        ) : (
                            <>
                                <select
                                    value={durationMonths}
                                    onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-3"
                                    disabled={(depositsLocked && user?.role !== 'admin') || isDepositing}
                                >
                                    <option value={1}>1 Month</option>
                                    <option value={3}>3 Months</option>
                                    <option value={6}>6 Months</option>
                                    <option value={12}>12 Months</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    Your investment will be locked for {durationMonths} month{durationMonths > 1 ? 's' : ''}
                                </p>
                            </>
                        )}
                    </div>
                )}

                <div>
                    <Input
                        type="number"
                        placeholder="Amount (USDT)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                        disabled={(depositsLocked && user?.role !== 'admin') || isDepositing}
                    />
                    {(minAmount || maxAmount) && (
                        <p className="text-xs text-gray-400 mt-2">
                            {minAmount && maxAmount ? `Min: ${minAmount} USDT | Max: ${maxAmount} USDT` :
                                minAmount ? `Minimum deposit: ${minAmount} USDT` :
                                    `Maximum deposit: ${maxAmount} USDT`}
                        </p>
                    )}
                </div>

                <Button
                    onClick={handleDeposit}
                    disabled={(depositsLocked && user?.role !== 'admin') || isDepositing || !amount || verifying || !usdtContract}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white border-0 rounded-xl py-6"
                >
                    {!usdtContract ? 'Loading...' : verifying ? 'Verifying Previous Payment...' : isDepositing ? 'Processing...' : 'Deposit to Pool'}
                </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
                * Deposits are made to the pool address. Make sure you're on BNB Smart Chain network.
            </p>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={paymentModal.isOpen}
                type={paymentModal.type}
                message={paymentModal.message}
                onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}
            />
        </motion.div>
    );
}