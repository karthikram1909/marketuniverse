
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log("Checking for 'confirmations' column in 'payment_intents'...");

    // Attempt to select 'confirmations' from a single row
    const { data, error } = await supabase
        .from('payment_intents')
        .select('confirmations')
        .limit(1);

    if (error) {
        console.error("Column check failed:", error.message);
        if (error.message.includes("does not exist")) {
            console.log("\n[ACTION REQUIRED] The 'confirmations' column is missing!");
            console.log("Please run the SQL in 'add_confirmations_column.sql' in your Supabase SQL Editor.");
        }
    } else {
        console.log("Column 'confirmations' exists.");
    }
}

checkColumn();
