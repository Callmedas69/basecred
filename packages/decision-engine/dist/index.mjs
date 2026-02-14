// src/types/tiers.ts
var TIER_ORDER = {
  VERY_LOW: 0,
  LOW: 1,
  NEUTRAL: 2,
  HIGH: 3,
  VERY_HIGH: 4
};
var CAPABILITY_ORDER = {
  EXPLORER: 0,
  BUILDER: 1,
  EXPERT: 2,
  ELITE: 3
};
function tierGte(a, b) {
  return TIER_ORDER[a] >= TIER_ORDER[b];
}
function tierLt(a, b) {
  return TIER_ORDER[a] < TIER_ORDER[b];
}
function tierGt(a, b) {
  return TIER_ORDER[a] > TIER_ORDER[b];
}
function tierLte(a, b) {
  return TIER_ORDER[a] <= TIER_ORDER[b];
}
function capabilityGte(a, b) {
  return CAPABILITY_ORDER[a] >= CAPABILITY_ORDER[b];
}
function capabilityLt(a, b) {
  return CAPABILITY_ORDER[a] < CAPABILITY_ORDER[b];
}
function capabilityGt(a, b) {
  return CAPABILITY_ORDER[a] > CAPABILITY_ORDER[b];
}
function capabilityLte(a, b) {
  return CAPABILITY_ORDER[a] <= CAPABILITY_ORDER[b];
}

// src/types/signals.ts
var DEFAULT_SIGNALS = {
  trust: "NEUTRAL",
  socialTrust: "NEUTRAL",
  builder: "EXPLORER",
  creator: "EXPLORER",
  recencyDays: 0,
  spamRisk: "NEUTRAL",
  signalCoverage: 0
};

// src/types/decisions.ts
var VALID_CONTEXTS = [
  "allowlist.general",
  "apply",
  "comment",
  "publish",
  "governance.vote"
];

// src/encoding/context.ts
var CONTEXT_ID_MAP = {
  "allowlist.general": 0,
  "comment": 1,
  "publish": 2,
  "apply": 3,
  "governance.vote": 4
};
var ID_TO_CONTEXT = {
  0: "allowlist.general",
  1: "comment",
  2: "publish",
  3: "apply",
  4: "governance.vote"
};
function encodeContextId(context) {
  const id = CONTEXT_ID_MAP[context];
  if (id === void 0) {
    throw new Error(`Unknown context: ${context}`);
  }
  return id;
}
function decodeContextId(id) {
  const context = ID_TO_CONTEXT[id];
  if (context === void 0) {
    throw new Error(`Unknown context ID: ${id}`);
  }
  return context;
}
function contextToBytes32(context) {
  const id = encodeContextId(context);
  return `0x${id.toString(16).padStart(64, "0")}`;
}

// src/encoding/decision.ts
var DECISION_VALUE_MAP = {
  DENY: 0,
  ALLOW_WITH_LIMITS: 1,
  ALLOW: 2
};
var VALUE_TO_DECISION = {
  0: "DENY",
  1: "ALLOW_WITH_LIMITS",
  2: "ALLOW"
};
function encodeDecision(decision) {
  const value = DECISION_VALUE_MAP[decision];
  if (value === void 0) {
    throw new Error(`Unknown decision: ${decision}`);
  }
  return value;
}
function decodeDecision(value) {
  const decision = VALUE_TO_DECISION[value];
  if (decision === void 0) {
    throw new Error(`Unknown decision value: ${value}`);
  }
  return decision;
}

