import { UnifiedProfileData } from "basecred-decision-engine";
import { getUnifiedProfile, SDKConfig } from "basecred-sdk";

export async function fetchLiveProfile(address: string): Promise<UnifiedProfileData> {
    const config: SDKConfig = {
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

    try {
        // SDK output matches UnifiedProfileData directly - no adapter needed
        const profile = await getUnifiedProfile(address, config);
        return profile as UnifiedProfileData;
    } catch (error) {
        console.error("SDK Fetch Error:", error);
        throw error;
    }
}
