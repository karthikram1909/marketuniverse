import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    description, 
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    variant = 'danger' // 'danger' or 'default'
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        {variant === 'danger' && (
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                        )}
                        <DialogTitle className="text-xl">{title}</DialogTitle>
                    </div>
                    {description && (
                        <DialogDescription className="text-gray-400 text-base">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2 mt-4 flex-col sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="border-white/10 text-white hover:bg-white/10 bg-transparent w-full sm:w-auto"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        disabled={isLoading}
                        className={`w-full sm:w-auto ${variant === 'danger' 
                            ? 'bg-red-500 hover:bg-red-600 text-white border-0' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white border-0'
                        }`}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}