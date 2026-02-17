import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DebugWalletModal({ isOpen, onClose, debugData }) {
    if (!debugData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-2 border-blue-500/30 text-white max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                        🔍 Debug Results
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[70vh] pr-4">
                    {/* Search Info */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                        <h3 className="text-white font-bold mb-2">🎯 Searched For:</h3>
                        <div className="space-y-1 text-sm">
                            <p className="text-gray-300">Original: <span className="text-blue-400 font-mono">{debugData.searched_for}</span></p>
                            <p className="text-gray-300">Lowercase: <span className="text-blue-400 font-mono">{debugData.searched_for_lower}</span></p>
                        </div>
                    </div>

                    {/* Data Found */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                        <h3 className="text-white font-bold mb-3">📦 Data Found for This Wallet:</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-black/30 rounded-lg p-3">
                                <p className="text-gray-400 text-sm">Pool Records</p>
                                <p className="text-green-400 text-2xl font-bold">{debugData.pool_investors_found}</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3">
                                <p className="text-gray-400 text-sm">Player Profiles</p>
                                <p className="text-green-400 text-2xl font-bold">{debugData.player_profiles_found}</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-3">
                                <p className="text-gray-400 text-sm">Game Records</p>
                                <p className={`text-2xl font-bold ${debugData.game_records_found > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {debugData.game_records_found}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* All Game Wallets */}
                    {debugData.all_game_wallets && debugData.all_game_wallets.length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                            <h3 className="text-white font-bold mb-3">🎮 ALL Wallets with Game Data ({debugData.total_games_in_db} total games):</h3>
                            <div className="space-y-2">
                                {debugData.all_game_wallets.map((wallet, idx) => (
                                    <div key={idx} className="bg-black/30 rounded-lg p-2 flex items-center gap-2">
                                        <span className="text-yellow-400 font-mono text-xs flex-1">{wallet}</span>
                                        {wallet.toLowerCase() === debugData.searched_for_lower && (
                                            <span className="text-green-400 text-xs font-bold">← THIS IS THE SEARCHED WALLET</span>
                                        )}
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(wallet);
                                            }}
                                            className="text-gray-500 hover:text-white transition-colors"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Users in Database */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                        <h3 className="text-white font-bold mb-3">👥 ALL Users in Database ({debugData.all_users.length}):</h3>
                        <div className="space-y-3">
                            {debugData.all_users.map((user, idx) => (
                                <div key={idx} className="bg-black/30 rounded-lg p-4 border border-white/10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-400">ID:</p>
                                            <p className="text-white font-mono">{user.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Email:</p>
                                            <p className="text-white">{user.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Wallet (Original):</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-cyan-400 font-mono text-xs">
                                                    {user.wallet_address || 'N/A'}
                                                </p>
                                                {user.wallet_address && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(user.wallet_address);
                                                        }}
                                                        className="text-gray-500 hover:text-white transition-colors"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Wallet (Lowercase):</p>
                                            <p className="text-yellow-400 font-mono text-xs">
                                                {user.wallet_address_lower || 'N/A'}
                                            </p>
                                        </div>
                                        {user.wallet_address !== user.wallet_address_lower && (
                                            <div className="col-span-2 bg-red-500/20 border border-red-500/50 rounded p-2">
                                                <p className="text-red-400 text-xs font-bold">
                                                    ⚠️ CASE MISMATCH! This user's wallet address has case sensitivity issues!
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={onClose} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}