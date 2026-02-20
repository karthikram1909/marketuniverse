import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Search, Copy, Check, Eye, Trash2, CheckCircle2, XCircle, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function UsersManagement({ onDeleteUser }) {
    const [viewModal, setViewModal] = useState({ isOpen: false, user: null });
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedField, setCopiedField] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 10;

    const { data: allUsers = [] } = useQuery({
        queryKey: ['allUsers'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            return data || [];
        },
        staleTime: 10000,
        refetchInterval: 30000
    });

    const { data: allAdmins = [] } = useQuery({
        queryKey: ['allAdmins'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin');
            if (error) throw error;
            return data || [];
        },
        staleTime: 10000
    });

    const { data: allKycVerifications = [] } = useQuery({
        queryKey: ['allKycVerifications'],
        queryFn: async () => {
            const { data, error } = await supabase.from('kyc_verifications').select('*');
            if (error) throw error;
            return data || [];
        },
        staleTime: 10000,
        refetchInterval: 30000
    });

    const approveKYCMutation = useMutation({
        mutationFn: async ({ userEmail, userWallet }) => {
            // Check if KYC record exists
            const { data: kycRecords, error: fetchError } = await supabase
                .from('kyc_verifications')
                .select('*')
                .or(`email.eq.${userEmail},wallet_address.eq.${userWallet?.toLowerCase() || ''}`);

            if (fetchError) throw fetchError;

            if (kycRecords && kycRecords.length > 0) {
                // Update existing KYC to approved
                const { data, error } = await supabase
                    .from('kyc_verifications')
                    .update({
                        status: 'approved',
                        admin_notes: 'Manually approved by admin',
                        reviewed_date: new Date().toISOString()
                    })
                    .eq('id', kycRecords[0].id);
                if (error) throw error;
                return data;
            } else {
                // Create new KYC record as approved
                const { data, error } = await supabase
                    .from('kyc_verifications')
                    .insert({
                        wallet_address: userWallet?.toLowerCase() || '',
                        email: userEmail,
                        identity_document_type: 'passport',
                        identity_document_url: 'manually_approved',
                        proof_of_address_type: 'bank_statement',
                        proof_of_address_url: 'manually_approved',
                        selfie_photo_url: 'manually_approved',
                        status: 'approved',
                        admin_notes: 'Manually approved by admin (documents received via email)',
                        reviewed_date: new Date().toISOString()
                    });
                if (error) throw error;
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allKycVerifications'] });
            toast.success('User KYC approved');
        },
        onError: (error) => {
            toast.error(`Failed to approve KYC: ${error.message}`);
        }
    });

    const rejectKYCMutation = useMutation({
        mutationFn: async ({ kycId }) => {
            const { data, error } = await supabase
                .from('kyc_verifications')
                .update({
                    status: 'rejected',
                    admin_notes: 'Manually rejected by admin',
                    reviewed_date: new Date().toISOString()
                })
                .eq('id', kycId);
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allKycVerifications'] });
            toast.success('User KYC rejected');
        },
        onError: (error) => {
            toast.error(`Failed to reject KYC: ${error.message}`);
        }
    });

    // Filter out admins from users list
    const regularUsers = allUsers.filter(user => {
        const isAdmin = allAdmins.some(admin =>
            admin.email?.toLowerCase() === user.email?.toLowerCase() ||
            admin.wallet_address?.toLowerCase() === user.wallet_address?.toLowerCase()
        );
        return !isAdmin;
    });

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const filteredUsers = regularUsers.filter(user => {
        const search = searchTerm.toLowerCase();
        return (
            user.email?.toLowerCase().includes(search) ||
            user.full_name?.toLowerCase().includes(search) ||
            user.wallet_address?.toLowerCase().includes(search) ||
            user.withdrawal_wallet_address?.toLowerCase().includes(search)
        );
    });

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const startIdx = (currentPage - 1) * USERS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIdx, startIdx + USERS_PER_PAGE);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-[#1f2937]/80 to-[#0f172a]/95 rounded-2xl p-6 led-glow-purple"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">All Users</h3>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold">
                        {regularUsers.length}
                    </span>
                </div>
                <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="bg-white/5 border-white/10 text-white pl-10 w-full sm:w-64"
                    />
                </div>
            </div>

            <div>
                <table className="w-full text-sm table-fixed">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-2 text-gray-400 font-semibold w-16">Avatar</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-semibold w-32">Name</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-semibold w-48">Email</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-semibold w-40">Wallet</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-semibold w-40">Withdrawal</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-semibold w-20">KYC</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-semibold w-20">Role</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-semibold w-16">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map((user, index) => {
                            const kycRecord = allKycVerifications.find(kyc =>
                                kyc.wallet_address?.toLowerCase() === user.wallet_address?.toLowerCase() ||
                                kyc.email?.toLowerCase() === user.email?.toLowerCase()
                            );

                            return (
                                <tr
                                    key={user.id}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <td className="py-3 px-2">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.full_name || 'User'}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {user.email ? user.email.slice(0, 2).toUpperCase() : '?'}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-2 text-white font-medium truncate">
                                        {user.full_name || 'N/A'}
                                    </td>
                                    <td className="py-3 px-2 text-gray-300 truncate" title={user.email}>
                                        {user.email || 'N/A'}
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-300 font-mono text-xs truncate" title={user.wallet_address}>
                                                {user.wallet_address ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : 'N/A'}
                                            </span>
                                            {user.wallet_address && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(user.wallet_address, `wallet-${user.id}`)}
                                                    className="h-5 w-5 p-0 hover:bg-white/10 flex-shrink-0"
                                                >
                                                    {copiedField === `wallet-${user.id}` ? (
                                                        <Check className="w-3 h-3 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-gray-400" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        {user.withdrawal_wallet_address ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-300 font-mono text-xs truncate" title={user.withdrawal_wallet_address}>
                                                    {user.withdrawal_wallet_address.slice(0, 6)}...{user.withdrawal_wallet_address.slice(-4)}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(user.withdrawal_wallet_address, `withdrawal-${user.id}`)}
                                                    className="h-5 w-5 p-0 hover:bg-white/10 flex-shrink-0"
                                                >
                                                    {copiedField === `withdrawal-${user.id}` ? (
                                                        <Check className="w-3 h-3 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-gray-400" />
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 text-xs">Not set</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center justify-center gap-2">
                                            {kycRecord ? (
                                                kycRecord.status === 'approved' ? (
                                                    <>
                                                        <span className="text-green-400 text-xl">✓</span>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                if (confirm('Reject this user\'s KYC?')) {
                                                                    rejectKYCMutation.mutate({ kycId: kycRecord.id });
                                                                }
                                                            }}
                                                            disabled={rejectKYCMutation.isPending}
                                                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 h-7 w-7 p-0"
                                                        >
                                                            <XCircle className="w-3 h-3" />
                                                        </Button>
                                                    </>
                                                ) : (kycRecord.status === 'pending' || kycRecord.status === 'under_review') ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm(`Approve KYC for ${user.email}?`)) {
                                                                approveKYCMutation.mutate({
                                                                    userEmail: user.email,
                                                                    userWallet: user.wallet_address
                                                                });
                                                            }
                                                        }}
                                                        disabled={approveKYCMutation.isPending}
                                                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Approve
                                                    </Button>
                                                ) : (
                                                    <span className="text-red-400 text-xl">✗</span>
                                                )
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        if (confirm(`Approve KYC for ${user.email}?\n\nThis will create a new KYC record marked as approved.`)) {
                                                            approveKYCMutation.mutate({
                                                                userEmail: user.email,
                                                                userWallet: user.wallet_address
                                                            });
                                                        }
                                                    }}
                                                    disabled={approveKYCMutation.isPending}
                                                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
                                                >
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Approve
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${user.role === 'admin'
                                            ? 'bg-[#f5c96a]/20 text-[#f5c96a]'
                                            : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm(`Promote ${user.email} to Admin?`)) {
                                                        const query = supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
                                                        query.then(({ error }) => {
                                                            if (error) {
                                                                toast.error('Failed to promote user: ' + error.message);
                                                            } else {
                                                                toast.success('User promoted to Admin');
                                                                queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                                                                queryClient.invalidateQueries({ queryKey: ['allAdmins'] });
                                                            }
                                                        });
                                                    }
                                                }}
                                                className="bg-[#f5c96a]/20 hover:bg-[#f5c96a]/30 text-[#f5c96a] border border-[#f5c96a]/50 h-7 w-7 p-0"
                                                title="Make Admin"
                                            >
                                                <Crown className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setViewModal({ isOpen: true, user })}
                                                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 h-7 w-7 p-0"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm(`Delete user ${user.email}?\n\nThis will only delete the user profile, NOT pool investments or financial data.`)) {
                                                        onDeleteUser(user.id);
                                                    }
                                                }}
                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 h-7 w-7 p-0"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No users found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <p className="text-gray-400 text-sm">
                        Showing {startIdx + 1}-{Math.min(startIdx + USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </Button>
                        <span className="text-white text-sm font-medium px-3">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            <Dialog open={viewModal.isOpen} onOpenChange={(open) => !open && setViewModal({ isOpen: false, user: null })}>
                <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                            <Users className="w-6 h-6 text-cyan-400" />
                            User Details
                        </DialogTitle>
                    </DialogHeader>
                    {viewModal.user && (
                        <div className="space-y-4">
                            {/* Avatar & Name */}
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                {viewModal.user.avatar_url ? (
                                    <img
                                        src={viewModal.user.avatar_url}
                                        alt={viewModal.user.full_name || 'User'}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                                        <span className="text-white font-medium text-xl">
                                            {viewModal.user.email ? viewModal.user.email.slice(0, 2).toUpperCase() : '?'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-white">{viewModal.user.full_name || 'N/A'}</h3>
                                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-bold ${viewModal.user.role === 'admin'
                                        ? 'bg-[#f5c96a]/20 text-[#f5c96a]'
                                        : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {viewModal.user.role || 'user'}
                                    </span>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Email</p>
                                    <p className="text-white font-medium break-all">{viewModal.user.email || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Telephone</p>
                                    <p className="text-white font-medium">{viewModal.user.telephone || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Date of Birth</p>
                                    <p className="text-white font-medium">{viewModal.user.date_of_birth || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Occupation</p>
                                    <p className="text-white font-medium">{viewModal.user.occupation || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Country</p>
                                    <p className="text-white font-medium">{viewModal.user.country || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">City</p>
                                    <p className="text-white font-medium">{viewModal.user.city || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg md:col-span-3">
                                    <p className="text-gray-400 text-xs mb-1">Address</p>
                                    <p className="text-white font-medium">{viewModal.user.address || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Wallet Addresses */}
                            <div className="space-y-3">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Wallet Address</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-mono text-sm break-all flex-1">{viewModal.user.wallet_address || 'N/A'}</p>
                                        {viewModal.user.wallet_address && (
                                            <Button
                                                size="sm"
                                                onClick={() => copyToClipboard(viewModal.user.wallet_address, 'modal-wallet')}
                                                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 h-8 w-8 p-0 flex-shrink-0"
                                            >
                                                {copiedField === 'modal-wallet' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Withdrawal Wallet Address</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-mono text-sm break-all flex-1">{viewModal.user.withdrawal_wallet_address || 'N/A'}</p>
                                        {viewModal.user.withdrawal_wallet_address && (
                                            <Button
                                                size="sm"
                                                onClick={() => copyToClipboard(viewModal.user.withdrawal_wallet_address, 'modal-withdrawal')}
                                                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 h-8 w-8 p-0 flex-shrink-0"
                                            >
                                                {copiedField === 'modal-withdrawal' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Social */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Discord</p>
                                    <p className="text-purple-400 font-medium">{viewModal.user.discord_name || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">X Profile</p>
                                    {viewModal.user.x_profile_link ? (
                                        <a
                                            href={viewModal.user.x_profile_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cyan-400 hover:text-cyan-300 font-medium break-all"
                                        >
                                            {viewModal.user.x_profile_link}
                                        </a>
                                    ) : (
                                        <p className="text-white font-medium">N/A</p>
                                    )}
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Created Date</p>
                                    <p className="text-white font-medium text-sm">{new Date(viewModal.user.created_date).toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <p className="text-gray-400 text-xs mb-1">Updated Date</p>
                                    <p className="text-white font-medium text-sm">{new Date(viewModal.user.updated_date).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}