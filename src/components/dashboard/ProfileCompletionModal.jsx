import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, User, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileCompletionModal({ isOpen, onClose, isWarning = false }) {
    return (
        <Dialog open={isOpen} onOpenChange={isWarning ? () => {} : onClose}>
            <DialogContent 
                className="bg-gradient-to-br from-[#1f2937] to-[#0f172a] border-2 border-purple-500/50 max-w-md"
                onPointerDownOutside={isWarning ? (e) => e.preventDefault() : undefined}
                onEscapeKeyDown={isWarning ? (e) => e.preventDefault() : undefined}
            >
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        {isWarning ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"
                            >
                                <AlertTriangle className="w-10 h-10 text-white" />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                            >
                                <User className="w-10 h-10 text-white" />
                            </motion.div>
                        )}
                    </div>
                    <DialogTitle className="text-2xl text-center text-white">
                        {isWarning ? 'Profile Completion Required' : 'Complete Your Profile'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-300 mt-2">
                        {isWarning ? (
                            <div className="space-y-3">
                                <p className="text-orange-400 font-semibold">
                                    ⚠️ You must complete your profile before accessing the platform
                                </p>
                                <p>
                                    For AML/KYC compliance and to ensure the security of all transactions, 
                                    we require complete profile information from all users.
                                </p>
                                <p className="text-sm text-gray-400">
                                    Please fill in all required fields before proceeding.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p>
                                    Welcome to MarketsUniverse! To comply with AML/KYC regulations and 
                                    ensure the security of your account, please complete your profile.
                                </p>
                                <div className="bg-white/5 rounded-lg p-3 text-sm text-left space-y-2">
                                    <p className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-purple-400" />
                                        <span>Full Name</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-purple-400" />
                                        <span>Telephone Number</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-purple-400" />
                                        <span>Withdrawal Wallet Address</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-purple-400" />
                                        <span>Country, City & Address</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-6">
                    <Button
                        onClick={onClose}
                        className={`w-full ${
                            isWarning 
                                ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                                : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        } hover:opacity-90 text-white border-0 rounded-xl py-6 text-lg font-semibold`}
                    >
                        {isWarning ? 'Complete Profile Now' : 'Get Started'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}