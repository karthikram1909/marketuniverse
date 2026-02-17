import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, X } from 'lucide-react';

const EMOJI_GROUPS = {
    'Smileys': '😂 😄 😍 🥰 😂 😅 😆 😊 😌 😍 🤣 😇 😂 😋',
    'Hand Gestures': '👍 👎 👋 🙌 🤝 ✋ 🖐️ ✌️ 🤟 👏 🙏 💪 👊 ✊',
    'Hearts & Love': '❤️ 🧡 💛 💚 💙 💜 🖤 💔 💕 💞 💓 💗 💝 💖',
    'Fire & Celebration': '🔥 ⭐ ✨ 🎉 🎊 🎈 🎁 🏆 🥇 🥈 🥉 🎯 💯 🌟',
    'Food & Drink': '😋 🍕 🍔 🍟 🍗 🍖 🌮 🍜 🍱 🍛 🍝 🍰 🎂 ☕',
    'Nature & Weather': '🌸 🌺 🌻 🌷 🌹 🍀 ☀️ 🌙 ⭐ 🌈 ❄️ 🔥 💧 🌊',
    'Objects': '🎮 🎸 🎹 🎤 🎧 📱 💻 ⌚ 📷 📺 🎬 📚 📝 ✏️',
    'Numbers': '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟'
};

export default function EmojiPicker({ onSelect, onClose }) {
    const [activeGroup, setActiveGroup] = useState('Smileys');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed bottom-24 right-80 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-4 w-80 shadow-2xl z-[200] backdrop-blur-xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Emojis</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Group Tabs */}
            <div className="flex gap-2 mb-4 pb-4 border-b border-white/10 overflow-x-auto scrollbar-hide">
                {Object.keys(EMOJI_GROUPS).map((group) => (
                    <button
                        key={group}
                        onClick={() => setActiveGroup(group)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                            activeGroup === group
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'text-gray-400 hover:bg-white/5'
                        }`}
                    >
                        {group}
                    </button>
                ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {EMOJI_GROUPS[activeGroup]?.split(' ').filter(e => e).map((emoji, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            onSelect(emoji);
                            onClose();
                        }}
                        className="text-lg hover:bg-white/10 rounded-lg p-2 transition hover:scale-110 text-center"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}