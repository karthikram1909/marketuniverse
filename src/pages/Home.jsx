import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Home() {
    const [showButton, setShowButton] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setShowButton(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleEnter = () => {
        navigate(createPageUrl('Landing'));
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-black" />

            <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0, 0.6, 0.8, 0.6]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 6.5
                }}
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, rgba(0,0,0,0.8) 50%, black 100%)',
                }}
            />

            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={`orb-${i}`}
                    className="absolute rounded-full"
                    initial={{ opacity: 0 }}
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
                        opacity: [0, 0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 6 + i * 0.2
                    }}
                />
            ))}

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

            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={`wave-${i}`}
                    className="absolute"
                    initial={{ opacity: 0 }}
                    style={{
                        width: '300px',
                        height: '300px',
                        border: '2px solid rgba(220,38,38,0.3)',
                        borderRadius: '50%',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                    animate={{
                        scale: [1, 3, 1],
                        opacity: [0, 0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 7 + i * 1.3
                    }}
                />
            ))}

            <div className="relative z-10 text-center px-6">
                <div className="fixed top-0 left-0 z-50 bg-red-600 text-white p-2">DEBUG: RENDERED</div>
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 2, ease: "easeOut" }}
                    className="mb-8 relative"
                >
                    <div className="relative">
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(192,192,192,0.6) 50%, transparent 100%)',
                                height: '4px',
                                filter: 'blur(2px)'
                            }}
                            animate={{
                                x: ['-100%', '200%'],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1,
                                ease: "linear"
                            }}
                        />
                        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-8 sm:mb-12 tracking-wider relative" style={{
                            fontFamily: 'Arial, sans-serif',
                            letterSpacing: '0.1em',
                            fontSize: 'clamp(2.5rem, 10vw, 12rem)'
                        }}>
                            <span style={{
                                color: 'transparent',
                                WebkitTextStroke: '3px white',
                                textShadow: '0 0 30px rgba(255,255,255,0.6)'
                            }}>
                                WELCOME
                            </span>
                        </h1>
                        {[...Array(7)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute top-0 bottom-0"
                                style={{
                                    left: `${i * 14.5}%`,
                                    width: '2px',
                                    background: 'linear-gradient(to bottom, transparent, rgba(192,192,192,0.8), transparent)',
                                    filter: 'blur(1px)'
                                }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scaleY: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>

                    <div className="relative">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold my-6 sm:my-8 tracking-wider" style={{
                            fontFamily: 'Arial, sans-serif',
                            letterSpacing: '0.08em',
                            fontSize: 'clamp(2rem, 7vw, 8rem)'
                        }}>
                            <span className="text-gray-400" style={{
                                WebkitTextStroke: '2px rgba(255,255,255,0.3)'
                            }}>
                                TO
                            </span>
                        </h2>
                    </div>

                    <div className="relative">
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(220,38,38,0.6) 50%, transparent 100%)',
                                height: '4px',
                                top: '50%',
                                filter: 'blur(2px)'
                            }}
                            animate={{
                                x: ['200%', '-100%'],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1,
                                ease: "linear"
                            }}
                        />
                        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mt-8 sm:mt-12 tracking-wider relative" style={{
                            fontFamily: 'Arial, sans-serif',
                            letterSpacing: '0.1em',
                            fontSize: 'clamp(2.5rem, 10vw, 12rem)'
                        }}>
                            <span style={{
                                color: 'transparent',
                                WebkitTextStroke: '3px #dc2626',
                                textShadow: '0 0 30px rgba(220,38,38,0.6)'
                            }}>
                                THE TEMPLE
                            </span>
                        </h1>
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute top-0 bottom-0"
                                style={{
                                    left: `${i * 12.5}%`,
                                    width: '2px',
                                    background: 'linear-gradient(to bottom, transparent, rgba(220,38,38,0.8), transparent)',
                                    filter: 'blur(1px)'
                                }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scaleY: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.25,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                </motion.div>

                {showButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                        whileHover={{
                            scale: 1.02,
                            boxShadow: '0 8px 40px rgba(220,38,38,0.3)'
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleEnter}
                        className="relative px-8 sm:px-12 py-3 sm:py-4 text-white text-base sm:text-xl font-bold rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)'
                            }}
                        />

                        <motion.div
                            className="absolute inset-0 rounded-2xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(220,38,38,0.4), rgba(255,255,255,0.3))',
                                filter: 'blur(10px)',
                                zIndex: -1
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

                        <span className="relative z-10 flex items-center gap-3 font-semibold tracking-wide bg-gradient-to-r from-white via-[#dc2626] to-white bg-clip-text text-transparent">
                            ⚡ ENTER THE TEMPLE ⚡
                        </span>

                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dc2626]/20 to-transparent"
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
                    </motion.button>
                )}
            </div>

            <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black/80" />
        </div>
    );
}