// src/encoding/signals.ts
function encodeTier(tier) {
  return TIER_ORDER[tier];
}
function decodeTier(value) {
  const entries = Object.entries(TIER_ORDER);
  const entry = entries.find(([, v]) => v === value);
  if (!entry) {
    throw new Error(`Unknown tier value: ${value}`);
  }
  return entry[0];
}
function encodeCapability(capability) {
  return CAPABILITY_ORDER[capability];
}
function decodeCapability(value) {
  const entries = Object.entries(CAPABILITY_ORDER);
  const entry = entries.find(([, v]) => v === value);
  if (!entry) {
    throw new Error(`Unknown capability value: ${value}`);
  }
  return entry[0];
}
function signalCoverageToBps(coverage) {
  if (coverage < 0 || coverage > 1) {
    throw new Error(`Signal coverage must be between 0 and 1, got: ${coverage}`);
  }
  return Math.round(coverage * 1e4);
}
function bpsToSignalCoverage(bps) {
  if (bps < 0 || bps > 1e4) {
    throw new Error(`Basis points must be between 0 and 10000, got: ${bps}`);
  }
  return bps / 1e4;
}
function encodeSignalsForCircuit(signals) {
  return {
    trust: encodeTier(signals.trust),
    socialTrust: encodeTier(signals.socialTrust),
    builder: encodeCapability(signals.builder),
    creator: encodeCapability(signals.creator),
    recencyDays: signals.recencyDays,
    spamRisk: encodeTier(signals.spamRisk),
    signalCoverageBps: signalCoverageToBps(signals.signalCoverage)
  };
}

// src/encoding/policyHash.ts
var BN254_FIELD_ORDER = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
function stripPolicyHashPrefix(hash) {
  if (hash.startsWith("sha256:")) {
    return hash.slice(7);
  }
  return hash;
}
function policyHashToFieldElement(hash) {
  const hexHash = stripPolicyHashPrefix(hash);
  if (!/^[0-9a-fA-F]+$/.test(hexHash)) {
    throw new Error(`Invalid hex in policy hash: ${hexHash}`);
  }
  const value = BigInt("0x" + hexHash);
  return value % BN254_FIELD_ORDER;
}
function policyHashToBytes32(hash) {
  const fieldElement = policyHashToFieldElement(hash);
  return `0x${fieldElement.toString(16).padStart(64, "0")}`;
}
function isPolicyHashValidFieldElement(hash) {
  const hexHash = stripPolicyHashPrefix(hash);
  if (!/^[0-9a-fA-F]+$/.test(hexHash)) {
    return false;
  }
  const value = BigInt("0x" + hexHash);
  return value < BN254_FIELD_ORDER;
}

// src/encoding/proof.ts
function snarkjsProofToContract(proof) {
  return {
    a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
    // B point coordinates are reversed in snarkjs output
    b: [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
    ],
    c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])]
  };
}
function snarkjsSignalsToContract(signals) {
  return signals.map((s) => BigInt(s));
}
function contractProofToStrings(proof) {
  return {
    a: [proof.a[0].toString(), proof.a[1].toString()],
    b: [
      [proof.b[0][0].toString(), proof.b[0][1].toString()],
      [proof.b[1][0].toString(), proof.b[1][1].toString()]
    ],
    c: [proof.c[0].toString(), proof.c[1].toString()]
  };
}
function stringProofToContract(proof) {
  return {
    a: [BigInt(proof.a[0]), BigInt(proof.a[1])],
    b: [
      [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
      [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])]
    ],
    c: [BigInt(proof.c[0]), BigInt(proof.c[1])]
  };
}

