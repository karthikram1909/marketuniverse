-- Make kathirvel.murugan@gmail.com an admin

-- Update the main profiles table
UPDATE profiles
SET role = 'admin'
WHERE email = 'kathirvel.murugan@gmail.com';

-- Update the chat_profiles table
UPDATE chat_profiles
SET is_admin = true,
    is_approved = true
WHERE email = 'kathirvel.murugan@gmail.com';

-- Verification
SELECT email, role FROM profiles WHERE email = 'kathirvel.murugan@gmail.com';
SELECT email, is_admin, is_approved FROM chat_profiles WHERE email = 'kathirvel.murugan@gmail.com';
