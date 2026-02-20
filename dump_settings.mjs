
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let supabaseUrl = '';
let supabaseKey = '';

try {
    const env = fs.readFileSync('.env', 'utf8');
    supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim() || '';
    supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim() || '';
} catch (e) { }

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    const { data: settings } = await supabase
        .from('pool_settings')
        .select('*')
        .eq('pool_type', 'scalping');

    fs.writeFileSync('settings_dump.json', JSON.stringify(settings || [], null, 2));
}

checkSettings();