// src/encoding/subject.ts
import { createHash } from "crypto";
function subjectToBytes32(subject) {
  const normalized = subject.toLowerCase().trim();
  const hash = createHash("sha256").update(normalized).digest("hex");
  return `0x${hash}`;
}
function isValidBytes32(value) {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

// src/engine/rules/fallback.ts
var FALLBACK_RULES = [
  {
    id: "deny_no_signals",
    context: "*",
    when: (s) => s.signalCoverage === 0,
    decision: "DENY",
    reason: "No reputation signals available",
    confidenceDelta: -100
  },
  {
    id: "limit_partial_signals",
    context: "*",
    when: (s) => s.signalCoverage < 0.5,
    decision: "ALLOW_WITH_LIMITS",
    reason: "Insufficient signal coverage for full access",
    confidenceDelta: -30
  }
];

// src/engine/rules/hard-deny.ts
var HARD_DENY_RULES = [
  {
    id: "deny_spam",
    context: "*",
    when: (s) => s.spamRisk === "HIGH" || s.spamRisk === "VERY_HIGH",
    decision: "DENY",
    reason: "High spam risk detected",
    confidenceDelta: -100
  },
  {
    id: "deny_low_social_trust",
    context: "*",
    when: (s) => tierLt(s.socialTrust, "NEUTRAL"),
    decision: "DENY",
    reason: "Social trust below acceptable threshold",
    confidenceDelta: -100
  },
  {
    id: "deny_critical_trust",
    context: "*",
    when: (s) => s.trust === "VERY_LOW",
    decision: "DENY",
    reason: "Critical trust risk detected",
    confidenceDelta: -100
  }
];

// src/engine/rules/allow.ts
var ALLOW_RULES = [
  // =========================================================================
  // Context: allowlist.general
  // =========================================================================
  {
    id: "allow_strong_builder",
    context: "allowlist.general",
    when: (s) => s.builder === "ELITE" || capabilityGte(s.builder, "EXPERT") && tierGte(s.socialTrust, "HIGH"),
    decision: "ALLOW",
    reason: "Strong builder credibility with sufficient social trust",
    confidenceDelta: 30
  },
  {
    id: "allow_strong_creator",
    context: "allowlist.general",
    when: (s) => s.creator === "ELITE" || capabilityGte(s.creator, "EXPERT") && tierGte(s.socialTrust, "HIGH"),
    decision: "ALLOW",
    reason: "Strong creator credibility with sufficient social trust",
    confidenceDelta: 30
  },
  {
    id: "allow_high_trust",
    context: "allowlist.general",
    when: (s) => tierGte(s.trust, "HIGH") && tierGte(s.socialTrust, "HIGH"),
    decision: "ALLOW",
    reason: "High trust across multiple reputation systems",
    confidenceDelta: 25
  },
  // =========================================================================
  // Context: comment
  // =========================================================================
  {
    id: "allow_comment_trusted",
    context: "comment",
    when: (s) => tierGte(s.trust, "NEUTRAL") && tierGte(s.socialTrust, "NEUTRAL"),
    decision: "ALLOW",
    reason: "Sufficient trust for commenting",
    confidenceDelta: 15
  },
  // =========================================================================
  // Context: publish
  // =========================================================================
  {
    id: "allow_publish_verified",
    context: "publish",
    when: (s) => tierGte(s.trust, "HIGH") && tierGte(s.socialTrust, "HIGH") && (capabilityGte(s.builder, "BUILDER") || capabilityGte(s.creator, "BUILDER")),
    decision: "ALLOW",
    reason: "Verified publisher with demonstrated capability",
    confidenceDelta: 25
  },
  // =========================================================================
  // Context: apply (job applications, grants, etc.)
  // =========================================================================
  {
    id: "allow_apply_qualified",
    context: "apply",
    when: (s) => tierGte(s.trust, "NEUTRAL") && (capabilityGte(s.builder, "EXPERT") || capabilityGte(s.creator, "EXPERT")),
    decision: "ALLOW",
    reason: "Qualified applicant with demonstrated skills",
    confidenceDelta: 20
  },
  // =========================================================================
  // Context: governance.vote
  // =========================================================================
  {
    id: "allow_governance_vote",
    context: "governance.vote",
    when: (s) => tierGte(s.trust, "HIGH") && tierGte(s.socialTrust, "NEUTRAL") && s.recencyDays <= 30,
    decision: "ALLOW",
    reason: "Active, trusted member eligible for governance",
    confidenceDelta: 20
  }
];

// src/engine/rules/allow-with-limits.ts
var ALLOW_WITH_LIMITS_RULES = [
  // =========================================================================
  // Context: allowlist.general
  // =========================================================================
  {
    id: "probation_inactive",
    context: "allowlist.general",
    when: (s) => tierGte(s.trust, "NEUTRAL") && s.recencyDays > 14,
    decision: "ALLOW_WITH_LIMITS",
    reason: "Trustworthy but recently inactive - limited access granted",
    confidenceDelta: -10
  },
  {
    id: "probation_new_user",
    context: "allowlist.general",
    when: (s) => tierGte(s.trust, "NEUTRAL") && tierGte(s.socialTrust, "NEUTRAL") && s.builder === "EXPLORER" && s.creator === "EXPLORER",
    decision: "ALLOW_WITH_LIMITS",
    reason: "New user with baseline trust - starting at medium confidence",
    confidenceDelta: 0
  },
  {
    id: "probation_mixed_signals",
    context: "allowlist.general",
    when: (s) => tierGte(s.trust, "HIGH") && tierGte(s.socialTrust, "LOW"),
    decision: "ALLOW_WITH_LIMITS",
    reason: "High ability but mixed social signals - limited access",
    confidenceDelta: -10
  },
  // =========================================================================
  // Context: comment
  // =========================================================================
  {
    id: "limit_comment_new",
    context: "comment",
    when: (s) => tierGte(s.trust, "LOW") && s.signalCoverage >= 0.5,
    decision: "ALLOW_WITH_LIMITS",
    reason: "New user - rate-limited commenting allowed",
    confidenceDelta: -5
  },
  // =========================================================================
  // Context: publish
  // =========================================================================
  {
    id: "limit_publish_unverified",
    context: "publish",
    when: (s) => tierGte(s.trust, "NEUTRAL") && tierGte(s.socialTrust, "NEUTRAL"),
    decision: "ALLOW_WITH_LIMITS",
    reason: "Baseline trust - publishing with review queue",
    confidenceDelta: -10
  },
  // =========================================================================
  // Context: governance.vote
  // =========================================================================
  {
    id: "limit_governance_inactive",
    context: "governance.vote",
    when: (s) => tierGte(s.trust, "HIGH") && s.recencyDays > 30 && s.recencyDays <= 90,
    decision: "ALLOW_WITH_LIMITS",
    reason: "Trusted but inactive - reduced voting weight",
    confidenceDelta: -15
  }
];

// src/engine/rules/index.ts
var ALL_RULES = [
  ...FALLBACK_RULES,
  ...HARD_DENY_RULES,
  ...ALLOW_RULES,
  ...ALLOW_WITH_LIMITS_RULES
];
function isHardDenyRule(id) {
  return HARD_DENY_RULES.some((rule) => rule.id === id);
}
function getRulesForContext(context) {
  return ALL_RULES.filter(
    (rule) => rule.context === "*" || rule.context === context
  );
}
function getRuleById(id) {
  return ALL_RULES.find((rule) => rule.id === id);
}
function getAllContexts() {
  const contexts = /* @__PURE__ */ new Set();
  for (const rule of ALL_RULES) {
    if (rule.context !== "*") {
      contexts.add(rule.context);
    }
  }
  return Array.from(contexts);
}

// src/engine/confidence.ts
var CONFIDENCE_THRESHOLDS = {
  VERY_HIGH: 80,
  HIGH: 60,
  MEDIUM: 40
  // Below MEDIUM → LOW
};
function mapConfidence(numericConfidence) {
  if (numericConfidence >= CONFIDENCE_THRESHOLDS.VERY_HIGH) return "VERY_HIGH";
  if (numericConfidence >= CONFIDENCE_THRESHOLDS.HIGH) return "HIGH";
  if (numericConfidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "MEDIUM";
  return "LOW";
}
var BASE_CONFIDENCE = 50;

// src/engine/decide.ts
var ENGINE_VERSION = "v1";
function decide(signals, context) {
  for (const rule of FALLBACK_RULES) {
    if (matchesContext(rule, context) && rule.when(signals)) {
      return finalize(rule, BASE_CONFIDENCE + rule.confidenceDelta);
    }
  }
  for (const rule of HARD_DENY_RULES) {
    if (matchesContext(rule, context) && rule.when(signals)) {
      return finalize(rule, BASE_CONFIDENCE + rule.confidenceDelta);
    }
  }
  for (const rule of ALLOW_RULES) {
    if (matchesContext(rule, context) && rule.when(signals)) {
      return finalize(rule, BASE_CONFIDENCE + rule.confidenceDelta);
    }
  }
  for (const rule of ALLOW_WITH_LIMITS_RULES) {
    if (matchesContext(rule, context) && rule.when(signals)) {
      return finalize(rule, BASE_CONFIDENCE + rule.confidenceDelta);
    }
  }
  return {
    decision: "DENY",
    confidence: "LOW",
    constraints: [],
    retryAfter: null,
    ruleIds: [],
    version: ENGINE_VERSION,
    explain: ["No rule satisfied for this context"]
  };
}
function matchesContext(rule, context) {
  return rule.context === "*" || rule.context === context;
}
function finalize(rule, numericConfidence) {
  return {
    decision: rule.decision,
    confidence: mapConfidence(numericConfidence),
    constraints: getConstraintsForRule(rule),
    retryAfter: null,
    ruleIds: [rule.id],
    version: ENGINE_VERSION,
    explain: [rule.reason]
  };
}
function getConstraintsForRule(rule) {
  if (rule.decision !== "ALLOW_WITH_LIMITS") {
    return [];
  }
  const constraintMap = {
    probation_inactive: ["reduced_access", "activity_required"],
    probation_new_user: ["probation_period", "limited_actions"],
    probation_mixed_signals: ["review_required"],
    limit_partial_signals: ["reduced_access"],
    limit_comment_new: ["rate_limited"],
    limit_publish_unverified: ["review_queue"],
    limit_governance_inactive: ["reduced_weight"]
  };
  return constraintMap[rule.id] ?? ["limited_access"];
}

// src/engine/normalizers/ethos.ts
var ETHOS_THRESHOLDS = {
  VERY_HIGH: 1800,
  // Distinguished+
  HIGH: 1250,
  // Established - Exemplary
  NEUTRAL: 900,
  // Neutral - Known
  LOW: 550
  // Questionable
  // Below LOW → VERY_LOW (Untrusted)
};
function normalizeEthosTrust(profile) {
  if (!profile) return null;
  let score;
  if (profile.data && typeof profile.data.score === "number") {
    score = profile.data.score;
  }
  if (score === void 0) return null;
  if (score >= ETHOS_THRESHOLDS.VERY_HIGH) return "VERY_HIGH";
  if (score >= ETHOS_THRESHOLDS.HIGH) return "HIGH";
  if (score >= ETHOS_THRESHOLDS.NEUTRAL) return "NEUTRAL";
  if (score >= ETHOS_THRESHOLDS.LOW) return "LOW";
  return "VERY_LOW";
}
function isEthosAvailable(profile) {
  if (!profile) return false;
  return !!(profile.data && typeof profile.data.score === "number");
}

// src/engine/normalizers/neynar.ts
var SOCIAL_TRUST_THRESHOLDS = {
  VERY_HIGH: 0.85,
  HIGH: 0.6,
  NEUTRAL: 0.3,
  LOW: 0.15
  // Below LOW → VERY_LOW
};
var SPAM_RISK_THRESHOLDS = {
  VERY_LOW: 0.7,
  // high quality = very low spam risk
  LOW: 0.5,
  NEUTRAL: 0.3,
  HIGH: 0.15
  // Below HIGH → VERY_HIGH spam risk
};
function normalizeNeynarSocialTrust(profile) {
  if (!profile) return null;
  let score;
  if (profile.data && typeof profile.data.userScore === "number") {
    score = profile.data.userScore;
  }
  if (score === void 0) return null;
  if (score >= SOCIAL_TRUST_THRESHOLDS.VERY_HIGH) return "VERY_HIGH";
  if (score >= SOCIAL_TRUST_THRESHOLDS.HIGH) return "HIGH";
  if (score >= SOCIAL_TRUST_THRESHOLDS.NEUTRAL) return "NEUTRAL";
  if (score >= SOCIAL_TRUST_THRESHOLDS.LOW) return "LOW";
  return "VERY_LOW";
}
function normalizeNeynarSpamRisk(profile) {
  if (!profile) return null;
  let score;
  if (profile.data && typeof profile.data.userScore === "number") {
    score = profile.data.userScore;
  }
  if (score === void 0) return null;
  if (score >= SPAM_RISK_THRESHOLDS.VERY_LOW) return "VERY_LOW";
  if (score >= SPAM_RISK_THRESHOLDS.LOW) return "LOW";
  if (score >= SPAM_RISK_THRESHOLDS.NEUTRAL) return "NEUTRAL";
  if (score >= SPAM_RISK_THRESHOLDS.HIGH) return "HIGH";
  return "VERY_HIGH";
}
function isNeynarAvailable(profile) {
  if (!profile) return false;
  return !!(profile.data && typeof profile.data.userScore === "number");
}

// src/engine/normalizers/talent.ts
var TALENT_THRESHOLDS = {
  BUILDER: 60,
  EXPERT: 140,
  ELITE: 220
};
function normalizeScoreToCapability(score) {
  if (score >= TALENT_THRESHOLDS.ELITE) return "ELITE";
  if (score >= TALENT_THRESHOLDS.EXPERT) return "EXPERT";
  if (score >= TALENT_THRESHOLDS.BUILDER) return "BUILDER";
  return "EXPLORER";
}
function normalizeTalentBuilder(profile) {
  if (!profile) return "EXPLORER";
  let score;
  if (profile.data && typeof profile.data.builderScore === "number") {
    score = profile.data.builderScore;
  }
  if (score === void 0) return "EXPLORER";
  return normalizeScoreToCapability(score);
}
function normalizeTalentCreator(profile) {
  if (!profile) return "EXPLORER";
  let score;
  if (profile.data && typeof profile.data.creatorScore === "number") {
    score = profile.data.creatorScore;
  }
  if (score === void 0) return "EXPLORER";
  return normalizeScoreToCapability(score);
}
function isTalentBuilderAvailable(profile) {
  if (!profile) return false;
  return !!(profile.data && typeof profile.data.builderScore === "number");
}
function isTalentCreatorAvailable(profile) {
  if (!profile) return false;
  return !!(profile.data && typeof profile.data.creatorScore === "number");
}

// src/engine/normalizers/index.ts
function normalizeSignals(profile) {
  const coverage = calculateSignalCoverage(profile);
  const trust = normalizeEthosTrust(profile.ethos) ?? "NEUTRAL";
  const socialTrust = normalizeNeynarSocialTrust(profile.farcaster) ?? "NEUTRAL";
  const spamRisk = normalizeNeynarSpamRisk(profile.farcaster) ?? "NEUTRAL";
  const builder = normalizeTalentBuilder(profile.talent ?? null);
  const creator = normalizeTalentCreator(profile.talent ?? null);
  const recencyDays = calculateRecencyDays(profile);
  return {
    trust,
    socialTrust,
    builder,
    creator,
    recencyDays,
    spamRisk,
    signalCoverage: coverage
  };
}
function calculateSignalCoverage(profile) {
  const weights = {
    ethos: 0.3,
    farcaster: 0.3,
    talentBuilder: 0.2,
    talentCreator: 0.2
  };
  let coverage = 0;
  if (isEthosAvailable(profile.ethos)) {
    coverage += weights.ethos;
  }
  if (isNeynarAvailable(profile.farcaster ?? null)) {
    coverage += weights.farcaster;
  }
  if (isTalentBuilderAvailable(profile.talent ?? null)) {
    coverage += weights.talentBuilder;
  }
  if (isTalentCreatorAvailable(profile.talent ?? null)) {
    coverage += weights.talentCreator;
  }
  return coverage;
}
function calculateRecencyDays(profile) {
  const daysAgo = profile.recency?.lastUpdatedDaysAgo;
  if (typeof daysAgo === "number") {
    return daysAgo < 0 ? 0 : Math.floor(daysAgo);
  }
  return 0;
}

// src/policies/hash.ts
import { createHash as createHash2 } from "crypto";
function computePolicyHash(input) {
  const payload = {
    context: input.context,
    normalizationVersion: input.normalizationVersion,
    thresholds: sortObject(input.thresholds)
  };
  const serialized = stableStringify(payload);
  const hash = createHash2("sha256").update(serialized).digest("hex");
  return `sha256:${hash}`;
}
function stableStringify(value) {
  return JSON.stringify(sortObject(value));
}
function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }
  if (value && typeof value === "object") {
    const record = value;
    return Object.keys(record).sort().reduce((acc, key) => {
      acc[key] = sortObject(record[key]);
      return acc;
    }, {});
  }
  return value;
}

