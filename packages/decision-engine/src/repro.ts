
import { executeDecision } from "./use-cases/decide"
import type { DecisionContext } from "./types/decisions"

/**
 * Simple repro script to exercise the decision engine and progression layer.
 *
 * This uses a mocked profile fetcher so it can run without external APIs.
 */
async function main() {
    const subject = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    const context: DecisionContext = "allowlist.general"

    console.log(`Analyzing subject: ${subject}`)

    // Mock fetcher to simulate what the API does
    const profileFetcher = async () => {
        // Minimal high-signal profile to trigger ALLOW
        return {
            ethos: {
                data: { score: 1700 },
            },
            farcaster: {
                data: { userScore: 0.8 },
            },
            talent: {
                data: { builderScore: 180, creatorScore: 120 },
            },
            recency: { lastUpdatedDaysAgo: 0 },
        } as any
    }

    const decision = await executeDecision(
        { subject, context },
        profileFetcher
    )

    console.log("Decision Output (with progression):", JSON.stringify(decision, null, 2))
}

main().catch(console.error)
