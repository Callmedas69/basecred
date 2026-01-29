/**
 * Tier and Capability Types with Explicit Ordering
 *
 * These types represent normalized reputation levels and capabilities.
 * IMPORTANT: Never use string comparison (>=) on Tier values directly.
 * Always use tierGte(), tierLt(), or equivalent numeric comparison.
 */
type Tier = "VERY_LOW" | "LOW" | "NEUTRAL" | "HIGH" | "VERY_HIGH";
/**
 * Explicit ordering for Tier comparisons (ascending)
 * VERY_LOW (0) < LOW (1) < NEUTRAL (2) < HIGH (3) < VERY_HIGH (4)
 */
declare const TIER_ORDER: Record<Tier, number>;
type Capability = "NONE" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
/**
 * Explicit ordering for Capability comparisons (ascending)
 * NONE (0) < INTERMEDIATE (1) < ADVANCED (2) < EXPERT (3)
 */
declare const CAPABILITY_ORDER: Record<Capability, number>;
/**
 * Check if Tier a is greater than or equal to Tier b
 * @example tierGte("HIGH", "NEUTRAL") // true
 * @example tierGte("LOW", "HIGH") // false
 */
declare function tierGte(a: Tier, b: Tier): boolean;
/**
 * Check if Tier a is less than Tier b
 * @example tierLt("LOW", "HIGH") // true
 * @example tierLt("HIGH", "NEUTRAL") // false
 */
declare function tierLt(a: Tier, b: Tier): boolean;
/**
 * Check if Tier a is greater than Tier b
 */
declare function tierGt(a: Tier, b: Tier): boolean;
/**
 * Check if Tier a is less than or equal to Tier b
 */
declare function tierLte(a: Tier, b: Tier): boolean;
/**
 * Check if Capability a is greater than or equal to Capability b
 * @example capabilityGte("EXPERT", "ADVANCED") // true
 * @example capabilityGte("NONE", "INTERMEDIATE") // false
 */
declare function capabilityGte(a: Capability, b: Capability): boolean;
/**
 * Check if Capability a is less than Capability b
 */
declare function capabilityLt(a: Capability, b: Capability): boolean;
/**
 * Check if Capability a is greater than Capability b
 */
declare function capabilityGt(a: Capability, b: Capability): boolean;
/**
 * Check if Capability a is less than or equal to Capability b
 */
declare function capabilityLte(a: Capability, b: Capability): boolean;

/**
 * Normalized Signals Interface
 *
 * These signals exist ONLY at decision time and are NOT persisted.
 * They are derived on-demand from external reputation providers.
 */

/**
 * Normalized signals consumed by the Decision Engine rules.
 * All signals are derived from external providers:
 * - trust: Ethos credibility
 * - socialTrust: Neynar user quality
 * - builder: Talent Protocol builder score
 * - creator: Talent Protocol creator score
 * - spamRisk: Neynar spam detection
 */
interface NormalizedSignals {
    /** Aggregated long-term trust (derived from Ethos) */
    trust: Tier;
    /** Social legitimacy / spam risk (derived from Neynar) */
    socialTrust: Tier;
    /** Technical credibility (derived from Talent Protocol) */
    builder: Capability;
    /** Content / community credibility (derived from Talent Protocol) */
    creator: Capability;
    /** Days since last activity */
    recencyDays: number;
    /** Derived spam risk indicator (from Neynar) */
    spamRisk: Tier;
    /**
     * Percentage of signals successfully fetched (0-1)
     * Used by fallback rules to handle partial data
     */
    signalCoverage: number;
}
/**
 * Partial signals for when some providers are unavailable
 */
type PartialSignals = Partial<NormalizedSignals> & {
    signalCoverage: number;
};
/**
 * Default signals used when no data is available
 */
declare const DEFAULT_SIGNALS: NormalizedSignals;

/**
 * Rule Types and DSL Definitions
 *
 * Rules are the core of the Decision Engine.
 * They are deterministic, auditable, and versioned.
 */

