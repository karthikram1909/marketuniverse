
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey || !supabaseKey.startsWith('ey')) {
    console.warn('⚠️ WARNING: VITE_SUPABASE_ANON_KEY does not look like a valid JWT (should start with "ey"). Authentication may fail. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey)
