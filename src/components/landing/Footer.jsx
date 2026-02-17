import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '../common/Logo';
import SupportForm from './SupportForm';
import { BookOpen, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useWallet } from '../wallet/WalletContext';

export default function Footer() {
    const { account } = useWallet();
    const [user, setUser] = useState(null);

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

    return (
        <>
            <SupportForm />
            <footer className="relative bg-black border-t border-red-500/20 py-12 px-6 overflow-hidden">
                <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        background: 'radial-gradient(ellipse at bottom, rgba(220,38,38,0.1) 0%, transparent 60%)',
                    }}
                />
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <div className="mb-4">
                            <Logo size="default" showText={true} />
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Collaborative pool trading across crypto and traditional markets. Trade together, succeed together.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Products</h4>
                        <ul className="space-y-3">
                            <li><Link to={createPageUrl('CryptoPool')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Crypto Pool</Link></li>
                            <li><Link to={createPageUrl('TraditionalPool')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Traditional Pool</Link></li>
                            <li><Link to={createPageUrl('VIPPool')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">VIP Pool</Link></li>
                            <li><Link to={createPageUrl('Staking')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Staking</Link></li>
                            <li><Link to={createPageUrl('Pythia')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Pythia</Link></li>
                            <li><Link to={createPageUrl('PrintMoney')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Print Money</Link></li>
                            <li><Link to={createPageUrl('DealOrNoDeal')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Deal or No Deal</Link></li>
                            <li><Link to={createPageUrl('Prophet')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Prophet</Link></li>
                        </ul>
                    </div>

                    <div>
                         <h4 className="text-white font-semibold mb-4">Resources</h4>
                         <ul className="space-y-3">
                             <li>
                                 <Link to={createPageUrl('Documentation')} className="text-gray-400 hover:text-red-500 transition-colors text-sm flex items-center gap-2">
                                     <BookOpen className="w-4 h-4" />
                                     Documentation
                                 </Link>
                             </li>
                             <li>
                                 <Link to={createPageUrl('News')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">
                                     News
                                 </Link>
                             </li>
                             {user && (
                                 <li>
                                     <Link to={`${createPageUrl('Dashboard')}?view=chat`} className="text-gray-400 hover:text-cyan-500 transition-colors text-sm flex items-center gap-2">
                                         <MessageCircle className="w-4 h-4" />
                                         Chat
                                     </Link>
                                 </li>
                             )}
                             <li>
                                 <Link to={createPageUrl('FAQ')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">
                                     FAQ
                                 </Link>
                             </li>
                             <li>
                                 <Link to={createPageUrl('APIDocumentation')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">
                                     API & Exchanges
                                 </Link>
                             </li>
                             <li>
                                 <Link to={createPageUrl('Lessons')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">
                                     Lessons
                                 </Link>
                             </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-3">
                            <li><Link to={createPageUrl('PrivacyPolicy')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Privacy Policy</Link></li>
                            <li><Link to={createPageUrl('TermsOfService')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Terms of Service</Link></li>
                            <li><Link to={createPageUrl('CookiePolicy')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Cookie Policy</Link></li>
                            <li><Link to={createPageUrl('FinancialHealth')} className="text-gray-400 hover:text-red-500 transition-colors text-sm">Financial Health</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-400 text-sm">
                        Copyright © 2026 Powered and Created by MarketsUniverse.com - All Rights Reserved by MarketsUniverse LLC
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="https://x.com/Planhtarxis" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                        <a href="https://www.youtube.com/@PlanhtarxisTrading" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        </a>
                        <a href="https://discord.com/invite/Y335JjFhNw" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
        </>
    );
}