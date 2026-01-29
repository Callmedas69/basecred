"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ALL_RULES: () => ALL_RULES,
  BASE_CONFIDENCE: () => BASE_CONFIDENCE,
  CAPABILITY_ORDER: () => CAPABILITY_ORDER,
  DEFAULT_SIGNALS: () => DEFAULT_SIGNALS,
  ENGINE_VERSION: () => ENGINE_VERSION,
  TIER_ORDER: () => TIER_ORDER,
  calculateSignalCoverage: () => calculateSignalCoverage,
  capabilityGt: () => capabilityGt,
  capabilityGte: () => capabilityGte,
  capabilityLt: () => capabilityLt,
  capabilityLte: () => capabilityLte,
  decide: () => decide,
  executeDecision: () => executeDecision,
  getAllContexts: () => getAllContexts,
  getRuleById: () => getRuleById,
  getRulesForContext: () => getRulesForContext,
  mapConfidence: () => mapConfidence,
  normalizeSignals: () => normalizeSignals,
  tierGt: () => tierGt,
  tierGte: () => tierGte,
  tierLt: () => tierLt,
  tierLte: () => tierLte,
  validateDecideRequest: () => validateDecideRequest
});
module.exports = __toCommonJS(index_exports);

// src/types/tiers.ts
var TIER_ORDER = {
  VERY_LOW: 0,
  LOW: 1,
  NEUTRAL: 2,
  HIGH: 3,
  VERY_HIGH: 4
};
var CAPABILITY_ORDER = {
  NONE: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
  EXPERT: 3
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
  builder: "NONE",
  creator: "NONE",
  recencyDays: 0,
  spamRisk: "NEUTRAL",
  signalCoverage: 0
};

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
    when: (s) => s.builder === "EXPERT" || capabilityGte(s.builder, "ADVANCED") && tierGte(s.socialTrust, "HIGH"),
    decision: "ALLOW",
    reason: "Strong builder credibility with sufficient social trust",
    confidenceDelta: 30
  },
  {
    id: "allow_strong_creator",
    context: "allowlist.general",
    when: (s) => s.creator === "EXPERT" || capabilityGte(s.creator, "ADVANCED") && tierGte(s.socialTrust, "HIGH"),
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
    when: (s) => tierGte(s.trust, "HIGH") && tierGte(s.socialTrust, "HIGH") && (capabilityGte(s.builder, "INTERMEDIATE") || capabilityGte(s.creator, "INTERMEDIATE")),
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
    when: (s) => tierGte(s.trust, "NEUTRAL") && (capabilityGte(s.builder, "ADVANCED") || capabilityGte(s.creator, "ADVANCED")),
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
    when: (s) => tierGte(s.trust, "NEUTRAL") && tierGte(s.socialTrust, "NEUTRAL") && s.builder === "NONE" && s.creator === "NONE",
    decision: "ALLOW_WITH_LIMITS",
    reason: "New user with baseline trust - probationary access",
    confidenceDelta: -15
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
  VERY_HIGH: 40,
  // was 80
  HIGH: 20,
  // was 60
  NEUTRAL: 0,
  // was 40
  LOW: -20
  // was 20 (effectively unused since scores are 0+)
  // Below LOW → VERY_LOW
};
function normalizeEthosTrust(profile) {
  if (!profile) return null;
  let score;
  if (profile.data && typeof profile.data.score === "number") {
    score = profile.data.score;
  } else if (profile.availability === "available" && typeof profile.credibility_score === "number") {
    score = profile.credibility_score;
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
  if (profile.data && typeof profile.data.score === "number") return true;
  return profile.availability === "available";
}

// src/engine/normalizers/neynar.ts
var SOCIAL_TRUST_THRESHOLDS = {
  VERY_HIGH: 0.9,
  HIGH: 0.7,
  NEUTRAL: 0.4,
  LOW: 0.2
  // Below LOW → VERY_LOW
};
var SPAM_RISK_THRESHOLDS = {
  VERY_LOW: 0.8,
  // high quality = very low spam risk
  LOW: 0.6,
  NEUTRAL: 0.4,
  HIGH: 0.2
  // Below HIGH → VERY_HIGH spam risk
};
function normalizeNeynarSocialTrust(user) {
  if (!user) return null;
  let score;
  if (user.data && typeof user.data.userScore === "number") {
    score = user.data.userScore;
  } else if (user.farcaster_user_score !== void 0) {
    score = user.farcaster_user_score;
  }
  if (score === void 0) return null;
  if (score >= SOCIAL_TRUST_THRESHOLDS.VERY_HIGH) return "VERY_HIGH";
  if (score >= SOCIAL_TRUST_THRESHOLDS.HIGH) return "HIGH";
  if (score >= SOCIAL_TRUST_THRESHOLDS.NEUTRAL) return "NEUTRAL";
  if (score >= SOCIAL_TRUST_THRESHOLDS.LOW) return "LOW";
  return "VERY_LOW";
}
function normalizeNeynarSpamRisk(user) {
  if (!user) return null;
  let score;
  if (user.data && typeof user.data.userScore === "number") {
    score = user.data.userScore;
  } else if (user.farcaster_user_score !== void 0) {
    score = user.farcaster_user_score;
  }
  if (score === void 0) return null;
  if (score >= SPAM_RISK_THRESHOLDS.VERY_LOW) return "VERY_LOW";
  if (score >= SPAM_RISK_THRESHOLDS.LOW) return "LOW";
  if (score >= SPAM_RISK_THRESHOLDS.NEUTRAL) return "NEUTRAL";
  if (score >= SPAM_RISK_THRESHOLDS.HIGH) return "HIGH";
  return "VERY_HIGH";
}
function isNeynarAvailable(user) {
  if (!user) return false;
  if (user.data && typeof user.data.userScore === "number") return true;
  return user.farcaster_user_score !== void 0;
}

// src/engine/normalizers/talent.ts
var TALENT_THRESHOLDS = {
  EXPERT: 80,
  ADVANCED: 50,
  INTERMEDIATE: 20
  // Below INTERMEDIATE → NONE
};
function normalizeTalentBuilder(profile) {
  if (!profile) return "NONE";
  let score;
  if (profile.data && typeof profile.data.builderScore === "number") {
    score = profile.data.builderScore;
  } else if (profile.builder && profile.builder.availability === "available" && typeof profile.builder.score === "number") {
    score = profile.builder.score;
  }
  if (score === void 0) return "NONE";
  if (score >= TALENT_THRESHOLDS.EXPERT) return "EXPERT";
  if (score >= TALENT_THRESHOLDS.ADVANCED) return "ADVANCED";
  if (score >= TALENT_THRESHOLDS.INTERMEDIATE) return "INTERMEDIATE";
  return "NONE";
}
function normalizeTalentCreator(profile) {
  if (!profile) return "NONE";
  let score;
  if (profile.data && typeof profile.data.creatorScore === "number") {
    score = profile.data.creatorScore;
  } else if (profile.creator && profile.creator.availability === "available" && typeof profile.creator.score === "number") {
    score = profile.creator.score;
  }
  if (score === void 0) return "NONE";
  if (score >= TALENT_THRESHOLDS.EXPERT) return "EXPERT";
  if (score >= TALENT_THRESHOLDS.ADVANCED) return "ADVANCED";
  if (score >= TALENT_THRESHOLDS.INTERMEDIATE) return "INTERMEDIATE";
  return "NONE";
}
function isTalentBuilderAvailable(profile) {
  if (!profile) return false;
  if (profile.data && typeof profile.data.builderScore === "number") return true;
  return profile.builder && profile.builder.availability === "available";
}
function isTalentCreatorAvailable(profile) {
  if (!profile) return false;
  if (profile.data && typeof profile.data.creatorScore === "number") return true;
  return profile.creator && profile.creator.availability === "available";
}

// src/engine/normalizers/index.ts
function normalizeSignals(profile) {
  const coverage = calculateSignalCoverage(profile);
  const trust = normalizeEthosTrust(profile.ethos) ?? "NEUTRAL";
  const socialTrust = normalizeNeynarSocialTrust(profile.neynar) ?? "NEUTRAL";
  const spamRisk = normalizeNeynarSpamRisk(profile.neynar) ?? "NEUTRAL";
  const builder = normalizeTalentBuilder(profile.talent);
  const creator = normalizeTalentCreator(profile.talent);
  const recencyDays = calculateRecencyDays(profile.lastActivityAt);
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
    neynar: 0.3,
    talentBuilder: 0.2,
    talentCreator: 0.2
  };
  let coverage = 0;
  if (isEthosAvailable(profile.ethos)) {
    coverage += weights.ethos;
  }
  if (isNeynarAvailable(profile.neynar)) {
    coverage += weights.neynar;
  }
  if (isTalentBuilderAvailable(profile.talent)) {
    coverage += weights.talentBuilder;
  }
  if (isTalentCreatorAvailable(profile.talent)) {
    coverage += weights.talentCreator;
  }
  return coverage;
}
function calculateRecencyDays(lastActivityAt) {
  if (!lastActivityAt) return 0;
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - lastActivityAt.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1e3 * 60 * 60 * 24));
}

// src/use-cases/decide.ts
async function executeDecision(input, profileFetcher) {
  const profileData = await profileFetcher(input.subject);
  const signals = normalizeSignals(profileData);
  const decision = decide(signals, input.context);
  const subjectHash = hashSubject(input.subject);
  return {
    ...decision,
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
  return {
    valid: true,
    data: {
      subject: req.subject,
      context: req.context
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ALL_RULES,
  BASE_CONFIDENCE,
  CAPABILITY_ORDER,
  DEFAULT_SIGNALS,
  ENGINE_VERSION,
  TIER_ORDER,
  calculateSignalCoverage,
  capabilityGt,
  capabilityGte,
  capabilityLt,
  capabilityLte,
  decide,
  executeDecision,
  getAllContexts,
  getRuleById,
  getRulesForContext,
  mapConfidence,
  normalizeSignals,
  tierGt,
  tierGte,
  tierLt,
  tierLte,
  validateDecideRequest
});
