import React from 'react';
import { WalletProvider } from '../components/wallet/WalletContext';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function PrivacyPolicy() {
    const sections = [
        {
            id: 'introduction',
            title: '1. Introduction',
            icon: Shield,
            content: [
                {
                    subtitle: 'About This Policy',
                    text: 'MarketsUniverse LLC ("we," "us," "our," or "the Company") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our trading pools, staking services, gaming platforms, and related financial services. This policy is governed by the laws of Ukraine and complies with the General Data Protection Regulation (GDPR) and Ukrainian Law on Personal Data Protection (Law No. 2297-VI).'
                },
                {
                    subtitle: 'Our Commitment',
                    text: 'We operate with transparency and in compliance with Ukrainian financial regulations. As a registered entity under Ukrainian law, we maintain the highest standards of data protection, financial security, and regulatory compliance.'
                },
                {
                    subtitle: 'Scope of Services',
                    text: 'This policy applies to all users of our platform including: Trading Pool participants (Crypto Pool/Scalping, Traditional Pool, VIP Pool), Staking Contract holders (BTC, ETH, USDT, USDC, XRP), Gaming services users (Deal or No Deal with XP system, leaderboards, and trophy achievements), Educational services participants (Lessons packages, market analysis tools), and all dashboard, analytics, and platform features including KYC/AML verification, withdrawal management, and notifications.'
                }
            ]
        },
        {
            id: 'data-collection',
            title: '2. Information We Collect',
            icon: Eye,
            content: [
                {
                    subtitle: 'Personal Information',
                    text: 'We collect the following personal data: Full name and contact information (email address), Cryptocurrency wallet addresses (MetaMask and other Web3 wallets), Transaction data and payment information, Investment amounts and portfolio details, Geographic location data (IP address, country), Device information and browser type, and KYC/AML documentation where required by law.'
                },
                {
                    subtitle: 'Financial Data',
                    text: 'For trading and investment purposes, we collect: Deposit and withdrawal transaction records, Trading history and performance data, Staking contract details and earnings, Pool investment balances and profit/loss statements, Tax reporting information, and Payment processing data including blockchain transaction hashes.'
                },
                {
                    subtitle: 'Gaming and Platform Data',
                    text: 'When using our gaming services, we collect: Game participation records and results, XP points and level progression, Trophy and achievement data, Leaderboard rankings and competition history, and Entry fees and winnings records.'
                },
                {
                    subtitle: 'Automatically Collected Data',
                    text: 'We automatically collect: Website analytics and page view data, Visit timestamps and session duration, Referrer information and marketing source, Browser settings and device information, and IP address and geolocation data for security and compliance purposes.'
                }
            ]
        },
        {
            id: 'data-usage',
            title: '3. How We Use Your Information',
            icon: FileText,
            content: [
                {
                    subtitle: 'Service Delivery',
                    text: 'We use your information to: Process deposits and withdrawals, Execute trading strategies on your behalf, Manage staking contracts and calculate earnings, Facilitate gaming participation and distribute winnings, Provide educational services and market analysis, and Maintain your dashboard and account access.'
                },
                {
                    subtitle: 'Financial Operations',
                    text: 'Your data enables us to: Calculate profit shares and distribute returns, Process pool management fees, Track investment performance and generate reports, Manage risk and portfolio allocation, Execute trades across multiple exchanges, and Comply with financial reporting requirements.'
                },
                {
                    subtitle: 'Legal and Compliance',
                    text: 'We process your data to: Comply with Ukrainian financial regulations, Fulfill KYC (Know Your Customer) requirements, Prevent money laundering and financial fraud, Respond to legal requests and regulatory inquiries, Maintain audit trails for financial transactions, and Ensure compliance with international sanctions and restrictions.'
                },
                {
                    subtitle: 'Platform Improvement',
                    text: 'We analyze data to: Improve trading strategies and performance, Enhance user experience and interface design, Develop new features and services, Monitor platform security and detect fraud, Optimize system performance and reliability, and Provide customer support and resolve issues.'
                }
            ]
        },
        {
            id: 'data-sharing',
            title: '4. Data Sharing and Disclosure',
            icon: Lock,
            content: [
                {
                    subtitle: 'Third-Party Service Providers',
                    text: 'We may share your data with: Cryptocurrency exchanges for trade execution, Payment processors for deposit/withdrawal handling, Blockchain networks for transaction verification, Cloud storage providers for data security, Analytics services for platform improvement, and Customer support systems for service delivery.'
                },
                {
                    subtitle: 'Legal Requirements',
                    text: 'We may disclose your information when: Required by Ukrainian law or court order, Responding to regulatory inquiries, Investigating fraud or illegal activity, Protecting our rights and property, Enforcing our Terms of Service, or Complying with international financial regulations.'
                },
                {
                    subtitle: 'Business Transfers',
                    text: 'In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity. We will notify you of such changes and provide options regarding your data.'
                },
                {
                    subtitle: 'No Data Sales',
                    text: 'We do not sell, rent, or trade your personal information to third parties for marketing purposes. Your data is used exclusively for service delivery and legal compliance.'
                }
            ]
        },
        {
            id: 'data-security',
            title: '5. Data Security and Protection',
            icon: Shield,
            content: [
                {
                    subtitle: 'Security Measures',
                    text: 'We implement robust security protocols: End-to-end encryption for sensitive data, Secure Socket Layer (SSL) technology, Multi-factor authentication for account access, Cold storage for cryptocurrency holdings, Regular security audits and penetration testing, DDoS protection and firewall systems, and Encrypted database storage with access controls.'
                },
                {
                    subtitle: 'Blockchain Security',
                    text: 'For cryptocurrency transactions, we: Use industry-standard wallet security, Require transaction confirmations, Implement withdrawal limits and verification, Monitor suspicious blockchain activity, Maintain separate hot and cold wallets, and Use multi-signature wallets for large holdings.'
                },
                {
                    subtitle: 'Data Breach Protocol',
                    text: 'In case of a security breach, we will: Notify affected users within 72 hours, Report the incident to Ukrainian authorities, Implement immediate containment measures, Investigate the breach thoroughly, Provide guidance on protective actions, and Update security measures to prevent recurrence.'
                }
            ]
        },
        {
            id: 'your-rights',
            title: '6. Your Rights Under Ukrainian and EU Law',
            icon: CheckCircle,
            content: [
                {
                    subtitle: 'Access Rights',
                    text: 'You have the right to: Access your personal data we hold, Request copies of your transaction history, View your pool investment records, Download your trading performance reports, and Access your staking contract details.'
                },
                {
                    subtitle: 'Correction and Deletion',
                    text: 'You may: Update incorrect personal information, Correct contact details and preferences, Request deletion of your account (subject to legal retention requirements), Remove optional data from your profile, and Withdraw consent for optional data processing.'
                },
                {
                    subtitle: 'Data Portability',
                    text: 'You can: Export your personal data in machine-readable format, Transfer your investment history to another service, Download transaction records, and Obtain copies of all communications.'
                },
                {
                    subtitle: 'Objection and Restriction',
                    text: 'You may: Object to certain data processing activities, Restrict processing for specific purposes, Opt-out of marketing communications, Limit automated decision-making, and Request human review of automated processes.'
                },
                {
                    subtitle: 'Exercising Your Rights',
                    text: 'To exercise these rights, contact us through the support form on our platform or email our Data Protection Officer. We will respond within 30 days as required by Ukrainian law.'
                }
            ]
        },
        {
            id: 'retention',
            title: '7. Data Retention',
            icon: FileText,
            content: [
                {
                    subtitle: 'Retention Periods',
                    text: 'We retain your data as follows: Transaction records: 7 years (Ukrainian financial regulations), Investment and trading history: 7 years (tax compliance), KYC/AML documentation: 5 years after account closure, Support communications: 3 years, Analytics and platform usage data: 2 years, and Marketing consent records: Until withdrawn.'
                },
                {
                    subtitle: 'Account Closure',
                    text: 'Upon account closure, we: Archive essential financial records for regulatory compliance, Delete non-essential personal data within 90 days, Maintain transaction history for legal requirements, and Provide final statements and tax documents.'
                },
                {
                    subtitle: 'Legal Holds',
                    text: 'Data may be retained longer when: Required by ongoing legal proceedings, Subject to regulatory investigation, Necessary for dispute resolution, or Mandated by Ukrainian or international law.'
                }
            ]
        },
        {
            id: 'cookies',
            title: '8. Cookies and Tracking',
            icon: Eye,
            content: [
                {
                    subtitle: 'Cookie Usage',
                    text: 'We use cookies for: Session management and authentication, User preferences and settings, Platform analytics and performance monitoring, Security and fraud prevention, and Marketing attribution and campaign tracking.'
                },
                {
                    subtitle: 'Cookie Types',
                    text: 'Essential cookies: Required for platform functionality, Performance cookies: Improve user experience, Analytics cookies: Track usage and trends, and Marketing cookies: Measure campaign effectiveness (with consent).'
                },
                {
                    subtitle: 'Your Cookie Choices',
                    text: 'You can: Manage cookie preferences in your browser, Opt-out of non-essential cookies, Delete existing cookies, and Review our Cookie Policy for detailed information.'
                }
            ]
        },
        {
            id: 'international',
            title: '9. International Data Transfers',
            icon: AlertCircle,
            content: [
                {
                    subtitle: 'Cross-Border Transfers',
                    text: 'As a global platform, your data may be transferred to: Cryptocurrency exchanges worldwide, Cloud servers in various jurisdictions, Payment processors in multiple countries, and Service providers outside Ukraine.'
                },
                {
                    subtitle: 'Transfer Safeguards',
                    text: 'We ensure protection through: Standard contractual clauses approved by EU authorities, Adequacy decisions for certain countries, Privacy Shield frameworks where applicable, Encryption during data transmission, and Regular compliance audits.'
                },
                {
                    subtitle: 'Ukrainian Law Compliance',
                    text: 'All international transfers comply with Ukrainian regulations on cross-border data flows and maintain the same level of protection as required within Ukraine.'
                }
            ]
        },
        {
            id: 'financial-specific',
            title: '10. Financial Services Specific Provisions',
            icon: Shield,
            content: [
                {
                    subtitle: 'Trading Pool Operations',
                    text: 'For our trading pools (Crypto Pool, Traditional Pool, VIP Pool), we: Monitor pool performance and trading activity using time-based share calculations, Track individual investor contributions and returns with NAV-based share distribution, Calculate profit shares and management fees (typically 15-20% on profits), Execute trades on authorized cryptocurrency exchanges with full transparency, Maintain detailed trading logs accessible to all participants, Report real-time performance including Gross PnL, Trading Fees, Profit Share, and Net PnL, Track deposit transactions with individual durations for Traditional Pool, and Comply with Ukrainian investment and cryptocurrency regulations.'
                },
                {
                    subtitle: 'Staking Services',
                    text: 'For staking contracts (BTC, ETH, USDT, USDC, XRP), we: Secure cryptocurrency holdings in company-controlled cold storage wallets, Calculate daily compounding interest automatically (6% APY for 3-month, 7% for 6-month, 8% for 12-month), Process staking deposits to company wallet addresses on BEP-20 network, Manage contract terms, durations, and maturity dates, Apply early cancellation penalties (30% for 3-month, 40% for 6-month, 50% for 12-month on earnings only), Protect principal 100% regardless of early cancellation, Distribute matured contract withdrawals including principal plus accumulated earnings, and Maintain transparent real-time contract records viewable in user dashboards.'
                },
                {
                    subtitle: 'Gaming Services',
                    text: 'For Deal or No Deal gaming platform, we: Process $3 USDT entry fees per game, Track game outcomes and winnings (recorded for entertainment/XP purposes), Calculate and award XP based on winnings ($1-$50k = 100 XP up to $750k+ = 5,000 XP) plus 100 XP bonus per refused banker offer, Manage 13 god levels (0-12) with progressive XP requirements, Award unique trophy NFTs for each level achieved, Maintain monthly 30-day leaderboards based on total XP, Distribute monthly prizes (200 XRP for 1st, 100 XRP for 2nd, 50 XRP for 3rd place), Process the 1 BTC Grand Prize for players completing Level 12 (Zeus) - reward can be earned multiple times as new rounds begin after each claim, Ensure provably fair random number generation for case amounts, and Verify game integrity using blockchain transaction records.'
                },
                {
                    subtitle: 'Risk Disclosure',
                    text: 'We provide clear risk warnings about: Cryptocurrency volatility and market risks, Trading losses and investment risks, Staking contract terms and penalties, Gaming outcomes and probabilities, and Regulatory compliance requirements.'
                }
            ]
        },
        {
            id: 'minors',
            title: '11. Children\'s Privacy',
            icon: AlertCircle,
            content: [
                {
                    subtitle: 'Age Restrictions',
                    text: 'Our platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors. By using our services, you confirm that you are at least 18 years old and have the legal capacity to enter into financial contracts.'
                },
                {
                    subtitle: 'Parental Notice',
                    text: 'If we discover that we have collected information from a minor, we will immediately delete such information and terminate the account. Parents or guardians who believe their child has provided information should contact us immediately.'
                }
            ]
        },
        {
            id: 'updates',
            title: '12. Policy Updates',
            icon: FileText,
            content: [
                {
                    subtitle: 'Changes to This Policy',
                    text: 'We may update this Privacy Policy to reflect: Changes in Ukrainian or EU law, New services or features, Enhanced security measures, Regulatory requirements, or Improved data practices.'
                },
                {
                    subtitle: 'Notification of Changes',
                    text: 'We will notify you of material changes by: Email notification to registered users, Dashboard notifications, Prominent website announcements, and Updated effective dates in the policy.'
                },
                {
                    subtitle: 'Your Acceptance',
                    text: 'Continued use of our platform after policy updates constitutes acceptance of the changes. If you do not agree with updates, you may close your account subject to fulfilling outstanding obligations.'
                }
            ]
        },
        {
            id: 'contact',
            title: '13. Contact Information',
            icon: FileText,
            content: [
                {
                    subtitle: 'Data Protection Officer',
                    text: 'For privacy-related inquiries, contact our Data Protection Officer through the support form on our platform or via the contact methods provided in our Terms of Service.'
                },
                {
                    subtitle: 'Supervisory Authority',
                    text: 'You have the right to lodge a complaint with the Ukrainian Commissioner for Human Rights or your local data protection authority if you believe your privacy rights have been violated.'
                },
                {
                    subtitle: 'Company Information',
                    text: 'MarketsUniverse LLC is registered under Ukrainian law and operates in full compliance with: Ukrainian Law on Personal Data Protection (Law No. 2297-VI), General Data Protection Regulation (GDPR), Ukrainian financial services regulations, and International financial compliance standards.'
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
                                    <Shield className="w-10 h-10 text-white" />
                                </motion.div>
                            </div>
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 uppercase tracking-wide">
                                Privacy Policy
                            </h1>
                            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-4 px-4">
                                Your privacy and data protection are our highest priorities
                            </p>
                            <p className="text-red-500 text-sm">
                                Effective Date: January 1, 2026 | Governed by Ukrainian Law
                            </p>
                        </motion.div>

                        {/* Important Notice */}
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
                                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-white font-semibold text-lg mb-2">Important Information</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        This Privacy Policy is a legally binding document under Ukrainian law. By using MarketsUniverse services, you acknowledge that you have read, understood, and agree to the collection, use, and disclosure of your personal information as described herein. If you do not agree with this policy, please discontinue use of our platform immediately.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Policy Sections */}
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

                        {/* Final Statement */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative mt-12 p-8 rounded-2xl backdrop-blur-xl border border-green-500/30 overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(0,0,0,0.8) 100%)',
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-white font-semibold text-lg mb-2">Our Commitment to You</h3>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                        MarketsUniverse LLC is committed to maintaining the highest standards of privacy protection, data security, and regulatory compliance. We operate transparently under Ukrainian law and international best practices to safeguard your personal and financial information.
                                    </p>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        Thank you for trusting us with your data and your investments. We are dedicated to providing secure, professional, and compliant financial services while respecting your privacy rights at every step.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Last Updated */}
                        <div className="text-center mt-12">
                            <p className="text-gray-500 text-sm">
                                Last Updated: January 1, 2026 | Version 1.0
                            </p>
                            <p className="text-gray-500 text-sm mt-2">
                                MarketsUniverse LLC | Registered under Ukrainian Law
                            </p>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </WalletProvider>
    );
}