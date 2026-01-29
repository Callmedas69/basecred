import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { fetchLiveProfile } from './src/repositories/liveProfileRepository';

const TEST_ADDRESS = "0x168D8b4f50BB3aA67D05a6937B643004257118ED";

async function runTest() {
    console.log("--- Starting Live Fetch Test ---");
    console.log("Address:", TEST_ADDRESS);

    try {
        const result = await fetchLiveProfile(TEST_ADDRESS);
        console.log("\n--- Result ---");
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Test Failed:", err);
    }
}

runTest();
