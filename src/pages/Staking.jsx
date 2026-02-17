import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletProvider, useWallet } from '../components/wallet/WalletContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
    Wallet, TrendingUp, Clock, DollarSign, AlertTriangle,
    CheckCircle, Calendar, Coins, Shield, ArrowLeft, Home
} from 'lucide-react';
import PaymentModal from '../components/staking/PaymentModal';
import InsufficientBalanceModal from '../components/staking/InsufficientBalanceModal';
import CancelContractModal from '../components/staking/CancelContractModal';

const CRYPTO_CONTRACTS = {
    BTC: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    XRP: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE'
};

const CRYPTO_LOGOS = {
    BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    USDC: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.png'
};

const STAKING_PLANS = [
    { months: 3, apy: 0.06, penaltyRate: 0.30, label: '3 Months', apyDisplay: '6% APY', periodReturn: '~1.45%' },
    { months: 6, apy: 0.07, penaltyRate: 0.40, label: '6 Months', apyDisplay: '7% APY', periodReturn: '~3.4%' },
    { months: 12, apy: 0.08, penaltyRate: 0.50, label: '12 Months', apyDisplay: '8% APY', periodReturn: '8%' }
];

const BSC_PARAMS = {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
};

const ERC20_ABI = [
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)'
];

function StakingContent() {
    const { account, connectWallet, isConnecting } = useWallet();
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);

    // Load current user
    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
                    setUser({ ...authUser, ...profile });
                }
            } catch (error) {
                console.log('User not authenticated');
            }
        };
        loadUser();
    }, []);

    const [selectedCrypto, setSelectedCrypto] = useState('BTC');
    const [selectedPlan, setSelectedPlan] = useState(STAKING_PLANS[0]);
    const [amount, setAmount] = useState('');
    const [projectedEarnings, setProjectedEarnings] = useState(0);
    const [isStaking, setIsStaking] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: 'success', message: '' });
    const [insufficientBalanceModal, setInsufficientBalanceModal] = useState({
        isOpen: false,
        cryptoType: '',
        requiredAmount: 0,
        currentBalance: 0
    });
    const [cancelModal, setCancelModal] = useState({
        isOpen: false,
        contract: null
    });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [pendingTxHash, setPendingTxHash] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [confirmations, setConfirmations] = useState(0);

    // Fetch staking settings
    const { data: settings } = useQuery({
        queryKey: ['stakingSettings'],
        queryFn: async () => {
            const { data } = await supabase.from('pool_settings').select('*').eq('pool_type', 'staking').maybeSingle();
            return data || null;
        },
        staleTime: 300000,
        refetchOnWindowFocus: false
    });

    // Fetch user's staking contracts
    const { data: contracts = [] } = useQuery({
        queryKey: ['stakingContracts', account],
        queryFn: async () => {
            if (!account) return [];
            const { data } = await supabase.from('staking_contracts').select('*').eq('wallet_address', account.toLowerCase()).order('start_date', { ascending: false });
            return data || [];
        },
        enabled: !!account,
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    // Calculate projected earnings with proper daily compounding
    useEffect(() => {
        const amt = parseFloat(amount || '0');
        if (amt > 0) {
            const principal = amt;
            const days = selectedPlan.months * 30;
            const dailyRate = Math.pow(1 + selectedPlan.apy, 1 / 365) - 1;
            const finalValue = principal * Math.pow(1 + dailyRate, days);
            const earnings = finalValue - principal;
            setProjectedEarnings(earnings);
        } else {
            setProjectedEarnings(0);
        }
    }, [amount, selectedPlan]);

    // Create staking contract mutation
    const createStakingMutation = useMutation({
        mutationFn: async ({ amount: stakeAmount, txHash }) => {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + selectedPlan.months);

            const { data: { user: authUser } } = await supabase.auth.getUser();

            const { data, error } = await supabase.from('staking_contracts').insert({
                user_id: authUser?.id,
                wallet_address: account.toLowerCase(),
                crypto_type: selectedCrypto,
                staked_amount: parseFloat(stakeAmount),
                duration_months: selectedPlan.months,
                apy_rate: selectedPlan.apy,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                current_value: parseFloat(stakeAmount),
                total_earned: 0,
                last_update: startDate.toISOString(),
                tx_hash: txHash
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stakingContracts'] });
            setAmount('');
        }
    });

    // Update contract earnings mutation
    const updateEarningsMutation = useMutation({
        mutationFn: async (contract) => {
            const now = new Date();
            const startDate = new Date(contract.start_date);
            const endDate = new Date(contract.end_date);

            const daysSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            const dailyRate = Math.pow(1 + (contract.apy_rate || contract.apy || 0), 1 / 365) - 1;

            const currentValue = contract.staked_amount * Math.pow(1 + dailyRate, daysSinceStart);
            const totalEarned = currentValue - contract.staked_amount;

            const status = now >= endDate ? 'completed' : 'active';

            const { data, error } = await supabase.from('staking_contracts').update({
                current_value: currentValue,
                total_earned: totalEarned,
                last_update: now.toISOString(),
                status: status
            }).eq('id', contract.id).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stakingContracts'] });
        }
    });

    // Cancel contract mutation
    const cancelContractMutation = useMutation({
        mutationFn: async (contract) => {
            if (!contract) return null;
            const now = new Date();
            const startDate = new Date(contract.start_date);
            const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const plan = STAKING_PLANS.find(p => p.months === contract.duration_months);
            if (!plan) throw new Error('Plan not found');

            let penalty;
            if (daysSinceStart <= 7) {
                penalty = contract.staked_amount * plan.penaltyRate;
            } else if (daysSinceStart <= 28) {
                penalty = (contract.staked_amount + (contract.total_earned || 0)) * plan.penaltyRate;
            } else {
                penalty = (contract.total_earned || 0) * plan.penaltyRate;
            }

            const finalValue = contract.staked_amount + (contract.total_earned || 0) - penalty;

            const { data, error } = await supabase.from('staking_contracts').update({
                status: 'cancelled',
                cancelled_date: now.toISOString(),
                penalty_paid: penalty,
                current_value: finalValue,
                total_earned: contract.total_earned
            }).eq('id', contract.id).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stakingContracts'] });
        }
    });

    const verifyPendingTransaction = async (txHash) => {
        setVerifying(false);
        setPendingTxHash(null);

        try {
            await createStakingMutation.mutateAsync({ amount, txHash });
            setPaymentModal({
                isOpen: true,
                type: 'success',
                message: `Your staking contract has been confirmed!`
            });
        } catch (error) {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to create staking contract'
            });
        }
    };

    const ensureBSC = async () => {
        // @ts-ignore
        if (!window.ethereum) throw new Error('MetaMask not found');
        // @ts-ignore
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BSC_PARAMS.chainId) {
            try {
                // @ts-ignore
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BSC_PARAMS.chainId }]
                });
            } catch (e) {
                // @ts-ignore
                if (e.code === 4902) {
                    // @ts-ignore
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [BSC_PARAMS]
                    });
                } else {
                    throw e;
                }
            }
        }
    };

    const handleStake = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: 'Please enter a valid amount to stake.'
            });
            return;
        }

        if (!window.ethereum) {
            setPaymentModal({
                isOpen: true,
                type: 'error',
                message: 'MetaMask not found. Please install MetaMask to continue.'
            });
            return;
        }

        const companyWallet = settings?.pool_address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

        setIsStaking(true);

        setPaymentModal({
            isOpen: true,
            type: 'processing',
            message: 'Processing your staking transaction. Please confirm in MetaMask and wait for blockchain confirmation...'
        });

        try {
            await ensureBSC();

            // @ts-ignore
            if (!window.ethers) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            // @ts-ignore
            const provider = new window.ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            // @ts-ignore
            const validCompanyWallet = window.ethers.utils.getAddress(companyWallet);

            // @ts-ignore
            const tokenContract = new window.ethers.Contract(
                CRYPTO_CONTRACTS[selectedCrypto],
                ERC20_ABI,
                signer
            );

            const decimals = await tokenContract.decimals();
            // @ts-ignore
            const amountWei = window.ethers.utils.parseUnits(amount, decimals);

            const balance = await tokenContract.balanceOf(account);
            if (balance.lt(amountWei)) {
                const balanceFormatted = parseFloat(window.ethers.utils.formatUnits(balance, decimals));
                setInsufficientBalanceModal({
                    isOpen: true,
                    cryptoType: selectedCrypto,
                    requiredAmount: parseFloat(amount),
                    currentBalance: balanceFormatted
                });
                setIsStaking(false);
                setPaymentModal({ isOpen: false, type: '', message: '' });
                return;
            }

            const tx = await tokenContract.transfer(validCompanyWallet, amountWei);
            setPendingTxHash(tx.hash);
            setVerifying(true);

            const receipt = await tx.wait();
            const txHash = receipt.transactionHash || tx.hash;

            setPaymentModal({
                isOpen: true,
                type: 'processing',
                message: 'Transaction sent! Verifying on blockchain...'
            });

            await verifyPendingTransaction(txHash);

            setAmount('');
        } catch (error) {
            console.error('Staking error:', error);
            const isUserRejection = error?.code === 4001 || error?.code === 'ACTION_REJECTED';

            if (error?.message?.includes('exceeds balance')) {
                setInsufficientBalanceModal({
                    isOpen: true,
                    cryptoType: selectedCrypto,
                    requiredAmount: parseFloat(amount),
                    currentBalance: 0
                });
            } else {
                setPaymentModal({
                    isOpen: true,
                    type: 'error',
                    message: isUserRejection
                        ? 'Payment cancelled by user.'
                        : error?.message || 'Staking transaction failed.'
                });
            }
        } finally {
            setIsStaking(false);
        }
    };

    const handleUpdateContract = async (contract) => {
        await updateEarningsMutation.mutateAsync(contract);
    };

    const handleCancelContract = (contract) => {
        setCancelModal({
            isOpen: true,
            contract
        });
    };

    const confirmCancelContract = async () => {
        const contract = cancelModal.contract;
        if (!contract) return;

        const now = new Date();
        const startDate = new Date(contract.start_date);
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const plan = STAKING_PLANS.find(p => p.months === contract.duration_months);

        let penalty;
        if (daysSinceStart <= 7) {
            penalty = contract.staked_amount * plan.penaltyRate;
        } else if (daysSinceStart <= 28) {
            penalty = (contract.staked_amount + contract.total_earned) * plan.penaltyRate;
        } else {
            penalty = contract.total_earned * plan.penaltyRate;
        }

        const returnAmount = contract.staked_amount + contract.total_earned - penalty;

        await cancelContractMutation.mutateAsync(contract);

        try {
            await supabase.from('notifications').insert([
                {
                    wallet_address: account.toLowerCase(),
                    email: user?.email,
                    type: 'staking_cancel',
                    title: 'Staking Contract Cancelled',
                    message: `Your ${contract.crypto_type} staking contract has been cancelled. Penalty: ${penalty.toFixed(6)} ${contract.crypto_type}. Available to withdraw: ${returnAmount.toFixed(6)} ${contract.crypto_type}`,
                    amount: returnAmount,
                    read: false,
                    is_admin: false
                }
            ]);
        } catch (error) {
            console.warn('Failed to create cancel notification:', error);
        }

        setCancelModal({ isOpen: false, contract: null });
        setPaymentModal({
            isOpen: true,
            type: 'warning',
            message: `Contract cancelled. Penalty: ${penalty.toFixed(6)}. Amount: ${returnAmount.toFixed(6)}`
        });
    };

    useEffect(() => {
        if (!contracts.length) return;
        const now = new Date();
        contracts.forEach(contract => {
            if (contract.status !== 'active') return;
            const lastUpdate = new Date(contract.last_update);
            const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate >= 24) {
                updateEarningsMutation.mutate(contract);
            }
        });
    }, [contracts]);

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const getTimeRemaining = (endDate) => {
        if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const now = new Date();
        const end = new Date(endDate);
        const diff = end.getTime() - now.getTime();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return { days, hours, minutes, seconds };
    };

    const getDailyEarnings = (contract) => {
        if (!contract?.apy_rate || !contract?.current_value) return 0;
        const dailyRate = Math.pow(1 + contract.apy_rate, 1 / 365) - 1;
        return contract.current_value * dailyRate;
    };

    if (!account) {
        return (
            <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-6">
                <div className="text-center max-w-md relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-8">
                        <Wallet className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
                    <Button onClick={connectWallet} disabled={isConnecting} size="lg" className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl px-8">
                        <Wallet className="w-5 h-5 mr-2" />
                        {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black relative overflow-hidden px-4 sm:px-6 py-8">
            <div className="max-w-7xl mx-auto relative z-10 w-full">
                <div className="flex gap-3 mb-6">
                    <Link to={createPageUrl('Dashboard')}>
                        <Button variant="ghost" className="text-red-400 hover:text-red-300">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Link to={createPageUrl('Landing')}>
                        <Button variant="ghost" className="text-red-400 hover:text-red-300">
                            <Home className="w-4 h-4 mr-2" />
                            Home
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div className="flex-1">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Crypto Staking</h1>
                        <p className="text-gray-400">Stake your crypto and earn compound interest</p>
                    </div>
                    {user?.role === 'admin' && (
                        <Link to={createPageUrl('StakingAdmin')}>
                            <Button className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl">
                                <Shield className="w-4 h-4 mr-2" />
                                Admin View
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-black/60 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Coins className="w-6 h-6 text-red-500" />
                                Stake Crypto
                            </h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-5 gap-2">
                                    {Object.keys(CRYPTO_CONTRACTS).map(crypto => (
                                        <button
                                            key={crypto}
                                            onClick={() => setSelectedCrypto(crypto)}
                                            className={`flex flex-col items-center p-2 rounded-xl border transition-all ${selectedCrypto === crypto ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <img src={CRYPTO_LOGOS[crypto]} alt={crypto} className="w-6 h-6 mb-1" />
                                            <span className="text-[10px] text-white font-bold">{crypto}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {STAKING_PLANS.map(plan => (
                                        <button
                                            key={plan.months}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`p-3 rounded-xl border text-center transition-all ${selectedPlan.months === plan.months ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="text-white font-bold text-xs">{plan.label}</div>
                                            <div className="text-red-400 text-[10px] font-bold">{plan.apyDisplay}</div>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Amount to Stake</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="bg-white/5 border-white/10 text-white h-12"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                                            {selectedCrypto}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Estimated Earnings:</span>
                                        <span className="text-green-400 font-bold">+{projectedEarnings.toFixed(6)} {selectedCrypto}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Total Reward:</span>
                                        <span className="text-white font-bold">{(parseFloat(amount || 0) + projectedEarnings).toFixed(6)} {selectedCrypto}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleStake}
                                    disabled={isStaking || !amount || verifying}
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white h-12 rounded-xl font-bold"
                                >
                                    {isStaking || verifying ? 'Processing...' : 'Start Staking Now'}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-black/60 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-red-500" />
                                Why Stake with Us?
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    { title: 'Compound Interest', desc: 'Daily automated compounding strategy' },
                                    { title: 'Secure Assets', desc: 'Audited smart contracts and cold storage' },
                                    { title: 'Flexible Terms', desc: 'Choose from 3, 6, or 12 month plans' }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-3 h-3 text-red-500" />
                                        </div>
                                        <div>
                                            <div className="text-white text-xs font-bold">{item.title}</div>
                                            <div className="text-gray-400 text-[10px]">{item.desc}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-black/60 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-xl font-bold text-white mb-6">Your Active Contracts</h3>
                            <div className="space-y-4">
                                {contracts.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                                        No active staking contracts found.
                                    </div>
                                ) : (
                                    contracts.map(contract => (
                                        <div key={contract.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-red-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/10">
                                                        <img src={CRYPTO_LOGOS[contract.crypto_type]} alt={contract.crypto_type} className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold">{contract.crypto_type} {contract.duration_months}M</div>
                                                        <div className="text-gray-400 text-[10px]">Staked on {new Date(contract.start_date).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-green-400 font-bold">+{contract.total_earned.toFixed(6)}</div>
                                                    <div className="text-[10px] text-gray-400">Total Profit Earned</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-4 mb-4">
                                                <div>
                                                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Staked</div>
                                                    <div className="text-white font-bold text-sm">{contract.staked_amount.toFixed(4)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">APY Rate</div>
                                                    <div className="text-red-400 font-bold text-sm">{(contract.apy_rate || contract.apy || 0) * 100}%</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Status</div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${contract.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                        }`}>{contract.status.toUpperCase()}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="flex gap-2 text-[10px] text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Ends in: {getTimeRemaining(contract.end_date).days}d {getTimeRemaining(contract.end_date).hours}h</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" className="h-8 text-[10px] text-red-400" onClick={() => handleCancelContract(contract)}>
                                                        Cancel Contract
                                                    </Button>
                                                    <Button size="sm" className="h-8 text-[10px] bg-red-500/20 text-red-500 hover:bg-red-500/30" onClick={() => handleUpdateContract(contract)}>
                                                        Update Value
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PaymentModal
                isOpen={paymentModal.isOpen}
                type={paymentModal.type}
                message={paymentModal.message}
                onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}
            />
            <InsufficientBalanceModal
                isOpen={insufficientBalanceModal.isOpen}
                onClose={() => setInsufficientBalanceModal({ ...insufficientBalanceModal, isOpen: false })}
                cryptoType={insufficientBalanceModal.cryptoType}
                requiredAmount={insufficientBalanceModal.requiredAmount}
                currentBalance={insufficientBalanceModal.currentBalance}
            />
            {cancelModal.contract && (() => {
                const contract = cancelModal.contract;
                const now = new Date();
                const startDate = new Date(contract.start_date);
                const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const plan = STAKING_PLANS.find(p => p.months === contract.duration_months) || STAKING_PLANS[0];

                let penaltyRate = plan.penaltyRate;
                let penalty;
                if (daysSinceStart <= 7) {
                    penalty = contract.staked_amount * plan.penaltyRate;
                } else if (daysSinceStart <= 28) {
                    penalty = (contract.staked_amount + (contract.total_earned || 0)) * plan.penaltyRate;
                } else {
                    penalty = (contract.total_earned || 0) * plan.penaltyRate;
                }
                const finalAmount = contract.staked_amount + (contract.total_earned || 0) - penalty;

                return (
                    <CancelContractModal
                        isOpen={cancelModal.isOpen}
                        onClose={() => setCancelModal({ ...cancelModal, isOpen: false })}
                        onConfirm={confirmCancelContract}
                        contract={contract}
                        penaltyRate={penaltyRate}
                        penalty={penalty}
                        finalAmount={finalAmount}
                        isLoading={cancelContractMutation.isPending}
                    />
                );
            })()}
        </div>
    );
}

export default function Staking() {
    return (
        <WalletProvider>
            <StakingContent />
        </WalletProvider>
    );
}