// src/policies/v1.ts
var POLICY_INPUTS_V1 = [
  {
    context: "allowlist.general",
    normalizationVersion: "v1",
    thresholds: {
      trustMin: "HIGH",
      socialTrustMin: "HIGH",
      builderMin: "EXPERT",
      creatorMin: "EXPERT",
      spamRiskMax: "HIGH"
    }
  },
  {
    context: "comment",
    normalizationVersion: "v1",
    thresholds: {
      trustMin: "NEUTRAL",
      socialTrustMin: "NEUTRAL",
      spamRiskMax: "HIGH"
    }
  },
  {
    context: "publish",
    normalizationVersion: "v1",
    thresholds: {
      trustMin: "HIGH",
      socialTrustMin: "HIGH",
      builderMin: "BUILDER",
      creatorMin: "BUILDER",
      spamRiskMax: "HIGH"
    }
  },
  {
    context: "apply",
    normalizationVersion: "v1",
    thresholds: {
      trustMin: "NEUTRAL",
      builderMin: "EXPERT",
      creatorMin: "EXPERT",
      spamRiskMax: "HIGH"
    }
  },
  {
    context: "governance.vote",
    normalizationVersion: "v1",
    thresholds: {
      trustMin: "HIGH",
      socialTrustMin: "NEUTRAL",
      recencyDaysMax: 30,
      spamRiskMax: "HIGH"
    }
  }
];
var POLICIES_V1 = POLICY_INPUTS_V1.map((policy) => ({
  ...policy,
  policyHash: computePolicyHash(policy)
}));

