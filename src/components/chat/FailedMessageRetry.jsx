import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * FailedMessageRetry - Shows retry UI for messages that failed to send
 * Displays error icon, message, and retry button
 */
export default function FailedMessageRetry({ message, onRetry, isRetrying = false }) {
    if (message.status !== 'failed') return null;

    return (
        <div className="bg-red-950/40 border border-red-700/60 rounded-lg px-3 py-2 mt-2 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">Failed to send. Tap to retry.</span>
            <Button
                size="sm"
                variant="ghost"
                onClick={() => onRetry(message)}
                disabled={isRetrying}
                className="h-6 px-2 text-red-300 hover:text-red-200 hover:bg-red-900/40"
            >
                {isRetrying ? (
                    <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <RotateCcw className="w-3 h-3" />
                )}
            </Button>
        </div>
    );
}