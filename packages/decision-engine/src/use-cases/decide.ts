/**
 * Decision Use Case
 * 
 * Orchestrates the decision flow:
 * 1. Fetch signals from repositories
 * 2. Normalize signals
 * 3. Evaluate rules
 * 4. Return decision
 * 
 * This is the BUSINESS LOGIC layer - it orchestrates but doesn't
 * know about HTTP or infrastructure details.
 */

import type { DecisionOutput, DecideRequest } from "../types/decisions"
import { decide } from "../engine/decide"
import { normalizeSignals, type UnifiedProfileData } from "../engine/normalizers"

// ============================================================================
// Use Case Input/Output
// ============================================================================

export interface DecideUseCaseInput {
    /** Wallet address or Farcaster FID */
    subject: string
    /** Decision context */
    context: string
}

export interface DecideUseCaseOutput extends DecisionOutput {
    /** Subject hash for logging (privacy-preserving) */
    subjectHash: string
}

// ============================================================================
// Use Case Implementation
// ============================================================================

/**
 * Execute the decision use case.
 * 
 * @param input - Subject and context for decision
 * @param profileFetcher - Function to fetch profile data from repositories
 * @returns Decision output with explanation
 * 
 * @example
 * const result = await executeDecision(
 *   { subject: "0x123...", context: "allowlist.general" },
 *   fetchUnifiedProfile
 * )
 */
export async function executeDecision(
    input: DecideUseCaseInput,
    profileFetcher: (subject: string) => Promise<UnifiedProfileData>
): Promise<DecideUseCaseOutput> {
    // Step 1: Fetch profile data from repositories
    const profileData = await profileFetcher(input.subject)

    // Step 2: Normalize signals
    const signals = normalizeSignals(profileData)

    // Step 3: Evaluate rules and get decision
    const decision = decide(signals, input.context)

    // Step 4: Hash subject for privacy-preserving logging
    const subjectHash = hashSubject(input.subject)

    return {
        ...decision,
        subjectHash,
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Hash the subject identifier for privacy-preserving logging.
 * Uses a simple hash - in production, use SHA-256.
 */
function hashSubject(subject: string): string {
    // Simple hash for now - replace with crypto.subtle.digest in production
    let hash = 0
    for (let i = 0; i < subject.length; i++) {
        const char = subject.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return `subj_${Math.abs(hash).toString(16)}`
}

/**
 * Validate decision request input.
 */
export function validateDecideRequest(
    request: unknown
): { valid: true; data: DecideRequest } | { valid: false; error: string } {
    if (!request || typeof request !== "object") {
        return { valid: false, error: "Request body must be an object" }
    }

    const req = request as Record<string, unknown>

    if (!req.subject || typeof req.subject !== "string") {
        return { valid: false, error: "Missing or invalid 'subject' field" }
    }

    if (!req.context || typeof req.context !== "string") {
        return { valid: false, error: "Missing or invalid 'context' field" }
    }

    return {
        valid: true,
        data: {
            subject: req.subject,
            context: req.context,
        },
    }
}