// src/repositories/inMemoryPolicyRepository.ts
var InMemoryPolicyRepository = class {
  policies;
  constructor(policies = POLICIES_V1) {
    this.policies = new Map(policies.map((policy) => [policy.context, policy]));
  }
  async getPolicyByContext(context) {
    return this.policies.get(context) ?? null;
  }
};

// src/engine/progression.ts
function deriveAccessStatus(decision, options = {}) {
  if (decision === "ALLOW") {
    return "eligible";
  }
  if (decision === "ALLOW_WITH_LIMITS") {
    return "limited";
  }
  if (options.isHardDeny) {
    return "blocked";
  }
  return "not_ready";
}
function resolveBlockingFactors(signals) {
  return {
    // Trust is considered ready when not at the very bottom tier
    trust: signals.trust !== "VERY_LOW",
    // Social trust is ready when not below NEUTRAL
    socialTrust: signals.socialTrust !== "VERY_LOW",
    // Builder/creator considered ready from mid-tier upwards
    builder: signals.builder !== "EXPLORER",
    creator: signals.creator !== "EXPLORER",
    // Spam risk is acceptable when not in the top risk tiers
    spamRisk: signals.spamRisk !== "VERY_HIGH" && signals.spamRisk !== "HIGH",
    // Signal coverage is considered ready when we have most signals
    signalCoverage: signals.signalCoverage >= 0.8
  };
}
var CONTEXT_REQUIREMENTS = {
  "allowlist.general": ["trust", "builder", "creator"],
  apply: ["trust"],
  comment: ["spamRisk", "socialTrust"],
  publish: ["creator", "spamRisk"],
  "governance.vote": ["trust", "socialTrust"]
};
function deriveBlockingFactorsForContext(context, snapshot) {
  const requiredFactors = CONTEXT_REQUIREMENTS[context] ?? [];
  const blocking = [];
  for (const factor of requiredFactors) {
    if (!snapshot[factor]) {
      blocking.push(factor);
    }
  }
  return blocking;
}