type Decision = "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS";
/**
 * A rule that can be evaluated at runtime.
 * Rules are evaluated in priority order:
 * 1. Fallback rules (signal coverage)
 * 2. Hard-deny rules
 * 3. Allow rules
 * 4. Allow-with-limits rules
 * 5. Default deny
 */
interface Rule {
    /** Unique identifier for this rule */
    id: string;
    /**
     * Context where this rule applies.
     * Use "*" for global rules (apply to all contexts)
     */
    context: string | "*";
    /**
     * Condition function that determines if this rule matches.
     * Must be a pure function with no side effects.
     */
    when: (signals: NormalizedSignals) => boolean;
    /** The decision to return if this rule matches */
    decision: Decision;
    /** Human-readable explanation for this decision */
    reason: string;
    /**
     * Adjustment to confidence score.
     * Added to base confidence (50) to compute final confidence.
     */
    confidenceDelta: number;
}
/** Operators supported in DSL conditions */
type DSLOperator = ">=" | ">" | "==" | "<=" | "<" | "!=";
/**
 * A single condition in a DSL rule.
 * All conditions in a rule are combined with implicit AND.
 */
interface DSLCondition {
    /** Signal name to check (e.g., "trust", "builder") */
    signal: string;
    /** Comparison operator */
    operator: DSLOperator;
    /** Value to compare against */
    value: string | number;
}
/**
 * A rule expressed in the declarative DSL format.
 * This format is:
 * - JSON-serializable
 * - Auditable
 * - Hashable for ZK proofs
 */
interface DSLRule {
    /** Unique identifier */
    id: string;
    /** Version of this rule */
    version: string;
    /** Context where this rule applies */
    context: string;
    /**
     * Conditions to evaluate (implicit AND)
     * For OR logic, create separate rules
     */
    conditions: DSLCondition[];
    /** Logic operator (v1 only supports AND) */
    logic: "AND";
    /** Decision to return if all conditions match */
    decision: Decision;
    /** Confidence adjustment */
    confidenceDelta: number;
    /** Human-readable reason */
    reason: string;
}
/**
 * Metadata for a versioned ruleset.
 * Used for auditing and ZK verification.
 */
interface RulesetMetadata {
    /** Ruleset version (e.g., "v1.0.0") */
    version: string;
    /** SHA-256 hash of the ruleset for API/audit */
    sha256Hash: string;
    /** Poseidon hash for ZK circuits (optional) */
    poseidonHash?: string;
    /** Number of rules in this set */
    ruleCount: number;
    /** Timestamp when this ruleset was created */
    createdAt: number;
}
/**
 * A complete ruleset with metadata
 */
interface Ruleset {
    metadata: RulesetMetadata;
    rules: DSLRule[];
}

/**
 * Decision Output Types
 *
 * These types define the structure of decision responses
 * from the Decision Engine.
 */

/**
 * Categorical confidence tier for API responses.
 * Mapped from numeric confidence (base 50 + deltas).
 */
type ConfidenceTier = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
/**
 * Machine-readable decision output from the engine.
 * This is the primary response format for the /v1/decide API.
 */
interface DecisionOutput {
    /** The actual decision: ALLOW, DENY, or ALLOW_WITH_LIMITS */
    decision: Decision;
    /** Confidence level in this decision */
    confidence: ConfidenceTier;
    /**
     * Constraints applied when decision is ALLOW_WITH_LIMITS.
     * Empty array for ALLOW or DENY.
     */
    constraints: string[];
    /**
     * Seconds to wait before retrying (for rate-limited or temporary denials).
     * null if not applicable.
     */
    retryAfter: number | null;
    /** IDs of rules that contributed to this decision */
    ruleIds: string[];
    /** Engine version used for this decision */
    version: string;
    /** Human-readable explanation of the decision */
    explain: string[];
}
/**
 * Human-readable explanation format.
 * Optional enhancement to DecisionOutput.
 */
