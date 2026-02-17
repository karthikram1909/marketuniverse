import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function TradingChart() {
    const canvasRef = useRef(null);
    const [chartData, setChartData] = useState({ current: 0, change: 0, changePercent: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationId;
        let data = [];
        const MAX_POINTS = 150;
        let time = 0;

        const resize = () => {
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };

        const initData = () => {
            data = [];
            let value = 100;
            for (let i = 0; i < MAX_POINTS; i++) {
                value += (Math.random() - 0.5) * 2;
                data.push(value);
            }
        };

        const updateData = () => {
            const last = data[data.length - 1] || 100;
            const volatility = 2.5 + Math.sin(time * 0.1) * 1.5;
            const trend = Math.sin(time * 0.05) * 0.3;
            const next = last + (Math.random() - 0.5) * volatility + trend;
            data.push(next);
            if (data.length > MAX_POINTS) data.shift();
            time++;

            // Update stats
            const first = data[0];
            const change = last - first;
            const changePercent = (change / first) * 100;
            setChartData({ current: last, change, changePercent });
        };

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;
            const padding = { left: 50, right: 30, top: 30, bottom: 40 };

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Background gradient
            const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
            bgGradient.addColorStop(0, '#0f172a');
            bgGradient.addColorStop(1, '#020617');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // Grid lines
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = padding.top + (i * (height - padding.top - padding.bottom) / 5);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
            }

            if (data.length === 0) return;

            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min || 1;
            const innerWidth = width - padding.left - padding.right;
            const innerHeight = height - padding.top - padding.bottom;

            // Draw smooth line with tension
            ctx.beginPath();
            const points = data.map((value, i) => ({
                x: padding.left + (i / (data.length - 1)) * innerWidth,
                y: padding.top + (1 - (value - min) / range) * innerHeight
            }));

            // Smooth curve using cardinal spline
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length - 2; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            if (points.length > 2) {
                ctx.quadraticCurveTo(
                    points[points.length - 2].x,
                    points[points.length - 2].y,
                    points[points.length - 1].x,
                    points[points.length - 1].y
                );
            }

            // Dynamic gradient based on trend
            const isPositive = data[data.length - 1] > data[0];
            const gradient = ctx.createLinearGradient(padding.left, 0, width - padding.right, 0);
            if (isPositive) {
                gradient.addColorStop(0, '#22c55e');
                gradient.addColorStop(0.5, '#10b981');
                gradient.addColorStop(1, '#34d399');
            } else {
                gradient.addColorStop(0, '#ef4444');
                gradient.addColorStop(0.5, '#dc2626');
                gradient.addColorStop(1, '#f87171');
            }
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.shadowColor = isPositive ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Fill area under line
            ctx.lineTo(width - padding.right, height - padding.bottom);
            ctx.lineTo(padding.left, height - padding.bottom);
            ctx.closePath();
            
            const areaGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
            if (isPositive) {
                areaGradient.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
                areaGradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.1)');
                areaGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
            } else {
                areaGradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
                areaGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.1)');
                areaGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }
            ctx.fillStyle = areaGradient;
            ctx.fill();

            // Draw animated last point
            const lastPoint = points[points.length - 1];
            const pulse = Math.sin(time * 0.1) * 2 + 4;
            
            ctx.beginPath();
            ctx.arc(lastPoint.x, lastPoint.y, pulse, 0, Math.PI * 2);
            ctx.fillStyle = isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(lastPoint.x, lastPoint.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = isPositive ? '#22c55e' : '#ef4444';
            ctx.fill();
        };

        const animate = () => {
            updateData();
            draw();
            animationId = requestAnimationFrame(animate);
        };

        resize();
        initData();
        animate();

        window.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className="w-full max-w-7xl mx-auto mb-12 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1f2937]/50 to-[#0f172a]/80 backdrop-blur-xl overflow-hidden">
            {/* Header with live stats */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-400 font-medium">LIVE MARKET</span>
                    </div>
                    <motion.div
                        key={chartData.current}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-baseline gap-3"
                    >
                        <span className="text-2xl font-bold text-white">
                            ${chartData.current.toFixed(2)}
                        </span>
                        <span className={`text-sm font-semibold ${chartData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {chartData.change >= 0 ? '+' : ''}{chartData.change.toFixed(2)} ({chartData.changePercent >= 0 ? '+' : ''}{chartData.changePercent.toFixed(2)}%)
                        </span>
                    </motion.div>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 rounded-lg bg-white/5 text-xs text-gray-400">1H</div>
                    <div className="px-3 py-1 rounded-lg bg-cyan-500/20 text-xs text-cyan-400 font-medium">LIVE</div>
                    <div className="px-3 py-1 rounded-lg bg-white/5 text-xs text-gray-400">1D</div>
                </div>
            </div>
            
            {/* Chart */}
            <div className="h-80">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    aria-label="Live market chart"
                />
            </div>
        </div>
    );
}