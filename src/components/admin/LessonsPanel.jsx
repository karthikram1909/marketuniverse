import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, ExternalLink, Clock, CheckCircle2, X, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';

export default function LessonsPanel() {
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [notes, setNotes] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const queryClient = useQueryClient();

    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['lessonBookings', statusFilter],
        queryFn: async () => {
            let query = supabase.from('lesson_bookings').select('*').order('created_at', { ascending: false }).limit(100);
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        staleTime: 300000,
        refetchOnWindowFocus: false
    });

    const { data: settings } = useQuery({
        queryKey: ['lessonSettings'],
        queryFn: async () => {
            const { data, error } = await supabase.from('lesson_settings').select('*');
            if (error) throw error;
            return data?.[0] || { purchases_locked: false };
        },
        staleTime: 300000,
        refetchOnWindowFocus: false
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, notes, booking }) => {
            const { error } = await supabase.from('lesson_bookings').update({ status, notes }).eq('id', id);
            if (error) throw error;

            // Send notification to user if notes are provided
            if (notes && notes.trim()) {
                const { error: notifError } = await supabase.from('notifications').insert({
                    wallet_address: booking.wallet_address,
                    email: booking.email,
                    type: 'support_reply',
                    title: 'Lesson Booking Update',
                    message: notes,
                    read: false
                });
                if (notifError) throw notifError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lessonBookings'] });
            toast.success('Booking status updated');
            setSelectedBooking(null);
            setNotes('');
        }
    });

    const toggleLockMutation = useMutation({
        mutationFn: async (locked) => {
            if (settings?.id) {
                const { data, error } = await supabase.from('lesson_settings').update({ purchases_locked: locked }).eq('id', settings.id);
                if (error) throw error;
                return data;
            } else {
                const { data, error } = await supabase.from('lesson_settings').insert({ purchases_locked: locked });
                if (error) throw error;
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lessonSettings'] });
            toast.success('Lesson purchase settings updated');
        }
    });

    const packageNames = {
        '4_strategies': '4 Strategies Package',
        'elliot_fibonacci': 'Elliot Waves & Fibonacci',
        'full_personal': 'Full Trading Lesson & Personal Coaching'
    };

    const statusColors = {
        pending: { badge: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
        confirmed: { badge: 'bg-blue-500/20 text-blue-400', icon: CheckCircle2 },
        completed: { badge: 'bg-green-500/20 text-green-400', icon: CheckCircle2 }
    };

    const pendingCount = bookings.filter(b => b.status === 'pending').length;

    const purchasesLocked = settings?.purchases_locked || false;

    return (
        <div className="bg-[#0f1420] rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <GraduationCap className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">Lesson Bookings</h2>
                    {pendingCount > 0 && (
                        <Badge className="bg-yellow-500 text-white">{pendingCount} pending</Badge>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => toggleLockMutation.mutate(!purchasesLocked)}
                        disabled={toggleLockMutation.isPending}
                        className={`${purchasesLocked
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50'
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/50'
                            } border`}
                    >
                        {purchasesLocked ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                        {purchasesLocked ? 'Locked' : 'Open'}
                    </Button>
                    {['all', 'pending', 'confirmed', 'completed'].map(status => (
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
                <div className="text-center text-gray-400 py-8">Loading bookings...</div>
            ) : bookings.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No lesson bookings yet</div>
            ) : (
                <div className="space-y-3">
                    {bookings.map(booking => {
                        const StatusIcon = statusColors[booking.status].icon;
                        return (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-white font-semibold">{packageNames[booking.package_type]}</h3>
                                            <Badge className={statusColors[booking.status].badge}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {booking.status}
                                            </Badge>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-400">User: </span>
                                                <span className="text-white font-medium">{booking.full_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Email: </span>
                                                <span className="text-white">{booking.email || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Wallet: </span>
                                                <span className="text-white font-mono text-xs">
                                                    {booking.wallet_address.slice(0, 8)}...{booking.wallet_address.slice(-6)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Amount: </span>
                                                <span className="text-green-400 font-bold">${booking.amount_paid} USDT</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                            <span className="mr-3">
                                                Booked: {moment(booking.created_date).format('MMM D, YYYY h:mm A')}
                                            </span>
                                            {booking.tx_hash && (
                                                <a
                                                    href={`https://bscscan.com/tx/${booking.tx_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                                                >
                                                    View TX <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                        {booking.notes && (
                                            <div className="mt-3 bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                                                <div className="text-xs text-purple-400 font-semibold mb-1">Notes:</div>
                                                <p className="text-sm text-gray-300">{booking.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {booking.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setNotes(booking.notes || '');
                                                }}
                                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                                            >
                                                Process
                                            </Button>
                                        )}
                                        {booking.status === 'confirmed' && (
                                            <Button
                                                size="sm"
                                                onClick={() => updateStatusMutation.mutate({
                                                    id: booking.id,
                                                    status: 'completed',
                                                    notes: booking.notes
                                                })}
                                                className="bg-green-500/20 hover:bg-green-500/30 text-green-400"
                                            >
                                                Complete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Process Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setSelectedBooking(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-6"
                        >
                            <div className="bg-[#0f1420] border border-white/10 rounded-2xl p-6 max-w-2xl w-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">Process Lesson Booking</h3>
                                    <button
                                        onClick={() => setSelectedBooking(null)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">Package:</div>
                                        <div className="text-white font-bold">{packageNames[selectedBooking.package_type]}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">User:</div>
                                        <div className="text-white">{selectedBooking.full_name} ({selectedBooking.email})</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 mb-1">Amount Paid:</div>
                                        <div className="text-green-400 font-bold">${selectedBooking.amount_paid} USDT</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Textarea
                                        placeholder="Add notes (optional)..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={4}
                                        className="bg-white/5 border-white/10 text-white resize-none"
                                    />
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => updateStatusMutation.mutate({
                                                id: selectedBooking.id,
                                                status: 'confirmed',
                                                notes,
                                                booking: selectedBooking
                                            })}
                                            disabled={updateStatusMutation.isPending}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            {updateStatusMutation.isPending ? 'Processing...' : 'Confirm Booking'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedBooking(null)}
                                            className="border-white/10 text-gray-400"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}