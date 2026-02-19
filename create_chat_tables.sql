
-- 1. Create tables (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.chat_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT,
    username TEXT,
    bio TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'offline',
    is_approved BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_moderator BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    permission TEXT DEFAULT 'read_write',
    channel_avatar_url TEXT,
    created_by TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.youtube_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE SET NULL,
    stream_type TEXT DEFAULT 'public',
    channel_id TEXT,
    video_url TEXT,
    youtube_video_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    content TEXT,
    is_system_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    is_authorized BOOLEAN DEFAULT TRUE,
    permission_level TEXT DEFAULT 'read_write',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, room_id)
);

CREATE TABLE IF NOT EXISTS public.chat_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    sender_email TEXT,
    unread_count INTEGER DEFAULT 0,
    last_read_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Schema Migrations (Ensure columns exist if table already existed)

-- chat_profiles
ALTER TABLE public.chat_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_profile_id UUID REFERENCES public.chat_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_wallet TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_username TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reaction_emojis JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS client_message_id TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT NOW();

-- 3. Enable RLS
ALTER TABLE public.chat_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Drop first to avoid conflicts)

-- Chat Profiles
DROP POLICY IF EXISTS "Public read chat profiles" ON public.chat_profiles;
DROP POLICY IF EXISTS "Admins manage chat profiles" ON public.chat_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.chat_profiles;
DROP POLICY IF EXISTS "Users create own profile" ON public.chat_profiles;

CREATE POLICY "Public read chat profiles" ON public.chat_profiles FOR SELECT USING (true);
CREATE POLICY "Admins manage chat profiles" ON public.chat_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users update own profile" ON public.chat_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users create own profile" ON public.chat_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat Rooms
DROP POLICY IF EXISTS "Public read chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins manage chat rooms" ON public.chat_rooms;

CREATE POLICY "Public read chat rooms" ON public.chat_rooms FOR SELECT USING (true);
CREATE POLICY "Admins manage chat rooms" ON public.chat_rooms FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- YouTube Settings
DROP POLICY IF EXISTS "Public read youtube settings" ON public.youtube_settings;
DROP POLICY IF EXISTS "Admins manage youtube settings" ON public.youtube_settings;

CREATE POLICY "Public read youtube settings" ON public.youtube_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage youtube settings" ON public.youtube_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Chat Messages
DROP POLICY IF EXISTS "Public read chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users create messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins delete messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users update own messages" ON public.chat_messages;

CREATE POLICY "Public read chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Users create messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_user_id);
CREATE POLICY "Admins delete messages" ON public.chat_messages FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = sender_user_id); 

-- Chat User Permissions
DROP POLICY IF EXISTS "Public read permissions" ON public.chat_user_permissions;
DROP POLICY IF EXISTS "Admins manage permissions" ON public.chat_user_permissions;

CREATE POLICY "Public read permissions" ON public.chat_user_permissions FOR SELECT USING (true);
CREATE POLICY "Admins manage permissions" ON public.chat_user_permissions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Chat Notifications
DROP POLICY IF EXISTS "Users read own notifications" ON public.chat_notifications;
DROP POLICY IF EXISTS "System create notifications" ON public.chat_notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.chat_notifications;

CREATE POLICY "Users read own notifications" ON public.chat_notifications FOR SELECT USING (
    recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR 
    recipient_email IS NULL 
);
CREATE POLICY "System create notifications" ON public.chat_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.chat_notifications FOR UPDATE USING (
    recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

NOTIFY pgrst, 'reload config';