interface DecisionExplanation {
    /** One-line summary */
    summary: string;
    /** Detailed breakdown of factors */
    factors: string[];
}
/**
 * Decision log entry for auditing.
 * Does NOT include raw scores or signals (data minimization).
 */
interface DecisionLog {
    /** Hashed identity (for privacy) */
    subjectHash: string;
    /** Context where decision was made */
    context: string;
    /** The decision that was made */
    decision: Decision;
    /** Confidence tier */
    confidence: ConfidenceTier;
    /** Rule IDs that matched */
    ruleIds: string[];
    /** Signal coverage at decision time (for debugging) */
    signalCoverage: number;
    /** Unix timestamp */
    timestamp: number;
}
/**
 * Request body for POST /v1/decide
 */
interface DecideRequest {
    /** Wallet address or Farcaster FID */
    subject: string;
    /** Decision context (e.g., "allowlist.general") */
    context: string;
}
/**
 * Error response format
 */
interface DecisionError {
    /** Error code */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional details (optional) */
    details?: Record<string, unknown>;
}

/**
 * Confidence Mapping
 *
 * Maps numeric confidence scores to categorical tiers.
 * Base confidence is 50, modified by rule confidenceDelta values.
 */

/**
 * Map a numeric confidence score to a categorical tier.
 *
 * @param numericConfidence - Numeric confidence (base 50 + deltas)
 * @returns Categorical confidence tier
 *
 * @example
 * mapConfidence(80) // "VERY_HIGH"
 * mapConfidence(65) // "HIGH"
 * mapConfidence(45) // "MEDIUM"
 * mapConfidence(20) // "LOW"
 */
declare function mapConfidence(numericConfidence: number): ConfidenceTier;
/** Base confidence before any rule adjustments */
declare const BASE_CONFIDENCE = 50;

/**
 * Decision Engine Core
 *
 * The main decide() function that evaluates rules and produces decisions.
 * This is the heart of the BaseCred Decision Engine.
 *
 * Architecture:
 * - This module is BUSINESS LOGIC only
 * - It receives NormalizedSignals (from normalizers)
 * - It returns DecisionOutput (for API layer)
 * - It has NO knowledge of HTTP, databases, or external APIs
 */

/** Current engine version - included in all decision outputs */
declare const ENGINE_VERSION = "v1";
/**
 * Evaluate rules and produce a decision for the given signals and context.
 *
 * This function implements the 5-phase evaluation order:
 * 1. Fallback rules (signal coverage)
 * 2. Hard-deny rules (critical risks)
 * 3. Allow rules (positive signals)
 * 4. Allow-with-limits rules (conditional access)
 * 5. Default deny (no rule matched)
 *
 * First match wins - the engine returns immediately when a rule matches.
 *
 * @param signals - Normalized signals from reputation providers
 * @param context - Decision context (e.g., "allowlist.general")
 * @returns DecisionOutput with decision, confidence, and explanation
 *
 * @example
 * const decision = decide(signals, "allowlist.general")
 * // { decision: "ALLOW", confidence: "HIGH", ... }
 */
declare function decide(signals: NormalizedSignals, context: string): DecisionOutput;

/**
 * Ethos Signal Normalizer
 *
 * Maps Ethos credibility scores to trust Tier.
 * Ethos is the source of truth for long-term trust/credibility.
 */

type EthosAvailability = "available" | "not_found" | "unlinked" | "error";
interface EthosProfile {
    availability: EthosAvailability;
    credibility_score?: number;
    review_count?: number;
    vouch_count?: number;
}

/**
 * Neynar Signal Normalizer
 *
 * Maps Neynar user quality to socialTrust and spamRisk Tiers.
 * Neynar is the source of truth for Farcaster social behavior.
 */

interface NeynarUser {
    fid?: number;
    username?: string;
    display_name?: string;
    pfp_url?: string;
    /** Farcaster user quality score (0-1) */
    farcaster_user_score?: number;
    /** Follower count */
    follower_count?: number;
    /** Following count */
    following_count?: number;
    /** Whether the account is verified */
    verified?: boolean;
    /** Account creation timestamp */
    registered_at?: string;
}

