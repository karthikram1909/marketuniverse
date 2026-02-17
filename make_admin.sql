-- Make user an admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = '2210030135cse@gmail.com';

-- Ensure they have an admin entry if needed in other tables (optional, depending on schema)
-- Create a notification for them
INSERT INTO public.notifications (user_id, message, read, created_at)
SELECT id, 'You have been granted admin privileges.', false, now()
FROM public.profiles
WHERE email = '2210030135cse@gmail.com';
