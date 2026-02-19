
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

// Using service key to ensure we can see all columns/tables if schema inspection requires it
// But for standard inspection, anon might work if public.
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfilesSchema() {
    console.log('Checking profiles table schema...');

    // Attempt to select a single row to see the returned keys
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in profiles table:', Object.keys(data[0]).join(', '));

        // Check for specific columns used in UserProfileForm
        const requiredColumns = [
            'display_name',
            'email',
            'telephone',
            'discord_name',
            'x_profile_link',
            'withdrawal_wallet_address',
            'avatar_url',
            'country',
            'city',
            'address',
            'date_of_birth',
            'occupation'
        ];

        const existingColumns = Object.keys(data[0]);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length > 0) {
            console.error('MISSING COLUMNS:', missingColumns.join(', '));
            console.log('Recommendation: Add these columns to the profiles table.');
        } else {
            console.log('All required columns appear to be present (based on non-null data).');
            // Note: if data[0] has null for a column, the key might still be there or not depending on JSON driver? 
            // Supabase/PostgREST usually returns keys even if null.
        }
    } else {
        console.log('No profiles found to inspect. Cannot verify columns dynamically.');
        // If no profiles, we can't easily check columns via select *
    }
}

checkProfilesSchema();
