
import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Using URL:', supabaseUrl);
    const { data: trades, error: tradesError } = await supabase
        .from('pool_trades')
        .select('*')
        .eq('pool_type', 'scalping');

    if (tradesError) console.error('Trades Error:', tradesError);
    else console.log('Scalping Trades:', trades.length, trades);

    const { data: investors, error: invError } = await supabase
        .from('pool_investors')
        .select('*')
        .eq('pool_type', 'scalping');

    if (invError) console.error('Investors Error:', invError);
    else console.log('Scalping Investors:', investors.length);
}

checkData();
