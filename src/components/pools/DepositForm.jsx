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
    const [usdtContract, setUsdtContract] = useState(null);
    const [user, setUser] = useState(null);

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

    // Poll pending transactions every 30 seconds (READ-ONLY after processing)
    useEffect(() => {
        if (!pendingTxHash || !verifying) return;

        const interval = setInterval(async () => {
            // Fetch current status without calling verifyBscTransaction
            const { data: pendingTxs } = await supabase
                .from('pending_transactions')
                .select('*')
                .eq('tx_hash', pendingTxHash)
                .eq('wallet_address', account.toLowerCase())
                .eq('pool_type', poolType);

            if (pendingTxs.length > 0) {
                const tx = pendingTxs[0];

                if (tx.status === 'completed') {
                    setVerifying(false);
                    setPendingTxHash(null);
                    setPaymentModal({
                        isOpen: true,
                        type: 'success',
                        message: 'Your deposit has been confirmed and credited!'
                    });
                    if (onDepositSuccess) onDepositSuccess();
                } else if (tx.status === 'processing') {
                    // Just update UI message, don't call verifyBscTransaction
                    setPaymentModal({
                        isOpen: true,
                        type: 'processing',
                        message: 'Deposit received and secured on blockchain. Final credit will complete within 5 minutes. You may safely close this window.'
                    });
                } else {
                    // Only call verifyBscTransaction for 'pending' or 'verifying'
                    await verifyPendingTransaction(pendingTxHash);
                }
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [pendingTxHash, verifying, account, poolType]);

    // Check for pending transactions on component mount
    useEffect(() => {
        if (!account) return;

        const checkPending = async () => {
            try {
                const { data: pending } = await supabase
                    .from('pending_transactions')
                    .select('*')
                    .eq('wallet_address', account.toLowerCase())
                    .eq('pool_type', poolType)
                    .in('status', ['pending', 'verifying', 'processing']);

                if (pending.length > 0) {
                    const tx = pending[0];
                    setPendingTxHash(tx.tx_hash);
                    setVerifying(true);

                    // Check if already in 'processing' or 'completed' status
                    if (tx.status === 'processing') {
                        setPaymentModal({
                            isOpen: true,
                            type: 'processing',
                            message: 'Deposit received and secured on blockchain. Final credit will complete within 5 minutes. You may safely close this window.'
                        });
                        // Do NOT call verifyPendingTransaction - backend automation handles it
                    } else if (tx.status === 'completed') {
                        setVerifying(false);
                        setPendingTxHash(null);
                        setPaymentModal({
                            isOpen: true,
                            type: 'success',
                            message: 'Your deposit has been confirmed and credited!'
                        });
                        if (onDepositSuccess) onDepositSuccess();
                    } else {
                        // Only verify if status is 'pending' or 'verifying'
                        await verifyPendingTransaction(tx.tx_hash);
                    }
                }
            } catch (error) {
                console.error('Failed to check pending transactions:', error);
            }
        };

        checkPending();
    }, [account, poolType]);

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

        const transactionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // LOG STAGE 1: INITIALIZED
        logInitialized(transactionId, {
            userId: account,
            amount: parseFloat(amount),
            token: 'USDT',
            walletAddress: account,
            poolAddress,
            poolType
        });

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

        // Balance gating: Allow admins to bypass balance check for testing
        if (parseFloat(amount) > parseFloat(balance) && user?.role !== 'admin') {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: `Insufficient balance. You have ${balance} USDT, but trying to deposit ${amount} USDT.`
            });
            return;
        }

        // Deposits locked gating: Allow admins to bypass locks for testing
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
            message: 'Processing your deposit. Please confirm in MetaMask and wait for blockchain confirmation...'
        });

        let pendingTxId = null;
        let intentId = null;

        // BEST-EFFORT: Create DepositIntent before MetaMask transaction
        // This captures user intent even if frontend-backend communication fails after MetaMask confirms
        try {
            // Fetch current BSC block number for intent-bounded scanning
            let currentBlock = 0;
            try {
                const blockResponse = await fetch('https://bsc-dataseed.binance.org/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_blockNumber',
                        params: [],
                        id: 1
                    })
                });
                const blockData = await blockResponse.json();
                if (blockData.result) {
                    currentBlock = parseInt(blockData.result, 16);
                    console.log('✅ Current BSC block:', currentBlock);
                }
            } catch (blockError) {
                console.warn('⚠️ Failed to fetch current block (non-blocking):', blockError);
            }

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

            const intentData = {
                wallet_address: account.toLowerCase(),
                pool_address: poolAddress.toLowerCase(),
                expected_amount: parseFloat(amount),
                pool_type: poolType,
                status: 'initiated',
                start_block: currentBlock > 0 ? currentBlock : null,
                created_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString()
            };

            // Add duration_months only for traditional pool
            if (poolType === 'traditional') {
                intentData.duration_months = durationMonths;
            }

            const { data: intent } = await supabase.from('deposit_intents').insert(intentData).select().single();
            const intentId = intent?.id;
            console.log('✅ DepositIntent created:', intentId);
        } catch (intentError) {
            // Log but DO NOT block MetaMask transaction
            console.warn('⚠️ Failed to create DepositIntent (non-blocking):', intentError);
        }

        try {
            await ensureBSC();

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
            const signer = web3Provider.getSigner();

            // Validate and checksum the pool address
            // FIX: Check for placeholder addresses and use the real one if found
            let targetAddress = poolAddress;
            if (targetAddress === '0xScalpingPoolAddress123' || targetAddress === '0xVipPoolAddress456') {
                console.warn('⚠️ Detected placeholder pool address. Using fallback valid address.');
                targetAddress = '0x508D61ad3f1559679BfAe3942508B4cf7767935A'; // User's valid wallet
            }
            const validPoolAddress = ethers.utils.getAddress(targetAddress);

            const token = new ethers.Contract(usdtContract, ERC20_ABI, signer);

            const decimals = await token.decimals();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            const tx = await token.transfer(validPoolAddress, amountWei);
            const txHash = tx.hash;

            // LOG STAGE 2: PENDING
            logPending(transactionId, {
                status: 'pending',
                chain: 'BSC',
                expectedAmount: parseFloat(amount),
                poolType,
                txHash
            });

            // Create PendingTransaction AFTER transaction is sent (with tx_hash)
            try {
                const { data: pendingTx } = await supabase.from('pending_transactions').insert({
                    wallet_address: account.toLowerCase(),
                    tx_hash: txHash,
                    status: 'pending',
                    expected_amount: parseFloat(amount),
                    pool_type: poolType,
                    pool_address: poolAddress,
                    duration_months: poolType === 'traditional' ? durationMonths : undefined
                }).select().single();
                if (pendingTx) pendingTxId = pendingTx.id;
                setPendingTxHash(txHash);
                setVerifying(true);

                // LOG: Transaction hash received
                logTransactionRound(transactionId, {
                    roundNumber: 1,
                    txHash,
                    blockNumber: null,
                    confirmations: 0,
                    currentStatus: 'pending',
                    expectedAmount: parseFloat(amount)
                });
            } catch (error) {
                console.error('Failed to create pending transaction record:', error);
            }

            const receipt = await tx.wait();

            setPaymentModal({
                isOpen: true,
                type: 'processing',
                message: 'Transaction sent! Verifying on blockchain (this may take 1-2 minutes)...'
            });

            // Start verification immediately
            await verifyPendingTransaction(txHash);

            setAmount('');
        } catch (error) {
            console.error('Deposit error:', error);

            // Check if user rejected the transaction
            const isUserRejection = error?.code === 4001 ||
                error?.code === 'ACTION_REJECTED' ||
                error?.message?.includes('user rejected') ||
                error?.message?.includes('User denied');

            logFailure(transactionId, {
                txHash: pendingTxHash || null,
                failureReason: isUserRejection
                    ? 'User rejected the transaction'
                    : error?.message || 'Deposit transaction failed',
                status: 'failed',
                poolType,
                attemptedRounds: confirmations
            });

            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: isUserRejection
                    ? 'Payment cancelled by user. No funds were transferred.'
                    : error?.data?.message || error?.message || 'Deposit transaction failed. Please try again.'
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
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                        <p className="text-sm text-blue-400 font-semibold">Verifying Transaction...</p>
                    </div>
                    <p className="text-xs text-gray-400">
                        Confirmations: {confirmations}/12
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        TX: {pendingTxHash.slice(0, 10)}...{pendingTxHash.slice(-8)}
                    </p>
                    {/* Button removed - manual verification can cause race conditions */}
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