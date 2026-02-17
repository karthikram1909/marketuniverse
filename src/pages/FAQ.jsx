import React, { useState } from 'react';
import { WalletProvider } from '../components/wallet/WalletContext';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function FAQ() {
    const [searchTerm, setSearchTerm] = useState('');
    const [openIndex, setOpenIndex] = useState(null);

    const faqCategories = [
        {
            category: 'Getting Started',
            questions: [
                {
                    q: 'What is this platform?',
                    a: 'Our platform enables investors to participate in collective trading pools managed by professional traders. You can also stake crypto assets to earn guaranteed APY returns. All operations are transparent and recorded on the blockchain.'
                },
                {
                    q: 'Do I need a wallet to use this platform?',
                    a: 'Yes, you need a MetaMask wallet connected to the BNB Smart Chain (BSC) to deposit funds, participate in pools, or stake crypto assets.'
                },
                {
                    q: 'Which blockchain does this platform use?',
                    a: 'We exclusively use the BNB Smart Chain (BSC) for all transactions. All deposits must be made using BEP-20 tokens.'
                },
                {
                    q: 'How do I connect my wallet?',
                    a: 'Click the "Connect Wallet" button in the top-right corner. Make sure you have MetaMask installed and switch to the BNB Smart Chain network. The platform will automatically prompt you to switch networks if needed.'
                },
                {
                    q: 'Is there a minimum deposit amount?',
                    a: 'There is no strict minimum, but we recommend at least $100 USDT to ensure meaningful participation and to make transaction fees worthwhile.'
                }
            ]
        },
        {
            category: 'Trading Pools',
            questions: [
                {
                    q: 'What are the different pool types?',
                    a: 'We offer three pools: Crypto Pool/Scalping (high-frequency cryptocurrency day trading with no lock-in), Traditional Pool (conservative longer-term strategy with 1-12 month lock-in periods), and VIP Pool (premium strategies combining scalping, swing, and position trading with no lock-in). Each has different risk profiles and trading styles.'
                },
                {
                    q: 'What is the Traditional Pool lock-in period?',
                    a: 'When depositing into the Traditional Pool, you must choose an investment duration: 1, 3, 6, or 12 months. Your funds are committed for this period to maintain pool stability and enable longer-term strategies. Your chosen duration and end date are displayed in your dashboard.'
                },
                {
                    q: 'How is my ownership percentage calculated?',
                    a: 'Your ownership is calculated as: (Your Investment / Total Pool Size) × 100. This percentage determines your share of profits and losses. It may change as others deposit or withdraw.'
                },
                {
                    q: 'What is Clean PnL?',
                    a: 'Clean PnL is the profit after deducting trading fees from gross profits. This is the actual profit that gets distributed to investors proportionally based on their ownership percentage.'
                },
                {
                    q: 'What is the manager profit share?',
                    a: 'Pool managers receive a percentage (typically 10-20%) of positive gross profits as compensation. This is only charged on profitable trades, never on losses. The exact rate is displayed on each pool page.'
                },
                {
                    q: 'How are trading fees calculated?',
                    a: 'Exchange trading fees (typically 0.01% to 0.1% per trade) are automatically deducted from each trade\'s PnL. These fees vary by exchange and trading volume. All fees are transparent and visible in trade history.'
                },
                {
                    q: 'Can I lose money in a pool?',
                    a: 'Yes. Trading involves risk, and you could lose some or all of your invested capital. Losses are distributed proportionally to all pool participants based on ownership percentage.'
                },
                {
                    q: 'When are deposits locked?',
                    a: 'Pool deposits may be temporarily locked during certain market conditions or administrative periods. This is indicated on the pool page. Locked periods prevent new deposits but don\'t affect existing investments.'
                }
            ]
        },
        {
            category: 'Deposits & Investments',
            questions: [
                {
                    q: 'Which tokens can I deposit for pools?',
                    a: 'Only USDT (BEP-20) is accepted for pool deposits. Make sure you\'re sending BEP-20 tokens on the BNB Smart Chain, not ERC-20 or other networks.'
                },
                {
                    q: 'How do I make a deposit?',
                    a: 'Navigate to your chosen pool, enter the amount (for Traditional Pool, also select your investment duration: 1, 3, 6, or 12 months), and click deposit. Your MetaMask will open for transaction approval. After blockchain confirmation, your investment is recorded and you start earning/losing based on pool performance.'
                },
                {
                    q: 'Can I deposit into multiple pools?',
                    a: 'Yes, you can invest in all three pools simultaneously. Each pool operates independently with its own performance tracking.'
                },
                {
                    q: 'Is my deposit confirmed immediately?',
                    a: 'Your deposit is recorded after blockchain confirmation, which typically takes 1-3 minutes on BSC. You can track your transaction on BscScan using the transaction hash.'
                }
            ]
        },
        {
            category: 'Withdrawals',
            questions: [
                {
                    q: 'How do I withdraw from a pool?',
                    a: 'Go to your dashboard, click the Withdrawals panel, select the pool, enter the amount (up to your current balance), provide your BEP-20 wallet address, and submit the request.'
                },
                {
                    q: 'How long do withdrawals take?',
                    a: 'Withdrawal requests are reviewed and processed manually by administrators. Pool withdrawals typically take 3-7 business days. Staking withdrawals may take 5-10 business days. You\'ll receive a dashboard notification when your withdrawal is approved and paid to your wallet.'
                },
                {
                    q: 'What is my current balance?',
                    a: 'Your balance equals: Invested Amount + Your Share of Profits - Your Share of Losses - Manager Profit Share - Previous Withdrawals. This is the maximum amount you can withdraw.'
                },
                {
                    q: 'Can I withdraw partially?',
                    a: 'Yes, you can withdraw any amount up to your current balance. You don\'t have to withdraw your entire investment.'
                },
                {
                    q: 'Are there withdrawal fees?',
                    a: 'The platform doesn\'t charge withdrawal fees, but you\'re responsible for the blockchain transaction fees when funds are sent to your wallet. Traditional Pool has a 10% early withdrawal penalty if you withdraw before your lock-in period ends.'
                },
                {
                    q: 'What is the Traditional Pool early withdrawal penalty?',
                    a: 'If you withdraw from the Traditional Pool before your committed investment period ends, a 10% penalty is deducted from your withdrawal amount. This penalty compensates for disruption to pool strategy. After your lock-in period expires, you can withdraw freely without penalties.'
                },
                {
                    q: 'Can I avoid the Traditional Pool penalty?',
                    a: 'Yes, the 10% penalty only applies to early withdrawals. If you wait until your chosen investment duration (1, 3, 6, or 12 months) expires, you can withdraw your full balance without any penalties.'
                }
            ]
        },
        {
            category: 'Staking',
            questions: [
                {
                    q: 'Which cryptocurrencies can I stake?',
                    a: 'You can stake BTC, ETH, USDT, USDC, or XRP. All must be BEP-20 tokens on the BNB Smart Chain. You send your chosen cryptocurrency to the company wallet address provided during staking setup.'
                },
                {
                    q: 'What are the staking APY rates?',
                    a: '3-month contracts earn 6% APY (~1.45% total over 3 months), 6-month contracts earn 7% APY (~3.4% over 6 months), and 12-month contracts earn 8% APY (8% over 12 months). All rates use daily compounding and are the same for all supported cryptocurrencies.'
                },
                {
                    q: 'How is interest calculated with daily compounding?',
                    a: 'Interest compounds daily using the formula: A = P(1 + r)^t, where P is principal, r is daily rate calculated as (1 + APY)^(1/365) - 1, and t is days elapsed. For example, 6% APY gives a daily rate of ~0.01597%. Your earnings accumulate every day and update automatically every 24 hours, or you can manually update by clicking "Update Earnings".'
                },
                {
                    q: 'Can I cancel my staking contract early?',
                    a: 'Yes, but penalties apply to your earned interest only. 3-month: 30% penalty on earnings, 6-month: 40% penalty, 12-month: 50% penalty. Your original staked amount (principal) is always 100% safe and returned in full. After penalty deduction, you receive principal + remaining earnings.'
                },
                {
                    q: 'What happens when my staking contract ends?',
                    a: 'The contract status changes to "completed" and earnings stop accumulating. You can then submit a withdrawal request to receive your original amount plus all earned interest.'
                },
                {
                    q: 'Can I stake multiple contracts?',
                    a: 'Yes, you can create multiple staking contracts with different cryptocurrencies and durations. Each contract operates independently.'
                }
            ]
        },
        {
            category: 'AML & KYC Verification',
            questions: [
                {
                    q: 'What is KYC and why is it required?',
                    a: 'KYC (Know Your Customer) is a verification process to confirm your identity. It helps prevent fraud, money laundering, and ensures compliance with financial regulations. Completing KYC may be required for certain services or withdrawal limits.'
                },
                {
                    q: 'What documents do I need for KYC verification?',
                    a: 'You need three documents: 1) A government-issued ID (passport, driving licence, or ID card), 2) Proof of address (bank statement or tax document), and 3) A selfie photo holding your ID document.'
                },
                {
                    q: 'How long does KYC verification take?',
                    a: 'KYC verification typically takes 1-3 business days. You will be notified via email and in your dashboard once your verification is reviewed. If additional information is needed, our team will contact you.'
                },
                {
                    q: 'Is my personal information secure?',
                    a: 'Yes. We do not share your personal details with third parties. The company reserves the right to share information only under an official court request. All submitted documents are encrypted and stored securely.'
                },
                {
                    q: 'What happens if my KYC is rejected?',
                    a: 'If your KYC verification is rejected, you will receive admin notes explaining the reason. Common reasons include unclear photos, expired documents, or mismatched information. You can resubmit with corrected documents.'
                },
                {
                    q: 'Can I use the platform without KYC?',
                    a: 'Basic platform features may be available without KYC, but certain services, higher withdrawal limits, or advanced features may require completed verification. Check specific service requirements for details.'
                }
            ]
        },
        {
            category: 'Security & Safety',
            questions: [
                {
                    q: 'Is this platform safe?',
                    a: 'We use non-custodial smart contracts on the BSC blockchain. We never hold your private keys. All transactions are transparent and verifiable on-chain. However, trading involves risk and you should only invest what you can afford to lose.'
                },
                {
                    q: 'Can I verify transactions on the blockchain?',
                    a: 'Yes, every deposit, trade, and withdrawal is recorded on the BNB Smart Chain. You can verify any transaction on BscScan.com using the transaction hash.'
                },
                {
                    q: 'Who has access to pool funds?',
                    a: 'Pool funds are sent to designated pool addresses on the blockchain. Only authorized managers can execute trades. Withdrawals are processed automatically through smart contracts without manual intervention.'
                },
                {
                    q: 'How does the system identify users?',
                    a: 'Your MetaMask wallet address is your unique account identifier. Each wallet address is treated as a separate account with its own investments, deposits, and data. If you connect with a different wallet address, it will be recognized as a completely different user account.'
                },
                {
                    q: 'What if I lose access to my wallet?',
                    a: 'CRITICAL: If you lose access to your MetaMask wallet (private keys or seed phrase), you permanently lose access to your account and ALL associated investments and funds. There is no email/password recovery option. Your wallet address is the ONLY way to access your account. Always backup your seed phrase securely in multiple safe locations. Your wallet security is entirely your responsibility.'
                },
                {
                    q: 'Can I use multiple wallets?',
                    a: 'Yes, you can connect with different MetaMask wallets, but each wallet address will be treated as a completely separate account. Your investments, balances, and data are tied to specific wallet addresses and cannot be transferred between wallets.'
                }
            ]
        },
        {
            category: 'Lessons & Education',
            questions: [
                {
                    q: 'What lesson packages are available?',
                    a: '4 Basic Strategies ($25 USDT) teaches foundational trading techniques. Elliot Fibonacci ($150 USDT) covers advanced technical analysis. Full Personal Training ($500 USDT) provides comprehensive one-on-one mentorship with personalized trading plans. All lessons are taught by experienced professional traders.'
                },
                {
                    q: 'How do I book a lesson?',
                    a: 'Select your desired package on the Lessons page, pay the package fee in USDT (BEP-20) to the wallet address shown, submit your transaction hash and contact details, and await admin confirmation (typically 24-48 hours). You\'ll receive lesson scheduling details via email.'
                },
                {
                    q: 'Are the lessons refundable?',
                    a: 'Lesson fees are non-refundable once payment is confirmed and lessons are scheduled. Make sure to review package details before purchasing.'
                },
                {
                    q: 'Do lessons guarantee trading success?',
                    a: 'No. Lessons provide education and strategies, but do not guarantee trading profits. You are responsible for your own trading decisions and results. We recommend practicing with paper trading before risking real capital.'
                }
            ]
        },
        {
            category: 'Deal or No Deal Game',
            questions: [
                {
                    q: 'What is Deal or No Deal?',
                    a: 'Deal or No Deal is a game of chance and strategy where you compete for prizes ranging from $0.01 to $1,000,000. Special launch offer: Pay only $1 USDT entry fee for the first 3 months, then $3 USDT after. Choose your case, eliminate other cases, and decide whether to accept the Banker\'s offers or risk it all for bigger prizes.'
                },
                {
                    q: 'How much does it cost to play?',
                    a: 'Special launch offer: Each game costs only $1 USDT (BEP-20) for the first 3 months, then $3 USDT after. The entry fee is paid to the game wallet address and is non-refundable once the game starts. You can play unlimited games as long as you don\'t have an active game in progress. Payment is made directly from your MetaMask wallet.'
                },
                {
                    q: 'How do I start a game?',
                    a: 'Click "Start New Game", pay the entry fee ($1 USDT for first 3 months, then $3), and select your lucky case (1-26). Once confirmed, the game begins and prize amounts are randomly distributed among all 26 cases.'
                },
                {
                    q: 'How does the game work?',
                    a: 'After choosing your case, you open cases in rounds (6-5-4-3-2-2-2-2-2 cases per round). After each round, the Banker makes an offer based on remaining prizes. You decide: accept the offer (Deal!) or continue (No Deal!). If you refuse all offers, you make a final choice to keep your case or swap it with the last remaining case.'
                },
                {
                    q: 'What is the Banker\'s offer?',
                    a: 'The Banker calculates offers algorithmically based on remaining prize amounts, typically 70-90% of the average. The offer gets more accurate as fewer cases remain. You can accept any offer to end the game immediately and receive that amount.'
                },
                {
                    q: 'What is the XP system?',
                    a: 'You earn XP based on your winnings: 100 XP for $1-$50k, 300 XP for $50k-$100k, 500 XP for $100k-$300k, 1,000 XP for $300k-$500k, 2,000 XP for $500k-$750k, and 5,000 XP for $750k+. Plus, earn bonus XP for each Banker offer you refuse - the bonus amount scales with your current god level, rewarding higher-level players for taking risks. XP determines your leaderboard rank and unlocks god-level trophies as you level up from 0 to 12.'
                },
                {
                    q: 'What are the monthly leaderboard prizes?',
                    a: 'Every 30 days, the top 10 players with the highest total XP win XRP rewards: 1st place gets 200 XRP, 2nd place gets 100 XRP, 3rd place gets 50 XRP, 4th-5th place receive 25 XRP each, 6th-8th place get 15 XRP each, and 9th-10th place earn 10 XRP each. Total monthly rewards: 465 XRP distributed. Rankings reset each period.'
                },
                {
                    q: 'What are god levels and trophies?',
                    a: 'As you accumulate XP, you progress through 13 god levels (0-12), each with unique titles like "New God Born" (Level 0), "Aphrodite" (Level 1), "Poseidon" (Level 9), "Athena" (Level 10), "Hera" (Level 11), up to "Zeus" (Level 12). Each level unlocks a collectible trophy NFT displayed in your cabinet.'
                },
                {
                    q: 'What is the NFT Trophy Marketplace?',
                    a: 'As you progress through god levels, you earn Trophy NFTs for each completed level. Once you reach an advanced level, the NFT Marketplace unlocks, allowing you to sell your Trophy NFTs for Bitcoin (BTC). Each trophy has a fixed BTC price that increases with the level - the ultimate Zeus trophy sells for 1 full BTC! When you sell your trophies, your progress resets and you can start the journey again, creating a repeatable cycle to earn real Bitcoin.'
                },
                {
                    q: 'What is the 1 BTC reward?',
                    a: 'Players who complete Level 12 (Zeus) by accumulating 2,000,001+ XP receive 1 BTC. After claiming and the reward is paid, you can earn it again by completing another round. Contact admin to claim once you reach this level.'
                },
                {
                    q: 'Do I receive my winnings automatically?',
                    a: 'Game winnings are recorded in your history and contribute to your XP and leaderboard ranking. They are tracked for entertainment purposes. Only the top 10 monthly leaderboard winners receive actual XRP payouts from the admin. Additionally, you can earn real Bitcoin by selling your Trophy NFTs once the marketplace unlocks.'
                },
                {
                    q: 'Can I play multiple games at once?',
                    a: 'No, you can only have one active game at a time per wallet address. You must complete your current game (accept a deal or reach the final decision) before starting a new one.'
                },
                {
                    q: 'Can I undo opening a case?',
                    a: 'No, once you select a case to open, it cannot be undone. The case is immediately revealed and eliminated from play. Choose carefully!'
                },
                {
                    q: 'Should I keep or swap my case at the end?',
                    a: 'Statistically, both choices have equal odds. It\'s purely a psychological decision. Some players prefer sticking with their original choice, while others like to swap. Trust your instinct!'
                },
                {
                    q: 'How can I increase my XP faster?',
                    a: 'To maximize XP: 1) Win bigger amounts for more base XP, 2) Refuse Banker offers to earn bonus XP - the amount scales with your current god level, so higher-level players earn more XP for taking risks, and 3) Play consistently to accumulate XP across multiple games.'
                },
                {
                    q: 'What strategy should I use?',
                    a: 'If you want to climb the leaderboard, focus on XP by refusing early low offers and playing frequently. If you want guaranteed returns, accept strong Banker offers when high prizes are eliminated. Balance risk vs reward based on your goals.'
                }
            ]
        },
        {
            category: 'Performance & Tracking',
            questions: [
                {
                    q: 'How can I track my performance?',
                    a: 'Your dashboard displays real-time statistics including invested amount, current balance, PnL, return percentage, and ownership. You can also view detailed trade history for each pool.'
                },
                {
                    q: 'Can I see all trades executed in the pool?',
                    a: 'Yes, all pool trades are fully transparent. You can view trade history showing pair, direction, leverage, PnL, fees, and timestamps for every trade.'
                },
                {
                    q: 'What are notifications for?',
                    a: 'You receive notifications for important events like deposit confirmations, withdrawal approvals, staking contract creation, and trade completions. Check your dashboard notifications panel regularly.'
                },
                {
                    q: 'How often is data updated?',
                    a: 'Pool data, balances, and performance metrics are updated in real-time. Staking contracts are updated every 24 hours.'
                }
            ]
        }
    ];

    const allQuestions = faqCategories.flatMap((cat, catIndex) =>
        cat.questions.map((q, qIndex) => ({
            ...q,
            category: cat.category,
            id: `${catIndex}-${qIndex}`
        }))
    );

    const filteredQuestions = searchTerm
        ? allQuestions.filter(
              (item) =>
                  item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allQuestions;

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
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-12"
                        >
                            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-6">
                                <HelpCircle className="w-4 h-4 text-red-400" />
                                <span className="text-red-400 text-sm font-medium">Resources</span>
                            </div>
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-6 relative px-4">
                                <span className="relative z-10">Frequently Asked Questions</span>
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
                                    Frequently Asked Questions
                                </motion.div>
                            </h1>
                            <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto mb-8 px-4">
                                Find answers to common questions about our trading pools and staking services
                            </p>

                            {/* Search */}
                            <div className="relative max-w-xl mx-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search questions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-6 bg-black/60 border-red-500/20 text-white rounded-xl text-lg focus:border-red-500/50 backdrop-blur-xl"
                                />
                            </div>
                        </motion.div>

                        {/* FAQ List */}
                        <div className="space-y-4">
                            {searchTerm ? (
                                // Search results view
                                <>
                                    <p className="text-gray-400 mb-6">
                                        Found {filteredQuestions.length} result{filteredQuestions.length !== 1 ? 's' : ''}
                                    </p>
                                    {filteredQuestions.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-black/60 border border-red-500/20 rounded-xl overflow-hidden backdrop-blur-xl"
                                        >
                                            <button
                                                onClick={() => setOpenIndex(openIndex === item.id ? null : item.id)}
                                                className="w-full px-6 py-5 flex items-start gap-4 text-left hover:bg-red-500/10 transition-colors"
                                            >
                                                <HelpCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                                                <div className="flex-1">
                                                    <div className="text-xs text-red-400 mb-1">{item.category}</div>
                                                    <h3 className="text-white font-semibold mb-1">{item.q}</h3>
                                                    {openIndex === item.id && (
                                                        <p className="text-gray-400 mt-3 leading-relaxed">{item.a}</p>
                                                    )}
                                                </div>
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                                                        openIndex === item.id ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </button>
                                        </motion.div>
                                    ))}
                                </>
                            ) : (
                                // Category view
                                faqCategories.map((category, catIndex) => (
                                    <motion.div
                                        key={catIndex}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: catIndex * 0.1 }}
                                        className="bg-black/60 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden"
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
                                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                            {category.category}
                                        </h2>
                                        <div className="space-y-3 relative z-10">
                                            {category.questions.map((item, qIndex) => {
                                                const id = `${catIndex}-${qIndex}`;
                                                return (
                                                    <div
                                                        key={qIndex}
                                                        className="bg-white/5 rounded-xl overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => setOpenIndex(openIndex === id ? null : id)}
                                                            className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <div className="flex-1">
                                                                <h3 className="text-white font-semibold">{item.q}</h3>
                                                                {openIndex === id && (
                                                                    <p className="text-gray-400 mt-3 leading-relaxed">
                                                                        {item.a}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <ChevronDown
                                                                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                                                                    openIndex === id ? 'rotate-180' : ''
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Still have questions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-12 bg-black/60 border border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-xl relative overflow-hidden"
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
                            <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Still have questions?</h3>
                            <p className="text-gray-400 mb-6 relative z-10">
                                Can't find what you're looking for? Check our comprehensive documentation or reach out to our support team.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
                                <a
                                    href={'/Documentation'}
                                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 text-white font-semibold rounded-xl transition-opacity"
                                >
                                    View Documentation
                                </a>
                                <a
                                    href="https://discord.com/invite/Y335JjFhNw"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-red-500/20 transition-colors"
                                >
                                    Join Discord
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <Footer />
            </div>
        </WalletProvider>
    );
}