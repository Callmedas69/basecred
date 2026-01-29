
import { executeDecision } from "./use-cases/decide";
import { normalizeSignals } from "./engine/normalizers";
import { getUnifiedProfile } from "basecred-sdk";

// Mock environment variables if needed
process.env.ETHOS_BASE_URL = "https://api.ethos.network";
process.env.TALENT_BASE_URL = "https://api.talentprotocol.com";
// process.env.NEYNAR_API_KEY = "..." // User might need to provide this or we mock the fetcher

async function main() {
    const subject = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // Vitalik
    const context = "allowlist.general";

    console.log(`Analyzing subject: ${subject}`);

    // Mock fetcher to simulate what the API does
    const profileFetcher = async (sub: string) => {
        // We can use the real SDK if keys are available, or just mock the return
        // For now, let's try to simulate a "good" user and see if it passes
        // If we can't run the real SDK without keys, we will return a mock high-value profile
        
        return {
            ethos: {
                data: { score: 1000 },
                signals: { hasVouches: true }, // minimal mock
                meta: {}
            },
            neynar: {
                data: { userScore: 0.95 },
                meta: {}
            },
            talent: {
                data: {
                    builderScore: 99,
                    creatorScore: 99
                },
                meta: {}
            },
            lastActivityAt: new Date()
        } as any;
    };

    // 1. Check Normalization
    const rawProfile = await profileFetcher(subject);
    console.log("Raw Profile (Mocked):", JSON.stringify(rawProfile, null, 2));
    
    const signals = normalizeSignals(rawProfile);
    console.log("Normalized Signals:", JSON.stringify(signals, null, 2));

    // 2. Execute Decision
    const decision = await executeDecision(
        { subject, context },
        profileFetcher
    );

    console.log("Decision Output:", JSON.stringify(decision, null, 2));
}

main().catch(console.error);