/**
 * Talent Protocol Signal Normalizer
 *
 * Maps Talent Protocol builder/creator scores to Capability levels.
 * Talent is the source of truth for skills and abilities.
 */

type TalentAvailability = "available" | "not_found" | "unlinked" | "error";
interface TalentFacet {
    availability: TalentAvailability;
    score?: number;
    level?: string;
    last_updated_at?: string;
}
interface TalentProfile {
    builder: TalentFacet;
    creator: TalentFacet;
}

/**
 * Signal Normalizer Orchestrator
 *
 * Combines all individual normalizers into a unified NormalizedSignals object.
 * Calculates signal coverage based on available data.
 */

/**
 * Combined profile data from all providers.
 */
interface UnifiedProfileData {
    ethos: EthosProfile | any | null;
    neynar: NeynarUser | any | null;
    talent: TalentProfile | any | null;
    /** Timestamp of last activity (for recency calculation) */
    lastActivityAt?: Date | null;
}
/**
 * Normalize all signals from a unified profile.
 *
 * @param profile - Combined profile data from all providers
 * @returns NormalizedSignals ready for rule evaluation
 *
 * @example
 * const signals = normalizeSignals({
 *   ethos: { availability: "available", credibility_score: 75 },
 *   neynar: { farcaster_user_score: 0.8 },
 *   talent: { builder: { availability: "available", score: 60 } }
 * })
 */
declare function normalizeSignals(profile: UnifiedProfileData): NormalizedSignals;
/**
 * Calculate what percentage of signals are available.
 * Used by fallback rules to handle partial data gracefully.
 *
 * Weights:
 * - Ethos: 30% (primary trust signal)
 * - Neynar: 30% (social/spam signal)
 * - Talent Builder: 20%
 * - Talent Creator: 20%
 */
declare function calculateSignalCoverage(profile: UnifiedProfileData): number;

/**
 * Rule Registry
 *
 * Central export point for all rule sets.
 * Rules are organized by type and evaluation order.
 */

/**
 * All rules in evaluation order.
 * Useful for introspection, testing, and documentation.
 */
declare const ALL_RULES: Rule[];
/**
 * Get all rules for a specific context.
 */
declare function getRulesForContext(context: string): Rule[];
/**
 * Get rule by ID.
 */
declare function getRuleById(id: string): Rule | undefined;
/**
 * Get all unique contexts.
 */
declare function getAllContexts(): string[];

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

interface DecideUseCaseInput {
    /** Wallet address or Farcaster FID */
    subject: string;
    /** Decision context */
    context: string;
}
interface DecideUseCaseOutput extends DecisionOutput {
    /** Subject hash for logging (privacy-preserving) */
    subjectHash: string;
}
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
declare function executeDecision(input: DecideUseCaseInput, profileFetcher: (subject: string) => Promise<UnifiedProfileData>): Promise<DecideUseCaseOutput>;
/**
 * Validate decision request input.
 */
declare function validateDecideRequest(request: unknown): {
    valid: true;
    data: DecideRequest;
} | {
    valid: false;
    error: string;
};

export { ALL_RULES, BASE_CONFIDENCE, CAPABILITY_ORDER, type Capability, type ConfidenceTier, DEFAULT_SIGNALS, type DSLCondition, type DSLOperator, type DSLRule, type DecideRequest, type DecideUseCaseInput, type DecideUseCaseOutput, type Decision, type DecisionError, type DecisionExplanation, type DecisionLog, type DecisionOutput, ENGINE_VERSION, type NormalizedSignals, type PartialSignals, type Rule, type Ruleset, type RulesetMetadata, TIER_ORDER, type Tier, type UnifiedProfileData, calculateSignalCoverage, capabilityGt, capabilityGte, capabilityLt, capabilityLte, decide, executeDecision, getAllContexts, getRuleById, getRulesForContext, mapConfidence, normalizeSignals, tierGt, tierGte, tierLt, tierLte, validateDecideRequest };
