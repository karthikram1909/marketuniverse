import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { WalletProvider, useWallet } from '../components/wallet/WalletContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Check, GraduationCap, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import InsufficientBalanceModal from '../components/lessons/InsufficientBalanceModal';
import PurchaseProcessModal from '../components/lessons/PurchaseProcessModal';
import { ethers } from 'ethers';

const USDT_BEP20 = '0x55d398326f99059fF775485246999027B3197955';

const packages = [
    {
        id: '4_strategies',
        name: '4 Strategies Package',
        price: 500,
        description: 'Master 4 proven trading strategies',
        features: [
            'Scalping Strategy',
            'Swing Trading Strategy',
            'Breakout Strategy',
            'Trend Following Strategy',
            'Video Tutorials',
            'Trading Templates',
            'Email Support'
        ],
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'elliot_fibonacci',
        name: 'Elliot Waves & Fibonacci',
        price: 1000,
        description: 'Advanced technical analysis mastery',
        features: [
            'Complete Elliot Wave Theory',
            'Fibonacci Retracements',
            'Wave Counting Techniques',
            'Pattern Recognition',
            'Live Trading Examples',
            'Advanced Chart Analysis',
            'Priority Email Support',
            '1 Group Q&A Session'
        ],
        gradient: 'from-purple-500 to-pink-500'
    },
    {
        id: 'full_personal',
        name: 'Full Trading Lesson & Personal Coaching',
        price: 2000,
        description: 'Complete trading education with personal mentorship',
        features: [
            'All Strategies Included',
            'Elliot Wave & Fibonacci',
            'Risk Management System',
            'Psychology & Mindset',
            '1-on-1 Personal Sessions',
            'Custom Trading Plan',
            'Lifetime Access to Materials',
            '24/7 Priority Support',
            'Private Discord Channel'
        ],
        gradient: 'from-amber-500 to-orange-500'
    }
];

