import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COIN_LOGOS = {
    BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    SOL: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
    AVAX: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    LINK: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    ADA: 'https://cryptologos.cc/logos/cardano-ada-logo.png'
};

const BINANCE_SYMBOLS = {
    BTC: 'btcusdt',
    ETH: 'ethusdt',
    SOL: 'solusdt',
    XRP: 'xrpusdt',
    AVAX: 'avaxusdt',
    LINK: 'linkusdt',
    ADA: 'adausdt'
};

const initialMarkets = [
    { symbol: 'BTC', name: 'Bitcoin', price: 0, change: 0, volume: '0' },
    { symbol: 'ETH', name: 'Ethereum', price: 0, change: 0, volume: '0' },
    { symbol: 'SOL', name: 'Solana', price: 0, change: 0, volume: '0' },
    { symbol: 'XRP', name: 'XRP', price: 0, change: 0, volume: '0' },
    { symbol: 'AVAX', name: 'Avalanche', price: 0, change: 0, volume: '0' },
    { symbol: 'LINK', name: 'Chainlink', price: 0, change: 0, volume: '0' },
    { symbol: 'ADA', name: 'Cardano', price: 0, change: 0, volume: '0' }
];

export default function MarketSection() {
    const [markets, setMarkets] = useState(initialMarkets);

    useEffect(() => {
        // Fetch initial data via REST API
        const fetchInitialData = async () => {
            try {
                const symbols = Object.values(BINANCE_SYMBOLS);
                const promises = symbols.map(symbol => 
                    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`)
                        .then(res => res.json())
                );
                
                const results = await Promise.all(promises);
                
                results.forEach(data => {
                    const symbol = Object.keys(BINANCE_SYMBOLS).find(
                        key => BINANCE_SYMBOLS[key] === data.symbol.toLowerCase()
                    );
                    
                    if (symbol) {
                        setMarkets(prev => prev.map(market => 
                            market.symbol === symbol
                                ? {
                                    ...market,
                                    price: parseFloat(data.lastPrice),
                                    change: parseFloat(data.priceChangePercent),
                                    volume: (parseFloat(data.quoteVolume) / 1000000000).toFixed(2) + 'B'
                                }
                                : market
                        ));
                    }
                });
            } catch (error) {
                console.error('Failed to fetch market data:', error);
            }
        };

        fetchInitialData();

        // Setup WebSocket for live updates
        const streams = Object.values(BINANCE_SYMBOLS).map(symbol => `${symbol}@ticker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.data && message.data.e === '24hrTicker') {
                    const data = message.data;
                    const symbol = Object.keys(BINANCE_SYMBOLS).find(
                        key => BINANCE_SYMBOLS[key] === data.s.toLowerCase()
                    );
                    
                    if (symbol) {
                        setMarkets(prev => prev.map(market => 
                            market.symbol === symbol
                                ? {
                                    ...market,
                                    price: parseFloat(data.c),
                                    change: parseFloat(data.P),
                                    volume: (parseFloat(data.q) / 1000000000).toFixed(2) + 'B'
                                }
                                : market
                        ));
                    }
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };

        ws.onerror = () => {
            // Silently handle WebSocket connection errors
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    return (
        <section id="markets" className="relative py-24 px-6">
            <div className="absolute inset-0 bg-black" />
            
            <motion.div 
                className="absolute inset-0"
                animate={{ opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background: 'radial-gradient(ellipse at bottom right, rgba(220,38,38,0.1) 0%, transparent 60%)',
                }}
            />
            
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`market-orb-${i}`}
                    className="absolute rounded-full"
                    style={{
                        width: `${Math.random() * 100 + 40}px`,
                        height: `${Math.random() * 100 + 40}px`,
                        background: i % 2 === 0 ? 'radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        x: [0, Math.random() * 40 - 20, 0],
                        y: [0, Math.random() * 40 - 20, 0],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}

            <div className="relative z-10 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
                >
                    <div>
                        <span className="text-red-500 text-sm font-medium tracking-wider uppercase mb-4 block">
                            Live Markets
                        </span>
                    </div>
                    <motion.a
                        href="https://www.coinmarketcap.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative mt-6 md:mt-0 px-8 py-3 text-white text-base font-bold rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 inline-flex items-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)' }} />
                        <motion.div
                            className="absolute inset-0 rounded-2xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(220,38,38,0.4), rgba(255,255,255,0.3))',
                                filter: 'blur(10px)',
                                zIndex: -1
                            }}
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <span className="relative z-10 flex items-center gap-2 font-semibold tracking-wide bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent">
                            View All Markets
                            <ArrowRight className="w-5 h-5 text-white" />
                        </span>
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dc2626]/20 to-transparent"
                            style={{ transform: 'skewX(-20deg)' }}
                            animate={{ x: ['-200%', '200%'] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                        />
                    </motion.a>
                </motion.div>

                <div className="relative backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                    {/* Glass reflection */}
                    <div 
                        className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-10"
                        style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)'
                        }}
                    />

                    {/* Gradient background */}
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                    }} />

                    {/* Animated border glow */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl -z-10"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(220,38,38,0.4), rgba(255,255,255,0.3))',
                            filter: 'blur(10px)',
                        }}
                        animate={{
                            opacity: [0.4, 0.7, 0.4],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Professional shine sweep */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dc2626]/20 to-transparent pointer-events-none"
                        style={{
                            transform: 'skewX(-20deg)'
                        }}
                        animate={{
                            x: ['-200%', '200%'],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "easeInOut"
                        }}
                    />

                    <div className="relative z-20 hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-gray-400 text-sm font-medium">
                        <div className="col-span-4">Asset</div>
                        <div className="col-span-3 text-right">Price</div>
                        <div className="col-span-2 text-right">24h Change</div>
                        <div className="col-span-3 text-right">Volume</div>
                    </div>

                    {markets.map((market, index) => (
                        <motion.div
                            key={market.symbol}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="relative z-20 px-4 sm:px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            {/* Mobile Layout */}
                            <div className="md:hidden flex items-start gap-3">
                                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center p-2">
                                    <img 
                                        src={COIN_LOGOS[market.symbol]} 
                                        alt={market.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerText = market.symbol.charAt(0);
                                            e.target.parentElement.classList.add('text-white', 'font-bold', 'text-lg');
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <p className="text-white font-bold text-base">{market.symbol}</p>
                                            <p className="text-gray-400 text-xs">{market.name}</p>
                                        </div>
                                        <span className={`flex items-center gap-1 font-semibold text-sm ${market.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {market.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs(market.change).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-white font-mono font-semibold text-sm">
                                            ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-gray-400 font-mono text-xs">${market.volume}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden md:grid grid-cols-12 gap-4">
                                <div className="col-span-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center p-1.5">
                                        <img 
                                            src={COIN_LOGOS[market.symbol]} 
                                            alt={market.name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerText = market.symbol.charAt(0);
                                                e.target.parentElement.classList.add('text-white', 'font-bold');
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{market.symbol}</p>
                                        <p className="text-gray-400 text-sm">{market.name}</p>
                                    </div>
                                </div>
                                <div className="col-span-3 flex items-center justify-end">
                                    <span className="text-white font-mono font-medium">
                                        ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="col-span-2 flex items-center justify-end">
                                    <span className={`flex items-center gap-1 font-medium ${market.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {market.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {Math.abs(market.change).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="col-span-3 flex items-center justify-end">
                                    <span className="text-gray-400 font-mono">${market.volume}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}