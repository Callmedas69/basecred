import { NextRequest, NextResponse } from "next/server";
import {
    executeDecision,
    validateDecideRequest,
    normalizeSignals,
    InMemoryPolicyRepository,
    listPolicies
} from "basecred-decision-engine";
import { getUnifiedProfile } from "basecred-sdk";
import { checkRateLimit } from "@/lib/rateLimit";
import { createActivityRepository } from "@/repositories/activityRepository";
import { sendWebhook } from "@/lib/webhook";
import { getSDKConfig } from "@/lib/serverConfig";
import { truncateAddress } from "@/lib/utils";
import type { ActivityEntry } from "@/types/apiKeys";

const policyRepository = new InMemoryPolicyRepository();

export async function POST(req: NextRequest) {
    try {
        // Reject oversized payloads (100KB limit)
        const contentLength = Number(req.headers.get("content-length") || "0");
        if (contentLength > 100_000) {
            return NextResponse.json(
                { code: "PAYLOAD_TOO_LARGE", message: "Request body too large" },
                { status: 413 }
            );
        }

        // Rate limit check for API key requests
        const apiKeyId = req.headers.get("x-basecred-key-id");
        if (apiKeyId) {
            const rateCheck = await checkRateLimit("apiKey", apiKeyId);
            if (!rateCheck.allowed) {
                return NextResponse.json(
                    { code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
                    {
                        status: 429,
                        headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) },
                    }
                );
            }
        }

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
            const raw = await getUnifiedProfile(sub, getSDKConfig());
            
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

        const policies = await listPolicies({ policyRepository });
        const policy = policies.find((entry) => entry.context === context);

        const responseBody = {
            ...decision,
            profile: capturedProfile,
            signals,
            policyHash: policy?.policyHash
        };

        // Log activity for API key requests (fire-and-forget)
        if (apiKeyId) {
            const activityRepo = createActivityRepository();
            const { createApiKeyRepository } = await import("@/repositories/apiKeyRepository");
            const keyRepo = createApiKeyRepository();

            const keyRecord = await keyRepo.validateKey(apiKeyId);
            const entry: ActivityEntry = {
                timestamp: Date.now(),
                apiKeyPrefix: keyRecord?.keyPrefix ?? apiKeyId.slice(0, 8) + "...",
                subject,
                context,
                decision: decision.decision,
                confidence: decision.confidence ?? "MEDIUM",
            };

            // Best-effort, non-blocking: log activity, record usage, and push to global feed
            Promise.all([
                activityRepo.logActivity(entry),
                keyRepo.recordUsage(apiKeyId),
                activityRepo.logGlobalFeedEntry({
                    agentName: keyRecord?.label ?? "unknown",
                    ownerAddress: truncateAddress(subject),
                    context,
                    timestamp: Date.now(),
                }),
            ]).catch((err) => console.error("[decide] Activity logging failed:", err));

            // Fire webhook if registration has a webhookUrl (fire-and-forget)
            if (keyRecord) {
                const walletAddress = keyRecord.walletAddress;
                const keyHash = apiKeyId;
                (async () => {
                    const { createAgentRegistrationRepository } = await import("@/repositories/agentRegistrationRepository");
                    const regRepo = createAgentRegistrationRepository();
                    const registrations = await regRepo.listByOwner(walletAddress);
                    const registration = registrations.find(
                        (r) => r.apiKeyHash === keyHash && r.status === "verified"
                    );
                    if (registration?.webhookUrl) {
                        await sendWebhook(registration.webhookUrl, {
                            event: "reputation.checked",
                            timestamp: Date.now(),
                            agentName: registration.agentName,
                            ownerAddress: walletAddress,
                            data: {
                                context,
                                decision: decision.decision,
                                confidence: decision.confidence ?? "MEDIUM",
                            },
                        });
                    }
                })().catch((err) => console.error("[decide] Webhook delivery failed:", err));
            }
        }

        const response = NextResponse.json(responseBody);
        if (policy?.policyHash) {
            response.headers.set("x-policy-hash", policy.policyHash);
        }
        return response;

    } catch (error: unknown) {
        console.error("Decision API Error:", error);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
