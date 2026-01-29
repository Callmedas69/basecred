import dotenv from 'dotenv';
import path from 'path';
import { getUnifiedProfile } from 'basecred-sdk';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log("Loading env from:", envPath);
dotenv.config({ path: envPath });

const TEST_ADDRESS = "0x168D8b4f50BB3aA67D05a6937B643004257118ED";

async function runDebug() {
    console.log("\n--- Debugging BaseCred SDK ---");
    console.log("Subject:", TEST_ADDRESS);

    const config = {
        ethos: {
            baseUrl: process.env.ETHOS_BASE_URL || "https://api.ethos.network",
            clientId: process.env.ETHOS_CLIENT_ID || "",
        },
        talent: {
            baseUrl: process.env.TALENT_BASE_URL || "https://api.talentprotocol.com",
            apiKey: process.env.TALENT_API_KEY || "",
        },
        farcaster: {
            enabled: true,
            neynarApiKey: process.env.NEYNAR_API_KEY || "",
        },
    };

    console.log("\n--- Configuration Check ---");
    console.log("Ethos ClientID Present:", !!config.ethos.clientId, `(Value: ${config.ethos.clientId.substring(0, 4)}***)`);
    console.log("Talent API Key Present:", !!config.talent.apiKey);
    console.log("Neynar API Key Present:", !!config.farcaster.neynarApiKey);

    try {
        console.log("\n--- Fetching Profile ---");
        const profile = await getUnifiedProfile(TEST_ADDRESS, config);

        console.log("\n--- Raw Availability ---");
        console.log(JSON.stringify(profile.availability, null, 2));

        console.log("\n--- Raw Data (Ethos) ---");
        console.log(JSON.stringify(profile.ethos, null, 2));

        console.log("\n--- Raw Data (Neynar) ---");
        console.log(JSON.stringify(profile.farcaster, null, 2));

        console.log("\n--- Raw Data (Talent) ---");
        console.log(JSON.stringify(profile.talent, null, 2));

    } catch (err) {
        console.error("\n!!! SDK Error !!!");
        console.error(err);
    }
}

runDebug();
