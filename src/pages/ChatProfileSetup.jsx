import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, CheckCircle2, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatProfileSetup() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        avatar_url: '',
        bio: ''
    });
    const [usernameError, setUsernameError] = useState('');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [profileChecked, setProfileChecked] = useState(false);
    const [profileExists, setProfileExists] = useState(false);
    const [isApproved, setIsApproved] = useState(null);  // NEW: track approval status

    const isProfileLocked = profileChecked && profileExists;

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();

                if (!currentUser) {
                    navigate('/');
                    return;
                }

                // Get wallet address from profile if possible
                const { data: profile } = await supabase.from('profiles').select('withdrawal_wallet_address').eq('id', currentUser.id).maybeSingle();
                const userWithWallet = { ...currentUser, wallet_address: profile?.withdrawal_wallet_address };

                setUser(userWithWallet);

                // Check if profile already exists by email (canonical identity)
                const { data: profiles, error } = await supabase.from('chat_profiles').select('*').eq('email', currentUser.email.toLowerCase());

                if (error) {
                    console.error('Error checking profile:', error);
                }

                if (profiles && profiles.length > 0) {
                    setProfileExists(true);
                    setProfileChecked(true);

                    const profile = profiles[0];
                    setIsApproved(profile.is_approved === true);

                    // HARD GATE: Only redirect if APPROVED
                    if (profile.is_approved === true) {
                        navigate('/Chat', { replace: true });
                        return; // Prevent further execution
                    }
                    // If unapproved, stay on this page and show pending screen
                } else {
                    setProfileExists(false);
                    setProfileChecked(true);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, [navigate]);

    const checkUsernameAvailability = async (username) => {
        if (!username || username.length < 3) {
            setUsernameError('Username must be at least 3 characters');
            return false;
        }

        try {
            const { count, error } = await supabase
                .from('chat_profiles')
                .select('username', { count: 'exact', head: true })
                .eq('username', username.toLowerCase());

            if (error) throw error;

            if (count > 0) {
                setUsernameError('Username already taken');
                return false;
            }

            setUsernameError('');
            return true;
        } catch (err) {
            console.error('Username check failed:', err);
            return false;
        }
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, username: value });
        if (value) {
            checkUsernameAvailability(value);
        } else {
            setUsernameError('');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarPreview(e.target?.result);
        };
        reader.readAsDataURL(file);

        // Upload file
        setIsUploadingAvatar(true);
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
        } catch (err) {
            console.error('Avatar upload failed:', err);
            setError('Failed to upload avatar');
            setAvatarPreview(null);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const removeAvatar = () => {
        setFormData({ ...formData, avatar_url: '' });
        setAvatarPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (profileChecked && profileExists) {
            setError('Chat profile already exists');
            return;
        }

        if (!formData.username.trim()) {
            setError('Username is required');
            return;
        }

        if (!await checkUsernameAvailability(formData.username)) {
            return;
        }

        // Guard: Check if email already has a profile (prevents unique constraint error)
        try {
            const { count } = await supabase
                .from('chat_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('email', user.email.toLowerCase());

            if (count > 0) {
                navigate('/Chat');
                return;
            }
        } catch (err) {
            console.error('Email check failed:', err);
        }

        setIsSubmitting(true);

        try {
            // Use user.id as seed fallback if wallet is missing
            const avatarSeed = user.wallet_address || user.id;

            const { error: createError } = await supabase
                .from('chat_profiles')
                .insert({
                    user_id: user.id,
                    email: user.email.toLowerCase(),
                    wallet_address: user.wallet_address ? user.wallet_address.toLowerCase() : null,
                    username: formData.username.toLowerCase(),
                    avatar_url: formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
                    bio: formData.bio || '',
                    status: 'offline',
                    is_approved: user.role === 'admin' ? true : false,
                    is_blocked: false
                });

            if (createError) throw createError;

            navigate('/Chat?just_created=true'); // Signal to Chat that profile was just created
        } catch (err) {
            console.error('Profile creation failed:', err);
            if (err.message?.toLowerCase().includes('username') || err.message?.toLowerCase().includes('unique')) {
                setUsernameError('Username already taken');
                setError('Username already taken');
            } else {
                setError('Failed to create profile');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // HARD GUARD: If profile is APPROVED, do NOT render form (redirect already happened in useEffect)
    if (profileChecked && profileExists && isApproved === true) {
        return null;  // Approved users are already redirected, don't render anything
    }

    // If profile exists but NOT approved, show pending screen instead of form
    if (profileChecked && profileExists && isApproved === false) {
        // Fetch profile to check blocked status (it was already loaded in useEffect)
        // For now, we can infer from isApproved === false that profile exists
        // We'll get block status from next API call or show generic pending message

        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-8 h-8 text-amber-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                Profile Pending Approval
                            </h1>
                            <p className="text-gray-400 mb-4">
                                Your chat profile has been submitted and is awaiting admin review.
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                You will be notified via email once your profile is approved and you can access the chat.
                            </p>
                            <Button
                                onClick={() => navigate('/')}
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
                            >
                                ← Return to Home
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Create Chat Profile</h1>
                        <p className="text-gray-400 text-sm">Set up your chat identity to join the community</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </motion.div>
                    )}

                    {/* Profile Locked Message */}
                    {isProfileLocked && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            <p className="text-sm text-amber-400">Your chat profile is under review. Editing is disabled until approval.</p>
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Username
                            </label>
                            <Input
                                type="text"
                                placeholder="Choose your chat username"
                                value={formData.username}
                                onChange={handleUsernameChange}
                                disabled={isSubmitting || isProfileLocked}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            />
                            {usernameError && (
                                <p className="text-xs text-red-400 mt-1">{usernameError}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">3+ characters, unique across the platform</p>
                        </div>

                        {/* Avatar Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Avatar (optional)
                            </label>
                            {avatarPreview ? (
                                <div className="relative mb-3">
                                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-40 object-cover rounded-lg" />
                                    <button
                                        type="button"
                                        onClick={removeAvatar}
                                        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            ) : null}
                            <label className="block border-2 border-dashed border-white/20 hover:border-white/40 rounded-lg p-4 text-center cursor-pointer transition">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={isSubmitting || isUploadingAvatar || isProfileLocked}
                                    className="hidden"
                                />
                                <Upload className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-400">
                                    {isUploadingAvatar ? 'Uploading...' : 'Click to upload image'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                            </label>
                            <p className="text-xs text-gray-500 mt-1">Leave blank for default avatar</p>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Bio (optional)
                            </label>
                            <Textarea
                                placeholder="Tell us about yourself"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                disabled={isSubmitting || isProfileLocked}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-20"
                            />
                            <p className="text-xs text-gray-500 mt-1">Max 200 characters</p>
                        </div>

                        {/* User ID / Wallet Display */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                {user.wallet_address ? 'Wallet Address' : 'User ID'}
                            </label>
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-gray-300 text-sm font-mono break-all">
                                {user.wallet_address || `user-${user.id.slice(0, 8)}`}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {user.wallet_address ? 'This cannot be changed' : 'Connect wallet later in settings'}
                            </p>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isSubmitting || !formData.username.trim() || usernameError || isProfileLocked}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating Profile...
                                </>
                            ) : (
                                'Create Chat Profile'
                            )}
                        </motion.button>
                    </form>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300">
                            <strong>Note:</strong> Your profile will need admin approval before you can fully participate in the chat. You'll be notified when approved.
                        </p>
                    </div>
                </div>
            </motion.div>


        </div>
    );
}