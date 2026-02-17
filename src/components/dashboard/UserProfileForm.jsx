import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Save, Mail, Phone, Hash, ArrowLeft, Upload, X as XIcon, AlertCircle, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from '../wallet/WalletContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export default function UserProfileForm() {
    const queryClient = useQueryClient();
    const { account } = useWallet();
    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        telephone: '',
        discord_name: '',
        x_profile_link: '',
        withdrawal_wallet_address: '',
        avatar_url: '',
        country: '',
        city: '',
        address: '',
        date_of_birth: '',
        occupation: ''
    });
    const [uploading, setUploading] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            return { ...user, ...profile };
        }
    });

    useEffect(() => {
        if (user) {
            setFormData({
                display_name: user.display_name || user.user_metadata?.full_name || '',
                email: user.email || '',
                telephone: user.telephone || '',
                discord_name: user.discord_name || '',
                x_profile_link: user.x_profile_link || '',
                withdrawal_wallet_address: user.withdrawal_wallet_address || account || '',
                avatar_url: user.avatar_url || user.user_metadata?.avatar_url || '',
                country: user.country || '',
                city: user.city || '',
                address: user.address || '',
                date_of_birth: user.date_of_birth || '',
                occupation: user.occupation || ''
            });
        }
    }, [user, account]);

    // Check if profile is complete
    const isProfileComplete = () => {
        return !!(
            formData.display_name &&
            formData.email &&
            formData.telephone &&
            formData.withdrawal_wallet_address &&
            formData.country &&
            formData.city &&
            formData.address &&
            formData.date_of_birth &&
            formData.occupation
        );
    };

    const updateUserMutation = useMutation({
        mutationFn: async (data) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...data
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['currentUser']);
            toast.success('Profile updated successfully!');
        },
        onError: (error) => {
            toast.error('Failed to update profile');
            console.error(error);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Allow partial saves
        updateUserMutation.mutate(formData);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData({ ...formData, avatar_url: publicUrl });
            toast.success('Image uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload image');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setFormData({ ...formData, avatar_url: '' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 led-glow-purple"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Profile Details</h2>
                        <p className="text-gray-400 text-sm">Manage your personal information</p>
                    </div>
                </div>
                <Link to={createPageUrl('Landing')}>
                    <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home Page
                    </Button>
                </Link>
            </div>

            {!isProfileComplete() && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4"
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="text-orange-400 text-sm">
                            <p className="font-semibold mb-1">Complete Your Profile</p>
                            <p>Please fill in all required fields to comply with AML/KYC requirements and access all platform features.</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Avatar Upload Section */}
                <div className="flex items-center gap-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="relative">
                        {formData.avatar_url ? (
                            <div className="relative">
                                <img
                                    src={formData.avatar_url}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                    <XIcon className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <User className="w-10 h-10 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">Profile Picture</h3>
                        <p className="text-gray-400 text-sm mb-3">Upload a profile picture (max 5MB)</p>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm">
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Uploading...' : 'Upload Image'}
                            </span>
                        </label>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-sm mb-2 block">
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <Input
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm mb-2 block">
                            Email <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="email"
                                value={formData.email}
                                className="bg-white/10 border-white/10 text-gray-400 pl-10 cursor-not-allowed"
                                placeholder="john@example.com"
                                disabled
                                readOnly
                            />
                        </div>
                        <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-sm mb-2 block">
                            Telephone <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="tel"
                                value={formData.telephone}
                                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                className="bg-white/5 border-white/10 text-white pl-10"
                                placeholder="+1 234 567 8900"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm mb-2 block">Discord Name</label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                value={formData.discord_name}
                                onChange={(e) => setFormData({ ...formData, discord_name: e.target.value })}
                                className="bg-white/5 border-white/10 text-white pl-10"
                                placeholder="username#1234"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-gray-400 text-sm mb-2 block">X Profile Link</label>
                    <Input
                        type="url"
                        value={formData.x_profile_link}
                        onChange={(e) => setFormData({ ...formData, x_profile_link: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="https://x.com/username"
                    />
                </div>

                <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                        Withdrawal Wallet Address <span className="text-red-400">*</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.withdrawal_wallet_address}
                        onChange={(e) => setFormData({ ...formData, withdrawal_wallet_address: e.target.value })}
                        className="bg-white/10 border-white/10 text-gray-400 font-mono text-sm"
                        placeholder="Connect wallet or paste address"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                        {account
                            ? 'Auto-filled from connected wallet.'
                            : 'Connect your wallet to auto-fill or paste address manually.'}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-sm mb-2 block">
                            Country <span className="text-red-400">*</span>
                        </label>
                        <Input
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="United States"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm mb-2 block">
                            City <span className="text-red-400">*</span>
                        </label>
                        <Input
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="New York"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                        Address <span className="text-red-400">*</span>
                    </label>
                    <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="123 Main Street, Apt 4B"
                        required
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-sm mb-2 block">
                            Date of Birth <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                max={format(new Date(), 'yyyy-MM-dd')}
                                min="1900-01-01"
                                className="bg-white/5 border-white/10 text-white pl-10"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm mb-2 block">
                            Occupation <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                value={formData.occupation}
                                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                className="bg-white/5 border-white/10 text-white pl-10"
                                placeholder="Software Engineer"
                                required
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white border-0 rounded-xl"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </motion.div>
    );
}