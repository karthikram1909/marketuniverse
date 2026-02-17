import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerificationModal({ 
    isOpen, 
    onClose, 
    onVerify, 
    email, 
    purpose = 'admin_access',
    isLoading = false 
}) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (code.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        const success = await onVerify(code);
        if (!success) {
            setError('Invalid or expired code. Please try again.');
            setCode('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#0f1420] border border-white/20 text-white max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="text-2xl text-center">Two-Factor Authentication</DialogTitle>
                    <DialogDescription className="text-gray-400 text-center">
                        {purpose === 'admin_access' 
                            ? 'Admin access requires verification'
                            : 'Verify your identity to continue'}
                    </DialogDescription>
                </DialogHeader>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 flex items-start gap-3">
                        <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-300">
                                A 6-digit verification code has been sent to:
                            </p>
                            <p className="text-sm text-white font-medium mt-1">{email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">
                                Verification Code
                            </label>
                            <Input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setCode(value);
                                    setError('');
                                }}
                                placeholder="000000"
                                className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest font-mono"
                                maxLength={6}
                                autoFocus
                            />
                            {error && (
                                <p className="text-red-400 text-sm mt-2">{error}</p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="outline"
                                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0"
                                disabled={isLoading || code.length !== 6}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify'
                                )}
                            </Button>
                        </div>
                    </form>

                    <p className="text-xs text-gray-500 text-center">
                        Code expires in 5 minutes. Check your spam folder if you don't see it.
                    </p>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}