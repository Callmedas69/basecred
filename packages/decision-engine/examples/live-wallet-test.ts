/**
 * Live Wallet Test
 * 
 * Tests the Decision Engine with real API data for a specific wallet.
 * 
 * Run with: npx tsx examples/live-wallet-test.ts
 * 
 * Note: Reads API keys from .env.local
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") })

import { decide, normalizeSignals } from "../src"
import type { UnifiedProfileData } from "../src/engine/normalizers"

const WALLET = "0x168D8b4f50BB3aA67D05a6937B643004257118ED"
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? ""
const TALENT_API_KEY = process.env.TALENT_API_KEY ?? ""

console.log("API Keys loaded:", {
    farcaster: NEYNAR_API_KEY ? "✓" : "✗",
    talent: TALENT_API_KEY ? "✓" : "✗",
})

// ============================================================================
// API Fetchers (using correct endpoints)
// ============================================================================

async function fetchEthosProfile(address: string) {
    try {
        // Ethos Network API v2 - POST /profiles with addresses
        const response = await fetch(
            `https://api.ethos.network/api/v2/profiles`,
            {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    addresses: [address],
                    limit: 1
                })
            }
        )

        if (!response.ok) {
            const text = await response.text()
            console.log("  Ethos: error (status:", response.status, ")", text)
            return null
        }

        const data = await response.json()
        console.log("  Ethos raw:", JSON.stringify(data, null, 2))

        // Check if we got results
        if (!data.values || data.values.length === 0) {
            console.log("  Ethos: no profile found for address")
            return null
        }

        const profile = data.values[0]
        const user = profile.user

        // Ethos score is 0-2800; keep raw score for SDK schema
        const rawScore = user?.score ?? 1200

        return {
            data: { score: rawScore },
        }
    } catch (error) {
        console.log("  Ethos: error fetching", error)
        return null
    }
}

async function fetchFarcasterProfile(address: string) {
    try {
        // Neynar API v2 - bulk by address endpoint
        const response = await fetch(
            `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
            {
                headers: {
                    "Accept": "application/json",
                    "x-api-key": NEYNAR_API_KEY,
                }
            }
        )

        if (!response.ok) {
            const text = await response.text()
            console.log("  Farcaster: error (status:", response.status, ")", text)
            return null
        }

        const data = await response.json()
        console.log("  Farcaster raw:", JSON.stringify(data, null, 2))

        // Response is { [address]: [users] }
        const users = data[address.toLowerCase()] || data[address] || []
        if (users.length > 0) {
            const user = users[0]
            return {
                data: {
                    userScore: user.experimental?.neynar_user_score ?? 0.5,
                },
            }
        }

        console.log("  Farcaster: no users found for address")
        return null
    } catch (error) {
        console.log("  Farcaster: error fetching", error)
        return null
    }
}

async function fetchTalentProfile(address: string) {
    try {
        // Talent Protocol API - scores endpoint (returns all scores)
        const response = await fetch(
            `https://api.talentprotocol.com/scores?id=${address}&account_source=wallet`,
            {
                headers: {
                    "Accept": "application/json",
                    "X-API-KEY": TALENT_API_KEY,
                }
            }
        )

        if (!response.ok) {
            const text = await response.text()
            console.log("  Talent: error (status:", response.status, ")", text)
            return null
        }

        const data = await response.json()
        console.log("  Talent raw:", JSON.stringify(data, null, 2))

        // Find builder_score and creator_score from the scores array
        const scores = data.scores ?? []
        const builderScore = scores.find((s: { slug: string }) => s.slug === "builder_score")
        const creatorScore = scores.find((s: { slug: string }) => s.slug === "creator_score")

        return {
            data: {
                builderScore: builderScore?.points ?? 0,
                creatorScore: creatorScore?.points ?? 0,
            },
        }
    } catch (error) {
        console.log("  Talent: error fetching", error)
        return null
    }
}

// ============================================================================
// Main Test
// ============================================================================

async function main() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║     BaseCred Decision Engine - Live Wallet Test                ║
╠════════════════════════════════════════════════════════════════╣
║  Wallet: ${WALLET}  
╚════════════════════════════════════════════════════════════════╝
`)

    console.log("Fetching reputation data from APIs...\n")

    // Fetch from all providers
    console.log("→ Fetching Ethos profile...")
    const ethos = await fetchEthosProfile(WALLET)

    console.log("\n→ Fetching Farcaster profile...")
    const farcaster = await fetchFarcasterProfile(WALLET)

    console.log("\n→ Fetching Talent profile...")
    const talent = await fetchTalentProfile(WALLET)

    // Combine into unified profile
    const profile: UnifiedProfileData = {
        ethos,
        farcaster,
        talent,
        recency: { lastUpdatedDaysAgo: 0 },
    }

    console.log("\n" + "=".repeat(60))
    console.log("UNIFIED PROFILE DATA")
    console.log("=".repeat(60))
    console.log(JSON.stringify(profile, null, 2))

    // Normalize signals
    const signals = normalizeSignals(profile)

    console.log("\n" + "=".repeat(60))
    console.log("NORMALIZED SIGNALS")
    console.log("=".repeat(60))
    console.log(JSON.stringify(signals, null, 2))

    // Test multiple contexts
    const contexts = [
        "allowlist.general",
        "comment",
        "publish",
        "apply",
        "governance.vote"
    ]

    console.log("\n" + "=".repeat(60))
    console.log("DECISIONS BY CONTEXT")
    console.log("=".repeat(60))

    for (const context of contexts) {
        const decision = decide(signals, context)
        console.log(`\n📋 Context: ${context}`)
        console.log(`   Decision: ${decision.decision}`)
        console.log(`   Confidence: ${decision.confidence}`)
        console.log(`   Rule: ${decision.ruleIds.join(", ") || "(default deny)"}`)
        console.log(`   Reason: ${decision.explain.join("; ")}`)
        if (decision.constraints.length > 0) {
            console.log(`   Constraints: ${decision.constraints.join(", ")}`)
        }
    }

    console.log("\n" + "=".repeat(60))
    console.log("TEST COMPLETE")
    console.log("=".repeat(60))
}

main().catch(console.error)
