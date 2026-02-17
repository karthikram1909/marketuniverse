import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function DeleteProfileModal({ profile, isOpen, onClose, onConfirm, isDeleting }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-gradient-to-br from-black via-red-950/20 to-black border border-red-500/30 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-6 h-6" />
                        Confirm Deletion
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <p className="text-gray-300">
                        Are you sure you want to permanently delete the chat profile for:
                    </p>
                    
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <p className="text-white font-bold text-lg">{profile?.username}</p>
                        <p className="text-xs text-gray-400 break-all mt-1">
                            User ID: {profile?.id}
                        </p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-300 text-sm">
                            ⚠️ This action cannot be undone. All messages and permissions will be lost.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Profile'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}