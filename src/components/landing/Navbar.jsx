import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../wallet/WalletContext';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, LogOut, Shield, Menu, X, DollarSign, Newspaper, Droplets, Lock, Sparkles, Home, Coins, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../common/Logo';

export default function Navbar() {
    const { account, balance, chainId, isConnecting, connectWallet, disconnectWallet, formatAddress, getNetworkName } = useWallet();
    const [user, setUser] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileWalletVisible, setMobileWalletVisible] = useState(true);
    const [poolsOpen, setPoolsOpen] = useState(false);
    const [gamesOpen, setGamesOpen] = useState(false);

    const getNativeCurrency = () => {
        const currencies = {
            '0x1': 'ETH',
            '0x89': 'MATIC',
            '0x38': 'BNB',
            '0xa86a': 'AVAX',
            '0xa4b1': 'ETH',
            '0xa': 'ETH'
        };
        return currencies[chainId] || 'ETH';
    };

    useEffect(() => {
        const loadUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
                setUser({ ...authUser, ...profile });
            } else {
                setUser(null);
            }
        };

        loadUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadUser();
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 bg-black"
        >
            <div className="max-w-7xl mx-auto">
                <div className="bg-black/95 backdrop-blur-xl border border-red-500/20 rounded-2xl px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <Link to={createPageUrl('Home')}>
                            <Logo size="small" showText={true} />
                        </Link>

                        <div className="hidden lg:flex items-center gap-6 text-sm">
                            <Link to={createPageUrl('Landing')} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                                <Home className="w-4 h-4" />
                                Home
                            </Link>

                            {/* Pools Dropdown with Hover */}
                            <div
                                className="relative"
                                onMouseEnter={() => setPoolsOpen(true)}
                                onMouseLeave={() => setPoolsOpen(false)}
                            >
                                <button className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 outline-none">
                                    <Droplets className="w-4 h-4" />
                                    Pools <ChevronDown className="w-3 h-3" />
                                </button>
                                <AnimatePresence>
                                    {poolsOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full mt-2 left-0 bg-black/95 backdrop-blur-2xl border border-red-500/20 text-white min-w-[200px] rounded-lg shadow-2xl p-1 z-50"
                                        >
                                            <Link to={createPageUrl('PoolPlans')} className="block cursor-pointer hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10 rounded-lg px-3 py-2 transition-all">
                                                Pool Plans
                                            </Link>
                                            <Link to={createPageUrl('CryptoPool')} className="block cursor-pointer hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10 rounded-lg px-3 py-2 transition-all">
                                                Crypto Pool
                                            </Link>
                                            <Link to={createPageUrl('TraditionalPool')} className="block cursor-pointer hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10 rounded-lg px-3 py-2 transition-all">
                                                Traditional Pool
                                            </Link>
                                            <Link to={createPageUrl('VIPPool')} className="block cursor-pointer hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10 rounded-lg px-3 py-2 transition-all">
                                                VIP Pool
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Link to={createPageUrl('Staking')} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                                <Lock className="w-4 h-4" />
                                Staking
                            </Link>

                            {/* Games Dropdown with Hover */}
                            <div
                                className="relative"
                                onMouseEnter={() => setGamesOpen(true)}
                                onMouseLeave={() => setGamesOpen(false)}
                            >
                                <button className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 outline-none">
                                    <DollarSign className="w-4 h-4" />
                                    Games <ChevronDown className="w-3 h-3" />
                                </button>
                                <AnimatePresence>
                                    {gamesOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full mt-2 left-0 bg-black/95 backdrop-blur-2xl border border-green-500/20 text-white min-w-[200px] rounded-lg shadow-2xl p-1 z-50"
                                        >
                                            <Link to={createPageUrl('DealOrNoDeal')} className="block cursor-pointer hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-lg px-3 py-2 transition-all">
                                                Deal or No Deal
                                            </Link>
                                            <Link to={createPageUrl('Prophet')} className="block cursor-pointer hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-lg px-3 py-2 transition-all">
                                                Prophet
                                            </Link>
                                            <Link to={createPageUrl('PrintMoney')} className="block cursor-pointer hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-lg px-3 py-2 transition-all">
                                                Print Money
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Link to={createPageUrl('Pythia')} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                                <Sparkles className="w-4 h-4" />
                                Pythia
                            </Link>

                            {/* Buy PMU Coin Link */}
                            <Link to={createPageUrl('BuyPMUCoin')} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                                <Coins className="w-4 h-4" />
                                Buy PMU Coin
                            </Link>

                            {/* News Link */}
                            <Link to={createPageUrl('News')} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                                <Newspaper className="w-4 h-4" />
                                News
                            </Link>

                            {/* Chat Link - Only for authenticated users */}
                            {user && (
                                <Link to={`${createPageUrl('Dashboard')}?view=chat`} className="text-gray-400 hover:text-cyan-500 transition-colors flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    Chat
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {!user && (
                                <Link to={createPageUrl('Login')}>
                                    <Button
                                        variant="ghost"
                                        className="hidden lg:flex text-gray-400 hover:text-white hover:bg-white/5 rounded-xl px-4"
                                    >
                                        Log In
                                    </Button>
                                </Link>
                            )}
                            {account ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="hidden lg:flex bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl px-4"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                                            {formatAddress(account)}
                                            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#1a1f2e] border-white/10 text-white min-w-[200px]">
                                        <div className="px-3 py-2">
                                            <p className="text-xs text-gray-400">Balance</p>
                                            <p className="font-semibold">{balance} {getNativeCurrency()}</p>
                                        </div>
                                        <div className="px-3 py-2">
                                            <p className="text-xs text-gray-400">Network</p>
                                            <p className="font-semibold">{getNetworkName(chainId)}</p>
                                        </div>
                                        <DropdownMenuSeparator className="bg-white/10" />
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('Dashboard')} className="cursor-pointer hover:bg-white/5">
                                                <Wallet className="w-4 h-4 mr-2" />
                                                Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                        {user?.role === 'admin' && (
                                            <DropdownMenuItem asChild>
                                                <Link to={createPageUrl('GeneralAdmin')} className="cursor-pointer hover:bg-white/5 text-[#f5c96a]">
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Admin Panel
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator className="bg-white/10" />
                                        {user && (
                                            <DropdownMenuItem
                                                onClick={async () => {
                                                    await supabase.auth.signOut();
                                                    window.location.reload();
                                                }}
                                                className="cursor-pointer text-gray-400 hover:bg-white/5"
                                            >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Sign Out (Auth)
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => {
                                                try {
                                                    disconnectWallet?.();
                                                } catch (error) {
                                                    console.error('Disconnect error:', error);
                                                    window.location.href = createPageUrl('Home');
                                                }
                                            }}
                                            className="cursor-pointer text-red-400 hover:bg-white/5 hover:text-red-400"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Disconnect Wallet
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    onClick={connectWallet}
                                    disabled={isConnecting}
                                    className="hidden lg:flex bg-black/80 backdrop-blur-xl border border-red-500/30 text-white hover:bg-white/10 hover:border-red-500/50 rounded-xl px-6"
                                >
                                    <Wallet className="w-4 h-4 mr-2" />
                                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                </Button>
                            )}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Wallet Display */}
                    <div className="lg:hidden mt-3">
                        {account ? (
                            mobileWalletVisible ? (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                            <span className="text-white text-sm font-mono">{formatAddress(account)}</span>
                                        </div>
                                        <Button
                                            onClick={() => setMobileWalletVisible(false)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-400 hover:text-white h-6 px-2"
                                        >
                                            Hide
                                        </Button>
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-400 mb-3">
                                        <div>
                                            <span className="block">Balance</span>
                                            <span className="text-white">{balance} BNB</span>
                                        </div>
                                        <div>
                                            <span className="block">Network</span>
                                            <span className="text-white">{getNetworkName(chainId)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link to={createPageUrl('Dashboard')} className="flex-1">
                                            <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white text-sm py-2">
                                                Dashboard
                                            </Button>
                                        </Link>
                                        <Button
                                            onClick={() => {
                                                try {
                                                    disconnectWallet?.();
                                                } catch (error) {
                                                    console.error('Disconnect error:', error);
                                                    window.location.href = createPageUrl('Home');
                                                }
                                            }}
                                            variant="outline"
                                            className="bg-white/5 border-white/10 text-red-400 hover:bg-white/10 hover:text-red-400 text-sm py-2"
                                        >
                                            Disconnect
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => setMobileWalletVisible(true)}
                                    className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl py-2 text-sm"
                                >
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2" />
                                    Show Wallet
                                </Button>
                            )
                        ) : (
                            <Button
                                onClick={connectWallet}
                                disabled={isConnecting}
                                className="w-full bg-black/80 backdrop-blur-xl border border-red-500/30 text-white hover:bg-white/10 hover:border-red-500/50 rounded-xl py-3"
                            >
                                <Wallet className="w-4 h-4 mr-2" />
                                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden mt-4 bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-xl max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        <div className="flex flex-col gap-3">
                            <Link
                                to={createPageUrl('Landing')}
                                className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm rounded-lg hover:bg-white/5 flex items-center gap-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Home className="w-4 h-4" /> Home
                            </Link>

                            {/* Pools Section */}
                            <div className="border-t border-white/10 pt-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1">
                                    <Droplets className="w-3 h-3" /> Pools
                                </p>
                                <Link
                                    to={createPageUrl('PoolPlans')}
                                    className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm block rounded-lg hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Pool Plans
                                </Link>
                                <Link
                                    to={createPageUrl('CryptoPool')}
                                    className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm block rounded-lg hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Crypto Pool
                                </Link>
                                <Link
                                    to={createPageUrl('TraditionalPool')}
                                    className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm block rounded-lg hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Traditional Pool
                                </Link>
                                <Link
                                    to={createPageUrl('VIPPool')}
                                    className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm block rounded-lg hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    VIP Pool
                                </Link>
                            </div>

                            <Link
                                to={createPageUrl('Staking')}
                                className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm rounded-lg hover:bg-white/5 flex items-center gap-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Lock className="w-4 h-4" /> Staking
                            </Link>

                            {/* Games Section */}
                            <div className="border-t border-white/10 pt-2">
                                <p className="text-xs text-green-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Games
                                </p>
                                <Link
                                    to={createPageUrl('DealOrNoDeal')}
                                    className="text-gray-300 hover:text-green-500 transition-all py-2 px-3 text-sm block rounded-lg hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Deal or No Deal
                                </Link>
                                <Link
                                    to={createPageUrl('Prophet')}
                                    className="text-gray-300 hover:text-green-500 transition-all py-2 px-3 text-sm block rounded-lg hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Prophet
                                </Link>
                                <Link
                                    to={createPageUrl('PrintMoney')}
                                    className="text-gray-300 hover:text-green-500 transition-all py-2 px-3 text-sm block rounded-lg hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Print Money
                                </Link>
                            </div>

                            <Link
                                to={createPageUrl('Pythia')}
                                className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm rounded-lg hover:bg-white/5 flex items-center gap-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Sparkles className="w-4 h-4" /> Pythia
                            </Link>

                            <Link
                                to={createPageUrl('BuyPMUCoin')}
                                className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm rounded-lg hover:bg-white/5 flex items-center gap-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Coins className="w-4 h-4" /> Buy PMU Coin
                            </Link>

                            <Link
                                to={createPageUrl('News')}
                                className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm rounded-lg hover:bg-white/5 flex items-center gap-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Newspaper className="w-4 h-4" /> News
                            </Link>

                            {user ? (
                                <button
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        window.location.reload();
                                    }}
                                    className="text-red-400 hover:text-red-300 transition-all py-2 px-3 text-sm rounded-lg hover:bg-white/5 flex items-center gap-2 w-full text-left"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out (Auth)
                                </button>
                            ) : (
                                <Link
                                    to={createPageUrl('Login')}
                                    className="text-gray-300 hover:text-red-500 transition-all py-2 px-3 text-sm rounded-lg hover:bg-white/5 flex items-center gap-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <LogOut className="w-4 h-4" /> Log In
                                </Link>
                            )}

                            {account && (
                                <>
                                    <div className="border-t border-white/10 pt-3 mt-2">
                                        <Link
                                            to={createPageUrl('Dashboard')}
                                            className="text-cyan-400 hover:text-cyan-300 transition-all py-2 px-3 text-sm block rounded-lg hover:bg-cyan-500/10"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        {user?.role === 'admin' && (
                                            <Link
                                                to={createPageUrl('GeneralAdmin')}
                                                className="text-[#f5c96a] hover:text-[#f5c96a]/80 transition-all py-2 px-3 text-sm block rounded-lg hover:bg-[#f5c96a]/10"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                Admin Panel
                                            </Link>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.nav>
    );
}