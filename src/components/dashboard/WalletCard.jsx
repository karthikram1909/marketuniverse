import React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../wallet/WalletContext';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function WalletCard() {
    const { account, balance, usdtBalance, chainId, getNetworkName } = useWallet();
    const [copied, setCopied] = useState(false);

    const copyAddress = () => {
        navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 rounded-2xl p-[1px]"
        >
            <div className="bg-[#0f1420] rounded-2xl p-4 sm:p-6 h-full">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-gray-400 text-xs sm:text-sm font-medium">Wallet</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-gray-400 text-xs">{getNetworkName(chainId)}</span>
                    </div>
                </div>

                <div className="mb-4 sm:mb-6">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">BNB Balance</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-4xl font-bold text-white">{balance || '0.0000'}</span>
                        <span className="text-sm sm:text-xl text-gray-400">BNB</span>
                    </div>
                </div>

                <div className="mb-4 sm:mb-6">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">USDT Balance</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-3xl font-bold text-green-400">{usdtBalance || '0.00'}</span>
                        <span className="text-sm sm:text-lg text-gray-400">USDT</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">BEP-20 Token</p>
                </div>

                <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                    <p className="text-gray-400 text-xs mb-2">Address</p>
                    <div className="flex items-center justify-between gap-2">
                        <code className="text-white text-xs sm:text-sm font-mono truncate">
                            {account}
                        </code>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                                onClick={copyAddress}
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                                onClick={() => window.open(`https://etherscan.io/address/${account}`, '_blank')}
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}