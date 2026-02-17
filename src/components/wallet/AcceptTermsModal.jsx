import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText, Shield, Cookie, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AcceptTermsModal({ isOpen, onAccept, walletAddress }) {
    const navigate = useNavigate();
    const [hasRead, setHasRead] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAccept = async () => {
        if (!hasRead || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Check if already exists to prevent duplicates
            const { data: existing } = await supabase
                .from('user_agreements')
                .select('*')
                .eq('wallet_address', walletAddress.toLowerCase());

            if (!existing || existing.length === 0) {
                await supabase.from('user_agreements').insert({
                    wallet_address: walletAddress.toLowerCase(),
                    terms_accepted: true,
                    privacy_accepted: true,
                    cookies_accepted: true,
                    acceptance_date: new Date().toISOString()
                });
            }

            // Call onAccept to close modal and update state
            await onAccept();

            // Redirect to Dashboard after accepting terms
            navigate(createPageUrl('Dashboard'));
        } catch (error) {
            console.error('Error saving agreement:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-2xl bg-[#1a1f2e] border-white/10 text-white max-h-[90vh] overflow-y-auto"
                aria-describedby={undefined}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-6 h-6 text-cyan-400" />
                        Welcome to the Platform
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-yellow-200">
                                Before using our platform, please review and accept our terms and policies.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">Terms and Conditions</h3>
                                    <p className="text-sm text-gray-400 mb-2">
                                        By using our platform, you agree to our terms of service, including trading risks,
                                        profit sharing arrangements, and withdrawal policies.
                                    </p>
                                    <a
                                        href={createPageUrl('TermsOfService')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 text-sm hover:text-cyan-300 underline"
                                    >
                                        Read Terms & Conditions →
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">Privacy Policy</h3>
                                    <p className="text-sm text-gray-400 mb-2">
                                        We respect your privacy. Learn how we collect, use, and protect your personal
                                        information and wallet data.
                                    </p>
                                    <a
                                        href={createPageUrl('PrivacyPolicy')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-400 text-sm hover:text-purple-300 underline"
                                    >
                                        Read Privacy Policy →
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                            <div className="flex items-start gap-3">
                                <Cookie className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">Cookie Policy</h3>
                                    <p className="text-sm text-gray-400 mb-2">
                                        We use cookies to improve your experience and maintain wallet connectivity.
                                        Learn about our cookie usage.
                                    </p>
                                    <a
                                        href={createPageUrl('CookiePolicy')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-400 text-sm hover:text-orange-300 underline"
                                    >
                                        Read Cookie Policy →
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">FAQ</h3>
                                    <p className="text-sm text-gray-400 mb-2">
                                        Get answers to frequently asked questions about our platform, pools,
                                        staking, and services.
                                    </p>
                                    <a
                                        href={createPageUrl('FAQ')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-400 text-sm hover:text-green-300 underline"
                                    >
                                        Read FAQ →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <div className="flex items-start gap-3 mb-6">
                            <Checkbox
                                id="terms"
                                checked={hasRead}
                                onCheckedChange={setHasRead}
                                className="mt-1"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed cursor-pointer">
                                I confirm that I have read, understood, and agree to the Terms and Conditions,
                                Privacy Policy, Cookie Policy, and FAQ. I understand the risks involved in trading
                                and that I may lose some or all of my invested capital.
                            </label>
                        </div>

                        <Button
                            onClick={handleAccept}
                            disabled={!hasRead || isSubmitting}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed h-12 text-base font-semibold"
                        >
                            {isSubmitting ? 'Processing...' : 'Accept and Continue'}
                        </Button>

                        <p className="text-xs text-gray-500 text-center mt-3">
                            You must accept these terms to use the platform
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}