import React from 'react';
import { WalletProvider } from '../components/wallet/WalletContext';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { 
    BookOpen, TrendingUp, DollarSign, Shield, Users, 
    AlertTriangle, FileText, CheckCircle, ArrowRight, Coins, Briefcase 
} from 'lucide-react';

export default function Documentation() {
    const sections = [
        {
            id: 'overview',
            title: 'Platform Overview',
            icon: BookOpen,
            content: [
                {
                    subtitle: 'What is Pool Trading Platform?',
                    text: 'Our platform enables investors to participate in collective trading pools managed by professional traders. By pooling resources together, investors can access sophisticated trading strategies across cryptocurrency and traditional markets that would typically require substantial capital.'
                },
                {
                    subtitle: 'How It Works',
                    text: 'Investors deposit USDT (BEP-20) into one of our specialized trading pools. Professional managers execute trades on behalf of the pool, and profits/losses are distributed proportionally based on each investor\'s ownership percentage. All trades and performance metrics are fully transparent and visible to all participants.'
                }
            ]
        },
        {
            id: 'pools',
            title: 'Trading Pools',
            icon: TrendingUp,
            content: [
                {
                    subtitle: 'Crypto Pool (Scalping)',
                    text: 'High-frequency cryptocurrency scalping strategy focused on capturing small price movements throughout the day. Suitable for investors comfortable with active trading and higher volatility. Trades are executed multiple times per day across various cryptocurrency pairs using leverage. No lock-in period - deposit and withdraw anytime (subject to pool lock status). Manager profit share typically 15-20% of positive profits.'
                },
                {
                    subtitle: 'Traditional Pool',
                    text: 'Conservative strategy focused on established assets and traditional market correlations. Lower risk profile with emphasis on capital preservation and steady returns. Investors must choose a lock-in period (1, 3, 6, or 12 months) when depositing. Breaking the commitment early incurs a 10% penalty on the withdrawal amount. Longer holding periods and more selective trade entries. Manager profit share applies on positive profits.'
                },
                {
                    subtitle: 'VIP Pool',
                    text: 'Exclusive premium trading pool with advanced strategies combining high-frequency scalping, swing trading, and position trading across multiple cryptocurrency markets. VIP pool features enhanced risk management, priority trade execution, and access to exclusive market opportunities. No minimum investment restrictions. No lock-in period required. Flexible deposits and withdrawals (subject to pool status). Manager profit share applies on profitable trades. Designed for sophisticated investors seeking professional portfolio management.'
                }
            ]
        },
        {
            id: 'dealornodeal',
            title: 'Deal or No Deal Game',
            icon: Briefcase,
            content: [
                {
                    subtitle: 'Game Overview',
                    text: 'Deal or No Deal is a game of chance and strategy where players compete for prizes ranging from $0.01 to $1,000,000. Special launch offer: Pay only $1 USDT entry fee for the first 3 months, then $3 USDT after. Choose your lucky case from 26 options, and eliminate cases round by round to discover what prizes remain. The Banker will make offers based on the remaining prizes - accept the deal or risk it all for a bigger prize!'
                },
                {
                    subtitle: 'How to Play',
                    text: 'After paying the entry fee and selecting your case, you open cases in rounds: 6 cases in round 1, then 5, 4, 3, and finally 2 cases per round until only 2 cases remain. After each round, the Banker calculates an offer (typically 70-90% of the remaining prize average). You decide: accept the offer (Deal!) to end the game, or refuse (No Deal!) and continue. When 2 cases remain, make your final choice: keep your original case or swap it with the last remaining case.'
                },
                {
                    subtitle: 'XP System & Leveling',
                    text: 'Earn experience points (XP) based on your winnings and risk-taking: base XP ranges from 100 XP for small wins ($1-$50k) up to 5,000 XP for jackpot wins ($750k+), plus bonus XP for each Banker offer you refuse - the bonus amount scales with your current god level, rewarding higher-level players for taking risks. XP accumulates to unlock 13 god levels (0-12), each requiring progressively more XP. Each level unlocks unique god titles and collectible trophy NFTs. Progress from "New God Born" at level 0 to "Zeus" at level 12, with levels like Aphrodite, Dionysus, Artemis, Poseidon, and Athena along the way.'
                },
                {
                    subtitle: 'Monthly Leaderboard & XRP Prizes',
                    text: 'Every 30 days, the top 10 players with the highest total XP win XRP rewards: 1st place receives 200 XRP, 2nd place gets 100 XRP, 3rd place earns 50 XRP, 4th-5th place receive 25 XRP each, 6th-8th place get 15 XRP each, and 9th-10th place earn 10 XRP each. Total monthly rewards: 465 XRP distributed. A countdown timer shows time remaining until the next payout. Rankings reset each period, giving everyone a fresh chance to compete.'
                },
                {
                    subtitle: 'NFT Trophy Marketplace',
                    text: 'As you progress through the god levels, you earn unique Trophy NFTs for each completed level. Once you reach a certain advanced level in your journey, the NFT Marketplace unlocks, allowing you to sell your earned Trophy NFTs for Bitcoin (BTC). Each trophy has a fixed BTC value that increases with the level - from small fractions of BTC for early levels to 1 full BTC for the ultimate Zeus trophy. When you sell your trophies, your progress resets and you can start the journey again. This creates a repeatable cycle where you can earn real Bitcoin rewards by progressing through the god levels multiple times.'
                },
                {
                    subtitle: 'Ultimate Achievement: 1 BTC Reward',
                    text: 'Players who complete Level 12 (Zeus) by accumulating 2,000,001+ XP and receiving the trophy earn 1 BTC. After the reward is claimed and paid, a new round starts and you can earn it again. Contact admin to claim upon reaching this milestone.'
                },
                {
                    subtitle: 'Game Rules & Strategy',
                    text: 'You can only have one active game at a time. Entry fees are non-refundable. Banker offers are calculated algorithmically and increase in accuracy as fewer cases remain. To maximize XP for leaderboard climbing, refuse early low offers for bonus XP and play consistently. For guaranteed returns, accept strong offers when high prizes are eliminated. The final swap decision (keep vs. swap) has equal statistical odds - trust your instinct!'
                }
            ]
        },
        {
            id: 'staking',
            title: 'Staking Services',
            icon: Coins,
            content: [
                {
                    subtitle: 'How Staking Works',
                    text: 'Lock your crypto assets (BTC, ETH, USDT, USDC, or XRP) for a fixed period to earn guaranteed APY returns with daily compounding. Choose from 3-month (6% APY), 6-month (7% APY), or 12-month (8% APY) staking periods. Returns are the same across all supported crypto assets. All staking must be done using BEP-20 tokens on the BNB Smart Chain network. Send your chosen cryptocurrency to the company wallet address provided during the staking setup process.'
                },
                {
                    subtitle: 'Daily Compound Interest',
                    text: 'Interest is calculated and compounded daily throughout your staking period using the formula: A = P(1 + r)^t, where P is principal, r is daily rate ((1 + APY)^(1/365) - 1), and t is days elapsed. For example, a 6-month contract at 7% APY earns approximately 3.4% total return after compounding. Your current value increases every day, and you can view your accumulated earnings in real-time on your dashboard or manually update earnings by clicking the "Update Earnings" button.'
                },
                {
                    subtitle: 'Early Cancellation',
                    text: 'Contracts can be cancelled before maturity, but penalties apply to your earned interest only (your principal remains 100% safe). Penalties vary by plan: 3-month contracts incur a 30% penalty on earnings, 6-month contracts 40%, and 12-month contracts 50%. After the penalty is deducted, you receive your original staked amount plus the remaining earnings. For example, if you earned $100 in interest on a 6-month contract and cancel early, you forfeit $40 (40% penalty) and receive your principal plus $60 in earnings. Early cancellation is processed upon request and admin confirmation.'
                },
                {
                    subtitle: 'Withdrawal Process',
                    text: 'When your staking contract matures or after cancellation approval, submit a withdrawal request through your dashboard. Provide your BEP-20 wallet address for the same cryptocurrency type you staked (e.g., BTC stakers receive BTC back). Admin reviews and processes withdrawals typically within 3-7 business days. You will receive your cryptocurrency at the current network value, not USD equivalent.'
                }
            ]
        },
        {
            id: 'lessons',
            title: 'Educational Lessons',
            icon: BookOpen,
            content: [
                {
                    subtitle: 'Lesson Packages',
                    text: 'We offer professional trading education packages: 4 Basic Strategies ($25 USDT) - foundational trading techniques for beginners; Elliot Fibonacci ($150 USDT) - advanced technical analysis using Elliot Wave Theory and Fibonacci retracements; Full Personal Training ($500 USDT) - comprehensive one-on-one mentorship covering all strategies, risk management, and personalized trading plans. All lessons are conducted by experienced traders with proven track records.'
                },
                {
                    subtitle: 'Booking Process',
                    text: 'To book a lesson package: select your desired package on the Lessons page, pay the package fee in USDT (BEP-20) to the provided wallet address, submit transaction hash and your details through the booking form, await admin confirmation (typically 24-48 hours), and receive lesson scheduling information via email. Lessons may be conducted via video call, written materials, or hybrid formats depending on the package.'
                },
                {
                    subtitle: 'Lesson Content',
                    text: 'Educational content is for informational purposes only and does not constitute financial advice. Trading strategies taught may not be suitable for all market conditions. Past results shown in lessons are not guarantees of future performance. You are responsible for your own trading decisions. We recommend starting with paper trading before risking real capital.'
                }
            ]
        },
        {
            id: 'deposits',
            title: 'Deposits & Investments',
            icon: DollarSign,
            content: [
                {
                    subtitle: 'Making a Deposit',
                    text: 'Connect your MetaMask wallet, ensure you\'re on the BNB Smart Chain (BSC) network, and navigate to your chosen pool. Enter the amount of USDT you wish to deposit and confirm the transaction. For the Traditional Pool, you must also select an investment duration (1, 3, 6, or 12 months) before depositing. Your investment will be recorded immediately upon blockchain confirmation.'
                },
                {
                    subtitle: 'Traditional Pool Lock-In Period',
                    text: 'When depositing into the Traditional Pool, you commit to keeping your funds invested for your chosen duration (1, 3, 6, or 12 months). This commitment helps maintain pool stability and enables the manager to execute longer-term strategies. Each deposit transaction is tracked separately with its own duration and end date. If you need to withdraw before your commitment period ends, a 10% penalty will be applied to the withdrawal amount. Crypto Pool and VIP Pool have no lock-in periods.'
                },
                {
                    subtitle: 'Minimum Deposits',
                    text: 'There is no strict minimum deposit amount, but keep in mind that very small deposits may not be cost-effective due to blockchain transaction fees. We recommend deposits of at least $100 USDT to ensure meaningful participation.'
                },
                {
                    subtitle: 'Time-Based Share Calculation',
                    text: 'The platform uses a sophisticated share-based system (similar to mutual funds) to ensure you only receive profits from trades executed AFTER your deposit. When you deposit, you buy "shares" at current Net Asset Value (NAV). Each trade\'s profit/loss is distributed based on your share ownership at trade time. Withdrawals remove shares at current NAV. This ensures fair profit distribution - you don\'t benefit from trades before your deposit, and you don\'t lose from trades after your withdrawal. Your dashboard displays your current ownership percentage, total balance, and accumulated PnL.'
                }
            ]
        },
        {
            id: 'performance',
            title: 'Performance & Fees',
            icon: Users,
            content: [
                {
                    subtitle: 'Profit Distribution',
                    text: 'Pool profits are distributed proportionally based on ownership percentage. Clean PnL (profit after fees) is calculated by subtracting trading fees from gross profits. Each investor receives their percentage share of the clean PnL.'
                },
                {
                    subtitle: 'Manager Profit Share',
                    text: 'Pool managers receive a percentage of positive gross profits as compensation. This profit share rate varies by pool (typically 15-20%) and is clearly disclosed. The profit share is only charged on profitable trades, never on losses.'
                },
                {
                    subtitle: 'Trading Fees',
                    text: 'Exchange trading fees are deducted from each trade\'s PnL. These fees typically range from 0.01% to 0.1% per trade depending on the exchange and trading volume. All fees are fully transparent and visible in the trade history.'
                }
            ]
        },
        {
            id: 'withdrawals',
            title: 'Withdrawals',
            icon: FileText,
            content: [
                {
                    subtitle: 'Requesting a Withdrawal',
                    text: 'Navigate to your dashboard and click on the Withdrawals panel. Enter the amount you wish to withdraw (up to your current balance) and provide your BEP-20 wallet address. Submit the request and wait for admin approval.'
                },
                {
                    subtitle: 'Processing Time',
                    text: 'Withdrawal requests are manually reviewed and processed by administrators. Pool withdrawals typically take 3-7 business days for review and payment. Staking withdrawals may take 5-10 business days. You will receive a notification in your dashboard once your withdrawal has been approved and paid. Withdrawal status can be tracked in your dashboard Withdrawals panel.'
                },
                {
                    subtitle: 'Withdrawal Limits',
                    text: 'You can withdraw up to your current balance at any time (subject to pool withdrawal locks). Your balance calculation: Total Balance = Deposits - Withdrawals + Net PnL (after fees and profit share). For pools, your Net PnL = Gross PnL - Trading Fees - Manager Profit Share. The platform uses time-based share calculations to ensure you only receive profits from trades executed after your deposits. All balances are displayed in real-time on your dashboard.'
                },
                {
                    subtitle: 'Traditional Pool Early Withdrawal Penalty',
                    text: 'For the Traditional Pool only: If you withdraw before your committed investment period ends, a 10% penalty is deducted from your withdrawal amount. This penalty compensates for the disruption to pool strategy and is applied automatically. After your commitment period expires, you can withdraw freely without any penalties. The penalty only applies to early withdrawals, not to natural withdrawals after the lock-in period ends.'
                }
            ]
        },
        {
            id: 'kyc',
            title: 'AML & KYC Verification',
            icon: FileText,
            content: [
                {
                    subtitle: 'What is KYC?',
                    text: 'KYC (Know Your Customer) is an identity verification process required to comply with anti-money laundering (AML) regulations. It helps prevent fraud, money laundering, and ensures the platform operates within legal frameworks. Completing KYC may be required to access certain services or higher withdrawal limits.'
                },
                {
                    subtitle: 'Required Documents',
                    text: 'To complete KYC verification, you must submit three documents: 1) A government-issued identity document (passport, driving licence, or national ID card), 2) Proof of address (recent bank statement or tax document showing your residential address), and 3) A selfie photo of yourself holding your identity document for visual confirmation.'
                },
                {
                    subtitle: 'Verification Process',
                    text: 'After submitting your documents through the dashboard, your application enters "Under Review" status. Our compliance team manually reviews each submission, typically within 1-3 business days. You will be notified via email and dashboard notification once your verification is approved or if additional information is required. If rejected, admin notes will explain the reason so you can resubmit with corrections.'
                },
                {
                    subtitle: 'Privacy & Data Protection',
                    text: 'We take your privacy seriously. All submitted documents are encrypted and stored securely. We do not share your personal details with third parties. The company reserves the right to share information only under an official court request in compliance with legal obligations. Your data is protected according to industry-standard security practices.'
                },
                {
                    subtitle: 'Verification Status',
                    text: 'You can check your KYC status anytime in your dashboard under the "AML & KYC Verification" section. Statuses include: Pending (submitted, awaiting review), Under Review (being processed by our team), Approved (verification complete), or Rejected (requires resubmission with corrections based on admin feedback).'
                }
            ]
        },
        {
            id: 'security',
            title: 'Security & Safety',
            icon: Shield,
            content: [
                {
                    subtitle: 'Non-Custodial Approach',
                    text: 'We never hold your private keys. All deposits are made directly to pool smart contract addresses on the blockchain. Only you control your wallet and can authorize transactions.'
                },
                {
                    subtitle: 'Wallet Address as Account Identifier',
                    text: 'CRITICAL INFORMATION: Your MetaMask wallet address is your unique account identifier on this platform. Each wallet address is treated as a completely separate, independent account with its own investments, deposits, withdrawals, and data. The system recognizes users exclusively by their wallet address - there are no usernames, emails, or passwords for authentication.'
                },
                {
                    subtitle: 'Wallet Security & Account Access',
                    text: 'WARNING: If you lose access to your MetaMask wallet (by losing your private keys or seed phrase), you will PERMANENTLY lose access to your account and ALL associated funds and investments. There is absolutely no recovery mechanism - no email reset, no password recovery, no customer support intervention possible. Your wallet address is the ONLY key to your account. Always backup your seed phrase securely in multiple safe locations (written down, never digitally). Never share your private keys or seed phrase with anyone. The security of your wallet is entirely your personal responsibility.'
                },
                {
                    subtitle: 'Multiple Wallets',
                    text: 'You can connect to the platform using different MetaMask wallet addresses, but understand that each wallet will be recognized as a completely different user account. Your investments, balances, and transaction history are permanently tied to specific wallet addresses and cannot be merged or transferred between different wallets. If you use multiple wallets, you will have separate, independent accounts for each one.'
                },
                {
                    subtitle: 'Transparent Operations',
                    text: 'All trades, balances, and performance metrics are fully visible to all pool participants. Every deposit, trade, and withdrawal is recorded on-chain and can be independently verified.'
                },
                {
                    subtitle: 'Smart Contract Security',
                    text: 'Our pool addresses use standard BEP-20 token contracts. All deposits and transactions are recorded on the BNB Smart Chain blockchain, providing immutable proof of all activities.'
                }
            ]
        },
        {
            id: 'risks',
            title: 'Risks & Disclaimers',
            icon: AlertTriangle,
            content: [
                {
                    subtitle: 'Market Risk',
                    text: 'Cryptocurrency and traditional markets are highly volatile. You could lose some or all of your invested capital. Past performance is not indicative of future results. Only invest money you can afford to lose completely.'
                },
                {
                    subtitle: 'No Guarantees',
                    text: 'There are no guaranteed returns. While our pool managers are experienced, they cannot predict market movements with certainty. Losses are possible and may be substantial, especially during periods of high volatility.'
                },
                {
                    subtitle: 'Regulatory Considerations',
                    text: 'Cryptocurrency investments may be subject to regulations in your jurisdiction. It is your responsibility to understand and comply with local laws. This platform is not available to users in restricted territories.'
                }
            ]
        }
    ];

    return (
        <WalletProvider>
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
                
                <div className="pt-40 sm:pt-44 pb-20 px-4 sm:px-6 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-12 sm:mb-16"
                        >
                            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-6">
                                <BookOpen className="w-4 h-4 text-red-400" />
                                <span className="text-red-400 text-sm font-medium">Resources</span>
                            </div>
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-6 relative px-4">
                                <span className="relative z-10">Platform Documentation</span>
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
                                    Platform Documentation
                                </motion.div>
                            </h1>
                            <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto px-4">
                                Complete guide to trading pools, staking, games, lessons, and all platform services
                            </p>
                        </motion.div>

                        {/* Table of Contents */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-black/60 border border-red-500/20 rounded-2xl p-8 mb-12 backdrop-blur-xl relative overflow-hidden"
                        >
                            <motion.div
                                className="absolute inset-0 opacity-30"
                                animate={{
                                    background: [
                                        'radial-gradient(circle at 0% 0%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                        'radial-gradient(circle at 100% 100%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                        'radial-gradient(circle at 0% 0%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                    ],
                                }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-[#f5c96a]" />
                                Table of Contents
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-3 relative z-10">
                                {sections.map((section, index) => (
                                    <a
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 transition-all group"
                                    >
                                        <section.icon className="w-4 sm:w-5 h-4 sm:h-5 text-red-400 flex-shrink-0" />
                                        <span className="text-white text-sm sm:text-base group-hover:text-red-400 transition-colors">
                                            {section.title}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-gray-500 ml-auto group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                                    </a>
                                ))}
                            </div>
                        </motion.div>

                        {/* Documentation Sections */}
                        <div className="space-y-12">
                            {sections.map((section, sectionIndex) => (
                                <motion.div
                                    key={section.id}
                                    id={section.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: sectionIndex * 0.1 }}
                                    className="bg-black/60 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden"
                                >
                                    <motion.div
                                        className="absolute inset-0 opacity-20"
                                        animate={{
                                            background: [
                                                'radial-gradient(circle at 0% 50%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                                'radial-gradient(circle at 100% 50%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                                'radial-gradient(circle at 0% 50%, rgba(220,38,38,0.1) 0%, transparent 50%)',
                                            ],
                                        }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    <div className="flex items-center gap-2 sm:gap-3 mb-6 pb-4 border-b border-red-500/20 relative z-10">
                                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-0.5">
                                            <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                                                <section.icon className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                                            </div>
                                        </div>
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{section.title}</h2>
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        {section.content.map((item, itemIndex) => (
                                            <div key={itemIndex} className="pl-3 sm:pl-4 border-l-2 border-red-500/30">
                                                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-400 flex-shrink-0" />
                                                    {item.subtitle}
                                                </h3>
                                                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                                                    {item.text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Important Notice */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-12 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-2xl p-8 led-glow-red"
                        >
                            <div className="flex items-start gap-3 sm:gap-4">
                                <AlertTriangle className="w-6 sm:w-8 h-6 sm:h-8 text-red-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-red-400 mb-3">
                                        ⚠️ Important Risk Warning
                                    </h3>
                                    <p className="text-white text-base sm:text-lg leading-relaxed mb-3">
                                        <strong>Trading and investing in cryptocurrencies involves substantial risk of loss.</strong> The volatile nature of cryptocurrency markets means you could lose your entire investment. This platform does not provide financial advice.
                                    </p>
                                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                        By using this platform, you acknowledge that you understand these risks and accept full responsibility for your investment decisions. You should only invest capital that you can afford to lose completely. Consider consulting with a qualified financial advisor before making any investment decisions.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <Footer />
            </div>
        </WalletProvider>
    );
}