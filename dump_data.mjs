
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually extract variables from .env if possible
let supabaseUrl = '';
let supabaseKey = '';

try {
    const env = fs.readFileSync('.env', 'utf8');
    supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim() || '';
    supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim() || '';
} catch (e) {
    console.error('Failed to read .env');
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: trades } = await supabase
        .from('pool_trades')
        .select('*')
        .eq('pool_type', 'scalping');

    const { data: investors } = await supabase
        .from('pool_investors')
        .select('*')
        .eq('pool_type', 'scalping');

    const output = {
        tradesCount: trades?.length || 0,
        trades: trades || [],
        investorsCount: investors?.length || 0,
        investors: investors || []
    };

    fs.writeFileSync('data_dump.json', JSON.stringify(output, null, 2));
    console.log('Dumped data to data_dump.json');
}

checkData();
