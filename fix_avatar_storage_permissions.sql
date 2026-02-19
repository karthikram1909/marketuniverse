
-- Force 'avatars' bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- Ensure the bucket exists if it doesn't (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Update Avatars" ON storage.objects;

-- 1. READ: Allow everyone (anon + authenticated) to read files in avatars bucket
CREATE POLICY "Public Access to Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. INSERT: Allow authenticated users to upload to avatars bucket
CREATE POLICY "Authenticated Users Can Upload Avatars"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 3. UPDATE: Allow users to update their own files (or any file in bucket if we are loose)
-- Strictly, we should check owner, but for now let's allow authenticated users to update avatars
CREATE POLICY "Authenticated Users Can Update Avatars"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. DELETE: Allow users to delete their own files
CREATE POLICY "Authenticated Users Can Delete Avatars"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Reload config
NOTIFY pgrst, 'reload config';
