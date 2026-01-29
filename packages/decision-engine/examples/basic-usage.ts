/**
 * BaseCred Decision Engine - Usage Examples
 * 
 * Run with: npx tsx examples/basic-usage.ts
 */

import { decide, normalizeSignals } from "../src"
import type { NormalizedSignals } from "../src"

// ============================================================================
// Example 1: High-reputation user
// ============================================================================

console.log("\n=== Example 1: High-reputation user ===\n")

const highRepSignals = normalizeSignals({
    ethos: {
        availability: "available",
        credibility_score: 85  // High trust
    },
    neynar: {
        farcaster_user_score: 0.9  // Very high social trust
    },
    talent: {
        builder: { availability: "available", score: 75 },  // Advanced builder
        creator: { availability: "available", score: 50 }   // Advanced creator
    }
})

const decision1 = decide(highRepSignals, "allowlist.general")
console.log("Signals:", JSON.stringify(highRepSignals, null, 2))
console.log("Decision:", JSON.stringify(decision1, null, 2))

// ============================================================================
// Example 2: New user with no history
// ============================================================================

console.log("\n=== Example 2: New user (no history) ===\n")

const newUserSignals = normalizeSignals({
    ethos: null,  // No Ethos profile
    neynar: { farcaster_user_score: 0.5 },  // Neutral social
    talent: null  // No Talent profile
})

const decision2 = decide(newUserSignals, "allowlist.general")
console.log("Signals:", JSON.stringify(newUserSignals, null, 2))
console.log("Decision:", JSON.stringify(decision2, null, 2))

// ============================================================================
// Example 3: Spam account detection
// ============================================================================

console.log("\n=== Example 3: Spam account ===\n")

const spamSignals = normalizeSignals({
    ethos: { availability: "available", credibility_score: 20 },
    neynar: { farcaster_user_score: 0.1 },  // Very low = high spam risk
    talent: null
})

const decision3 = decide(spamSignals, "allowlist.general")
console.log("Signals:", JSON.stringify(spamSignals, null, 2))
console.log("Decision:", JSON.stringify(decision3, null, 2))

// ============================================================================
// Example 4: Expert builder
// ============================================================================

console.log("\n=== Example 4: Expert builder ===\n")

const expertBuilderSignals = normalizeSignals({
    ethos: { availability: "available", credibility_score: 60 },
    neynar: { farcaster_user_score: 0.7 },
    talent: {
        builder: { availability: "available", score: 90 },  // Expert!
        creator: { availability: "not_found" }
    }
})

const decision4 = decide(expertBuilderSignals, "allowlist.general")
console.log("Signals:", JSON.stringify(expertBuilderSignals, null, 2))
console.log("Decision:", JSON.stringify(decision4, null, 2))

// ============================================================================
// Example 5: Different contexts
// ============================================================================

console.log("\n=== Example 5: Context-specific decisions ===\n")

const moderateSignals = normalizeSignals({
    ethos: { availability: "available", credibility_score: 50 },
    neynar: { farcaster_user_score: 0.55 },
    talent: {
        builder: { availability: "available", score: 30 },
        creator: { availability: "available", score: 25 }
    }
})

const contexts = ["allowlist.general", "comment", "publish", "governance.vote"]

for (const context of contexts) {
    const decision = decide(moderateSignals, context)
    console.log(`Context: ${context}`)
    console.log(`  Decision: ${decision.decision}`)
    console.log(`  Confidence: ${decision.confidence}`)
    console.log(`  Rule: ${decision.ruleIds.join(", ") || "(default deny)"}`)
    console.log(`  Reason: ${decision.explain.join("; ")}`)
    console.log()
}

// ============================================================================
// Example 6: Inactive user
// ============================================================================

console.log("\n=== Example 6: Inactive trusted user ===\n")

// Manually set recencyDays since normalizeSignals calculates it from date
const inactiveSignals: NormalizedSignals = {
    trust: "NEUTRAL",
    socialTrust: "NEUTRAL",
    builder: "NONE",
    creator: "NONE",
    recencyDays: 30,  // 30 days inactive
    spamRisk: "NEUTRAL",
    signalCoverage: 1.0
}

const decision6 = decide(inactiveSignals, "allowlist.general")
console.log("Signals:", JSON.stringify(inactiveSignals, null, 2))
console.log("Decision:", JSON.stringify(decision6, null, 2))

// ============================================================================
// Summary
// ============================================================================

console.log("\n=== Summary ===\n")
console.log("1. High-rep user     → ALLOW (strong builder)")
console.log("2. New user          → ALLOW_WITH_LIMITS (partial signals)")
console.log("3. Spam account      → DENY (high spam risk)")
console.log("4. Expert builder    → ALLOW (expert capability)")
console.log("5. Context-specific  → Varies by context")
console.log("6. Inactive user     → ALLOW_WITH_LIMITS (probation)")
