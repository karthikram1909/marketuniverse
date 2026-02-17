import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle2, XCircle, Clock, AlertCircle, Shield, Lock, Eye, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '../wallet/WalletContext';
import { motion } from 'framer-motion';

export default function KYCPanel() {
    const { account } = useWallet();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        identity_document_type: '',
        identity_document: null,
        proof_of_address_type: '',
        proof_of_address: null,
        selfie_photo: null
    });

    const { data: kycData, isLoading } = useQuery({
        queryKey: ['kyc', account],
        queryFn: async () => {
            if (!account) return null;
            const { data } = await supabase.from('kyc_verifications')
                .select('*')
                .eq('wallet_address', account.toLowerCase())
                .limit(1);
            return data && data.length > 0 ? data[0] : null;
        },
        enabled: !!account
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const { data: record, error } = await supabase.from('kyc_verifications').insert(data).select().single();
            if (error) throw error;
            return record;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kyc'] });
            toast.success('KYC documents submitted successfully!');
            setFormData({
                identity_document_type: '',
                identity_document: null,
                proof_of_address_type: '',
                proof_of_address: null,
                selfie_photo: null
            });
        }
    });

    const handleFileChange = (field, file) => {
        setFormData(prev => ({ ...prev, [field]: file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.identity_document_type || !formData.identity_document ||
            !formData.proof_of_address_type || !formData.proof_of_address ||
            !formData.selfie_photo) {
            toast.error('Please fill all required fields');
            return;
        }

        setUploading(true);
        try {
            // Upload files
            const uploadFile = async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `kyc/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('kyc_documents')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('kyc_documents')
                    .getPublicUrl(filePath);

                return { file_url: publicUrl };
            };

            const [identityRes, addressRes, selfieRes] = await Promise.all([
                uploadFile(formData.identity_document),
                uploadFile(formData.proof_of_address),
                uploadFile(formData.selfie_photo)
            ]);

            await createMutation.mutateAsync({
                wallet_address: account.toLowerCase(),
                identity_document_type: formData.identity_document_type,
                identity_document_url: identityRes.file_url,
                proof_of_address_type: formData.proof_of_address_type,
                proof_of_address_url: addressRes.file_url,
                selfie_photo_url: selfieRes.file_url,
                status: 'under_review'
            });

            // Create notification for KYC submission
            try {
                await supabase.from('notifications').insert({
                    wallet_address: account.toLowerCase(),
                    type: 'trade_completed',
                    title: 'KYC Verification Submitted',
                    message: 'Your KYC verification documents have been submitted successfully and are under review. You will be notified once the verification is complete.',
                    read: false,
                    is_admin: false
                });
            } catch (notifError) {
                console.warn('Notification creation failed, but KYC submitted successfully');
            }
        } catch (error) {
            console.error('KYC submission error:', error);
            toast.error(`Failed to submit: ${error.message || 'Please try again'}`);
        } finally {
            setUploading(false);
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'pending':
            case 'under_review':
                return {
                    icon: <Clock className="w-6 h-6 text-yellow-500" />,
                    text: 'Verification Under Review',
                    color: 'border-yellow-500/30 bg-yellow-500/5'
                };
            case 'approved':
                return {
                    icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
                    text: 'Verification Completed',
                    color: 'border-green-500/30 bg-green-500/5'
                };
            case 'rejected':
                return {
                    icon: <XCircle className="w-6 h-6 text-red-500" />,
                    text: 'Verification Failed. Contact Support.',
                    color: 'border-red-500/30 bg-red-500/5'
                };
            default:
                return {
                    icon: <AlertCircle className="w-6 h-6 text-gray-500" />,
                    text: 'Not Submitted',
                    color: 'border-gray-500/30 bg-gray-500/5'
                };
        }
    };

    if (isLoading) {
        return <div className="text-white">Loading...</div>;
    }

    if (kycData) {
        const statusInfo = getStatusDisplay(kycData.status);
        return (
            <div className="space-y-6">
                <div className={`border-2 rounded-xl p-6 ${statusInfo.color}`}>
                    <div className="flex items-center gap-4">
                        {statusInfo.icon}
                        <div>
                            <h3 className="text-xl font-bold text-white">{statusInfo.text}</h3>
                            <p className="text-gray-400 text-sm mt-1">
                                Submitted on {new Date(kycData.created_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    {kycData.admin_notes && (
                        <div className="mt-4 p-4 bg-black/30 rounded-lg">
                            <p className="text-sm text-gray-300"><strong>Admin Notes:</strong> {kycData.admin_notes}</p>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Identity Document</p>
                        <p className="text-white font-semibold capitalize">{kycData.identity_document_type?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Proof of Address</p>
                        <p className="text-white font-semibold capitalize">{kycData.proof_of_address_type?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Selfie Photo</p>
                        <p className="text-white font-semibold">{kycData.selfie_photo_url ? 'Submitted' : 'N/A'}</p>
                    </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mt-6">
                    <p className="text-cyan-400 text-xs leading-relaxed">
                        <strong>Privacy Notice:</strong> We do not share your personal details with third parties.
                        The company reserves the right to share information only under an official court request.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Detailed Explanation Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/60 border border-red-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl"
            >
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-3">
                    <Shield className="w-7 h-7 text-red-400" />
                    Why KYC & AML Verification
                </h2>
                <p className="text-red-400 text-base sm:text-lg mb-8">Understanding our compliance requirements</p>

                <div className="space-y-6">
                    {/* Point 1 */}
                    <div className="border-l-4 border-cyan-500 pl-6">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                            1. Legal Compliance
                        </h3>
                        <div className="text-gray-300 space-y-3">
                            <p>MarketsUniverse LLC operates under Ukrainian law and international financial regulations. We are legally required to verify our users' identities to prevent:</p>
                            <div className="bg-white/5 rounded-xl p-4">
                                <ul className="space-y-2 text-sm">
                                    <li>• <span className="text-white font-semibold">Money Laundering:</span> Ensuring funds come from legitimate sources</li>
                                    <li>• <span className="text-white font-semibold">Terrorist Financing:</span> Blocking accounts linked to illegal organizations</li>
                                    <li>• <span className="text-white font-semibold">Fraud & Identity Theft:</span> Protecting both users and the platform</li>
                                    <li>• <span className="text-white font-semibold">Sanctions Violations:</span> Screening against international sanctions lists</li>
                                </ul>
                            </div>
                            <p className="text-cyan-400 text-sm">We comply with Ukrainian AML Law No. 361-IX and international FATF recommendations.</p>
                        </div>
                    </div>

                    {/* Point 2 */}
                    <div className="border-l-4 border-green-500 pl-6">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                            2. What We Verify
                        </h3>
                        <div className="text-gray-300 space-y-3">
                            <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                <div>
                                    <p className="text-white font-semibold mb-1">Identity Document (Required)</p>
                                    <p className="text-sm">Passport, driving licence, or government-issued ID card. Must be valid and clearly show your photo, full name, date of birth, and document number.</p>
                                </div>
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-white font-semibold mb-1">Proof of Address (Required)</p>
                                    <p className="text-sm">Bank statement or tax document issued within the last 3 months showing your full name and residential address.</p>
                                </div>
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-white font-semibold mb-1">Selfie Photo (Required)</p>
                                    <p className="text-sm">Photo of you holding your identity document next to your face. Ensures the person submitting matches the document.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Point 3 */}
                    <div className="border-l-4 border-yellow-500 pl-6">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                            3. When Verification is Required
                        </h3>
                        <div className="text-gray-300 space-y-3">
                            <p>KYC verification may be required:</p>
                            <ul className="space-y-2 text-sm list-disc list-inside ml-4">
                                <li>For large investment amounts or withdrawals</li>
                                <li>For cumulative transactions exceeding regulatory thresholds</li>
                                <li>When account activity appears unusual or suspicious</li>
                                <li>To access certain premium features or services</li>
                                <li>As part of routine compliance reviews</li>
                                <li>Upon request by regulatory authorities</li>
                            </ul>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-3">
                                <p className="text-yellow-400 text-sm"><strong>Note:</strong> Verification typically takes 3-7 business days. You'll be notified via dashboard once complete.</p>
                            </div>
                        </div>
                    </div>

                    {/* Point 4 */}
                    <div className="border-l-4 border-purple-500 pl-6">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                            4. Privacy & Data Protection
                        </h3>
                        <div className="text-gray-300 space-y-3">
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Lock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-white font-semibold">Secure Storage:</span> All documents encrypted and stored securely</p>
                                        <p><span className="text-white font-semibold">Limited Access:</span> Only authorized compliance officers can view KYC data</p>
                                        <p><span className="text-white font-semibold">No Third-Party Sharing:</span> We NEVER sell or share your data with third parties</p>
                                        <p><span className="text-white font-semibold">Court Orders Only:</span> Information shared only under official court request</p>
                                        <p><span className="text-white font-semibold">Data Retention:</span> Documents retained as required by Ukrainian law (typically 5 years)</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-cyan-400">We comply with Ukrainian Personal Data Protection Law No. 2297-VI and GDPR principles.</p>
                        </div>
                    </div>

                    {/* Point 5 */}
                    <div className="border-l-4 border-red-500 pl-6">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                            5. Verification Process
                        </h3>
                        <div className="text-gray-300 space-y-3">
                            <div className="bg-white/5 rounded-lg p-4 text-sm space-y-3">
                                <div>
                                    <p className="text-white font-semibold mb-1">Step 1: Document Upload</p>
                                    <p>Select document types and upload clear, readable photos or PDFs below.</p>
                                </div>
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-white font-semibold mb-1">Step 2: Automated Checks</p>
                                    <p>System performs initial validation (document format, readability, expiry dates).</p>
                                </div>
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-white font-semibold mb-1">Step 3: Manual Review</p>
                                    <p>Compliance team reviews documents for authenticity and accuracy (3-7 business days).</p>
                                </div>
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-white font-semibold mb-1">Step 4: Decision</p>
                                    <p>Status updated to <span className="text-green-400">Approved</span>, <span className="text-red-400">Rejected</span> (with reason), or <span className="text-yellow-400">Additional Info Required</span>.</p>
                                </div>
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-white font-semibold mb-1">Step 5: Notification</p>
                                    <p>You receive dashboard notification with verification result and next steps.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Point 6 */}
                    <div className="border-l-4 border-blue-500 pl-6">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                            6. Common Rejection Reasons
                        </h3>
                        <div className="text-gray-300 space-y-2">
                            <ul className="space-y-2 text-sm list-disc list-inside ml-4">
                                <li>Blurry, cropped, or low-quality images</li>
                                <li>Expired documents</li>
                                <li>Document name doesn't match account registration</li>
                                <li>Proof of address older than 3 months</li>
                                <li>Selfie doesn't clearly show face + document</li>
                                <li>Documents in unsupported languages without translation</li>
                                <li>Suspected document forgery or tampering</li>
                            </ul>
                            <p className="text-yellow-400 text-sm mt-3"><strong>Tip:</strong> Ensure all corners visible, text readable, and photos well-lit before uploading.</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* KYC Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">Submit Your Documents</h3>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-bold text-white">Identity Document</h3>
                    </div>
                    <Select value={formData.identity_document_type} onValueChange={(val) => setFormData({ ...formData, identity_document_type: val })}>
                        <SelectTrigger className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 text-white mb-3 h-12 hover:border-cyan-400 transition-all shadow-lg">
                            <SelectValue placeholder="📋 Select document type *" className="text-white font-semibold" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-cyan-500/30">
                            <SelectItem value="passport" className="text-white hover:bg-cyan-500/20">Passport</SelectItem>
                            <SelectItem value="driving_licence" className="text-white hover:bg-cyan-500/20">Driving Licence</SelectItem>
                            <SelectItem value="id_card" className="text-white hover:bg-cyan-500/20">ID Card</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileChange('identity_document', e.target.files[0])}
                            className="hidden"
                            id="identity-upload"
                        />
                        <label htmlFor="identity-upload" className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-red-500/50 transition-colors">
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-400">{formData.identity_document ? formData.identity_document.name : 'Upload Document'}</span>
                        </label>
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-bold text-white">Proof of Address</h3>
                    </div>
                    <Select value={formData.proof_of_address_type} onValueChange={(val) => setFormData({ ...formData, proof_of_address_type: val })}>
                        <SelectTrigger className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 text-white mb-3 h-12 hover:border-cyan-400 transition-all shadow-lg">
                            <SelectValue placeholder="📋 Select document type *" className="text-white font-semibold" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-cyan-500/30">
                            <SelectItem value="bank_statement" className="text-white hover:bg-cyan-500/20">Bank Statement</SelectItem>
                            <SelectItem value="tax_document" className="text-white hover:bg-cyan-500/20">Tax Document</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileChange('proof_of_address', e.target.files[0])}
                            className="hidden"
                            id="address-upload"
                        />
                        <label htmlFor="address-upload" className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-red-500/50 transition-colors">
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-400">{formData.proof_of_address ? formData.proof_of_address.name : 'Upload Document'}</span>
                        </label>
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-bold text-white">Selfie Photo</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">Upload a selfie holding your identity document</p>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange('selfie_photo', e.target.files[0])}
                            className="hidden"
                            id="selfie-upload"
                        />
                        <label htmlFor="selfie-upload" className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-red-500/50 transition-colors">
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-400">{formData.selfie_photo ? formData.selfie_photo.name : 'Upload Selfie'}</span>
                        </label>
                    </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <p className="text-cyan-400 text-xs leading-relaxed">
                        <strong>Privacy Notice:</strong> We do not share your personal details with third parties.
                        The company reserves the right to share information only under an official court request.
                    </p>
                </div>

                <Button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-bold"
                >
                    {uploading ? 'Uploading...' : 'Submit for Verification'}
                </Button>
            </form>
        </div>
    );
}