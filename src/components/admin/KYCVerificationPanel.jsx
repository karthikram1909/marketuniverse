import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Eye, Clock, FileText, Image, Shield, User, Mail, Phone, Wallet, MapPin, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function KYCVerificationPanel() {
    const queryClient = useQueryClient();
    const [selectedKYC, setSelectedKYC] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [viewImage, setViewImage] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);

    const { data: kycRequests, isLoading } = useQuery({
        queryKey: ['kyc-all'],
        queryFn: () => base44.entities.KYCVerification.list('-created_date')
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['all-users'],
        queryFn: () => base44.entities.User.list()
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, status, notes, kyc }) => {
            const updated = await base44.entities.KYCVerification.update(id, {
                status,
                admin_notes: notes,
                reviewed_date: new Date().toISOString()
            });
            
            // Create notification for user
            await base44.entities.Notification.create({
                wallet_address: kyc.wallet_address.toLowerCase(),
                email: kyc.email,
                type: 'support_reply',
                title: status === 'approved' ? 'KYC Verification Approved' : 'KYC Verification Rejected',
                message: status === 'approved' 
                    ? 'Your KYC verification has been approved. You now have full access to all platform features.' 
                    : `Your KYC verification has been rejected. Reason: ${notes}. Please resubmit with correct documents.`,
                read: false
            });
            
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kyc-all'] });
            toast.success('KYC verification updated');
            setSelectedKYC(null);
            setAdminNotes('');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return await base44.entities.KYCVerification.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kyc-all'] });
            toast.success('KYC verification deleted');
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            const allKyc = await base44.entities.KYCVerification.list();
            await Promise.all(allKyc.map(k => base44.entities.KYCVerification.delete(k.id)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kyc-all'] });
            toast.success('All KYC verifications deleted');
        }
    });

    const handleApprove = (kyc) => {
        if (confirm('Are you sure you want to approve this verification?')) {
            updateMutation.mutate({ id: kyc.id, status: 'approved', notes: adminNotes, kyc });
        }
    };

    const handleReject = (kyc) => {
        if (!adminNotes.trim()) {
            toast.error('Please provide notes for rejection');
            return;
        }
        if (confirm('Are you sure you want to reject this verification?')) {
            updateMutation.mutate({ id: kyc.id, status: 'rejected', notes: adminNotes, kyc });
        }
    };

    const handleDelete = (kyc) => {
        if (confirm('Are you sure you want to delete this verification? This action cannot be undone.')) {
            deleteMutation.mutate(kyc.id);
        }
    };

    const handleResetAll = () => {
        setShowResetModal(true);
    };
    
    const confirmResetAll = () => {
        deleteAllMutation.mutate();
        setShowResetModal(false);
    };

    const getDirectFileUrl = (fileUrl) => {
        if (!fileUrl) return null;
        
        // If it's already a Supabase storage URL, return as is
        if (fileUrl.includes('supabase.co/storage/v1/object/')) {
            return fileUrl;
        }
        
        // If it's already a full URL, return as is
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            return fileUrl;
        }
        
        // Otherwise return as is (should be a valid URL)
        return fileUrl;
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-gray-500/20 text-gray-300',
            under_review: 'bg-yellow-500/20 text-yellow-300',
            approved: 'bg-green-500/20 text-green-300',
            rejected: 'bg-red-500/20 text-red-300'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    if (isLoading) {
        return <div className="text-white">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">AML & KYC Verification</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {kycRequests?.filter(k => k.status === 'under_review').length || 0} pending reviews
                    </p>
                </div>
                <Button
                    onClick={handleResetAll}
                    disabled={deleteAllMutation.isPending}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset All KYC Data
                </Button>
            </div>

            <div className="grid gap-6">
                {kycRequests?.map((kyc) => {
                    const user = allUsers.find(u => 
                        u.wallet_address?.toLowerCase() === kyc.wallet_address?.toLowerCase() || 
                        u.email?.toLowerCase() === kyc.email?.toLowerCase()
                    );
                    
                    return (
                    <div key={kyc.id} className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 rounded-2xl p-8 border border-white/10 hover:border-cyan-500/30 transition-all led-glow-cyan">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-xl">USER INFORMATION</h3>
                                    <p className="text-gray-400 text-xs">Verification Request #{kyc.id.slice(0, 8)}</p>
                                </div>
                            </div>
                            {getStatusBadge(kyc.status)}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 text-xs mb-1 flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Full Name
                                </p>
                                <p className="text-white font-semibold">{user?.full_name || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 text-xs mb-1 flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    Email
                                </p>
                                <p className="text-white font-semibold text-sm break-all">{kyc.email || user?.email || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 text-xs mb-1 flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    Phone
                                </p>
                                <p className="text-white font-semibold">{user?.telephone || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <p className="text-gray-400 text-xs mb-1 flex items-center gap-2">
                                    <Wallet className="w-3 h-3" />
                                    Wallet
                                </p>
                                <p className="text-white font-mono text-xs break-all">
                                    {kyc.wallet_address.slice(0, 8)}...{kyc.wallet_address.slice(-6)}
                                </p>
                            </div>
                        </div>

                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
                            <p className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Location Details
                            </p>
                            <div className="grid md:grid-cols-3 gap-3">
                                <div>
                                    <p className="text-gray-400 text-xs mb-1">Country</p>
                                    <p className="text-white font-semibold">{user?.country || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs mb-1">City</p>
                                    <p className="text-white font-semibold">{user?.city || 'Not provided'}</p>
                                </div>
                                <div className="md:col-span-1">
                                    <p className="text-gray-400 text-xs mb-1">Address</p>
                                    <p className="text-white font-semibold text-sm">{user?.address || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
                            <p className="text-gray-500 text-xs flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Submitted: {new Date(kyc.created_date).toLocaleString()}
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-cyan-400" />
                                <h4 className="text-white font-bold">Submitted Documents</h4>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-xl p-5 hover:border-red-500/50 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">Identity Document</p>
                                                <p className="text-gray-400 text-xs capitalize">{kyc.identity_document_type.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => setViewImage(getDirectFileUrl(kyc.identity_document_url))}
                                        className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                </div>

                                <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/30 rounded-xl p-5 hover:border-orange-500/50 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">Proof of Address</p>
                                                <p className="text-gray-400 text-xs capitalize">{kyc.proof_of_address_type.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => setViewImage(getDirectFileUrl(kyc.proof_of_address_url))}
                                        className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/50"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-xl p-5 hover:border-purple-500/50 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <Image className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">Selfie Photo</p>
                                                <p className="text-gray-400 text-xs">With Document</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => setViewImage(getDirectFileUrl(kyc.selfie_photo_url))}
                                        className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {selectedKYC?.id === kyc.id && (
                            <div className="mt-4 space-y-3">
                                <Textarea
                                    placeholder="Admin notes (optional for approval, required for rejection)..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="bg-black/40 border-white/10 text-white"
                                    rows={3}
                                />
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => handleApprove(kyc)}
                                        disabled={updateMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Approve Manually
                                    </Button>
                                    <Button
                                        onClick={() => handleReject(kyc)}
                                        disabled={updateMutation.isPending || !adminNotes.trim()}
                                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject {!adminNotes.trim() && '(Notes Required)'}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedKYC(null);
                                            setAdminNotes('');
                                        }}
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            {(kyc.status === 'under_review' || kyc.status === 'pending') && selectedKYC?.id !== kyc.id && (
                                <Button
                                    onClick={() => {
                                        setSelectedKYC(kyc);
                                        setAdminNotes(kyc.admin_notes || '');
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                >
                                    Review / Approve Manually
                                </Button>
                            )}
                            {(kyc.status === 'approved' || kyc.status === 'rejected') && (
                                <Button
                                    onClick={() => {
                                        setSelectedKYC(kyc);
                                        setAdminNotes(kyc.admin_notes || '');
                                    }}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                                >
                                    Update Status
                                </Button>
                            )}
                            <Button
                                onClick={() => handleDelete(kyc)}
                                disabled={deleteMutation.isPending}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {kyc.admin_notes && (
                            <div className="mt-4 p-3 bg-black/30 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Admin Notes:</p>
                                <p className="text-sm text-gray-300">{kyc.admin_notes}</p>
                            </div>
                        )}
                    </div>
                    );
                    })}
                    </div>

                    {viewImage && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6" onClick={() => setViewImage(null)}>
                    <div className="max-w-6xl w-full max-h-[90vh] bg-[#1a1f2e] rounded-2xl p-6 border border-white/20 overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold">Document Preview</h3>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => window.open(viewImage, '_blank')}
                                    variant="outline"
                                    size="sm"
                                    className="text-white border-white/20"
                                >
                                    Open in New Tab
                                </Button>
                                <Button
                                    onClick={() => setViewImage(null)}
                                    variant="outline"
                                    size="sm"
                                    className="text-white border-white/20"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                        {viewImage.toLowerCase().endsWith('.pdf') ? (
                            <iframe 
                                src={viewImage} 
                                className="w-full h-[70vh] rounded-lg bg-white"
                                title="Document PDF"
                            />
                        ) : (
                            <img 
                                src={viewImage} 
                                alt="Document" 
                                className="w-full h-auto rounded-lg"
                                onError={(e) => {
                                    console.error('Image failed to load:', viewImage);
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%23fff" font-family="Arial" font-size="14" x="50%25" y="45%25" text-anchor="middle"%3EFailed to load document%3C/text%3E%3Ctext fill="%23fff" font-family="Arial" font-size="10" x="50%25" y="55%25" text-anchor="middle"%3ETry opening in new tab%3C/text%3E%3C/svg%3E';
                                }}
                            />
                        )}
                        <p className="text-xs text-gray-400 mt-4 break-all">URL: {viewImage}</p>
                    </div>
                    </div>
                    )}

                    {/* Reset Confirmation Modal */}
                    <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
                    <DialogContent className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-red-500/50 text-white max-w-md">
                    <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-white">
                            Delete All KYC Data?
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-300 leading-relaxed">
                        This will permanently delete <span className="text-red-400 font-semibold">ALL KYC verifications</span> from the system. 
                        This action cannot be undone.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 my-4">
                    <p className="text-red-400 text-sm flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>All user documents, verification statuses, and admin notes will be permanently deleted.</span>
                    </p>
                    </div>
                    <DialogFooter className="gap-2">
                    <Button
                        onClick={() => setShowResetModal(false)}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmResetAll}
                        disabled={deleteAllMutation.isPending}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        {deleteAllMutation.isPending ? 'Deleting...' : 'Delete All KYC Data'}
                    </Button>
                    </DialogFooter>
                    </DialogContent>
                    </Dialog>
                    </div>
                    );
                    }