import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, TrendingDown, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function WithdrawalForm({
    poolType,
    maxAmount,
    onSubmit,
    isSubmitting,
    cryptoType = 'USDT',
    withdrawalsLocked = false
}) {
    console.log('🎯 WithdrawalForm rendered for pool:', poolType, 'onSubmit type:', typeof onSubmit);
    const poolThemes = {
        scalping: {
            gradient: 'from-red-500/5 via-black/40 to-red-600/5',
            border: 'border-red-500/20',
            glow: 'bg-red-500/20',
            glowBlur: 'bg-red-500/20',
            icon: 'from-red-400 to-red-600',
            button: 'from-red-500 to-red-600',
            text: 'text-red-400'
        },
        traditional: {
            gradient: 'from-yellow-500/5 via-black/40 to-yellow-600/5',
            border: 'border-yellow-500/20',
            glow: 'bg-yellow-500/20',
            glowBlur: 'bg-yellow-500/20',
            icon: 'from-yellow-400 to-yellow-600',
            button: 'from-yellow-500 to-amber-600',
            text: 'text-yellow-400'
        },
        vip: {
            gradient: 'from-cyan-500/5 via-black/40 to-purple-600/5',
            border: 'border-cyan-500/20',
            glow: 'bg-cyan-500/20',
            glowBlur: 'bg-purple-500/20',
            icon: 'from-cyan-400 to-purple-600',
            button: 'from-cyan-500 to-purple-600',
            text: 'text-cyan-400'
        }
    };

    const theme = poolThemes[poolType] || poolThemes.scalping;

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        payment_address: '',
        name_surname: '',
        amount: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Load user profile data on mount
    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (profile) {
                        setFormData(prev => ({
                            ...prev,
                            email: profile.email || user.email || '',
                            payment_address: profile.withdrawal_wallet_address || '',
                            name_surname: profile.full_name || ''
                        }));
                    }
                }
            } catch (error) {
                console.error('Failed to load user profile:', error);
            }
        };
        loadUserProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🎯🎯🎯 FORM SUBMIT TRIGGERED for pool:', poolType);
        setIsLoading(true);
        setError('');
        setSuccess(false);

        // Check if withdrawals are locked
        if (withdrawalsLocked) {
            setError('Withdrawals are currently locked for this pool');
            setIsLoading(false);
            return;
        }

        // Validation
        if (!formData.email || !formData.payment_address || !formData.name_surname || !formData.amount) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount');
            setIsLoading(false);
            return;
        }

        if (amount > maxAmount) {
            setError(`Amount cannot exceed your balance of ${maxAmount.toFixed(2)} ${cryptoType}`);
            setIsLoading(false);
            return;
        }

        try {
            console.log('🔵 Calling onSubmit with formData:', formData);
            console.log('🔵 onSubmit function:', onSubmit);
            const result = await onSubmit(formData);
            console.log('✅ SUCCESS - result:', result);
            setSuccess(true);
            setFormData(prev => ({ ...prev, amount: '' }));
        } catch (err) {
            console.error('❌ ERROR:', err);
            setError(err.message || 'Failed to submit withdrawal request');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative bg-gradient-to-br ${theme.gradient} backdrop-blur-xl border ${theme.border} rounded-3xl p-6 overflow-hidden`}
        >
            {/* Animated Background Elements */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-50`} />
            <div className={`absolute -top-24 -right-24 w-48 h-48 ${theme.glowBlur} rounded-full blur-3xl`} />
            <div className={`absolute -bottom-24 -left-24 w-48 h-48 ${theme.glow} rounded-full blur-3xl`} />

            <div className="relative z-10">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 mb-6"
                >
                    <div className={`p-3 bg-gradient-to-br ${theme.icon} rounded-xl shadow-lg`}>
                        <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Request Withdrawal</h3>
                </motion.div>

                {withdrawalsLocked && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-5 mb-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
                        <div className="relative z-10 flex items-start gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-red-400 font-bold mb-1">Withdrawals Locked</p>
                                <p className="text-gray-300 text-sm">
                                    Withdrawals are temporarily disabled. Please try again later.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Available Balance Display */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border border-green-500/30 rounded-2xl p-5 mb-6 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-gray-300 font-medium">Available Balance:</span>
                        </div>
                        <div className="text-right">
                            <span className="text-green-400 font-bold text-2xl block">
                                {maxAmount.toFixed(6)}
                            </span>
                            <span className="text-green-300/60 text-xs">{cryptoType}</span>
                        </div>
                    </div>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-4 mb-4 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
                        <div className="relative z-10 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400 font-medium">{error}</span>
                        </div>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-2xl p-4 mb-4 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                        <div className="relative z-10 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400 font-medium">Withdrawal request submitted successfully!</span>
                        </div>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your@email.com"
                                className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Payment Address (BEP-20)
                            </label>
                            <Input
                                value={formData.payment_address}
                                onChange={(e) => setFormData({ ...formData, payment_address: e.target.value })}
                                placeholder="0x..."
                                className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 transition-all font-mono text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Name/Surname</label>
                            <Input
                                value={formData.name_surname}
                                onChange={(e) => setFormData({ ...formData, name_surname: e.target.value })}
                                placeholder="John Doe"
                                className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 transition-all"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Amount ({cryptoType})
                                </label>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, amount: maxAmount.toString() })}
                                    className={`text-xs ${theme.text} hover:opacity-80 transition-all font-medium px-3 py-1 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10`}
                                >
                                    Use Max Amount
                                </motion.button>
                            </div>
                            <Input
                                type="number"
                                step="0.000001"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 transition-all"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Button
                            type="submit"
                            disabled={isLoading || withdrawalsLocked}
                            className={`w-full mt-6 bg-gradient-to-r ${theme.button} hover:opacity-90 text-white border-0 rounded-xl py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50`}
                        >
                            {withdrawalsLocked ? (
                                '🔒 Withdrawals Locked'
                            ) : isLoading ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : (
                                'Submit Withdrawal Request'
                            )}
                        </Button>
                    </motion.div>
                </form>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-5 mt-6 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent" />
                    <div className="relative z-10 flex items-start gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        </div>
                        <p className="text-gray-300 text-sm">
                            <strong className="text-yellow-400">Note:</strong> Your withdrawal is in process.
                            You will receive payment to you provided BEP20 address after 30-60 Network confirmations.
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}