// src/use-cases/decide.ts
async function executeDecision(input, profileFetcher) {
  const profileData = await profileFetcher(input.subject);
  const signals = normalizeSignals(profileData);
  const decision = decide(signals, input.context);
  const isHardDeny = decision.ruleIds.some((id) => isHardDenyRule(id));
  const accessStatus = deriveAccessStatus(decision.decision, { isHardDeny });
  const blockingSnapshot = resolveBlockingFactors(signals);
  const blockingFactors = deriveBlockingFactorsForContext(
    input.context,
    blockingSnapshot
  );
  const subjectHash = hashSubject(input.subject);
  return {
    ...decision,
    accessStatus,
    blockingFactors,
    subjectHash
  };
}
function hashSubject(subject) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    const char = subject.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `subj_${Math.abs(hash).toString(16)}`;
}
function validateDecideRequest(request) {
  if (!request || typeof request !== "object") {
    return { valid: false, error: "Request body must be an object" };
  }
  const req = request;
  if (!req.subject || typeof req.subject !== "string") {
    return { valid: false, error: "Missing or invalid 'subject' field" };
  }
  if (!req.context || typeof req.context !== "string") {
    return { valid: false, error: "Missing or invalid 'context' field" };
  }
  const context = req.context;
  if (!VALID_CONTEXTS.includes(context)) {
    return {
      valid: false,
      error: `Invalid context. Must be one of: ${VALID_CONTEXTS.map((c) => `'${c}'`).join(", ")}`
    };
  }
  return {
    valid: true,
    data: {
      subject: req.subject,
      context
    }
  };
}

