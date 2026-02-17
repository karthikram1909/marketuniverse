import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function AdminNotificationsPanel() {
    const queryClient = useQueryClient();
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['adminNotifications'],
        queryFn: async () => {
            const notifs = await base44.entities.Notification.filter({
                is_admin: true
            }, '-created_date', 1000);
            console.log('📬 Fetched admin notifications:', notifs.length);
            return notifs;
        },
        refetchInterval: 10000,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
        onSuccess: () => queryClient.invalidateQueries(['adminNotifications'])
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Notification.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['adminNotifications'])
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('markAllNotificationsRead');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminNotifications']);
            queryClient.invalidateQueries(['unreadAdminNotifications']);
        }
    });

    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            // Fetch all admin notifications
            const allNotifs = await base44.entities.Notification.filter({ is_admin: true });
            
            // Delete each one
            for (const notif of allNotifs) {
                await base44.entities.Notification.delete(notif.id);
            }
            
            return { deleted: allNotifs.length };
        },
        onSuccess: () => {
            toast.success('All notifications deleted');
            queryClient.invalidateQueries(['adminNotifications']);
            queryClient.invalidateQueries(['unreadAdminNotifications']);
            setShowDeleteModal(false);
        }
    });

    if (isLoading) {
        return <div className="text-white">Loading notifications...</div>;
    }

    return (
        <div className="space-y-4">
            {notifications.length > 0 && (
                <div className="flex gap-2 justify-end">
                    <Button
                        size="sm"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending || notifications.every(n => n.read)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        {markAllAsReadMutation.isPending ? 'Marking...' : `Mark All Read (${notifications.filter(n => !n.read).length})`}
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
            )}
            {notifications.length === 0 ? (
                <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No admin notifications</p>
                </div>
            ) : (
                notifications.map((notif, idx) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative bg-gradient-to-br from-red-500/5 via-black/40 to-orange-500/5 backdrop-blur-xl border rounded-2xl p-6 ${
                            notif.read ? 'border-white/10' : 'border-red-500/30'
                        }`}
                    >
                        {!notif.read && (
                            <div className="absolute top-3 right-3 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                        )}
                        <h3 className="text-white font-bold text-lg mb-2">{notif.title}</h3>
                        <p className="text-gray-300 text-sm mb-3">{notif.message}</p>
                        {notif.amount && (
                            <p className="text-green-400 font-bold mb-3">${notif.amount.toFixed(2)} USDT</p>
                        )}
                        {notif.wallet_address && (
                            <p className="text-gray-400 text-xs mb-3 font-mono">
                                Wallet: {notif.wallet_address.slice(0, 10)}...{notif.wallet_address.slice(-8)}
                            </p>
                        )}
                        <div className="flex gap-2 text-xs text-gray-400 mb-4">
                            {new Date(notif.created_date).toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                            {!notif.read && (
                                <Button
                                    size="sm"
                                    onClick={() => markAsReadMutation.mutate(notif.id)}
                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-0"
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