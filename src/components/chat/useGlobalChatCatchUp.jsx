import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Global chat catch-up hook
 * Fetches missed messages for ALL rooms when app regains focus/visibility
 * Uses server created_date as ordering truth with messageStore deduplication
 */
export function useGlobalChatCatchUp({ isApproved, chatProfile, rooms, messageStore, activeReconciliationLocks = {} }) {
    // Concurrency control
    const catchUpInProgressRef = useRef(false);
    const lastCatchUpAtRef = useRef(0);

    // Telemetry (silent)
    const runsCount = useRef(0);
    const skippedByLockCount = useRef(0);
    const skippedByDebounceCount = useRef(0);

    // Use stable references for the loop
    const { mergeMessages, getLastServerCursor } = messageStore;

    useEffect(() => {
        const handleGlobalCatchUp = async () => {
            if (!isApproved || !chatProfile || !rooms || rooms.length === 0) return;

            // Lock: prevent concurrent runs
            if (catchUpInProgressRef.current) {
                skippedByLockCount.current++;
                return;
            }

            // Debounce: prevent rapid triggers within 2 seconds
            const now = Date.now();
            if (now - lastCatchUpAtRef.current < 2000) {
                skippedByDebounceCount.current++;
                return;
            }

            catchUpInProgressRef.current = true;
            lastCatchUpAtRef.current = now;
            runsCount.current++;

            try {
                // Stable room snapshot to avoid mutation during iteration
                const roomSnapshot = [...rooms];

                for (const room of roomSnapshot) {
                    // Skip rooms with active reconciliation - let reconciliation handle them
                    if (activeReconciliationLocks[room.id]) {
                        continue;
                    }

                    const cursor = getLastServerCursor(room.id);
                    // Skip catch-up if we have no cursor (room not yet loaded or empty)
                    if (!cursor) continue;

                    let query = supabase.from('chat_messages').select('*').eq('room_id', room.id).order('created_at', { ascending: true }).limit(100);

                    // Fetch messages created AFTER the cursor
                    query = query.gt('created_at', cursor.created_date);

                    const { data: catchUpMessages, error } = await query;

                    if (error) {
                        console.error(`Catch-up fetch error for room ${room.name}:`, error);
                        continue;
                    }

                    if (catchUpMessages && catchUpMessages.length > 0) {
                        mergeMessages(room.id, catchUpMessages, 'server');
                    }
                }
            } catch (err) {
                console.error("Global catch-up error:", err);
            } finally {
                catchUpInProgressRef.current = false;
            }
        };

        const handleFocus = () => {
            handleGlobalCatchUp();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleGlobalCatchUp();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initial run on mount if approved
        if (isApproved) {
            handleGlobalCatchUp();
        }

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isApproved, chatProfile, rooms, mergeMessages, getLastServerCursor, activeReconciliationLocks]);
}