import React from 'react';
import { WalletProvider } from '../components/wallet/WalletContext';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertTriangle, DollarSign, Shield, Lock, Users, TrendingUp, Coins, Trophy } from 'lucide-react';

export default function TermsOfService() {
    const sections = [
        {
            id: 'agreement',
            title: '1. Agreement to Terms',
            icon: FileText,
            content: [
                {
                    subtitle: 'Acceptance of Terms',
                    text: 'These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "Participant," "Investor," or "you") and MarketsUniverse LLC ("Company," "we," "us," or "our"), a limited liability company registered under the laws of Ukraine. By accessing, registering, or using our platform, services, or any related features, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and all applicable Ukrainian and international laws.'
                },
                {
                    subtitle: 'Eligibility Requirements',
                    text: 'You must be at least 18 years of age and possess the legal capacity to enter into binding contracts under Ukrainian law. By using our services, you represent and warrant that: (a) you meet the minimum age requirement; (b) you have not been previously suspended or banned from our platform; (c) you are not located in a jurisdiction where our services are prohibited; (d) your use complies with all applicable local, national, and international laws; and (e) all information you provide is accurate, current, and complete.'
                },
                {
                    subtitle: 'Jurisdictional Compliance',
                    text: 'Our services are operated from Ukraine and are subject to Ukrainian law. Users from other jurisdictions must ensure their use complies with local regulations regarding cryptocurrency trading, investment pools, online gaming, and financial services. We reserve the right to restrict access from jurisdictions where our services may be prohibited or restricted.'
                }
            ]
        },
        {
            id: 'services',
            title: '2. Platform Services Overview',
            icon: TrendingUp,
            content: [
                {
                    subtitle: 'Trading Pool Services',
                    text: 'We operate three distinct investment pools accessible via BEP-20 USDT deposits: (1) Crypto Pool (Scalping) - high-frequency cryptocurrency scalping with no lock-in period and 20% manager profit share on positive profits only, flexible deposits/withdrawals subject to pool status; (2) Traditional Pool - conservative long-term strategy requiring 1, 3, 6, or 12 month investment commitment with 10% early withdrawal penalty and 20% manager profit share on positive profits only; (3) VIP Pool - premium advanced strategies combining scalping, swing, and position trading with no lock-in, minimum deposit $20,000 USDT, and reduced 10% manager profit share on positive profits only, designed for sophisticated investors. Each pool features time-based share calculations ensuring fair profit distribution only from trades executed after your deposit. Manager profit share (10-20% depending on pool) applies exclusively to positive Clean PnL (profit after trading fees). All trades, performance metrics, and balances are fully transparent.'
                },
                {
                    subtitle: 'Staking Services',
                    text: 'Our staking platform allows you to stake supported cryptocurrencies (BTC, ETH, USDT, USDC, XRP) as BEP-20 tokens for fixed terms (3, 6, or 12 months) with guaranteed Annual Percentage Yield (APY) rates: 3-month = 6% APY, 6-month = 7% APY, 12-month = 8% APY. Staking involves sending your cryptocurrency to our company wallet address and locking funds for the agreed period. Interest compounds daily using the formula A = P(1 + r)^t where r = (1 + APY)^(1/365) - 1. Early cancellation penalties apply: 30% penalty on earnings for 3-month, 40% for 6-month, 50% for 12-month contracts. Principal is always 100% protected and returned in full.'
                },
                {
                    subtitle: 'Gaming Services',
                    text: 'We offer Deal or No Deal - a blockchain-based game of chance and strategy with $3 USDT entry fee per game. Features include: 26 cases with prizes from $0.01 to $1,000,000, round-based gameplay with Banker offers calculated algorithmically (70-90% of remaining prize average), XP progression system (100 to 5,000 XP based on winnings, plus 100 XP bonus per refused Banker offer), 13 god levels (0-12) with unique trophy NFTs awarded at each level, monthly 30-day leaderboards with XRP prizes (200/100/50 XRP for top 3 players), and Grand Prize of 1 BTC awarded one-time to first player reaching level 12 (God of Gods). Game outcomes use provably fair random number generation. Entry fees are non-refundable. Winnings are recorded for entertainment and XP purposes. All gaming activities comply with applicable regulations.'
                },
                {
                    subtitle: 'Educational and Analysis Tools',
                    text: 'We provide educational lesson packages: 4 Basic Strategies ($500 USDT) covering foundational trading techniques, Elliot Fibonacci ($1,000 USDT) teaching advanced technical analysis with Elliot Wave Theory and Fibonacci retracements, and Full Personal Training ($2,000 USDT) offering comprehensive one-on-one mentorship with personalized trading plans. Additional analysis tools may be provided. All educational content is for informational purposes only and does not constitute financial advice, investment recommendations, or guarantees of trading success. Trading involves substantial risk of loss.'
                }
            ]
        },
        {
            id: 'account',
            title: '3. Account Registration and Security',
            icon: Lock,
            content: [
                {
                    subtitle: 'Wallet Connection',
                    text: 'Account creation requires connecting a Web3-compatible cryptocurrency wallet (MetaMask or similar). You are solely responsible for: maintaining the security of your wallet private keys, all transactions executed from your wallet address, protecting your wallet from unauthorized access, backing up your wallet recovery phrases, and any losses resulting from wallet compromise or misuse.'
                },
                {
                    subtitle: 'Account Verification',
                    text: 'We may require Know Your Customer (KYC) verification including identity documents, proof of address, and source of funds documentation to comply with Ukrainian anti-money laundering (AML) regulations and international financial standards. Failure to provide requested verification may result in account restrictions or suspension.'
                },
                {
                    subtitle: 'Account Responsibilities',
                    text: 'You agree to: provide accurate and complete information during registration, maintain the confidentiality of your account credentials, notify us immediately of unauthorized access, accept responsibility for all activities under your account, refrain from transferring or selling your account, and comply with all platform rules and regulations.'
                },
                {
                    subtitle: 'Account Suspension and Termination',
                    text: 'We reserve the right to suspend, restrict, or terminate your account if: you violate these Terms or applicable laws, engage in fraudulent or suspicious activities, provide false or misleading information, fail to complete required verification, or engage in market manipulation or abuse. Upon termination, you remain obligated to settle outstanding investments, withdraw available funds subject to our procedures, and honor all financial commitments.'
                }
            ]
        },
        {
            id: 'trading-pools',
            title: '4. Trading Pool Terms and Conditions',
            icon: DollarSign,
            content: [
                {
                    subtitle: 'Investment Process',
                    text: 'To participate in trading pools: connect your MetaMask wallet to the platform, select your desired pool (Crypto, Traditional, or VIP), enter investment amount in USDT (BEP-20), for Traditional Pool, choose investment duration (1, 3, 6, or 12 months), approve and send USDT transaction from MetaMask to pool address, transaction is recorded automatically upon blockchain confirmation, and monitor your investment through real-time dashboard showing ownership percentage, balance, Net PnL, and trade history. The platform uses sophisticated time-based share calculations (NAV system) to ensure fair profit distribution.'
                },
                {
                    subtitle: 'Trading Operations',
                    text: 'We manage pool funds with full discretion regarding: trading strategies and execution, cryptocurrency selection and allocation, exchange selection and trade routing, position sizing and leverage usage, risk management and stop-loss implementation, and portfolio rebalancing. Trading is conducted by professional traders following established strategies for each pool category.'
                },
                {
                    subtitle: 'Profit Distribution and Fees',
                    text: 'Pool profits are distributed using a share-based system (similar to mutual funds): deposits buy shares at current Net Asset Value (NAV), each trade\'s profit/loss is distributed proportionally to shareholders at time of trade execution, withdrawals remove shares at current NAV. Manager profit share varies by pool: Crypto Pool 20%, Traditional Pool 20%, VIP Pool 10%. Profit share is deducted only from positive Clean PnL (profit after trading fees) before investor distribution. Trading fees (exchange commissions) are deducted from gross PnL. Your Net PnL = Gross PnL - Trading Fees - Profit Share (on profits only). Losses are shared proportionally with no manager profit share charged on losses. Total Balance = Deposits - Withdrawals + Net PnL. All calculations are transparent and displayed in real-time on pool pages.'
                },
                {
                    subtitle: 'Withdrawal Process',
                    text: 'To withdraw from pools: navigate to your pool dashboard, click the withdrawal section, enter your name, email, BEP-20 payment address, and withdrawal amount (up to current balance), and submit the request. Administrators manually review and process withdrawals, typically within 3-7 business days for pool withdrawals, 5-10 days for staking. You will receive USDT to your provided BEP-20 address. Withdrawals may be temporarily locked during high-volatility periods or administrative reviews (indicated on pool pages). For Traditional Pool, 10% penalty applies to early withdrawals before your investment duration expires. VIP Pool and Crypto Pool have no lock-in penalties. All withdrawal statuses are tracked in your dashboard.'
                },
                {
                    subtitle: 'Pool Closure or Restructuring',
                    text: 'We reserve the right to close, merge, or restructure pools with 30 days advance notice. In such events, investors will be given options to: transfer to alternative pools, withdraw funds according to standard procedures, or accept modified terms. Emergency closures may occur without notice in cases of regulatory changes or extreme market conditions.'
                }
            ]
        },
        {
            id: 'staking',
            title: '5. Staking Contract Terms',
            icon: Coins,
            content: [
                {
                    subtitle: 'Staking Contract Creation',
                    text: 'To create a staking contract: select cryptocurrency type (BTC, ETH, USDT, USDC, XRP), choose duration (3, 6, or 12 months), review APY rate for selected term, deposit cryptocurrency to designated company wallet, submit transaction hash and contract details, and await admin confirmation. Once confirmed, your contract begins immediately with daily compounding interest.'
                },
                {
                    subtitle: 'Interest Calculation',
                    text: 'Staking interest is calculated daily using compound interest formula: Daily Rate = (1 + APY)^(1/365) - 1. Interest compounds automatically each day, accumulating to your contract balance. Total earnings = Principal × ((1 + Daily Rate)^Days - 1). Your dashboard displays real-time current value and accumulated earnings.'
                },
                {
                    subtitle: 'Contract Duration and Maturity',
                    text: 'Staking contracts run for the specified duration (3, 6, or 12 months) from confirmation date. Upon maturity: you may withdraw full balance (principal + earnings), reinvest in a new contract, or leave funds for standard withdrawal processing. Matured contracts no longer earn interest and should be withdrawn or reinvested promptly.'
                },
                {
                    subtitle: 'Early Withdrawal Penalties',
                    text: 'Early cancellation before contract maturity incurs penalties: 50% of accumulated earnings are forfeited, principal is returned in full (minus penalty), processing may take 7-14 business days, and cancelled contracts cannot be reinstated. Early withdrawal should only be considered in urgent circumstances due to significant penalty costs.'
                },
                {
                    subtitle: 'Cryptocurrency Custody',
                    text: 'Staked cryptocurrencies are held in company-controlled wallets with the following security measures: cold storage for majority of holdings, multi-signature authorization for large transactions, regular security audits, insurance coverage where available, and segregated accounting for each staking contract. You maintain beneficial ownership while we hold custody during staking period.'
                }
            ]
        },
        {
            id: 'gaming',
            title: '6. Gaming Services Terms',
            icon: Trophy,
            content: [
                {
                    subtitle: 'Deal or No Deal - Game Mechanics',
                    text: 'Entry fee: $3 USDT per game paid to designated game wallet address via MetaMask. Gameplay: select your lucky case from 26 cases containing randomly distributed prize amounts from $0.01 to $1,000,000 USDT. Open cases in structured rounds: Round 1 = 6 cases, Round 2 = 5 cases, Round 3 = 4 cases, Round 4 = 3 cases, Rounds 5-9 = 2 cases each. After each round completes, the Banker makes an offer calculated algorithmically (typically 70-90% of remaining prize average). You choose: accept the offer (Deal!) to end game and receive that amount, or decline (No Deal!) to continue playing. When only 2 cases remain (yours + 1 other), you make final decision: keep your original case or swap it with the last remaining case. Game concludes when you accept a Banker offer or reveal your final case amount.'
                },
                {
                    subtitle: 'XP System and Levels',
                    text: 'Each game awards XP based on winnings tier: $1-$50,000 = 100 XP, $50,001-$100,000 = 300 XP, $100,001-$300,000 = 500 XP, $300,001-$500,000 = 1,000 XP, $500,001-$750,000 = 2,000 XP, $750,001+ = 5,000 XP. Additionally, earn 100 bonus XP for each Banker offer refused (risk bonus). XP accumulates permanently across all games to advance through 13 god levels (0-12): Level 0 (0 XP) = New God Born, Level 1 (500 XP) = God of Luck, Level 2 (1,200 XP) = God of Fortune, up to Level 12 (100,000 XP) = God of Gods. Each level unlocks a unique collectible trophy NFT with god-themed artwork displayed in your Trophy Cabinet. Level progression is permanent and never resets.'
                },
                {
                    subtitle: 'Trophy System',
                    text: 'Earn unique NFT trophies by reaching milestone levels. Each trophy is a collectible digital asset with god-themed artwork. Trophies are displayed in your Trophy Cabinet. Trophy NFTs are generated and awarded upon reaching each level. Trophies represent achievement and status within the gaming community.'
                },
                {
                    subtitle: 'Leaderboard and Monthly Competitions',
                    text: 'Monthly leaderboards run in 30-day periods tracking top performers based on total accumulated XP (not winnings). Each period is numbered sequentially with specific start and end dates. Top 3 players per period win XRP rewards: 1st Place - 200 XRP, 2nd Place - 100 XRP, 3rd Place - 50 XRP. Leaderboard rankings are displayed in real-time showing player names, wallet addresses, XP totals, god levels, and games played. Countdown timer shows time remaining until period ends. Prize distribution occurs within 15-30 days after period completion, administered by platform administrators. Winners are notified via dashboard notifications. XRP is paid to winner wallet addresses at current exchange rate.'
                },
                {
                    subtitle: 'Grand Prize - 1 BTC',
                    text: 'Achievement reward of 1 Bitcoin (BTC) for players who COMPLETE Level 12 (Zeus) by accumulating 1,000,001+ total XP and receiving the trophy. Upon claiming and receiving the reward, a new round begins and you can earn it again. Prize eligibility is tracked in PlayerProfile entity with btc_reward_claimed flag. User receives dashboard notification upon completing level 12 with instructions to contact support for prize claiming. Verification, identity confirmation, and KYC may be required before prize distribution. Prize payment processed within 30-60 days of verification completion. After successful payment and round reset, players can continue playing to earn the reward in subsequent rounds. Offer void where prohibited by local law or regulation.'
                },
                {
                    subtitle: 'Game Fairness and Integrity',
                    text: 'All games use provably fair random number generation. Deal or No Deal: 26 prize amounts are randomly shuffled at game creation using client-side JavaScript randomization with cryptographic-grade Math.random(). Your selected case number and all prize positions are permanently recorded in the DealOrNoDealGame entity on game creation. Case amounts and player case assignment cannot be altered after game creation. Banker offers are calculated algorithmically (70-90% of average remaining amounts with randomized multiplier). Game outcomes cannot be manipulated by players or administrators after game initialization. All entry fee transactions are recorded on BSC blockchain with transaction hashes providing transparent proof. We reserve the right to investigate suspicious patterns, multiple account abuse, or collusion attempts and void results if fraud is detected.'
                }
            ]
        },
        {
            id: 'risks',
            title: '7. Risk Disclosures and Warnings',
            icon: AlertTriangle,
            content: [
                {
                    subtitle: 'Trading and Investment Risks',
                    text: 'Cryptocurrency and financial markets carry substantial risk: Market volatility can result in significant losses. Past performance does not guarantee future results. You may lose your entire investment principal. Leverage amplifies both gains and losses. External events can cause rapid price movements. Regulatory changes may impact market access. Exchange failures or hacks may affect trading operations. No investment returns are guaranteed.'
                },
                {
                    subtitle: 'Cryptocurrency-Specific Risks',
                    text: 'Cryptocurrency investments involve unique risks: Extreme price volatility and market manipulation, Regulatory uncertainty in various jurisdictions, Technology risks including network failures or forks, Security vulnerabilities and hacking threats, Liquidity constraints during market stress, Irreversible transactions (no chargebacks), Private key loss resulting in permanent fund loss, and Exchange insolvency or operational issues.'
                },
                {
                    subtitle: 'Staking Risks',
                    text: 'Staking involves specific risks: Cryptocurrency price decline during lock-up period may exceed earned interest, Early withdrawal penalties significantly reduce returns, Smart contract vulnerabilities (if applicable), Company insolvency affecting staked holdings, Regulatory changes impacting staking operations, and Opportunity cost of locked funds.'
                },
                {
                    subtitle: 'Gaming Risks',
                    text: 'Gaming activities involve risk of loss: Entry fees are non-refundable regardless of outcomes, Probability-based games favor the house over time, Entertainment value should be primary motivation, Only risk amounts you can afford to lose completely, Gambling can be addictive - seek help if needed, and Winnings may be subject to taxation.'
                },
                {
                    subtitle: 'No Financial Advice',
                    text: 'IMPORTANT: We do not provide financial, investment, tax, or legal advice. All information, analysis, and educational content is for informational purposes only. You should consult qualified professionals before making financial decisions. Your investment decisions are your sole responsibility. We are not liable for losses resulting from your investment choices.'
                }
            ]
        },
        {
            id: 'fees',
            title: '8. Fees and Charges',
            icon: DollarSign,
            content: [
                {
                    subtitle: 'Trading Pool Fees',
                    text: 'Management and performance fees apply to all pools: Manager profit share varies by pool (Crypto Pool 20%, Traditional Pool 20%, VIP Pool 10%) and is deducted only from positive Clean PnL (profit after trading fees) before distribution to investors. No profit share is ever charged on losing trades. Exchange trading fees (typically 0.01% to 0.1% per trade) are automatically deducted from gross PnL. Traditional Pool early withdrawal penalty: 10% of withdrawal amount if withdrawing before investment duration expires (no penalty after duration ends). Crypto Pool and VIP Pool have no withdrawal penalties. No platform withdrawal processing fees, but standard blockchain gas fees apply. All fee structures are transparently displayed on pool pages before investment.'
                },
                {
                    subtitle: 'Staking Fees',
                    text: 'Staking services include: No management fees or platform fees during normal contract operation. Early cancellation penalties apply only to accumulated interest (earnings): 30% penalty for 3-month contracts, 40% for 6-month, 50% for 12-month. Principal is always returned 100% intact. Standard blockchain transaction fees (BNB gas fees on BSC) for deposits and withdrawals paid by user. No hidden fees - APY rates shown (6%, 7%, 8%) are the actual earning rates with daily compounding.'
                },
                {
                    subtitle: 'Gaming Fees',
                    text: 'Gaming entry fees: Deal or No Deal: $3 USDT entry fee per game paid to designated game wallet address. Entry fees are non-refundable once game begins and case selection is made. Game purchases may be temporarily locked by administrators (indicated on game page). Standard BNB blockchain gas fees for USDT transactions paid by user. No additional platform fees apply to gaming. Leaderboard prize payouts (200/100/50 XRP) and 1 BTC grand prize have no fees deducted from winnings.'
                },
                {
                    subtitle: 'Payment Processing',
                    text: 'Cryptocurrency transaction fees: Blockchain network fees (gas fees) paid by user, Exchange deposit/withdrawal fees if applicable, Minimum withdrawal amounts to cover transaction costs, and Priority processing available for additional fees.'
                }
            ]
        },
        {
            id: 'prohibited',
            title: '9. Prohibited Activities',
            icon: AlertTriangle,
            content: [
                {
                    subtitle: 'Illegal Activities',
                    text: 'You may not use our platform for: Money laundering or terrorist financing, Fraud, theft, or embezzlement, Tax evasion or reporting violations, Sanctions evasion or prohibited transactions, Funding illegal activities, Drug trafficking or illegal commerce, or Any activity violating Ukrainian or international law.'
                },
                {
                    subtitle: 'Market Manipulation',
                    text: 'Prohibited trading activities include: Wash trading or fictitious transactions, Front-running or insider trading, Price manipulation or pump-and-dump schemes, Coordinated market manipulation, Spoofing or layering orders, or Using bots or automated systems without authorization.'
                },
                {
                    subtitle: 'Gaming Abuse',
                    text: 'Gaming violations include: Multiple accounts or identity fraud, Collusion with other players, Exploiting bugs or glitches, Using automated gameplay systems, Bonus abuse or promotional manipulation, or Chargeback fraud or payment disputes.'
                },
                {
                    subtitle: 'Platform Abuse',
                    text: 'You may not: Reverse engineer or hack our systems, Distribute malware or viruses, Conduct DDoS or similar attacks, Scrape data without authorization, Impersonate staff or other users, or Interfere with platform operations.'
                }
            ]
        },
        {
            id: 'intellectual-property',
            title: '10. Intellectual Property Rights',
            icon: Shield,
            content: [
                {
                    subtitle: 'Our Property',
                    text: 'All platform content is owned by MarketsUniverse LLC: Website design and interface, Software and algorithms, Trading strategies and methodologies, Logos, trademarks, and branding, Educational content and analysis, and Documentation and user guides. You may not reproduce, distribute, or create derivative works without written permission.'
                },
                {
                    subtitle: 'License Grant',
                    text: 'We grant you a limited, non-exclusive, non-transferable license to: Access and use our platform for personal investment purposes, View and download content for personal reference, and Use our tools and calculators for your investment decisions. This license terminates upon account closure or Terms violation.'
                },
                {
                    subtitle: 'User Content',
                    text: 'By submitting content (messages, feedback, suggestions), you grant us a worldwide, royalty-free, perpetual license to use, modify, and incorporate your submissions for platform improvement and marketing purposes. You represent that you have all necessary rights to submitted content.'
                }
            ]
        },
        {
            id: 'liability',
            title: '11. Limitation of Liability',
            icon: Scale,
            content: [
                {
                    subtitle: 'Disclaimer of Warranties',
                    text: 'TO THE MAXIMUM EXTENT PERMITTED BY UKRAINIAN LAW: Services provided "AS IS" and "AS AVAILABLE", No warranties regarding availability, accuracy, or reliability, No guarantee of profit or investment returns, No warranty of error-free operation, and No guarantee of uninterrupted service.'
                },
                {
                    subtitle: 'Limitation of Liability',
                    text: 'MarketsUniverse LLC shall not be liable for: Investment losses or missed profit opportunities, Cryptocurrency price fluctuations, Exchange failures or bankruptcies, Blockchain network congestion or failures, Hacking, theft, or security breaches (despite reasonable precautions), Regulatory changes affecting service availability, Force majeure events (wars, natural disasters, pandemics), Third-party service failures, or Consequential, indirect, or incidental damages. Our maximum liability is limited to fees paid by you in the 12 months preceding the claim.'
                },
                {
                    subtitle: 'Indemnification',
                    text: 'You agree to indemnify and hold harmless MarketsUniverse LLC, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from: Your use of our services, Your violation of these Terms, Your violation of applicable laws, Your investment decisions and losses, Your gaming activities and outcomes, or Your breach of third-party rights.'
                }
            ]
        },
        {
            id: 'disputes',
            title: '12. Dispute Resolution and Governing Law',
            icon: Scale,
            content: [
                {
                    subtitle: 'Governing Law',
                    text: 'These Terms are governed by and construed in accordance with the laws of Ukraine, without regard to conflict of law principles. Ukrainian law applies to all aspects of your relationship with MarketsUniverse LLC including contract formation, performance, breach, and remedies.'
                },
                {
                    subtitle: 'Jurisdiction and Venue',
                    text: 'Any disputes arising from these Terms or your use of our services shall be subject to the exclusive jurisdiction of the competent courts in Ukraine. You consent to personal jurisdiction in Ukrainian courts and waive any objection based on inconvenient forum.'
                },
                {
                    subtitle: 'Informal Resolution',
                    text: 'Before filing any formal claim, you agree to attempt informal resolution by: Contacting our support team with detailed complaint description, Providing all relevant documentation and evidence, Engaging in good-faith negotiations for 30 days, and Considering mediation if direct negotiation fails. Most disputes can be resolved through open communication.'
                },
                {
                    subtitle: 'Arbitration (Optional)',
                    text: 'Parties may agree to binding arbitration under Ukrainian arbitration rules as an alternative to court proceedings. Arbitration provides faster and more cost-effective dispute resolution. Arbitration decisions are final and binding on both parties. Each party bears its own arbitration costs unless otherwise awarded.'
                },
                {
                    subtitle: 'Class Action Waiver',
                    text: 'You agree to bring claims only in your individual capacity, not as plaintiff or class member in any class, collective, or representative proceeding. You waive any right to participate in class action lawsuits against MarketsUniverse LLC.'
                }
            ]
        },
        {
            id: 'termination',
            title: '13. Term, Termination, and Survival',
            icon: FileText,
            content: [
                {
                    subtitle: 'Term',
                    text: 'These Terms commence upon your first use of our platform and continue until terminated by either party. Your obligations under these Terms survive as long as you maintain an account or have outstanding investments, staking contracts, or gaming participations.'
                },
                {
                    subtitle: 'Termination by You',
                    text: 'You may close your account at any time by: Withdrawing all available funds, Completing or cancelling active staking contracts (penalties apply), Settling all gaming activities, Submitting formal closure request through support, and Ceasing all platform use. Account closure does not relieve you of pre-existing obligations or liabilities.'
                },
                {
                    subtitle: 'Termination by Us',
                    text: 'We may suspend or terminate your account immediately for: Terms violations or illegal activities, Fraud or misrepresentation, Failure to complete required verification, Prolonged account inactivity, Regulatory compliance requirements, or Technical or security concerns. We will provide notice except where immediate action is necessary for security or legal reasons.'
                },
                {
                    subtitle: 'Effects of Termination',
                    text: 'Upon termination: Your license to use the platform terminates immediately, Outstanding investments and contracts continue under original terms, Available funds may be withdrawn subject to verification, We retain records as required by law, Indemnification and limitation of liability provisions survive, and Confidentiality obligations continue indefinitely.'
                },
                {
                    subtitle: 'Survival Provisions',
                    text: 'The following sections survive termination: Payment obligations and fee provisions, Intellectual property rights, Limitation of liability and disclaimers, Indemnification obligations, Dispute resolution and governing law, and Any provisions that by nature should survive.'
                }
            ]
        },
        {
            id: 'compliance',
            title: '14. Regulatory Compliance and AML',
            icon: Shield,
            content: [
                {
                    subtitle: 'Ukrainian Regulatory Compliance',
                    text: 'MarketsUniverse LLC operates in compliance with: Ukrainian Law on Virtual Assets, Ukrainian Law on Financial Services, Anti-Money Laundering (AML) regulations (Law No. 361-IX), Counter-Financing of Terrorism (CFT) requirements, Personal Data Protection laws (Law No. 2297-VI), and Ukrainian Tax Code provisions. We maintain all required licenses and registrations.'
                },
                {
                    subtitle: 'KYC/AML Procedures',
                    text: 'We implement comprehensive KYC/AML procedures: Identity verification for all users, Enhanced due diligence for large transactions, Source of funds documentation when required, Ongoing transaction monitoring, Suspicious activity reporting to authorities, Sanctions screening against international lists, and Compliance with FATF recommendations.'
                },
                {
                    subtitle: 'Transaction Monitoring',
                    text: 'All transactions are monitored for: Unusual patterns or behaviors, Structuring or smurfing attempts, High-risk jurisdiction activity, Politically Exposed Person (PEP) involvement, Sanctions violations, and Money laundering indicators. Suspicious activity may result in account freezing pending investigation.'
                },
                {
                    subtitle: 'Reporting Obligations',
                    text: 'We are required to report: Large transactions exceeding regulatory thresholds, Suspicious activities to Ukrainian Financial Intelligence Unit, Tax-relevant information to appropriate authorities, and Cross-border transfers as required by law. Users consent to such reporting as condition of service use.'
                }
            ]
        },
        {
            id: 'tax',
            title: '15. Tax Obligations',
            icon: DollarSign,
            content: [
                {
                    subtitle: 'User Tax Responsibility',
                    text: 'You are solely responsible for: Determining your tax obligations in your jurisdiction, Reporting investment income and capital gains, Paying all applicable taxes on earnings, Maintaining accurate transaction records, Filing required tax returns, and Consulting tax professionals for guidance. We do not provide tax advice.'
                },
                {
                    subtitle: 'Tax Reporting Assistance',
                    text: 'We provide tools to help your tax compliance: Transaction history exports, Annual summary statements, Profit/loss calculations, Realized vs. unrealized gains reports, and Gaming winnings records. These are for your convenience and do not constitute tax advice.'
                },
                {
                    subtitle: 'Ukrainian Tax Obligations',
                    text: 'For Ukrainian residents: Investment income taxed per Ukrainian Tax Code, Cryptocurrency gains subject to taxation, Gaming winnings may be taxable, Annual tax declarations required, and Penalties apply for non-compliance. Consult Ukrainian tax authorities or professionals for specific guidance.'
                },
                {
                    subtitle: 'International Tax Considerations',
                    text: 'Non-Ukrainian users should consider: Home country tax obligations, Double taxation treaties, Foreign account reporting requirements, Cryptocurrency taxation in your jurisdiction, and Gaming winnings tax treatment. We may be required to report to your tax authorities under international agreements.'
                }
            ]
        },
        {
            id: 'amendments',
            title: '16. Amendments and Modifications',
            icon: FileText,
            content: [
                {
                    subtitle: 'Right to Modify',
                    text: 'We reserve the right to modify these Terms at any time to reflect: Changes in Ukrainian or international law, New services or features, Enhanced security measures, Industry best practices, Regulatory requirements, or Operational improvements. Material changes will be communicated with reasonable notice.'
                },
                {
                    subtitle: 'Notice of Changes',
                    text: 'We will notify you of Term modifications by: Email to your registered address, Dashboard notifications upon login, Prominent website announcements, Updated effective date in Terms document, and Reasonable advance notice for material changes (typically 30 days).'
                },
                {
                    subtitle: 'Acceptance of Changes',
                    text: 'Continued use of our platform after modification constitutes acceptance of updated Terms. If you do not agree with changes: You may close your account before effective date, Withdraw available funds, Complete or cancel active contracts (penalties may apply), and Cease using our services. Historical Terms govern disputes arising before modification.'
                }
            ]
        },
        {
            id: 'miscellaneous',
            title: '17. Miscellaneous Provisions',
            icon: FileText,
            content: [
                {
                    subtitle: 'Entire Agreement',
                    text: 'These Terms, together with our Privacy Policy and any additional agreements you enter, constitute the entire agreement between you and MarketsUniverse LLC. They supersede all prior oral or written agreements, understandings, and communications.'
                },
                {
                    subtitle: 'Severability',
                    text: 'If any provision of these Terms is found invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision will be modified to the minimum extent necessary to make it valid and enforceable. If modification is not possible, the provision will be severed, and remaining Terms continue in full force.'
                },
                {
                    subtitle: 'Waiver',
                    text: 'Our failure to enforce any right or provision of these Terms does not constitute a waiver of such right or provision. Any waiver must be in writing and signed by authorized representative. Waiver of one breach does not waive subsequent breaches.'
                },
                {
                    subtitle: 'Assignment',
                    text: 'You may not assign or transfer your rights or obligations under these Terms without our written consent. We may assign these Terms in connection with merger, acquisition, corporate reorganization, or sale of assets. Any unauthorized assignment is void.'
                },
                {
                    subtitle: 'Force Majeure',
                    text: 'We are not liable for failure to perform obligations due to circumstances beyond our reasonable control including: Acts of God, natural disasters, wars or terrorism, Government actions or regulatory changes, Network or internet failures, Exchange or blockchain network failures, Pandemics or health emergencies, or Strikes or labor disputes. Service may be suspended during force majeure events.'
                },
                {
                    subtitle: 'Language',
                    text: 'These Terms are prepared in English. Translations may be provided for convenience, but the English version governs in case of conflicts. You acknowledge understanding the English version.'
                },
                {
                    subtitle: 'Contact Information',
                    text: 'For questions about these Terms, contact us through: Support form on our platform, Email addresses provided in Contact section, Or mailing address in Ukraine as registered. We aim to respond to inquiries within 3-5 business days.'
                }
            ]
        }
    ];

    return (
        <WalletProvider>
            <div className="min-h-screen bg-black relative overflow-hidden">
                {/* Base Background */}
                <div className="absolute inset-0 bg-black" />

                {/* Animated Red Energy Gradient */}
                <motion.div 
                    className="absolute inset-0"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.6, 0.8, 0.6]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, rgba(0,0,0,0.8) 50%, black 100%)',
                    }}
                />

                {/* Floating Energy Orbs */}
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={`orb-${i}`}
                        className="absolute rounded-full"
                        style={{
                            width: `${Math.random() * 150 + 50}px`,
                            height: `${Math.random() * 150 + 50}px`,
                            background: i % 2 === 0 
                                ? 'radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                            filter: 'blur(40px)',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            x: [0, Math.random() * 100 - 50, 0],
                            y: [0, Math.random() * 100 - 50, 0],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                ))}

                {/* Geometric Grid Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(220,38,38,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(220,38,38,0.5) 1px, transparent 1px),
                            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
                    }}
                />

                <Navbar />

                <main className="relative z-10 px-4 sm:px-6 pt-40 sm:pt-44 pb-20">
                    <div className="max-w-5xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-12"
                        >
                            <div className="flex justify-center mb-6">
                                <motion.div
                                    animate={{ 
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ 
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/50"
                                >
                                    <Scale className="w-10 h-10 text-white" />
                                </motion.div>
                            </div>
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 uppercase tracking-wide">
                                Terms of Service
                            </h1>
                            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-4 px-4">
                                Legal agreement governing your use of MarketsUniverse platform and services
                            </p>
                            <p className="text-red-500 text-sm">
                                Effective Date: January 1, 2026 | Governed by the Laws of Ukraine
                            </p>
                        </motion.div>

                        {/* Critical Notice */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative mb-12 p-6 rounded-2xl backdrop-blur-xl border border-red-500/30 overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(0,0,0,0.8) 100%)',
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-white font-semibold text-lg mb-2">IMPORTANT LEGAL NOTICE</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                                        These Terms of Service constitute a legally binding contract between you and MarketsUniverse LLC under Ukrainian law. BY ACCESSING OR USING OUR PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS. If you do not agree, you must immediately cease using our services.
                                    </p>
                                    <p className="text-red-400 text-sm font-semibold">
                                        CRYPTOCURRENCY TRADING AND INVESTMENT CARRY SIGNIFICANT RISKS. YOU MAY LOSE YOUR ENTIRE INVESTMENT. ONLY INVEST WHAT YOU CAN AFFORD TO LOSE.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Terms Sections */}
                        <div className="space-y-8">
                            {sections.map((section, index) => {
                                const Icon = section.icon;
                                return (
                                    <motion.div
                                        key={section.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative p-8 rounded-2xl backdrop-blur-xl border border-white/10 overflow-hidden"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)'
                                        }}
                                    >
                                        {/* Glass reflection */}
                                        <div 
                                            className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"
                                            style={{
                                                clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)'
                                            }}
                                        />

                                        {/* Section Header */}
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                                        </div>

                                        {/* Section Content */}
                                        <div className="space-y-6">
                                            {section.content.map((item, idx) => (
                                                <div key={idx}>
                                                    <h3 className="text-lg font-semibold text-red-400 mb-2">
                                                        {item.subtitle}
                                                    </h3>
                                                    <p className="text-gray-300 text-sm leading-relaxed">
                                                        {item.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Acknowledgment */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative mt-12 p-8 rounded-2xl backdrop-blur-xl border border-red-500/30 overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(0,0,0,0.8) 100%)',
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <Users className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-white font-semibold text-lg mb-2">User Acknowledgment</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                        By using MarketsUniverse services, you acknowledge and agree that:
                                    </p>
                                    <ul className="text-gray-300 text-sm space-y-2 list-disc list-inside">
                                        <li>You have read and understood these Terms of Service in their entirety</li>
                                        <li>You accept all risks associated with cryptocurrency trading and investments</li>
                                        <li>You are solely responsible for your investment decisions and outcomes</li>
                                        <li>You meet all eligibility requirements including age and legal capacity</li>
                                        <li>You will comply with all applicable laws in your jurisdiction</li>
                                        <li>You understand that past performance does not guarantee future results</li>
                                        <li>You have consulted appropriate professionals regarding tax and legal matters</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>

                        {/* Last Updated */}
                        <div className="text-center mt-12">
                            <p className="text-gray-500 text-sm">
                                Last Updated: January 1, 2026 | Version 1.0
                            </p>
                            <p className="text-gray-500 text-sm mt-2">
                                MarketsUniverse LLC | Registered under the Laws of Ukraine
                            </p>
                            <p className="text-gray-600 text-xs mt-4">
                                For questions or concerns regarding these Terms, please contact our support team through the platform
                            </p>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </WalletProvider>
    );
}