import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useWallet } from '../wallet/WalletContext';
import { DollarSign, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { supabase } from '@/lib/supabaseClient';
import { gameService } from '@/api/gameService';

const USDT_BEP20 = '0x55d398326f99059fF775485246999027B3197955';

export default function PaymentModal({ isOpen, onClose, onSuccess, gameFee, gameWallet }) {
    const { account, connectWallet } = useWallet();
    const [selectedCase, setSelectedCase] = useState(null);
    const [isPaying, setIsPaying] = useState(false);
    const [user, setUser] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [retrying, setRetrying] = useState(false);
    const [gameCreating, setGameCreating] = useState(false);
    const [creatingMessage, setCreatingMessage] = useState('');
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [gameData, setGameData] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await gameService.getCurrentUserWithProfile();
                setUser(currentUser);
            } catch (error) {
                console.log('User not authenticated');
            }
        };
        loadUser();
    }, []);

    // If modal opens without wallet connection, show connect prompt
    // If modal opens without wallet connection, try to connect
    useEffect(() => {
        if (isOpen && !account) {
            connectWallet().catch(() => {
                toast.error('Please connect your wallet first!');
                onClose();
            });
        }
    }, [isOpen, account, onClose, connectWallet]);

    const handlePayment = async (e) => {
        e?.preventDefault();
        e?.stopPropagation();

        console.log('Payment button clicked', { selectedCase, account, gameWallet, gameFee });

        if (!selectedCase) {
            toast.error('Please select a case number first!');
            return;
        }

        if (!window.ethereum || !account) {
            toast.error('Please connect your wallet');
            return;
        }

        const ADMIN_WALLET = '0x508D61ad3f1559679BfAe3942508B4cf7767935A';
        const targetWallet = gameWallet || ADMIN_WALLET;

        if (!targetWallet || targetWallet === 'null' || targetWallet === 'undefined') {
            toast.error('⚠️ Game wallet not configured! Contact admin.');
            return;
        }

        // Force usage of correct wallet
        const finalWallet = ethers.utils.isAddress(targetWallet) ? targetWallet : ADMIN_WALLET;

        setIsPaying(true);
        try {
            // 1. Enforce BSC Network
            const BSC_CHAIN_ID = '0x38';
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

            if (currentChainId !== BSC_CHAIN_ID) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: BSC_CHAIN_ID }],
                    });
                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask.
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: BSC_CHAIN_ID,
                                    chainName: 'BNB Smart Chain',
                                    nativeCurrency: {
                                        name: 'BNB',
                                        symbol: 'BNB',
                                        decimals: 18
                                    },
                                    rpcUrls: ['https://bsc-dataseed.binance.org/'],
                                    blockExplorerUrls: ['https://bscscan.com/']
                                }
                            ],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            if (!ethers.utils.isAddress(gameWallet)) {
                toast.error(`Invalid game wallet address. Contact admin.`);
                setIsPaying(false);
                return;
            }

            const usdtContract = new ethers.Contract(
                USDT_BEP20,
                ['function transfer(address to, uint256 amount) returns (bool)'],
                signer
            );

            const amount = ethers.utils.parseUnits(gameFee.toString(), 18);
            const tx = await usdtContract.transfer(finalWallet, amount);

            // 🔥 CRITICAL: Save payment record IMMEDIATELY after tx.hash is available
            // This prevents data loss if browser crashes before confirmation
            toast.success('Transaction sent! Saving record...');
            console.log('Transaction sent, saving immediately:', { txHash: tx.hash, caseNumber: selectedCase });

            // PHASE 1: Save pending game payment BEFORE waiting for confirmation
            try {
                await supabase.from('pending_game_payments').insert({
                    wallet_address: account.toLowerCase(),
                    tx_hash: tx.hash,
                    case_number: selectedCase,
                    game_fee: gameFee,
                    status: 'pending'
                });
                console.log('✅ Payment record saved immediately:', tx.hash);
                toast.success('Payment record saved! Waiting for blockchain confirmation...');
            } catch (pendingError) {
                console.warn('Non-critical: Failed to save pending game payment:', pendingError);
                // Continue flow even if backup logging fails
            }

            // PHASE 2: Now wait for blockchain confirmation
            console.log('Waiting for blockchain confirmation...');
            const receipt = await tx.wait();
            console.log('✅ Payment confirmed on blockchain:', { txHash: tx.hash, blockNumber: receipt.blockNumber });
            toast.success('Payment confirmed on blockchain!');

            // Create notifications for game entry
            try {
                await Promise.all([
                    supabase.from('notifications').insert({
                        user_id: user?.id,
                        message: `Payment confirmed! ${gameFee} USDT received for Case #${selectedCase}. Creating your game now...`,
                        read: false
                    }),
                    supabase.from('notifications').insert({
                        user_id: user?.id,
                        message: `New Deal or No Deal Payment: Player paid ${gameFee} USDT for Case #${selectedCase}. TX: ${tx.hash.slice(0, 10)}...`,
                        read: false
                    })
                ]);
            } catch (error) {
                console.warn('Failed to create notifications:', error);
            }

            // Show game creation loader
            setGameCreating(true);
            setCreatingMessage('💰 Payment confirmed! Verifying blockchain finality...');

            // 🔥 NEW: Frontend-driven polling

            // 15-second mandatory verification delay
            for (let i = 15; i > 0; i--) {
                setCreatingMessage(`running verification... ${i}s`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            setCreatingMessage(`⚡ Finalizing verification...`);

            let pollAttempts = 0;
            const maxPollAttempts = 12;
            const POLL_INTERVAL = 3000; // 3 seconds

            const pollForGame = async () => {
                while (pollAttempts < maxPollAttempts) {
                    pollAttempts++;

                    // Update message without specific time mentions
                    if (pollAttempts <= 4) {
                        setCreatingMessage(`🔒 Verifying blockchain confirmations...`);
                    } else if (pollAttempts <= 8) {
                        setCreatingMessage(`⚡ Verifying blockchain finality...`);
                    } else {
                        setCreatingMessage(`⏳ Almost ready...`);
                    }

                    try {
                        // Call backend to check status and create game if ready
                        const result = await gameService.checkGamePaymentStatus({
                            txHash: tx.hash
                        });

                        // const result = response.data;

                        // if (result.status === 'completed' && result.game_id) {
                        //     // Game created successfully!
                        //     setGameCreating(false);
                        //     setCreatingMessage('');
                        //     toast.success('🎮 Game created! Starting now...');
                        //     onClose();
                        //     window.location.reload();
                        //     return true;
                        // } else if (result.status === 'failed') {
                        //     toast.error('Payment failed: ' + result.error);
                        //     setGameCreating(false);
                        //     return false;
                        // } else if (result.status === 'confirming') {
                        //     // Update with confirmation progress
                        //     setCreatingMessage(`🔒 Confirmations: ${result.confirmations}/${result.required} blocks (${elapsed}s)`);
                        // }
                        if (result.status === 'completed' && result.game_id) {
                            // ✅ Game created successfully & payment confirmed
                            setGameCreating(false);
                            setCreatingMessage('');
                            toast.success('🎮 Game created! Starting now...');
                            onClose();

                            // Navigate to new game without reloading
                            onSuccess(selectedCase, tx.hash, result.game_id);

                            return true;

                        } else if (result.status === 'failed') {
                            // ❌ Payment failed or transaction invalid

                            toast.error('Payment failed: ' + result.error);
                            setGameCreating(false);

                            return false;

                        } else if (result.status === 'confirming') {
                            // ⏳ Transaction is valid but still waiting for blockchain confirmations
                            setCreatingMessage(`🔒 Verifying blockchain finality...`);
                        }

                    } catch (error) {
                        console.error('Poll error:', error);
                        // Continue polling even on error
                    }

                    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
                }
                return false;
            };

            const gameCreated = await pollForGame();

            if (!gameCreated) {
                // Keep modal open with timeout message
                setCreatingMessage('⏳ Still processing... Backup system will complete shortly if needed.');
                toast.info(`Payment confirmed! Game creation in progress. Safe to close and check back.`, { duration: 10000 });
            }
        } catch (error) {
            console.error('Payment error:', error);
            if (error.code === 4001) {
                toast.error('Transaction rejected by user');
            } else {
                toast.error(error.message || 'Payment failed');
            }
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isPaying && onClose()}>
            <DialogContent className="bg-[#1a1f2e] border border-white/20 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-[#f5c96a]" />
                        {verificationSuccess ? '🎮 Your Game' : gameCreating ? 'Creating Your Game...' : 'Start New Game'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {verificationSuccess ? `Payment verified! Case #${gameData?.player_case_number} is ready to play` : gameCreating ? 'Please wait while we set up your game' : 'Select your lucky case and pay the entry fee to start playing'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {verificationSuccess && gameData ? (
                        <div className="space-y-6 py-8">
                            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-8 text-center">
                                <p className="text-2xl font-bold text-white mb-6">✅ Payment Verified!</p>
                                <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mb-8">
                                    {Array.from({ length: 26 }, (_, i) => i + 1).map((num) => (
                                        <div key={num} className={`px-2 py-2 rounded-md font-bold text-sm ${gameData.player_case_number === num
                                            ? 'bg-[#f5c96a] text-black scale-110 ring-2 ring-[#f5c96a]'
                                            : 'bg-white/20 text-white'
                                            }`}>
                                            {num}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-lg text-green-400 mb-4">Your Selected Case: <span className="font-bold text-2xl">#{gameData.player_case_number}</span></p>
                                <p className="text-gray-300 mb-6">Entry Fee Paid: <span className="font-bold text-green-400">{gameFee} USDT</span></p>
                                <button
                                    onClick={() => {
                                        setVerificationSuccess(false);
                                        setGameData(null);
                                        setSelectedCase(null);
                                        onClose();
                                        onSuccess(gameData.player_case_number, gameData.tx_hash);
                                    }}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl py-4 text-lg font-bold"
                                >
                                    Start Playing 🎮
                                </button>
                            </div>
                        </div>
                    ) : gameCreating ? (
                        <div className="space-y-6 py-8">
                            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-8 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-[#f5c96a]/30 border-t-[#f5c96a] rounded-full animate-spin"></div>
                                        <Briefcase className="w-10 h-10 text-[#f5c96a] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-white mb-3">{creatingMessage}</p>
                                <p className="text-gray-300 mb-6">
                                    Your payment is on the blockchain! Verifying network confirmations before creating your game.
                                </p>
                                <div className="bg-black/30 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-green-400">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-semibold">Payment confirmed on blockchain</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-cyan-400">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-semibold">Verifying blockchain finality</span>
                                    </div>
                                    <p className="text-gray-400 text-xs">Ensuring transaction security through network confirmations</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Case Selection */}
                            <div>
                                <label className="text-gray-400 mb-4 block text-lg">Pick Your Case (1-26)</label>
                                <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
                                    {Array.from({ length: 26 }, (_, i) => i + 1).map((num) => (
                                        <div key={num} className="flex flex-col items-center gap-2">
                                            <div className={`px-2 py-1 rounded-md font-bold text-sm ${selectedCase === num ? 'bg-[#f5c96a] text-black' : 'bg-white/90 text-black'
                                                }`}>
                                                {num}
                                            </div>
                                            <div
                                                onClick={() => setSelectedCase(num)}
                                                className={`relative aspect-square rounded-lg transition-all cursor-pointer ${selectedCase === num
                                                    ? 'scale-110 ring-2 ring-[#f5c96a]'
                                                    : 'hover:scale-105'
                                                    }`}
                                            >
                                                <img
                                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693351edbed92fa9dea2299b/f9d1f57d9_image.png"
                                                    alt={`Case ${num}`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedCase && (
                                    <p className="text-[#f5c96a] font-semibold mt-3">
                                        Selected Case: #{selectedCase}
                                    </p>
                                )}
                            </div>

                            {/* Payment Section */}
                            <div className="border-t border-white/10 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-400">Entry Fee:</span>
                                    <span className="text-2xl font-bold text-white">${gameFee} USDT</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        console.log('Button clicked');
                                        handlePayment(e);
                                    }}
                                    disabled={isPaying || !selectedCase}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white border-0 rounded-xl py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg transition-all"
                                    style={{ pointerEvents: 'auto' }}
                                >
                                    <DollarSign className="w-6 h-6 mr-2" />
                                    {retrying ? `Retrying... (${retryCount}/3)` :
                                        isPaying ? 'Processing...' :
                                            `Pay ${gameFee} USDT & Start Game`}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}