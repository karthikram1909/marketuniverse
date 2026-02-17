import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MarketTape() {
    const [marketData, setMarketData] = useState({});
    const scrollRef = useRef(null);

    const cryptoSymbols = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 
        'ADAUSDT', 'DOGEUSDT', 'TRXUSDT', 'AVAXUSDT', 'LINKUSDT'
    ];

    // Crypto real-time from Binance
    useEffect(() => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${cryptoSymbols.map(s => s.toLowerCase() + '@ticker').join('/')}`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.s) {
                setMarketData(prev => ({
                    ...prev,
                    [data.s.replace('USDT', '')]: {
                        symbol: data.s.replace('USDT', ''),
                        price: parseFloat(data.c).toFixed(2),
                        change: parseFloat(data.P).toFixed(2)
                    }
                }));
            }
        };

        return () => ws.close();
    }, []);

    // Real market data from internet
    useEffect(() => {
        const fetchRealMarketData = async () => {
            try {
                const result = await base44.integrations.Core.InvokeLLM({
                    prompt: `Get current real-time market data for these assets: AAPL, GOOGL, TSLA, MSFT, NVDA, S&P 500 index, NASDAQ index, DOW index, EUR/USD, GBP/USD, USD/JPY, Gold (XAU/USD), Silver (XAG/USD). Return the current price and 24h percentage change for each.`,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            markets: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        symbol: { type: "string" },
                                        price: { type: "number" },
                                        change: { type: "number" }
                                    }
                                }
                            }
                        }
                    }
                });

                if (result.markets) {
                    result.markets.forEach(item => {
                        const decimals = ['EUR/USD', 'GBP/USD'].includes(item.symbol) ? 4 : 2;
                        setMarketData(prev => ({
                            ...prev,
                            [item.symbol]: {
                                symbol: item.symbol,
                                price: item.price.toFixed(decimals),
                                change: item.change.toFixed(2)
                            }
                        }));
                    });
                }
            } catch (error) {
                console.error('Error fetching market data:', error);
            }
        };

        fetchRealMarketData();
        const interval = setInterval(fetchRealMarketData, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const scroll = scrollRef.current;
        if (!scroll) return;

        let position = 0;
        let animationId;

        const animate = () => {
            position -= 1;
            const itemWidth = scroll.scrollWidth / 3;
            
            if (Math.abs(position) >= itemWidth) {
                position = 0;
            }
            
            scroll.style.transform = `translateX(${position}px)`;
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [Object.keys(marketData).length]);

    const marketItems = Object.values(marketData);
    const displayData = [...marketItems, ...marketItems, ...marketItems];

    return (
         <div className="bg-[#0f1420] border-b border-white/10 py-3 overflow-hidden min-h-[50px]">
             {marketItems.length === 0 ? (
                 <div className="text-center text-gray-400 text-sm">Loading live market data...</div>
             ) : (
             <div ref={scrollRef} className="flex whitespace-nowrap">
                 {displayData.map((item, index) => {
                    const changeNum = parseFloat(item.change);
                    const isPositive = changeNum >= 0;

                    return (
                        <div
                            key={`${item.symbol}-${index}`}
                            className="inline-flex items-center gap-2 px-6 border-r border-white/10"
                        >
                            <span className="text-white font-bold text-sm">
                                {item.symbol}
                            </span>
                            <span className="text-gray-300 text-sm">
                                ${parseFloat(item.price).toLocaleString()}
                            </span>
                            <span className={`flex items-center gap-1 text-xs font-bold ${
                                isPositive ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {isPositive ? (
                                    <TrendingUp className="w-3 h-3" />
                                ) : (
                                    <TrendingDown className="w-3 h-3" />
                                )}
                                {isPositive ? '+' : ''}{changeNum}%
                            </span>
                        </div>
                    );
                    })}
                    </div>
                    )}
                    </div>
                    );
}