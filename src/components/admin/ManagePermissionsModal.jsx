import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Lock, Unlock, Shield, Check, X } from 'lucide-react';

export default function ManagePermissionsModal({ profile, isOpen, onClose }) {
     const queryClient = useQueryClient();
     const [permissions, setPermissions] = useState({});
     const [saveError, setSaveError] = useState(null);

     // Fetch all rooms
     const { data: rooms = [] } = useQuery({
         queryKey: ['allChatRooms'],
         queryFn: () => base44.entities.ChatRoom.filter({})
     });

     // Fetch user's current permissions (using user_id from profile)
     const { data: userPermissions = [] } = useQuery({
         queryKey: ['userPermissions', profile?.id],
         queryFn: async () => {
             // Guard: user_id is required
             if (!profile?.id) {
                 throw new Error('User ID is required to fetch permissions');
             }
             return await base44.entities.ChatUserPermission.filter({
                 user_id: profile.id
             });
         },
         enabled: !!profile?.id && isOpen
     });

    // Initialize permissions state when data loads
    React.useEffect(() => {
        if (userPermissions.length > 0) {
            const permMap = {};
            userPermissions.forEach(perm => {
                permMap[perm.room_id] = {
                    is_authorized: perm.is_authorized,
                    permission_level: perm.permission_level,
                    id: perm.id
                };
            });
            setPermissions(permMap);
        }
    }, [userPermissions]);

    // Save permissions mutation
    const savePermissionsMutation = useMutation({
        mutationFn: async (permData) => {
            // Guard: user_id is required
            if (!profile?.id) {
                throw new Error('User ID is missing. Cannot save permissions.');
            }

            const promises = [];

            for (const room of rooms) {
                const existingPerm = userPermissions.find(p => p.room_id === room.id);
                const newPerm = permData[room.id];

                if (existingPerm && newPerm) {
                    // Update existing permission
                    promises.push(
                        base44.entities.ChatUserPermission.update(existingPerm.id, {
                            is_authorized: newPerm.is_authorized,
                            permission_level: newPerm.permission_level
                        })
                    );
                } else if (newPerm && newPerm.is_authorized) {
                    // Create new permission - user_id is primary identifier
                    promises.push(
                        base44.entities.ChatUserPermission.create({
                            user_id: profile.id,
                            room_id: room.id,
                            is_authorized: newPerm.is_authorized,
                            permission_level: newPerm.permission_level
                        })
                    );
                } else if (existingPerm && !newPerm?.is_authorized) {
                    // Delete permission if user is denied access
                    promises.push(
                        base44.entities.ChatUserPermission.delete(existingPerm.id)
                    );
                }
            }

            await Promise.all(promises);
        },
        onSuccess: () => {
            setSaveError(null);
            // Invalidate cache with user_id key
            queryClient.invalidateQueries({ queryKey: ['userPermissions', profile?.id] });
            onClose();
        },
        onError: (error) => {
            setSaveError(error.message || 'Failed to save permissions');
            console.error('Permission save error:', error);
        }
    });

    const toggleAuthorization = (roomId) => {
        setPermissions(prev => ({
            ...prev,
            [roomId]: {
                ...prev[roomId],
                is_authorized: !prev[roomId]?.is_authorized,
                permission_level: prev[roomId]?.permission_level || 'read_write'
            }
        }));
    };

    const setPermissionLevel = (roomId, level) => {
        setPermissions(prev => ({
            ...prev,
            [roomId]: {
                ...prev[roomId],
                is_authorized: prev[roomId]?.is_authorized !== false,
                permission_level: level
            }
        }));
    };

    const handleSave = () => {
        setSaveError(null);
        savePermissionsMutation.mutate(permissions);
    };

    // Group rooms by category
    const roomsByCategory = rooms.reduce((acc, room) => {
        if (!acc[room.category]) acc[room.category] = [];
        acc[room.category].push(room);
        return acc;
    }, {});

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] bg-gradient-to-br from-black via-purple-950/20 to-black border border-purple-500/30 text-white overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-6 h-6 text-purple-400" />
                        Manage Permissions - {profile?.username}
                    </DialogTitle>
                    <p className="text-sm text-gray-400 mt-2">
                        Control channel access and permissions for this user
                    </p>
                </DialogHeader>

                {saveError && (
                    <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-4 text-red-200 text-sm">
                        ⚠️ {saveError}
                    </div>
                )}

                <div className="space-y-6 mt-4">
                    {Object.entries(roomsByCategory).map(([category, categoryRooms]) => (
                        <div key={category} className="space-y-3">
                            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider px-2">
                                {category}
                            </h3>
                            
                            <div className="space-y-2">
                                {categoryRooms.map(room => {
                                    const perm = permissions[room.id] || { is_authorized: false, permission_level: 'read_write' };
                                    
                                    return (
                                        <motion.div
                                            key={room.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`bg-white/5 border rounded-lg p-4 transition-all ${
                                                perm.is_authorized 
                                                    ? 'border-purple-500/40 bg-purple-500/10' 
                                                    : 'border-white/10'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3 flex-1">
                                                    {room.channel_avatar_url && (
                                                        <img 
                                                            src={room.channel_avatar_url} 
                                                            alt={room.name} 
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <h4 className="text-white font-semibold">
                                                            #{room.name}
                                                        </h4>
                                                        {room.description && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {room.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {/* Authorization Toggle */}
                                                    <button
                                                        onClick={() => toggleAuthorization(room.id)}
                                                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                                                            perm.is_authorized
                                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                                : 'bg-red-600/30 hover:bg-red-600/50 text-red-400 border border-red-500/50'
                                                        }`}
                                                    >
                                                        {perm.is_authorized ? (
                                                            <>
                                                                <Check className="w-4 h-4" />
                                                                Authorized
                                                            </>
                                                        ) : (
                                                            <>
                                                                <X className="w-4 h-4" />
                                                                Denied
                                                            </>
                                                        )}
                                                    </button>

                                                    {/* Permission Level Dropdown */}
                                                    {perm.is_authorized && (
                                                        <select
                                                            value={perm.permission_level}
                                                            onChange={(e) => setPermissionLevel(room.id, e.target.value)}
                                                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        >
                                                            <option value="read_only" className="bg-gray-900">
                                                                🔒 Read Only
                                                            </option>
                                                            <option value="read_write" className="bg-gray-900">
                                                                ✍️ Read & Write
                                                            </option>
                                                            <option value="moderator" className="bg-gray-900">
                                                                👑 Moderator
                                                            </option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Permission Description */}
                                            {perm.is_authorized && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <p className="text-xs text-gray-400">
                                                        {perm.permission_level === 'read_only' && (
                                                            <span>👀 Can view messages but cannot send messages</span>
                                                        )}
                                                        {perm.permission_level === 'read_write' && (
                                                            <span>✍️ Can view and send messages</span>
                                                        )}
                                                        {perm.permission_level === 'moderator' && (
                                                            <span>👑 Can view, send, and delete messages in this channel</span>
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        disabled={savePermissionsMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={savePermissionsMutation.isPending || !profile?.id}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white disabled:opacity-50"
                    >
                        {savePermissionsMutation.isPending ? '💾 Saving...' : '✓ Save Permissions'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}