// src/use-cases/decide-with-proof.ts
async function executeDecisionWithProof(input, deps) {
  if (!VALID_CONTEXTS.includes(input.context)) {
    throw new Error(
      `Invalid context. Must be one of: ${VALID_CONTEXTS.map((c) => `'${c}'`).join(", ")}`
    );
  }
  const policy = await deps.policyRepository.getPolicyByContext(input.context);
  if (!policy) {
    throw new Error(`Policy not found for context '${input.context}'`);
  }
  if (input.publicInputs.policyHash !== policy.policyHash) {
    throw new Error("Policy hash mismatch");
  }
  const verified = await deps.proofVerifier.verify(input.proof, input.publicInputs);
  if (!verified.valid || !verified.signals) {
    throw new Error(verified.error || "Invalid proof");
  }
  const decision = decide(verified.signals, input.context);
  const isHardDeny = decision.ruleIds.some((id) => isHardDenyRule(id));
  const accessStatus = deriveAccessStatus(decision.decision, { isHardDeny });
  const blockingSnapshot = resolveBlockingFactors(verified.signals);
  const blockingFactors = deriveBlockingFactorsForContext(input.context, blockingSnapshot);
  const subjectHash = input.subject ? hashSubject2(input.subject) : void 0;
  return {
    ...decision,
    accessStatus,
    blockingFactors,
    subjectHash,
    policyHash: policy.policyHash
  };
}
function hashSubject2(subject) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    const char = subject.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `subj_${Math.abs(hash).toString(16)}`;
}

