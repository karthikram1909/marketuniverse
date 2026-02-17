import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Badge } from 'lucide-react';

export default function ChatSidebar({
    rooms,
    onlineMembers,
    selectedRoomId,
    onRoomSelect,
    notifications
}) {
    // Group rooms by category
    const groupedRooms = useMemo(() => {
        const groups = {};
        rooms.forEach(room => {
            if (!groups[room.category]) {
                groups[room.category] = [];
            }
            groups[room.category].push(room);
        });
        return groups;
    }, [rooms]);

    const getUnreadCount = (roomId) => {
        const notif = notifications.find(n => n.room_id === roomId);
        return notif?.unread_count || 0;
    };

    return (
        <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col overflow-hidden">
            {/* Rooms Section */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Channels</h3>
                    <div className="space-y-1">
                        {Object.entries(groupedRooms).map(([category, categoryRooms]) => (
                            <div key={category}>
                                <p className="text-xs font-semibold text-gray-500 px-2 py-2">
                                    {category}
                                </p>
                                <div className="space-y-1">
                                    {categoryRooms.map(room => {
                                        const unreadCount = getUnreadCount(room.id);
                                        const isSelected = selectedRoomId === room.id;

                                        return (
                                            <motion.button
                                                 key={room.id}
                                                 onClick={() => onRoomSelect(room.id)}
                                                 whileHover={{ x: 4 }}
                                                 className={`w-full text-left px-3 py-2 rounded-lg transition duration-300 flex items-center justify-between ${
                                                     isSelected
                                                         ? 'bg-gradient-to-r from-pink-600/50 to-purple-600/50 text-pink-300 border border-pink-500/40 shadow-lg shadow-pink-500/20'
                                                         : 'text-gray-400 hover:bg-white/10'
                                                 }`}
                                             >
                                                 <span className="flex items-center gap-2 text-sm truncate">
                                                     {room.channel_avatar_url && (
                                                         <img src={room.channel_avatar_url} alt={room.name} className="w-4 h-4 rounded-full object-cover" />
                                                     )}
                                                     #{room.name}
                                                 </span>
                                                {unreadCount > 0 && (
                                                    <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs rounded-full shadow-lg shadow-red-500/30">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Online Members Section */}
            <div className="border-t border-pink-500/30 p-4 bg-gradient-to-t from-purple-950/40 to-transparent">
                <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-cyan-300 uppercase mb-3 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Online ({onlineMembers.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {onlineMembers.length > 0 ? (
                        onlineMembers.map(member => (
                            <motion.div
                                key={member.wallet_address}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2"
                            >
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/50 animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-300 truncate">
                                        {member.username}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500">No one online</p>
                    )}
                </div>
            </div>
        </div>
    );
}