function LessonsContent() {
    const { account } = useWallet();
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [purchasingPackage, setPurchasingPackage] = useState(null);
    const [showInsufficientModal, setShowInsufficientModal] = useState(false);
    const [balanceInfo, setBalanceInfo] = useState({ current: 0, required: 0, packageName: '' });
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState('preparing');
    const [currentPackage, setCurrentPackage] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
            } catch (error) {
                console.log('User not authenticated');
            }
        };
        loadUser();
    }, []);

    const { data: settings } = useQuery({
        queryKey: ['lessonSettings'],
        queryFn: async () => {
            const allSettings = await base44.entities.LessonSettings.list();
            return allSettings[0] || { purchases_locked: false, company_wallet_address: null };
        },
        staleTime: 300000,
        refetchOnWindowFocus: false
    });

    const bookingMutation = useMutation({
        mutationFn: async ({ packageData, txHash }) => {
            await base44.entities.LessonBooking.create({
                wallet_address: account.toLowerCase(),
                email: user?.email || '',
                full_name: user?.full_name || '',
                package_type: packageData.id,
                package_name: packageData.name,
                amount_paid: packageData.price,
                tx_hash: txHash,
                status: 'pending'
            });

            await base44.entities.Notification.create({
                wallet_address: account.toLowerCase(),
                email: user?.email || '',
                type: 'deposit_confirmed',
                title: 'Lesson Package Purchase',
                message: `Your purchase of ${packageData.name} for $${packageData.price} has been received and is being processed.`,
                amount: packageData.price,
                read: false
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['lessonBookings']);
            toast.success('Purchase successful! We will contact you shortly.');
            setPurchasingPackage(null);
        },
        onError: (error) => {
            toast.error(`Purchase failed: ${error.message}`);
            setPurchasingPackage(null);
        }
    });

    const ensureBSC = async () => {
        const BSC_CHAIN_ID = '0x38';
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BSC_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BSC_CHAIN_ID }]
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: BSC_CHAIN_ID,
                            chainName: 'BNB Smart Chain',
                            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                            rpcUrls: ['https://bsc-dataseed.binance.org'],
                            blockExplorerUrls: ['https://bscscan.com']
                        }]
                    });
                } else {
                    throw switchError;
                }
            }
        }
    };

    const handlePurchase = async (pkg) => {
        console.log('Purchase clicked for package:', pkg.name);
        
        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (settings?.purchases_locked) {
            toast.error('Lesson purchases are currently locked. Please try again later.');
            return;
        }

        if (!settings?.company_wallet_address) {
            toast.error('Lesson wallet not configured. Please contact support.');
            return;
        }

        if (typeof window.ethereum === 'undefined') {
            toast.error('MetaMask is not installed');
            return;
        }

        setPurchasingPackage(pkg.id);
        setCurrentPackage(pkg);
        setShowPurchaseModal(true);
        setPurchaseStatus('preparing');

        try {
            console.log('Ensuring BSC network...');
            await ensureBSC();

            console.log('Creating provider and signer...');
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            console.log('Creating USDT contract...');
            const usdtContract = new ethers.Contract(
                USDT_BEP20,
                [
                    'function transfer(address to, uint256 amount) returns (bool)',
                    'function decimals() view returns (uint8)',
                    'function balanceOf(address) view returns (uint256)'
                ],
                signer
            );

            const decimals = await usdtContract.decimals();
            const amount = ethers.utils.parseUnits(pkg.price.toString(), decimals);
            
            console.log('Amount to transfer:', amount.toString());

            // Check balance
            const balance = await usdtContract.balanceOf(account);
            const formattedBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));
            console.log('User USDT balance:', formattedBalance);
            
            if (balance.lt(amount)) {
                setBalanceInfo({
                    current: formattedBalance,
                    required: pkg.price,
                    packageName: pkg.name
                });
                setShowInsufficientModal(true);
                setShowPurchaseModal(false);
                setPurchasingPackage(null);
                return;
            }

            setPurchaseStatus('confirming');
            console.log('Initiating transfer...');
            const tx = await usdtContract.transfer(settings.company_wallet_address, amount);

            setPurchaseStatus('processing');
            console.log('Transaction hash:', tx.hash);
            await tx.wait();
            console.log('Transaction confirmed');

            await bookingMutation.mutateAsync({
                packageData: pkg,
                txHash: tx.hash
            });

            setPurchaseStatus('success');
            setTimeout(() => {
                setShowPurchaseModal(false);
                setPurchasingPackage(null);
            }, 3000);

        } catch (error) {
            console.error('Purchase error:', error);
            setPurchaseStatus('error');
            
            setTimeout(() => {
                setShowPurchaseModal(false);
                setPurchasingPackage(null);
            }, 2000);

            if (error.code === 4001) {
                toast.error('Transaction rejected by user');
            } else if (error.code === -32603) {
                toast.error('Insufficient USDT balance or gas');
            } else {
                toast.error('Transaction failed: ' + (error.message || 'Please try again'));
            }
        }
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: [
                            'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 80% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                        ],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.5, 0.3, 0.5],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
            </div>

            <Navbar />
            <div className="px-4 sm:px-6 py-20 pt-40 sm:pt-44 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <GraduationCap className="w-12 h-12 text-red-400" />
                            <h1 className="text-3xl sm:text-5xl font-bold text-white relative">
                                <span className="relative z-10">Trading Education</span>
                                <motion.div
                                    className="absolute inset-0 blur-2xl opacity-50"
                                    animate={{
                                        textShadow: [
                                            '0 0 20px rgba(220,38,38,0.5)',
                                            '0 0 40px rgba(220,38,38,0.8)',
                                            '0 0 20px rgba(220,38,38,0.5)',
                                        ],
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    Trading Education
                                </motion.div>
                            </h1>
                        </div>
                        <p className="text-base sm:text-xl text-gray-400 max-w-3xl mx-auto px-4">
                            Master the markets with professional trading education. Choose the package that fits your goals.
                        </p>
                    </motion.div>

                    {/* Locked Warning */}
                    {settings?.purchases_locked && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-2xl p-6 mb-12 flex items-center gap-4"
                        >
                            <AlertCircle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                            <div>
                                <h3 className="text-white font-semibold mb-1">Purchases Currently Locked</h3>
                                <p className="text-gray-300 text-sm">
                                    New cycle of Lessons starting soon. More infos contact our support live chat.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Packages Grid */}
                    <div className="grid md:grid-cols-3 gap-8 mb-20">
                        {packages.map((pkg, idx) => (
                            <motion.div
                                key={pkg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="relative bg-black/60 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl overflow-hidden hover:border-red-500/50 transition-all duration-300"
                            >
                                <motion.div
                                    className="absolute inset-0 opacity-20"
                                    animate={{
                                        background: [
                                            'radial-gradient(circle at 0% 0%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                            'radial-gradient(circle at 100% 100%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                            'radial-gradient(circle at 0% 0%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                        ],
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <div className="relative z-10">
                                <motion.div 
                                    className={`bg-gradient-to-r ${pkg.gradient} h-2 rounded-full mb-6`}
                                    animate={{
                                        opacity: [0.6, 1, 0.6],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 }}
                                />

                                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                                <p className="text-gray-400 text-sm mb-6">{pkg.description}</p>

                                <div className="mb-8">
                                    <span className="text-5xl font-bold text-white">${pkg.price}</span>
                                    <span className="text-gray-400 ml-2">USDT</span>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {pkg.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-300 text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => handlePurchase(pkg)}
                                    disabled={purchasingPackage === pkg.id || settings?.purchases_locked}
                                    className={`w-full bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white border-0 rounded-xl py-6`}
                                >
                                    {purchasingPackage === pkg.id ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="w-5 h-5 mr-2" />
                                            Purchase Now
                                        </>
                                    )}
                                </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Info Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-black/60 border border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-xl relative overflow-hidden"
                    >
                        <motion.div
                            className="absolute inset-0 opacity-30"
                            animate={{
                                background: [
                                    'radial-gradient(circle at 50% 50%, rgba(220,38,38,0.15) 0%, transparent 60%)',
                                    'radial-gradient(circle at 50% 50%, rgba(220,38,38,0.25) 0%, transparent 60%)',
                                    'radial-gradient(circle at 50% 50%, rgba(220,38,38,0.15) 0%, transparent 60%)',
                                ],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <h3 className="text-2xl font-bold text-white mb-4 relative z-10">What Happens After Purchase?</h3>
                        <div className="grid md:grid-cols-3 gap-6 text-left relative z-10">
                            <div>
                                <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                    <span className="text-red-400 font-bold text-xl">1</span>
                                </div>
                                <h4 className="text-white font-semibold mb-2">Instant Confirmation</h4>
                                <p className="text-gray-400 text-sm">Receive immediate confirmation of your purchase in your dashboard.</p>
                            </div>
                            <div>
                                <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                    <span className="text-red-400 font-bold text-xl">2</span>
                                </div>
                                <h4 className="text-white font-semibold mb-2">Personal Contact</h4>
                                <p className="text-gray-400 text-sm">Our team will reach out within 24 hours to schedule your sessions.</p>
                            </div>
                            <div>
                                <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                    <span className="text-red-400 font-bold text-xl">3</span>
                                </div>
                                <h4 className="text-white font-semibold mb-2">Start Learning</h4>
                                <p className="text-gray-400 text-sm">Get access to all materials and begin your trading education journey.</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            <Footer />
            <InsufficientBalanceModal
                isOpen={showInsufficientModal}
                onClose={() => setShowInsufficientModal(false)}
                currentBalance={balanceInfo.current}
                requiredAmount={balanceInfo.required}
                packageName={balanceInfo.packageName}
            />
            <PurchaseProcessModal
                isOpen={showPurchaseModal}
                packageData={currentPackage}
                status={purchaseStatus}
            />
        </div>
    );
}

export default function Lessons() {
    return (
        <WalletProvider>
            <LessonsContent />
        </WalletProvider>
    );
}