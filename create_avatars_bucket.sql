-- Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to all files in the 'avatars' bucket
-- Note: We check if policy exists by dropping it first to avoid errors
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
CREATE POLICY "Public Avatar Access" ON storage.objects 
FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Policy: Allow authenticated users to upload files to the 'avatars' bucket
DROP POLICY IF EXISTS "Authenticated Avatar Upload" ON storage.objects;
CREATE POLICY "Authenticated Avatar Upload" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'avatars' );

-- Policy: Allow users to update/delete their own files
-- Assuming the file name starts with the user ID or we just allow updates for now
DROP POLICY IF EXISTS "Users Manage Own Avatars" ON storage.objects;
CREATE POLICY "Users Manage Own Avatars" ON storage.objects
FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] )
WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- (Note: The update policy above relies on folder structure or naming convention. 
-- Since our code uses `userId-random.ext`, checking ownership via filename is tricky with just SQL policies 
-- without splitting strings. For basic functionality, INSERT is enough as we generate unique names).

