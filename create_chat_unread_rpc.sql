-- Add unique index for conflict handling if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_notif_user_room 
ON public.chat_notifications(recipient_email, room_id);

-- Function to get unread counts for all rooms for a user
CREATE OR REPLACE FUNCTION get_user_unread_counts(p_email TEXT)
RETURNS TABLE (room_id UUID, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cr.id as room_id,
        COUNT(cm.id) as count
    FROM
        chat_rooms cr
    -- Join notifications to get last read time for this user
    LEFT JOIN
        chat_notifications cn ON cn.room_id = cr.id AND cn.recipient_email = p_email
    -- Join messages to count those created after the last read time
    -- If no read record exists, assume 0 unread (or handle as needed, here we check > NULL which is always false, so we need COALESCE)
    -- If we want new users to see 0 unread, use NOW(). If we want them to see history, use '1970-01-01'.
    -- Let's use '1970-01-01' so they see "new" messages if they haven't read them.
    LEFT JOIN
        chat_messages cm ON cm.room_id = cr.id 
        AND cm.created_at > COALESCE(cn.last_read_timestamp, '1970-01-01'::timestamptz)
    GROUP BY
        cr.id;
END;
$$;

-- Function to mark a room as read
CREATE OR REPLACE FUNCTION mark_room_read(p_room_id UUID, p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.chat_notifications (room_id, recipient_email, last_read_timestamp, unread_count)
    VALUES (p_room_id, p_email, NOW(), 0)
    ON CONFLICT (recipient_email, room_id) 
    DO UPDATE SET last_read_timestamp = NOW(), unread_count = 0;
END;
$$;
