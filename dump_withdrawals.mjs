
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

async function checkWithdrawals() {
    const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('pool_type', 'scalping');

    fs.writeFileSync('withdrawals_dump.json', JSON.stringify(withdrawals || [], null, 2));
}

checkWithdrawals();
