import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

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
    const totalMessagesFetched = useRef(0);

    useEffect(() => {
        if (!isApproved || !chatProfile || rooms.length === 0) return;

        const handleGlobalCatchUp = async () => {
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
            
            let fetchedThisRun = 0;
            
            try {
                // Stable room snapshot to avoid mutation during iteration
                const roomSnapshot = [...rooms];
                
                for (const room of roomSnapshot) {
                     // Skip rooms with active reconciliation - let reconciliation handle them
                     if (activeReconciliationLocks[room.id]) {
                         continue;
                     }

                     const cursor = messageStore.getLastServerCursor(room.id);

                     try {
                         // INVARIANT: All fetches after a cursor use composite ordering
                         // to prevent messages with identical timestamps but higher IDs from being dropped
                         let query = { room_id: room.id };
                         if (cursor) {
                             // Fetch messages where created_date > cursor OR (created_date == cursor AND id > cursor.id)
                             query = {
                                 room_id: room.id,
                                 $or: [
                                     { created_date: { $gt: cursor.created_date } },
                                     {
                                         created_date: cursor.created_date,
                                         id: { $gt: cursor.id }
                                     }
                                 ]
                             };
                         }

                         const catchUpMessages = await base44.entities.ChatMessage.filter(
                             query,
                             'created_date',
                             100
                         );

                        if (catchUpMessages.length > 0) {
                            fetchedThisRun += catchUpMessages.length;
                            messageStore.mergeMessages(room.id, catchUpMessages, 'server');
                        }
                    } catch (err) {
                        console.error(`Catch-up failed for ${room.name}:`, err);
                    }
                }
                
                totalMessagesFetched.current += fetchedThisRun;
                if (fetchedThisRun > 0) {
                    console.log(`GlobalCatchUp: rooms=${roomSnapshot.length}, messages=${fetchedThisRun}`);
                }
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

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isApproved, chatProfile, rooms, messageStore, activeReconciliationLocks]);
}