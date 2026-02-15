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
type Capability = "EXPLORER" | "BUILDER" | "EXPERT" | "ELITE";
/**
 * Explicit ordering for Capability comparisons (ascending)
 * EXPLORER (0) < BUILDER (1) < EXPERT (2) < ELITE (3)
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
 * Retail-facing access status derived from the authoritative decision.
 *
 * This is a global, non-decisional interpretation layer and MUST NOT
 * be used to change engine behavior or thresholds.
 */
type AccessStatus = "eligible" | "limited" | "not_ready" | "blocked";
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
    /**
     * Derived, retail-facing access status.
     *
     * This field is OPTIONAL and is populated by the progression layer.
     * It does not affect enforcement or core decision semantics.
     */
    accessStatus?: AccessStatus;
    /**
     * Context-aware factors currently blocking access.
     *
     * This is a high-level, fixable guidance list and MUST NOT expose
     * raw scores or implementation details.
     */
    blockingFactors?: string[];
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
 * All valid contexts where the decision engine can be invoked.
 * Centralizing this ensures we don't have "magic strings" scattered around.
 */
type DecisionContext = "allowlist.general" | "apply" | "comment" | "publish" | "governance.vote";
/**
 * Helper to check if a string is a valid context at runtime
 */
declare const VALID_CONTEXTS: DecisionContext[];
/**
 * Request body for POST /v1/decide
 */
