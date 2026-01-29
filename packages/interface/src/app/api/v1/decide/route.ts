import { NextRequest, NextResponse } from "next/server";
import { 
    executeDecision, 
    validateDecideRequest, 
    normalizeSignals
} from "basecred-decision-engine";
import { getUnifiedProfile } from "basecred-sdk";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Validate Input
        const validated = validateDecideRequest(body);
        if (!validated.valid) {
            return NextResponse.json(
                { code: "INVALID_REQUEST", message: validated.error },
                { status: 400 }
            );
        }

        const { subject, context } = validated.data;

        // 2. Define Profile Fetcher (Adapter)
        let capturedProfile: any = null;

        const profileFetcher = async (sub: string) => {
             const config = {
                 ethos: { baseUrl: process.env.ETHOS_BASE_URL || "https://api.ethos.network", clientId: process.env.ETHOS_CLIENT_ID || "" },
                 talent: { baseUrl: process.env.TALENT_BASE_URL || "https://api.talentprotocol.com", apiKey: process.env.TALENT_API_KEY || "" },
                 farcaster: { enabled: true, neynarApiKey: process.env.NEYNAR_API_KEY || "" }
            };
            const raw = await getUnifiedProfile(sub, config);
            
            // Adapter: Pass SDK objects directly (Engine natively supports SDK structure)
            const profileData = {
                ethos: (raw.ethos as any) ?? null,
                neynar: (raw.farcaster as any) ?? null,
                talent: (raw.talent as any) ?? null,
                lastActivityAt: null // SDK does not provide this directly in Availability
            };

            // Capture for response enrichment
            capturedProfile = profileData;
            
            return profileData;
        };

        // 3. Execute Decision (Business Logic)
        const decision = await executeDecision(
            { subject, context },
            profileFetcher
        );

        // 4. Enrich Response for Explorer
        // The explorer needs the raw signals and profile to visualize the data.
        // Since the engine doesn't return them, we reconstruct them here.
        const signals = capturedProfile ? normalizeSignals(capturedProfile) : null;

        return NextResponse.json({
            ...decision,
            profile: capturedProfile,
            signals
        });

    } catch (error: any) {
        console.error("Decision API Error:", error);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: error.message || "Unknown error" },
            { status: 500 }
        );
    }
}