// src/use-cases/list-policies.ts
async function listPolicies(deps) {
  const contexts = [
    "allowlist.general",
    "apply",
    "comment",
    "publish",
    "governance.vote"
  ];
  const policies = await Promise.all(
    contexts.map((context) => deps.policyRepository.getPolicyByContext(context))
  );
  return policies.filter((policy) => Boolean(policy));
}
export {
  ALL_RULES,
  BASE_CONFIDENCE,
  BN254_FIELD_ORDER,
  CAPABILITY_ORDER,
  CONTEXT_ID_MAP,
  DECISION_VALUE_MAP,
  DEFAULT_SIGNALS,
  ENGINE_VERSION,
  InMemoryPolicyRepository,
  TIER_ORDER,
  VALID_CONTEXTS,
  bpsToSignalCoverage,
  calculateSignalCoverage,
  capabilityGt,
  capabilityGte,
  capabilityLt,
  capabilityLte,
  contextToBytes32,
  contractProofToStrings,
  decide,
  decodeCapability,
  decodeContextId,
  decodeDecision,
  decodeTier,
  encodeCapability,
  encodeContextId,
  encodeDecision,
  encodeSignalsForCircuit,
  encodeTier,
  executeDecision,
  executeDecisionWithProof,
  getAllContexts,
  getRuleById,
  getRulesForContext,
  isPolicyHashValidFieldElement,
  isValidBytes32,
  listPolicies,
  mapConfidence,
  normalizeSignals,
  policyHashToBytes32,
  policyHashToFieldElement,
  signalCoverageToBps,
  snarkjsProofToContract,
  snarkjsSignalsToContract,
  stringProofToContract,
  stripPolicyHashPrefix,
  subjectToBytes32,
  tierGt,
  tierGte,
  tierLt,
  tierLte,
  validateDecideRequest
};
