import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../wallet/WalletContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function NotificationsPanel() {
    const { account } = useWallet();
    const queryClient = useQueryClient();
    const [showMarkAllModal, setShowMarkAllModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [showReadNotifications, setShowReadNotifications] = useState(false);

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', account],
        queryFn: async () => {
            if (!account) return [];
            // Fetch all non-admin notifications (includes wallet-specific AND global notifications)
            const { data: notifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('is_admin', false)
                .order('created_at', { ascending: false })
                .limit(1000);

            // Remove duplicate news by article_url (keep newest)
            const seen = new Map();
            const uniqueNotifs = [];
            for (const notif of notifs) {
                if (notif.type === 'news_article' && notif.article_url) {
                    if (!seen.has(notif.article_url)) {
                        seen.set(notif.article_url, true);
                        uniqueNotifs.push(notif);
                    }
                } else {
                    uniqueNotifs.push(notif);
                }
            }

            return uniqueNotifs;
        },
        enabled: !!account,
        staleTime: 30000,
        refetchInterval: false,
        refetchOnWindowFocus: false
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
            if (error) throw error;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries(['notifications', account]);
            const previous = queryClient.getQueryData(['notifications', account]);
            queryClient.setQueryData(['notifications', account], (old) =>
                old?.map(n => n.id === id ? { ...n, read: true } : n) || []
            );
            return { previous };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['notifications', account], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries(['notifications']);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('notifications').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries(['notifications'])
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('mark-all-notifications-read', {
                body: { walletAddress: account.toLowerCase() }
            });
            if (error) throw error;
            return data;
        },
        onMutate: async () => {
            await queryClient.cancelQueries(['notifications', account]);
            const previous = queryClient.getQueryData(['notifications', account]);
            queryClient.setQueryData(['notifications', account], (old) =>
                old?.map(n => ({ ...n, read: true })) || []
            );
            return { previous };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['notifications', account], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries(['notifications']);
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            const ids = notifications.map(n => n.id);
            if (ids.length === 0) return;

            const { error } = await supabase.from('notifications').delete().in('id', ids);
            if (error) throw error;
        },
        onMutate: async () => {
            await queryClient.cancelQueries(['notifications', account]);
            const previous = queryClient.getQueryData(['notifications', account]);
            queryClient.setQueryData(['notifications', account], []);
            return { previous };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['notifications', account], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries(['notifications']);
        }
    });

    if (isLoading) {
        return <div className="text-white">Loading notifications...</div>;
    }

    const displayedNotifications = showReadNotifications
        ? notifications
        : notifications.filter(n => !n.read);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-4">
            {notifications.length > 0 && (
                <div className="flex gap-2 justify-between items-center">
                    <Button
                        size="sm"
                        onClick={() => setShowReadNotifications(!showReadNotifications)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                        {showReadNotifications ? 'Hide Read' : `Show All (${notifications.length})`}
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => setShowMarkAllModal(true)}
                            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            {markAllAsReadMutation.isPending ? 'Marking...' : `Mark All Read (${unreadCount})`}
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setShowDeleteAllModal(true)}
                            disabled={deleteAllMutation.isPending}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete All
                        </Button>
                    </div>
                </div>
            )}
            {displayedNotifications.length === 0 ? (
                <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">{notifications.length > 0 ? 'No unread notifications' : 'No notifications yet'}</p>
                </div>
            ) : (
                displayedNotifications.map((notif, idx) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative bg-gradient-to-br from-cyan-500/5 via-black/40 to-purple-500/5 backdrop-blur-xl border rounded-2xl p-6 ${notif.read ? 'border-white/10' : 'border-cyan-500/30'
                            }`}
                    >
                        {!notif.read && (
                            <div className="absolute top-3 right-3 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        )}
                        <h3 className="text-white font-bold text-lg mb-2">{notif.title}</h3>
                        <p className="text-gray-300 text-sm mb-3">{notif.message}</p>
                        {notif.amount && (
                            <p className="text-cyan-400 font-bold mb-3">${notif.amount.toFixed(2)} USDT</p>
                        )}
                        <div className="flex gap-2 text-xs text-gray-400 mb-4">
                            {new Date(notif.created_date || notif.created_at || Date.now()).toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                            {!notif.read && (
                                <Button
                                    size="sm"
                                    onClick={() => markAsReadMutation.mutate(notif.id)}
                                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-0"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Mark Read
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(notif.id)}
                                className="text-red-400 hover:text-red-300"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))
            )}

            {/* Mark All Read Modal */}
            <Dialog open={showMarkAllModal} onOpenChange={setShowMarkAllModal}>
                <DialogContent className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-cyan-500/50 text-white max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                <Check className="w-6 h-6 text-cyan-500" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-white">
                                Mark All as Read?
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-gray-300 leading-relaxed">
                            This will mark all <span className="text-cyan-400 font-semibold">{unreadCount} unread notifications</span> as read.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            onClick={() => setShowMarkAllModal(false)}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                markAllAsReadMutation.mutate();
                                setShowMarkAllModal(false);
                            }}
                            disabled={markAllAsReadMutation.isPending}
                            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                        >
                            {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark All Read'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete All Modal */}
            <Dialog open={showDeleteAllModal} onOpenChange={setShowDeleteAllModal}>
                <DialogContent className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-red-500/50 text-white max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-white">
                                Delete All Notifications?
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-gray-300 leading-relaxed">
                            This will permanently delete <span className="text-red-400 font-semibold">all {notifications.length} notifications</span>. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 my-4">
                        <p className="text-red-400 text-sm flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>All notification history will be permanently removed from your account.</span>
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            onClick={() => setShowDeleteAllModal(false)}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                deleteAllMutation.mutate();
                                setShowDeleteAllModal(false);
                            }}
                            disabled={deleteAllMutation.isPending}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold"
                        >
                            {deleteAllMutation.isPending ? 'Deleting...' : 'Delete All'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}