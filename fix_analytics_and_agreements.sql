-- Fix Analytics and Agreements Schema and Policies - V2 (More Robust)

-- 1. Fix visits table
DO $$ 
BEGIN 
    -- Rename referer to referrer if referer exists and referrer doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'referer') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'referrer') THEN
        ALTER TABLE public.visits RENAME COLUMN referer TO referrer;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'referer') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'referrer') THEN
        -- Both exist? Drop the old one
        ALTER TABLE public.visits DROP COLUMN referer;
    END IF;
END $$;

ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS wallet_address text;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS is_new_visitor boolean;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS longitude numeric;

-- 2. Fix page_views table
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS visitor_id text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS wallet_address text;

DO $$ 
BEGIN 
    -- Rename path to page_name
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'path') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'page_name') THEN
        ALTER TABLE public.page_views RENAME COLUMN path TO page_name;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'path') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'page_name') THEN
        ALTER TABLE public.page_views DROP COLUMN path;
    END IF;

    -- Rename viewed_at to entry_time
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'viewed_at') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'entry_time') THEN
        ALTER TABLE public.page_views RENAME COLUMN viewed_at TO entry_time;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'viewed_at') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'entry_time') THEN
        ALTER TABLE public.page_views DROP COLUMN viewed_at;
    END IF;
END $$;

ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS exit_time timestamp with time zone;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS time_spent integer;

-- 3. Update RLS policies
-- Visits
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous inserts to visits" ON public.visits;
CREATE POLICY "Allow anonymous inserts to visits" ON public.visits FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated inserts to visits" ON public.visits;
CREATE POLICY "Allow authenticated inserts to visits" ON public.visits FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view visits" ON public.visits;
CREATE POLICY "Admins can view visits" ON public.visits FOR SELECT USING (true);

-- Page Views
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous inserts to page_views" ON public.page_views;
CREATE POLICY "Allow anonymous inserts to page_views" ON public.page_views FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated inserts to page_views" ON public.page_views;
CREATE POLICY "Allow authenticated inserts to page_views" ON public.page_views FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view page views" ON public.page_views;
CREATE POLICY "Admins can view page views" ON public.page_views FOR SELECT USING (true);

-- User Agreements
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous inserts to user_agreements" ON public.user_agreements;
CREATE POLICY "Allow anonymous inserts to user_agreements" ON public.user_agreements FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated inserts to user_agreements" ON public.user_agreements;
CREATE POLICY "Allow authenticated inserts to user_agreements" ON public.user_agreements FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anonymous select from user_agreements" ON public.user_agreements;
CREATE POLICY "Allow anonymous select from user_agreements" ON public.user_agreements FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow authenticated select from user_agreements" ON public.user_agreements;
CREATE POLICY "Allow authenticated select from user_agreements" ON public.user_agreements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can view own agreements" ON public.user_agreements;
DROP POLICY IF EXISTS "Users can insert own agreements" ON public.user_agreements;
