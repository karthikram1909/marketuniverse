import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useWallet } from '../wallet/WalletContext';

export default function SupportForm() {
    const { account } = useWallet();
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error: msgError } = await supabase.from('support_messages').insert({
                ...formData,
                wallet_address: account?.toLowerCase() || null,
                status: 'pending',
                created_at: new Date().toISOString()
            });

            if (msgError) throw msgError;

            // Create notifications for user and admin
            await Promise.all([
                supabase.from('notifications').insert({
                    wallet_address: account?.toLowerCase() || null,
                    email: formData.email,
                    type: 'trade_completed',
                    title: 'Support Message Received',
                    message: `We received your message about "${formData.subject}". Our team will respond shortly.`,
                    read: false,
                    is_admin: false,
                    created_date: new Date().toISOString()
                }),
                supabase.from('notifications').insert({
                    email: formData.email,
                    type: 'trade_completed',
                    title: 'New Support Message',
                    message: `New support message from ${formData.name} (${formData.email}): ${formData.subject}`,
                    read: false,
                    is_admin: true,
                    created_date: new Date().toISOString()
                })
            ]);

            toast.success('Message sent successfully! We\'ll get back to you soon.');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setIsOpen(false);
        } catch (error) {
            console.error('Support form error:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Support Button */}
            <button
                onClick={() => {
                    console.log('Support button clicked!');
                    setIsOpen(!isOpen);
                }}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all overflow-hidden backdrop-blur-xl border border-white/10 cursor-pointer"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                    boxShadow: '0 8px 32px 0 rgba(220, 38, 38, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                    zIndex: 50
                }}
            >
                {/* Glass reflection */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"
                    style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 30%)'
                    }}
                />

                {/* Animated red shine */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent pointer-events-none"
                    animate={{
                        x: ['-100%', '100%']
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                <MessageCircle className="w-6 h-6 text-red-500 relative z-10 pointer-events-none" />
            </button>

            {/* Support Form Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50"
                            style={{ zIndex: 40 }}
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed w-[400px] rounded-2xl shadow-2xl p-8 overflow-hidden backdrop-blur-xl border border-white/10"
                            style={{
                                zIndex: 50,
                                bottom: '88px',
                                right: '24px',
                                background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.7) 50%, rgba(0,0,0,0.8) 100%)',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                            }}
                        >
                            {/* Animated Red Background Glow */}
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

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-xl font-bold text-white">Contact Support</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-red-400 transition-colors text-xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
                                <div>
                                    <Input
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="bg-black/40 border border-white/10 text-white placeholder:text-gray-500 h-11 rounded-lg focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="email"
                                        placeholder="Your Email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="bg-black/40 border border-white/10 text-white placeholder:text-gray-500 h-11 rounded-lg focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                                    />
                                </div>
                                <div>
                                    <Input
                                        placeholder="Subject"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                        className="bg-black/40 border border-white/10 text-white placeholder:text-gray-500 h-11 rounded-lg focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                                    />
                                </div>
                                <div>
                                    <Textarea
                                        placeholder="Describe your question or issue..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        rows={3}
                                        className="bg-black/40 border border-white/10 text-white placeholder:text-gray-500 rounded-lg resize-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                                    />
                                </div>
                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{
                                        scale: 1.02,
                                        boxShadow: '0 8px 40px rgba(220,38,38,0.4)'
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative w-full px-8 py-3 text-white text-sm font-bold rounded-lg overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
                                        boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)'
                                    }}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2 font-semibold tracking-wide">
                                        <Send className="w-4 h-4" />
                                        {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
                                    </span>

                                    {/* Shine effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
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
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}