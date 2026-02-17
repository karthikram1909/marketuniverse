import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ChatMessageStoreContext = createContext(null);

export function ChatMessageStoreProvider({ children }) {
    // Store messages by roomId: { [roomId]: [...messages] }
    const [messagesByRoom, setMessagesByRoom] = useState({});
    
    // Track previous counts to enforce monotonic growth
    const prevCountsRef = useRef({});
    
    // Track mount for debugging
    const mountCountRef = useRef(0);
    
    // Tombstone: Track deleted message IDs to prevent resurrection
    const deletedMessageIdsRef = useRef(new Set());
    
    // Track last known server cursor per room for reconnect catch-up
    // Cursor: { created_date: string, id: string }
    const lastServerCursorByRoomRef = useRef({});
    
    // Track last realtime message timestamp per room for gap detection
    const lastRealtimeReceivedAtRef = useRef({});
    
    React.useEffect(() => {
        mountCountRef.current++;
        console.log(`🏪 ChatMessageStore MOUNTED (count: ${mountCountRef.current})`);
        return () => console.log('🏪 ChatMessageStore UNMOUNTED');
    }, []);
    
    // Canonical ordering: server timestamp ascending, then by id, optimistic/failed messages last
    const sortMessagesCanonically = useCallback((messages) => {
        return [...messages].sort((a, b) => {
            // Persisted messages (with created_date) come first, ordered by timestamp
            const aIsPersisted = !!a.created_date;
            const bIsPersisted = !!b.created_date;
            
            if (aIsPersisted && bIsPersisted) {
                const dateCompare = new Date(a.created_date) - new Date(b.created_date);
                if (dateCompare !== 0) return dateCompare;
                // Same timestamp - sort by id for deterministic order
                return (a.id || '').localeCompare(b.id || '');
            }
            
            // One persisted, one not - persisted comes first
            if (aIsPersisted) return -1;
            if (bIsPersisted) return 1;
            
            // Both unpersisted - maintain client-side order (sending/failed/retrying)
            return 0;
        });
    }, []);
    
    // INVARIANT: Enforce monotonic message list (can only grow or stay same, never shrink)
    const enforceMonotonicity = useCallback((roomId, newMessages, operation) => {
        const prevCount = prevCountsRef.current[roomId] || 0;
        const newCount = newMessages.length;
        
        // Allow shrinkage ONLY for explicit delete operations
        if (newCount < prevCount && operation !== 'delete') {
            console.error(`
🚨 CRITICAL INVARIANT VIOLATION 🚨
Operation: ${operation}
Room: ${roomId}
Previous count: ${prevCount}
New count: ${newCount}
Messages LOST: ${prevCount - newCount}
Stack trace:`, new Error().stack);
            
            // BLOCK the destructive update
            return false;
        }
        
        prevCountsRef.current[roomId] = newCount;
        return true;
    }, []);
    
    // Expose messagesByRoom directly so consumers re-render on changes
    const getMessagesForRoom = useCallback((roomId) => {
        return messagesByRoom[roomId] || [];
    }, [messagesByRoom]);
    
    // Add optimistic message
    const addOptimisticMessage = useCallback((roomId, message) => {
        console.log(`➕ Store: Adding optimistic message ${message.client_message_id} to room ${roomId}`);
        setMessagesByRoom(prev => {
            const unsorted = [...(prev[roomId] || []), message];
            const updated = sortMessagesCanonically(unsorted);
            if (!enforceMonotonicity(roomId, updated, 'addOptimistic')) {
                console.error('❌ Blocked: addOptimisticMessage');
                return prev;
            }
            return { ...prev, [roomId]: updated };
        });
    }, [enforceMonotonicity, sortMessagesCanonically]);
    
    // Update message (for server confirmation)
    const updateMessage = useCallback((roomId, clientMessageId, updatedFields) => {
        console.log(`✏️ Store: Updating message ${clientMessageId} in room ${roomId}`);
        setMessagesByRoom(prev => {
            const unsorted = (prev[roomId] || []).map(msg =>
                msg.client_message_id === clientMessageId
                    ? { ...msg, ...updatedFields }
                    : msg
            );
            const updated = sortMessagesCanonically(unsorted);
            if (!enforceMonotonicity(roomId, updated, 'update')) {
                console.error('❌ Blocked: updateMessage');
                return prev;
            }
            // Log the updated message to verify created_date survival
            const updatedMsg = updated.find(m => m.client_message_id === clientMessageId);
            console.log(`✅ Message updated in store - full object:`, updatedMsg);
            return { ...prev, [roomId]: updated };
        });
    }, [enforceMonotonicity, sortMessagesCanonically]);
    
    // Merge messages (for server fetch/realtime)
     // INVARIANT: UI message list is authoritative - merges can only ADD or UPDATE, never shrink
     const mergeMessages = useCallback((roomId, newMessages, source = 'server') => {
         console.log(`🔀 Store: Merging ${newMessages.length} messages into room ${roomId} (source: ${source})`);
         setMessagesByRoom(prev => {
             const existing = prev[roomId] || [];
             
             // Filter out duplicates from batch
             const dedupedNewMessages = newMessages.filter(newMsg => {
                 if (newMsg.id && existing.some(m => m.id === newMsg.id)) {
                     console.log(`⛔ Skipping duplicate server message ${newMsg.id} (source: ${source})`);
                     return false;
                 }
                 return true;
             });
             
             // If no new messages after deduplication, skip merge
             if (dedupedNewMessages.length === 0) {
                 return prev;
             }
             
             const existingCount = existing.length;
             const merged = [...existing];

             // Normalize status: force 'sent' for server messages without explicit status
             // CRITICAL: Spread each message to create new objects (prevent mutation)
             const normalized = dedupedNewMessages.map(m => ({
                 ...m,
                 status: m.status || 'sent',
                 created_date: m.created_date
             }));

             // Track latest server cursor for reconnect catch-up
             // CRITICAL: Only track messages with REAL server timestamps
             // Ignore messages with fallback-generated timestamps to prevent cursor skips
             for (const msg of normalized) {
                 if (msg.created_date && msg.id && !msg._timestamp_is_fallback) {
                     const current = lastServerCursorByRoomRef.current[roomId];
                     if (!current || 
                         msg.created_date > current.created_date ||
                         (msg.created_date === current.created_date && msg.id > current.id)) {
                         lastServerCursorByRoomRef.current[roomId] = {
                             created_date: msg.created_date,
                             id: msg.id
                         };
                     }
                 }
             }

             // Track if any new messages were added
             let anyAdded = false;

             // Realtime messages bypass tombstone and always merge
             if (source === 'realtime') {
                 for (const newMsg of normalized) {
                     const exists = merged.some(m =>
                         (m.client_message_id && m.client_message_id === newMsg.client_message_id) ||
                         m.id === newMsg.id
                     );
                     if (!exists) {
                         merged.push(newMsg);
                         anyAdded = true;
                     }
                 }
             } else {
                 // Server messages respect tombstone filtering
                 for (const newMsg of normalized) {
                     // Block deleted messages from resurrection
                     if (deletedMessageIdsRef.current.has(newMsg.id)) {
                         continue; // Never re-add deleted messages
                     }
                     const exists = merged.some(m =>
                         (m.client_message_id && m.client_message_id === newMsg.client_message_id) ||
                         m.id === newMsg.id
                     );
                     if (!exists) {
                         merged.push(newMsg);
                         anyAdded = true;
                     }
                 }
             }

             // Sort by created_date (null timestamps at end) - use canonical ordering
             const sorted = sortMessagesCanonically(merged);

             // CRITICAL: Reject merge if it would shrink the list (only for server sources)
             if (source !== 'realtime' && sorted.length < existingCount) {
                 console.warn(`
    ⚠️ MERGE REJECTED - Would shrink message list
    Room: ${roomId}
    Current: ${existingCount} messages
    After merge: ${merged.length} messages
    Server returned: ${newMessages.length} messages
    ACTION: Keeping existing ${existingCount} messages unchanged
    REASON: Server fetch is incomplete/stale - UI is authoritative
                 `);
                 return prev; // Keep existing messages unchanged
             }

             // IDEMPOTENCY: Skip update ONLY if:
             // 1. No new messages were added AND
             // 2. Content is identical
             const isSame =
                 !anyAdded &&
                 existing.length === sorted.length &&
                 existing.every((msg, i) =>
                     msg.id === sorted[i].id &&
                     msg.status === sorted[i].status &&
                     msg.created_date === sorted[i].created_date
                 );

             if (isSame) {
                 return prev; // No changes, avoid infinite loop
             }

             console.log(`✓ Store: Room ${roomId} now has ${sorted.length} messages (was ${existingCount})`);

             if (source !== 'realtime' && !enforceMonotonicity(roomId, sorted, 'merge')) {
                 console.error('❌ Blocked: mergeMessages by enforceMonotonicity');
                 return prev;
             }

             // CRITICAL: Always return NEW object reference for room (even if re-sorted)
             // React uses reference equality to trigger re-render
             return { ...prev, [roomId]: sorted };
         });
     }, [enforceMonotonicity, sortMessagesCanonically]);
    
    // Delete message (EXPLICIT deletion - allowed to shrink)
    // Idempotent: safe to call multiple times for same messageId
    const deleteMessage = useCallback((roomId, messageId) => {
        // Idempotency check: skip if already tombstoned
        if (deletedMessageIdsRef.current.has(messageId)) {
            console.log(`✓ Message ${messageId} already deleted (no-op)`);
            return;
        }
        
        console.log(`🗑️ Store: EXPLICIT DELETE of message ${messageId} from room ${roomId}`);
        // Add to tombstone to prevent resurrection
        deletedMessageIdsRef.current.add(messageId);
        
        setMessagesByRoom(prev => {
            const existing = prev[roomId] || [];
            const updated = existing.filter(m => m.id !== messageId && m.client_message_id !== messageId);
            
            // Skip state update if message didn't exist (idempotent)
            if (existing.length === updated.length) {
                console.log(`✓ Message ${messageId} not found in room ${roomId} (no-op)`);
                return prev;
            }
            
            // Explicit delete is allowed to shrink
            enforceMonotonicity(roomId, updated, 'delete');
            return { ...prev, [roomId]: updated };
        });
    }, [enforceMonotonicity]);
    
    // Clear messages for a room (EXPLICIT clear - allowed to shrink)
    const clearMessages = useCallback((roomId) => {
        console.log(`🧹 Store: EXPLICIT CLEAR of messages for room ${roomId}`);
        setMessagesByRoom(prev => {
            // Explicit clear is allowed
            prevCountsRef.current[roomId] = 0;
            return { ...prev, [roomId]: [] };
        });
    }, []);
    

    
    // Get last known server cursor for a room (for reconnect catch-up)
    // Returns { created_date: string, id: string } or null
    const getLastServerCursor = useCallback((roomId) => {
        return lastServerCursorByRoomRef.current[roomId] || null;
    }, []);
    
    // Check if realtime gap detected for a room (>15s since last message)
    const hasRealtimeGap = useCallback((roomId) => {
        const last = lastRealtimeReceivedAtRef.current[roomId];
        return last && Date.now() - last > 15000;
    }, []);
    
    const value = {
        messagesByRoom, // Expose state directly for React to track
        getMessagesForRoom,
        addOptimisticMessage,
        updateMessage,
        mergeMessages,
        deleteMessage,
        clearMessages,
        getLastServerCursor,
        hasRealtimeGap
    };
    
    return (
        <ChatMessageStoreContext.Provider value={value}>
            {children}
        </ChatMessageStoreContext.Provider>
    );
}

export function useChatMessageStore() {
    const context = useContext(ChatMessageStoreContext);
    if (!context) {
        throw new Error('useChatMessageStore must be used within ChatMessageStoreProvider');
    }
    return context;
}