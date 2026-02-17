import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TICKERS = [
    { id: 'BTCUSDT', label: 'BTC/USDT', type: 'crypto', decimals: 2 },
    { id: 'ETHUSDT', label: 'ETH/USDT', type: 'crypto', decimals: 2 },
    { id: 'SOLUSDT', label: 'SOL/USDT', type: 'crypto', decimals: 2 },
    { id: 'BNBUSDT', label: 'BNB/USDT', type: 'crypto', decimals: 2 },
];

export default function LiveTicker() {
    const [prices, setPrices] = useState({});
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const symbols = TICKERS.map(t => t.id);
                const response = await fetch(
                    `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`
                );
                const data = await response.json();
                
                const priceMap = {};
                data.forEach(item => {
                    priceMap[item.symbol] = {
                        price: parseFloat(item.lastPrice),
                        change: parseFloat(item.priceChangePercent)
                    };
                });
                setPrices(priceMap);
            } catch (error) {
                console.warn('Error fetching prices:', error);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationId;
        let scrollPosition = 0;

        const scroll = () => {
            scrollPosition += 0.5;
            if (scrollPosition >= scrollContainer.scrollWidth / 2) {
                scrollPosition = 0;
            }
            scrollContainer.scrollLeft = scrollPosition;
            animationId = requestAnimationFrame(scroll);
        };

        animationId = requestAnimationFrame(scroll);

        return () => cancelAnimationFrame(animationId);
    }, [prices]);

    return (
        <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] mb-12 overflow-hidden">
            <div className="bg-black/40 backdrop-blur-sm border-y border-red-500/20">
                <div ref={scrollRef} className="overflow-x-hidden flex" style={{ scrollBehavior: 'auto' }}>
                    <div className="flex gap-12 py-3 flex-shrink-0">
                        {[...TICKERS, ...TICKERS, ...TICKERS].map((ticker, index) => {
                        const data = prices[ticker.id];
                        const isPositive = data?.change >= 0;
                        
                        return (
                            <div
                                key={`${ticker.id}-${index}`}
                                className="flex items-center gap-4 whitespace-nowrap px-4"
                            >
                                <span className="text-gray-400 text-sm font-medium">
                                    {ticker.label}
                                </span>
                                <span className="text-white font-bold text-base">
                                    {data ? `$${data.price.toFixed(ticker.decimals)}` : 'Loading...'}
                                </span>
                                {data && (
                                    <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isPositive ? '+' : ''}{data.change.toFixed(2)}%
                                    </span>
                                )}
                            </div>
                        );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}