interface DecideRequest {
    /** Wallet address or Farcaster FID */
    subject: string;
    /** Decision context (e.g., "allowlist.general") */
    context: DecisionContext;
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
    context: string | "*" | DecisionContext;
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
    context: string | DecisionContext;
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

interface ProofPublicInputs {
    policyHash: string;
    normalizationVersion?: string;
    context?: DecisionContext | string;
    thresholds?: Record<string, string | number>;
    [key: string]: unknown;
}
interface ProofPayload {
    proof: unknown;
}
interface VerifiedProof {
    valid: boolean;
    signals?: NormalizedSignals;
    error?: string;
}
interface ProofVerifier {
    verify: (proof: ProofPayload, publicInputs: ProofPublicInputs) => Promise<VerifiedProof>;
}

/**
 * Context ID Encoding/Decoding
 *
 * Maps DecisionContext strings to numeric IDs for circuit/contract use.
 * See: packages/contracts/circuits/CIRCUIT_SPEC.md
 */

/**
 * Context ID mappings (matches CIRCUIT_SPEC.md)
 */
declare const CONTEXT_ID_MAP: Record<DecisionContext, number>;
/**
 * Encode a DecisionContext to its numeric ID for circuit/contract use.
 *
 * @param context The decision context string
 * @returns The numeric context ID (0-4)
 * @throws Error if context is not valid
 */
declare function encodeContextId(context: DecisionContext): number;
/**
 * Decode a numeric context ID back to DecisionContext string.
 *
 * @param id The numeric context ID
 * @returns The DecisionContext string
 * @throws Error if ID is not valid
 */
declare function decodeContextId(id: number): DecisionContext;
/**
 * Convert a context ID to bytes32 format for on-chain use.
 * The contract expects context as bytes32(uint256(contextId)).
 *
 * @param context The decision context
 * @returns The context as 0x-prefixed bytes32 hex string
 */
declare function contextToBytes32(context: DecisionContext): `0x${string}`;

/**
 * Decision Value Encoding/Decoding
 *
 * Maps Decision strings to numeric values for circuit/contract use.
 * See: packages/contracts/circuits/CIRCUIT_SPEC.md
 */

/**
 * Decision value mappings (matches CIRCUIT_SPEC.md)
 */
declare const DECISION_VALUE_MAP: Record<Decision, number>;
/**
 * Encode a Decision to its numeric value for circuit/contract use.
 *
 * @param decision The decision string
 * @returns The numeric decision value (0-2)
 * @throws Error if decision is not valid
 */
declare function encodeDecision(decision: Decision): number;
/**
 * Decode a numeric decision value back to Decision string.
 *
 * @param value The numeric decision value
 * @returns The Decision string
 * @throws Error if value is not valid
 */
declare function decodeDecision(value: number): Decision;

/**
 * Signal Encoding Utilities
 *
 * Converts NormalizedSignals to circuit-compatible numeric values.
 * See: packages/contracts/circuits/CIRCUIT_SPEC.md
 */

/**
 * Circuit-compatible signal representation.
 * All values are numeric for ZK circuit consumption.
 */
interface CircuitSignals {
    /** Tier encoded as 0-4 */
    trust: number;
    /** Tier encoded as 0-4 */
    socialTrust: number;
    /** Capability encoded as 0-3 */
    builder: number;
    /** Capability encoded as 0-3 */
    creator: number;
    /** Days since last activity (uint) */
    recencyDays: number;
    /** Tier encoded as 0-4 */
    spamRisk: number;
    /** Signal coverage in basis points (0-10000) */
    signalCoverageBps: number;
}
/**
 * Encode a Tier to its numeric value for circuit use.
 * Uses the existing TIER_ORDER mapping.
 *
 * @param tier The tier string
 * @returns The numeric tier value (0-4)
 */
declare function encodeTier(tier: Tier): number;
/**
 * Decode a numeric value back to Tier.
 *
 * @param value The numeric tier value (0-4)
 * @returns The Tier string
 * @throws Error if value is not valid
 */
declare function decodeTier(value: number): Tier;
/**
 * Encode a Capability to its numeric value for circuit use.
 * Uses the existing CAPABILITY_ORDER mapping.
 *
 * @param capability The capability string
 * @returns The numeric capability value (0-3)
 */
declare function encodeCapability(capability: Capability): number;
/**
 * Decode a numeric value back to Capability.
 *
 * @param value The numeric capability value (0-3)
 * @returns The Capability string
 * @throws Error if value is not valid
 */
declare function decodeCapability(value: number): Capability;
/**
 * Convert signal coverage (0-1 decimal) to basis points (0-10000).
 *
 * @param coverage Signal coverage as decimal (0-1)
 * @returns Signal coverage in basis points (0-10000)
 */
declare function signalCoverageToBps(coverage: number): number;
/**
 * Convert basis points (0-10000) back to decimal coverage (0-1).
 *
 * @param bps Signal coverage in basis points (0-10000)
 * @returns Signal coverage as decimal (0-1)
 */
declare function bpsToSignalCoverage(bps: number): number;
/**
 * Encode all NormalizedSignals to circuit-compatible format.
 *
 * @param signals The normalized signals from the decision engine
 * @returns Circuit-compatible signal values
 */
declare function encodeSignalsForCircuit(signals: NormalizedSignals): CircuitSignals;

/**
 * Policy Hash Encoding Utilities
 *
 * Converts policy hash strings to circuit/contract-compatible field elements.
 * See: packages/contracts/circuits/CIRCUIT_SPEC.md
 */
/**
 * BN254 scalar field order (r).
 * Policy hashes must be reduced mod r to be valid field elements.
 * This is the same as the Groth16 scalar field.
 */
declare const BN254_FIELD_ORDER: bigint;
/**
 * Strip the "sha256:" prefix from a policy hash.
 *
 * @param hash Policy hash with or without prefix
 * @returns The raw hex hash without prefix
 */
declare function stripPolicyHashPrefix(hash: string): string;
/**
 * Convert a policy hash to a field element (bigint < BN254 field order).
 * The hash is interpreted as a big-endian unsigned integer and reduced mod r.
 *
 * @param hash Policy hash string (with or without sha256: prefix)
 * @returns The field element as bigint
 */
declare function policyHashToFieldElement(hash: string): bigint;
/**
 * Convert a policy hash to bytes32 format for on-chain use.
 * The field element is left-padded to 32 bytes.
 *
 * @param hash Policy hash string (with or without sha256: prefix)
 * @returns The policy hash as 0x-prefixed bytes32 hex string
 */
declare function policyHashToBytes32(hash: string): `0x${string}`;
/**
 * Check if a policy hash would fit in the BN254 field without reduction.
 * Useful for validation and debugging.
 *
 * @param hash Policy hash string (with or without sha256: prefix)
 * @returns true if the hash is already a valid field element
 */
declare function isPolicyHashValidFieldElement(hash: string): boolean;

/**
 * Proof Format Conversion Utilities
 *
 * Converts between snarkjs proof format and contract-compatible format.
 */
/**
 * snarkjs proof format (as returned by groth16.prove)
 */
interface SnarkjsProof {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
    curve: string;
}
/**
 * Contract-compatible proof format
 */
interface ContractProof {
    a: [bigint, bigint];
    b: [[bigint, bigint], [bigint, bigint]];
    c: [bigint, bigint];
}
/**
 * Convert snarkjs proof to contract-compatible format.
 * Handles the coordinate transformations required by the Groth16 verifier.
 *
 * Note: snarkjs outputs affine coordinates with a third element (1).
 * The contract expects only the x,y coordinates.
 * Also, the B point coordinates are swapped in the snarkjs output.
 *
 * @param proof The snarkjs proof object
 * @returns Contract-compatible proof with bigint values
 */
declare function snarkjsProofToContract(proof: SnarkjsProof): ContractProof;
/**
 * Convert public signals from snarkjs format to contract format.
 * snarkjs returns strings, contract expects bigints.
 *
 * @param signals Array of public signal strings
 * @returns Array of public signals as bigints
 */
declare function snarkjsSignalsToContract(signals: string[]): bigint[];
/**
 * Format proof for contract call (converts bigints to strings for JSON).
 * This is useful when sending proofs via API.
 */
interface ContractProofStrings {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
}
/**
 * Convert contract proof to string format for JSON serialization.
 *
 * @param proof The contract proof with bigint values
 * @returns Contract proof with string values
 */
declare function contractProofToStrings(proof: ContractProof): ContractProofStrings;
/**
 * Parse string proof back to contract format with bigints.
 *
 * @param proof The contract proof with string values
 * @returns Contract proof with bigint values
 */
declare function stringProofToContract(proof: ContractProofStrings): ContractProof;

/**
 * Subject Hash Encoding Utilities
 *
 * Converts subject identifiers to bytes32 format for on-chain use.
 */
/**
 * Hash a subject identifier (wallet address or FID) to bytes32.
 * Uses SHA-256 for consistent, collision-resistant hashing.
 *
 * @param subject The subject identifier (wallet address or FID)
 * @returns The subject as 0x-prefixed bytes32 hex string
 */
declare function subjectToBytes32(subject: string): `0x${string}`;
/**
 * Validate that a string is a valid bytes32 hex string.
 *
 * @param value The value to validate
 * @returns true if valid bytes32 format
 */
declare function isValidBytes32(value: string): value is `0x${string}`;

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
declare function decide(signals: NormalizedSignals, context: DecisionContext): DecisionOutput;

/**
 * Ethos Signal Normalizer (SDK schema)
 *
 * Maps Ethos credibility scores to trust Tier.
 * Ethos is the source of truth for long-term trust/credibility.
 */

interface EthosProfile {
    data?: {
        score?: number;
    };
    signals?: {
        hasNegativeReviews?: boolean;
        hasVouches?: boolean;
    };
    meta?: {
        firstSeenAt?: string | null;
        lastUpdatedAt?: string | null;
        activeSinceDays?: number | null;
        lastUpdatedDaysAgo?: number | null;
    };
}

/**
 * Farcaster Signal Normalizer (SDK schema)
 *
 * Maps Farcaster user quality to socialTrust and spamRisk Tiers.
 * Farcaster quality is sourced from the SDK `farcaster.data.userScore`.
 */

interface FarcasterProfile {
    data?: {
        /** Farcaster user quality score (0-1) */
        userScore?: number;
    };
    signals?: {
        passesQualityThreshold?: boolean;
    };
    meta?: {
        source?: string;
        scope?: string;
        lastUpdatedAt?: string | null;
        lastUpdatedDaysAgo?: number | null;
        updateCadence?: string;
        timeMeaning?: string;
    };
}

/**
 * Talent Protocol Signal Normalizer (SDK schema)
 *
 * Maps Talent Protocol builder / creator scores
 * into normalized Capability levels.
 *
 * Talent is treated as the source of truth.
 */

interface TalentProfile {
    data?: {
        builderScore?: number;
        builderRankPosition?: number | null;
        creatorScore?: number;
        creatorRankPosition?: number | null;
    };
    signals?: {
        verifiedBuilder?: boolean;
        verifiedCreator?: boolean;
    };
    meta?: {
        lastUpdatedAt?: string | null;
        lastUpdatedDaysAgo?: number | null;
    };
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
    identity?: {
        address?: string;
    };
    availability?: {
        ethos?: "available" | "not_found" | "unlinked" | "error";
        talent?: "available" | "not_found" | "unlinked" | "error";
        farcaster?: "available" | "not_found" | "unlinked" | "error";
    };
    ethos?: EthosProfile | null;
    talent?: TalentProfile | null;
    farcaster?: FarcasterProfile | null;
    recency?: {
        lastUpdatedDaysAgo?: number | null;
    };
}
/**
 * Normalize all signals from a unified profile.
 *
 * @param profile - Combined profile data from all providers
 * @returns NormalizedSignals ready for rule evaluation
 *
 * @example
 * const signals = normalizeSignals({
 *   ethos: { data: { score: 75 } },
 *   farcaster: { data: { userScore: 0.8 } },
 *   talent: { data: { builderScore: 60 } }
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
 * Progression & Explainability Layer
 *
 * This module provides a non-decisional, retail-facing interpretation of
 * authoritative engine outputs. It MUST NOT change rule thresholds, ordering,
 * or core decision behavior.
 */

/**
 * Snapshot of high-level readiness factors.
 *
 * This intentionally avoids exposing raw scores or tiers. Instead it reports
 * whether a factor is currently in a "ready" state for access progression.
 */
interface BlockingFactorSnapshot {
    trust: boolean;
    socialTrust: boolean;
    builder: boolean;
    creator: boolean;
    spamRisk: boolean;
    signalCoverage: boolean;
}
/**
 * Resolve global blocking-factor readiness from normalized signals.
 *
 * This function does NOT apply thresholds for decisions. It only reports
 * whether each factor is currently considered ready (true) or blocking (false)
 * at a coarse level suitable for UX.
 */
declare function resolveBlockingFactors(signals: NormalizedSignals): BlockingFactorSnapshot;
/**
 * Derive a list of context-aware blocking factors from a global snapshot.
 *
 * Only factors that:
 * - are required for the given context, and
 * - are currently not ready
 * will be returned.
 */
declare function deriveBlockingFactorsForContext(context: DecisionContext, snapshot: BlockingFactorSnapshot): string[];

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

interface PolicyDefinition {
    context: DecisionContext;
    policyHash: string;
    normalizationVersion: string;
    thresholds: Record<string, string | number>;
}
interface PolicyRepository {
    getPolicyByContext(context: DecisionContext): Promise<PolicyDefinition | null>;
}

declare class InMemoryPolicyRepository implements PolicyRepository {
    private readonly policies;
    constructor(policies?: PolicyDefinition[]);
    getPolicyByContext(context: DecisionContext): Promise<PolicyDefinition | null>;
}

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
    context: DecisionContext;
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

/**
 * ZK Decision Use Case
 *
 * Orchestrates proof-based decisions:
 * 1. Fetch policy by context
 * 2. Verify proof against public inputs
 * 3. Evaluate rules using verified signals
 * 4. Return decision output
 */

interface DecideWithProofUseCaseInput {
    subject?: string;
    context: DecisionContext;
    proof: ProofPayload;
    publicInputs: ProofPublicInputs;
}
interface DecideWithProofUseCaseDependencies {
    policyRepository: PolicyRepository;
    proofVerifier: ProofVerifier;
}
interface DecideWithProofUseCaseOutput extends DecisionOutput {
    subjectHash?: string;
    policyHash: string;
}
declare function executeDecisionWithProof(input: DecideWithProofUseCaseInput, deps: DecideWithProofUseCaseDependencies): Promise<DecideWithProofUseCaseOutput>;

interface ListPoliciesUseCaseDependencies {
    policyRepository: PolicyRepository;
}
declare function listPolicies(deps: ListPoliciesUseCaseDependencies): Promise<PolicyDefinition[]>;

export { ALL_RULES, type AccessStatus, BASE_CONFIDENCE, BN254_FIELD_ORDER, type BlockingFactorSnapshot, CAPABILITY_ORDER, CONTEXT_ID_MAP, type Capability, type CircuitSignals, type ConfidenceTier, type ContractProof, type ContractProofStrings, DECISION_VALUE_MAP, DEFAULT_SIGNALS, type DSLCondition, type DSLOperator, type DSLRule, type DecideRequest, type DecideUseCaseInput, type DecideUseCaseOutput, type DecideWithProofUseCaseDependencies, type DecideWithProofUseCaseInput, type DecideWithProofUseCaseOutput, type Decision, type DecisionContext, type DecisionError, type DecisionExplanation, type DecisionLog, type DecisionOutput, ENGINE_VERSION, InMemoryPolicyRepository, type ListPoliciesUseCaseDependencies, type NormalizedSignals, type PartialSignals, type PolicyDefinition, type PolicyRepository, type ProofPayload, type ProofPublicInputs, type ProofVerifier, type Rule, type Ruleset, type RulesetMetadata, type SnarkjsProof, TIER_ORDER, type Tier, type UnifiedProfileData, VALID_CONTEXTS, type VerifiedProof, bpsToSignalCoverage, calculateSignalCoverage, capabilityGt, capabilityGte, capabilityLt, capabilityLte, contextToBytes32, contractProofToStrings, decide, decodeCapability, decodeContextId, decodeDecision, decodeTier, deriveBlockingFactorsForContext, encodeCapability, encodeContextId, encodeDecision, encodeSignalsForCircuit, encodeTier, executeDecision, executeDecisionWithProof, getAllContexts, getRuleById, getRulesForContext, isPolicyHashValidFieldElement, isValidBytes32, listPolicies, mapConfidence, normalizeSignals, policyHashToBytes32, policyHashToFieldElement, resolveBlockingFactors, signalCoverageToBps, snarkjsProofToContract, snarkjsSignalsToContract, stringProofToContract, stripPolicyHashPrefix, subjectToBytes32, tierGt, tierGte, tierLt, tierLte, validateDecideRequest };
