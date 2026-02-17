-- Make karthikramkopparla@gmail.com an admin
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- Check if the profile exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = 'karthikramkopparla@gmail.com') THEN
        -- Update the role to 'admin'
        UPDATE public.profiles
        SET role = 'admin'
        WHERE email = 'karthikramkopparla@gmail.com';
        
        RAISE NOTICE 'Role updated to admin for karthikramkopparla@gmail.com';
    ELSE
        RAISE NOTICE 'Profile for karthikramkopparla@gmail.com not found. Please ensure the user has signed up.';
    END IF;
END $$;
