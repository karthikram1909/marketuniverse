import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmResetModal({ isOpen, onClose, onConfirm, title, description, confirmText = "Delete", loading = false }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-[#1a1f2e] to-[#0a0f1a] border-red-500/30">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-300 text-base leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
          <p className="text-red-400 text-sm font-semibold">⚠️ Warning: This action is permanent and cannot be undone!</p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outline"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 text-white font-bold"
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}