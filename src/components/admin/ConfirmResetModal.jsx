import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function ConfirmResetModal({ isOpen, onClose, onConfirm, title, description, isLoading }) {
    const [includeWithdrawals, setIncludeWithdrawals] = useState(false);
    
    useEffect(() => {
        if (!isOpen) {
            setIncludeWithdrawals(false);
        }
    }, [isOpen]);
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-[#1a1f2e] border-red-500/30 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-red-400">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <p className="text-red-200 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-yellow-200 text-sm font-semibold mb-1">
                                ⚠️ This action cannot be undone!
                            </p>
                            <p className="text-yellow-200/80 text-sm">
                                All data will be permanently deleted from the database.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Checkbox 
                                id="includeWithdrawals" 
                                checked={includeWithdrawals}
                                onCheckedChange={setIncludeWithdrawals}
                                className="mt-0.5"
                            />
                            <div className="flex-1">
                                <Label 
                                    htmlFor="includeWithdrawals" 
                                    className="text-white font-medium cursor-pointer"
                                >
                                    Also delete paid withdrawals
                                </Label>
                                <p className="text-gray-400 text-sm mt-1">
                                    This will remove all paid withdrawal records from the "Paid to Investors" section
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl h-11"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onConfirm(includeWithdrawals)}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 rounded-xl h-11 font-semibold"
                    >
                        {isLoading ? (
                            'Deleting...'
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Yes, Delete All Data
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}