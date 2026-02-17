import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Reply, X, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';
import DeleteMessageModal from './DeleteMessageModal';

export default function SupportMessagesPanel() {
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [messageToDelete, setMessageToDelete] = useState(null);
    const queryClient = useQueryClient();

    const { data: messages = [], isLoading, error } = useQuery({
        queryKey: ['supportMessages', statusFilter],
        queryFn: async () => {
            try {
                // Fetch all messages - RLS is open for SupportMessage entity
                const allMessages = await base44.entities.SupportMessage.list('-created_date', 100);
                console.log('Fetched messages:', allMessages);
                if (statusFilter === 'all') return allMessages;
                return allMessages.filter(msg => msg.status === statusFilter);
            } catch (err) {
                console.error('Error fetching messages:', err);
                throw err;
            }
        },
        staleTime: 30000,
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
        retry: 2
    });

    const replyMutation = useMutation({
        mutationFn: async ({ message, reply }) => {
            // Update the support message
            await base44.entities.SupportMessage.update(message.id, {
                admin_reply: reply,
                status: 'replied',
                replied_date: new Date().toISOString()
            });
            
            // Create notifications for user and admin
            const notificationData = {
                type: 'support_reply',
                title: `Re: ${message.subject}`,
                message: reply,
                read: false
            };
            
            if (message.wallet_address) {
                notificationData.wallet_address = message.wallet_address;
            }
            if (message.email) {
                notificationData.email = message.email;
            }
            
            await Promise.all([
                base44.entities.Notification.create(notificationData),
                base44.entities.Notification.create({
                    email: message.email,
                    type: 'trade_completed',
                    title: 'Support Reply Sent',
                    message: `You replied to ${message.name}'s message about "${message.subject}"`,
                    read: false,
                    is_admin: true
                })
            ]);
            
            // Send email to user
            try {
                await base44.integrations.Core.SendEmail({
                    to: message.email,
                    subject: `Re: ${message.subject}`,
                    body: `Hello ${message.name},\n\nThank you for contacting MarketsUniverse support.\n\n${reply}\n\nBest regards,\nMarketsUniverse Team`
                });
                return { emailSent: true };
            } catch (emailError) {
                console.error('Email send error:', emailError);
                return { emailSent: false, error: emailError.message };
            }
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['supportMessages'] });
            if (result.emailSent) {
                toast.success('Reply sent and email delivered successfully!');
            } else {
                toast.warning(`Reply saved but email failed: ${result.error}`);
            }
            setSelectedMessage(null);
            setReplyText('');
        },
        onError: (error) => {
            toast.error(`Failed to send reply: ${error.message}`);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            await base44.entities.SupportMessage.update(id, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportMessages'] });
            toast.success('Status updated');
        }
    });

    const deleteMessageMutation = useMutation({
        mutationFn: async (id) => {
            await base44.entities.SupportMessage.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supportMessages'] });
            toast.success('Message deleted');
            setMessageToDelete(null);
        }
    });

    const statusColors = {
        pending: { badge: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
        replied: { badge: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
        closed: { badge: 'bg-gray-500/20 text-gray-400', icon: XCircle }
    };

    const pendingCount = messages.filter(m => m.status === 'pending').length;

    return (
        <div className="bg-[#0f1420] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">Support Messages</h2>
                    {pendingCount > 0 && (
                        <Badge className="bg-red-500 text-white">{pendingCount} pending</Badge>
                    )}
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'replied', 'closed'].map(status => (
                        <Button
                            key={status}
                            size="sm"
                            variant={statusFilter === status ? 'default' : 'outline'}
                            onClick={() => setStatusFilter(status)}
                            className={statusFilter === status ? 'bg-purple-500 text-white' : 'border-white/10 text-gray-400'}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="text-center text-gray-400 py-8">Loading messages...</div>
            ) : error ? (
                <div className="text-center text-red-400 py-8">
                    Error loading messages: {error.message}
                    <br />
                    <Button 
                        size="sm" 
                        onClick={() => queryClient.invalidateQueries(['supportMessages'])}
                        className="mt-2 bg-purple-500"
                    >
                        Retry
                    </Button>
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No support messages yet</div>
            ) : (
                <div className="space-y-3">
                    {messages.map(message => {
                        const StatusIcon = statusColors[message.status].icon;
                        return (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-white font-semibold">{message.subject}</h3>
                                            <Badge className={statusColors[message.status].badge}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {message.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            <span className="font-medium">{message.name}</span> · {message.email}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {moment(message.created_date).format('MMM D, YYYY h:mm A')}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {message.status !== 'closed' && (
                                            <Button
                                                size="sm"
                                                onClick={() => setSelectedMessage(message)}
                                                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                                            >
                                                <Reply className="w-4 h-4 mr-1" />
                                                Reply
                                            </Button>
                                        )}
                                        {message.status !== 'closed' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateStatusMutation.mutate({ id: message.id, status: 'closed' })}
                                                className="border-white/10 text-gray-400"
                                            >
                                                Close
                                            </Button>
                                        )}
                                        {message.admin_reply && (
                                            <Button
                                                size="sm"
                                                onClick={() => setMessageToDelete(message)}
                                                disabled={deleteMessageMutation.isPending}
                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm mb-3">{message.message}</p>
                                {message.admin_reply && (
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-3">
                                        <div className="text-xs text-purple-400 font-semibold mb-1">Your Reply:</div>
                                        <p className="text-sm text-gray-300">{message.admin_reply}</p>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {moment(message.replied_date).format('MMM D, YYYY h:mm A')}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Reply Modal - Rendered via Portal */}
            {selectedMessage && createPortal(
                <AnimatePresence>
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]"
                            onClick={() => setSelectedMessage(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 flex items-center justify-center z-[10000] p-6 pointer-events-none"
                        >
                            <div className="bg-[#0f1420] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">Reply to Support Message</h3>
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">From:</div>
                                        <div className="text-white">{selectedMessage.name} ({selectedMessage.email})</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">Subject:</div>
                                        <div className="text-white">{selectedMessage.subject}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">Message:</div>
                                        <div className="text-gray-300 bg-white/5 p-3 rounded-lg">{selectedMessage.message}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Textarea
                                        placeholder="Type your reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        rows={6}
                                        className="bg-white/5 border-white/10 text-white resize-none"
                                    />
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => replyMutation.mutate({ message: selectedMessage, reply: replyText })}
                                            disabled={!replyText.trim() || replyMutation.isPending}
                                            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                                        >
                                            <Reply className="w-4 h-4 mr-2" />
                                            {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedMessage(null)}
                                            className="border-white/10 text-gray-400"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                </AnimatePresence>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            <DeleteMessageModal
                isOpen={!!messageToDelete}
                onClose={() => setMessageToDelete(null)}
                onConfirm={() => deleteMessageMutation.mutate(messageToDelete.id)}
                isLoading={deleteMessageMutation.isPending}
            />
        </div>
    );
}