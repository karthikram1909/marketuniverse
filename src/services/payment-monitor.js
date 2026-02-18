
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const ETHERSCAN_API_KEY_DEFAULT = "XTEIBN7XJ12BXTHQ737HTRHFQQE8TQ9SUX"; // As provided in prompt
const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // BSC USDT
const CONFIRMATION_THRESHOLD = 6; // Adjusted to 6 for faster UX (15-18s on BSC)
const POLLING_INTERVAL_MS = 3000; // 3 seconds (align with BSC block time)

// --- Load .env manually if not present ---
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

// --- Supabase Setup ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Supabase URL or Key not found in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Logging ---
const logFile = path.join(rootDir, 'backend_payments.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;

    console.log(logMessage);

    try {
        fs.appendFileSync(logFile, logMessage + '\n');
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
}

// --- Alchemy API ---
const ALCHEMY_API_KEY_DEFAULT = "demo";

async function alchemyCall(method, params, id = 1) {
    let apiKey = process.env.VITE_ALCHEMY_API_KEY ? process.env.VITE_ALCHEMY_API_KEY.trim() : ALCHEMY_API_KEY_DEFAULT;

    // Debugging: Check for common key issues
    if (apiKey === ALCHEMY_API_KEY_DEFAULT) {
        log(`[Config] WARNING: Using DEFAULT 'demo' API Key. Requests may fail.`);
    }

    const url = `https://bnb-mainnet.g.alchemy.com/v2/${apiKey}`;

    const body = {
        jsonrpc: "2.0",
        id: id,
        method: method,
        params: params
    };

    try {
        log(`[API] calling Alchemy: ${method}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            log(`[API] HTTP Error ${response.status}: ${errText}`);
            throw new Error(`HTTP Error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        if (data.error) {
            log(`[API] Alchemy Error: ${JSON.stringify(data.error)}`);
            return null;
        }
        return data.result;
    } catch (error) {
        log(`[API] Connection Failed: ${error.message}`);
        return null;
    }
}

async function monitorPayments() {
    log(`[System] Starting 'Alchemy-BNB' Monitor Cycle...`);
    try {
        await processAllIntents();
    } catch (err) {
        log(`[System] Error in monitor loop: ${err.message}`);
    }
    setTimeout(monitorPayments, POLLING_INTERVAL_MS);
}

// --- State Management ---
const SERVICE_ID = 'bnb_scanner';

async function getLastProcessedBlock() {
    const { data } = await supabase
        .from('monitoring_state')
        .select('last_processed_block')
        .eq('service_id', SERVICE_ID)
        .maybeSingle();

    return data?.last_processed_block ? parseInt(data.last_processed_block) : 0;
}

async function updateLastProcessedBlock(blockNum) {
    const { error } = await supabase
        .from('monitoring_state')
        .upsert({
            service_id: SERVICE_ID,
            last_processed_block: blockNum,
            updated_at: new Date()
        });

    if (error) {
        log(`[State] Failed to update block to ${blockNum}: ${error.message}`);
    }
}

async function processAllIntents() {
    // 1. Fetch relevant intents
    const { data: intents, error } = await supabase
        .from('payment_intents')
        .select('*')
        .in('status', ['PENDING', 'CONFIRMING']);

    if (error) {
        log(`[DB] Error fetching intents: ${error.message}`);
        return;
    }

    if (!intents || intents.length === 0) return;

    // 2. Block Tracking Logic
    let lastBlock = await getLastProcessedBlock();

    // Get Current Block Height
    const currentBlockHex = await alchemyCall("eth_blockNumber", []);
    if (!currentBlockHex) return;
    const currentBlock = parseInt(currentBlockHex, 16);

    // Determine Scan Range
    // If lastBlock is 0 (first run), start from latest - 100 blocks or from oldest intent?
    // User requested "incremental". Let's assume start from currentBlock - 100 if fresh.
    let fromBlock = lastBlock > 0 ? lastBlock + 1 : currentBlock - 100;
    let toBlock = currentBlock;

    // Safety: Don't scan into the future or same block repeatedly if too fast
    if (fromBlock > toBlock) {
        // limit logging frequency here if needed
        return;
    }

    log(`[Chain] Scanning Block Range: ${fromBlock} -> ${toBlock} (Current: ${currentBlock})`);

    // 3. Group by Receiver Address
    const intentsByAddress = {};
    for (const intent of intents) {
        const addr = intent.expected_to_address.toLowerCase();
        if (!intentsByAddress[addr]) intentsByAddress[addr] = [];
        intentsByAddress[addr].push(intent);
    }

    // 4. Process each wallet (Incremental Scan)
    for (const address of Object.keys(intentsByAddress)) {
        await processWalletRange(address, intentsByAddress[address], fromBlock, toBlock, currentBlock);
    }

    // 5. Update State
    await updateLastProcessedBlock(toBlock);
}

async function processWalletRange(walletAddress, intents, fromBlock, toBlock, currentBlock) {
    // Alchemy Optimized Call: getAssetTransfers with explicit block range
    const params = [{
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: `0x${toBlock.toString(16)}`,
        toAddress: walletAddress,
        contractAddresses: [USDT_CONTRACT_ADDRESS],
        category: ["erc20"],
        withMetadata: true,
        maxCount: "0x3e8" // 1000 transfers max per range
    }];

    const result = await alchemyCall("alchemy_getAssetTransfers", params);

    if (!result || !result.transfers) {
        return;
    }

    const transfers = result.transfers;

    for (const intent of intents) {
        const match = findMatch(intent, transfers);

        if (match) {
            // Idempotency Check: Prevent re-processing confirmed transactions
            const { data: existing } = await supabase
                .from('payment_intents')
                .select('id, status')
                .eq('tx_hash', match.hash)
                .neq('id', intent.id) // Check if ANOTHER intent used this hash
                .maybeSingle();

            if (existing && (existing.status === 'CONFIRMED')) {
                log(`[Skip] Hash ${match.hash} already used by intent ${existing.id}. Skipping.`);
                continue;
            }

            // Calculate Confirmations
            const txBlock = parseInt(match.blockNum, 16);
            const confirmations = currentBlock - txBlock;
            const targetConfirmations = intent.target_confirmations || CONFIRMATION_THRESHOLD;

            log(`[Match] Order ${intent.order_id} matched Tx: ${match.hash}. Confirmations: ${confirmations}/${targetConfirmations}`);

            if (confirmations >= targetConfirmations) {
                if (intent.status !== 'CONFIRMED') {
                    await markConfirmed(intent, match.hash, confirmations);
                }
            } else {
                if (intent.status !== 'CONFIRMING' || intent.tx_hash !== match.hash) {
                    await updateToConfirming(intent, match.hash, confirmations);
                }
            }
        }
    }
}

function findMatch(intent, transfers) {
    // Prompt Requirements:
    // transfer.from == senderWallet (case-insensitive)
    // transfer.to == receiverWallet (case-insensitive) -> Handled by API filter, but good to double check
    // transfer.rawContract.value == rawAmount (Exact match)

    // Prepare Intent Data
    const senderWallet = intent.expected_from_address.toLowerCase();
    const receiverWallet = intent.expected_to_address.toLowerCase();

    // Expected Amount: intent.expected_amount is likely "50.0" or similar decimal string.
    // Convert to RAW (BigInt) for BSC USDT (18 decimals).
    let expectedRaw;
    try {
        expectedRaw = ethers.utils.parseUnits(intent.expected_amount.toString(), 18);
    } catch (e) {
        log(`[Error] Failed to parse expected_amount for order ${intent.order_id}: ${e.message}`);
        return null;
    }

    for (const tx of transfers) {
        // 1. Check Receiver (redundant if API filtered, but safe)
        if (tx.to && tx.to.toLowerCase() !== receiverWallet) continue;

        // 2. Check Sender
        if (!tx.from || tx.from.toLowerCase() !== senderWallet) continue;

        // 3. Check Exact Raw Amount
        // tx.rawContract.value is Hex string (e.g. "0x...")
        if (!tx.rawContract || !tx.rawContract.value) continue;

        const txRaw = ethers.BigNumber.from(tx.rawContract.value);

        if (!txRaw.eq(expectedRaw)) continue;

        // Check Time/Block
        if (tx.metadata && tx.metadata.blockTimestamp) {
            const txTime = new Date(tx.metadata.blockTimestamp).getTime();
            const intentTime = new Date(intent.created_at).getTime();

            // Filter out old transactions:
            // If tx happened MORE than 10 minutes BEFORE the intent was created, it's an old tx.
            // (Allowing 10m buffer for clock skew/delays)
            if (txTime < (intentTime - 600000)) {
                // log(`[Match] skipping old tx ${tx.hash} (Time: ${tx.metadata.blockTimestamp})`);
                continue;
            }
        }

        // All checks passed
        return tx;
    }
    return null;
}

async function updateToConfirming(intent, txHash, confs) {
    log(`[Update] Order ${intent.order_id} -> CONFIRMING. Hash: ${txHash} (${confs} confs)`);

    const payload = {
        status: 'CONFIRMING',
        updated_at: new Date(),
        confirmations: confs
    };

    // Only update tx_hash if it's missing or effectively different (ignore case)
    // This prevents unique constraint errors when just normalizing case
    if (!intent.tx_hash || intent.tx_hash.toLowerCase() !== txHash.toLowerCase()) {
        payload.tx_hash = txHash;
    }

    const { error } = await supabase.from('payment_intents')
        .update(payload)
        .eq('id', intent.id);

    if (error) {
        if (error.message && error.message.includes('unique constraint')) {
            log(`[DB] Duplicate hash detected for order ${intent.order_id}. Marking as FAILED to clear queue.`);
            await supabase.from('payment_intents').update({ status: 'FAILED' }).eq('id', intent.id);
        } else {
            log(`[DB] Update Error (CONFIRMING): ${error.message}`);
        }
    }
}

async function markConfirmed(intent, txHash, confs) {
    log(`[Success] Order ${intent.order_id} -> CONFIRMED. Hash: ${txHash} (${confs} confs)`);

    const payload = {
        status: 'CONFIRMED',
        updated_at: new Date(),
        confirmations: confs
    };

    if (!intent.tx_hash || intent.tx_hash.toLowerCase() !== txHash.toLowerCase()) {
        payload.tx_hash = txHash;
    }

    const { error } = await supabase.from('payment_intents')
        .update(payload)
        .eq('id', intent.id);

    if (error) {
        if (error.message && error.message.includes('unique constraint')) {
            log(`[DB] Duplicate hash detected for order ${intent.order_id}. Marking as FAILED to clear queue.`);
            await supabase.from('payment_intents').update({ status: 'FAILED' }).eq('id', intent.id);
        } else {
            log(`[DB] Update Error (CONFIRMED): ${error.message}`);
        }
    }

    // Trigger any credit logic here
}

// Start
monitorPayments();
