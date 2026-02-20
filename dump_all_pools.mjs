
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

async function checkAllPools() {
    const { data: trades } = await supabase.from('pool_trades').select('pool_type, pnl, fee, date');
    const { data: investors } = await supabase.from('pool_investors').select('pool_type, invested_amount');

    fs.writeFileSync('all_pools_dump.json', JSON.stringify({ trades, investors }, null, 2));
}

checkAllPools();
