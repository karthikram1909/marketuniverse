import React from 'react';
import { WalletProvider } from '../components/wallet/WalletContext';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

export default function CookiePolicy() {
    return (
        <WalletProvider>
            <div className="min-h-screen bg-black relative overflow-hidden">
                {/* Animated Red Background */}
                <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                        background: [
                            'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 80% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
                        ]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                
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
                                <Cookie className="w-4 h-4 text-red-400" />
                                <span className="text-red-400 text-sm font-medium">Legal</span>
                            </div>
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-6 px-4">
                                Cookie Policy
                            </h1>
                            <p className="text-gray-400 text-base sm:text-lg px-4">
                                Last updated: December 6, 2025
                            </p>
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-black/60 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl space-y-8 text-gray-300 leading-relaxed"
                        >
                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">What Are Cookies</h2>
                                <p>
                                    Cookies are small text files that are placed on your device by websites you visit. They are widely used to make websites work more efficiently and provide information to website owners. Cookies help us understand how you use our platform and improve your experience.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">How We Use Cookies</h2>
                                <p className="mb-4">
                                    Our platform uses cookies for the following purposes:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong className="text-white">Essential Cookies:</strong> Required for the platform to function properly, including wallet connection state and authentication</li>
                                    <li><strong className="text-white">Performance Cookies:</strong> Help us understand how users interact with our platform by collecting anonymous usage data</li>
                                    <li><strong className="text-white">Functional Cookies:</strong> Remember your preferences such as network selection and display settings</li>
                                    <li><strong className="text-white">Analytics Cookies:</strong> Allow us to analyze platform usage and improve our services</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">Third-Party Cookies</h2>
                                <p className="mb-4">
                                    We may use third-party services that set cookies on your device:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong className="text-white">MetaMask:</strong> Wallet provider that stores connection preferences</li>
                                    <li><strong className="text-white">BNB Smart Chain:</strong> Blockchain interaction and transaction management</li>
                                    <li><strong className="text-white">Analytics Services:</strong> To understand platform usage patterns</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">Managing Cookies</h2>
                                <p className="mb-4">
                                    You can control and manage cookies in various ways:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Most browsers allow you to refuse or accept cookies through their settings</li>
                                    <li>You can delete cookies that have already been set</li>
                                    <li>You can set your browser to notify you when cookies are being sent</li>
                                </ul>
                                <p className="mt-4">
                                    Please note that disabling essential cookies may prevent certain features of the platform from functioning properly, particularly wallet connectivity and authentication.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">Local Storage</h2>
                                <p>
                                    In addition to cookies, we use browser local storage to save user preferences and maintain platform functionality. This includes wallet connection state, user settings, and cached data for improved performance. Local storage data remains on your device and is not transmitted to our servers.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">Updates to This Policy</h2>
                                <p>
                                    We may update this Cookie Policy from time to time to reflect changes in our practices or for legal and regulatory reasons. We encourage you to review this policy periodically. The "Last updated" date at the top indicates when this policy was last revised.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                                <p className="mb-4">
                                    If you have questions about our use of cookies or this Cookie Policy, please contact us through:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Discord: <a href="https://discord.com/invite/Y335JjFhNw" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">Join our server</a></li>
                                    <li>Twitter: <a href="https://x.com/Planhtarxis" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">@Planhtarxis</a></li>
                                </ul>
                            </section>

                            <div className="pt-6 border-t border-white/10">
                                <p className="text-sm text-gray-400">
                                    By continuing to use our platform, you acknowledge that you have read and understood this Cookie Policy and consent to our use of cookies as described herein.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="relative z-10">
                    <Footer />
                </div>
            </div>
        </WalletProvider>
    );
}