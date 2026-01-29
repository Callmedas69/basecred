---
sidebar_position: 4
---

# Rule Model

## Decision Contexts

Decisions are always evaluated within a **context**.

Examples:

- `allowlist.general`
- `comment`
- `publish`
- `apply`
- `governance.vote`

A rule **never applies globally without a context**.

## Rule Interface

```ts
interface Rule {
  id: string;
  context: string | "*";
  when: (signals: NormalizedSignals) => boolean;
  decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS";
  reason: string;
  confidenceDelta: number;
}
```

## Rule Evaluation Order

1. **Fallback Rules** (insufficient signals → fail fast)
2. **Hard-Deny Rules** (fail fast)
3. **Allow Rules**
4. **Allow-With-Limits Rules**
5. **Default Deny** (safe fallback)

> **Semantics:** First-match wins. The engine returns immediately when a rule matches. This is intentional — rules are ordered by priority, not accumulated.

## Rule Catalog

The engine evaluates rules in a strict 5-phase order. The **first** matching rule determines the result.

### Phase 1: Fallback Rules (Signal Quality)

_Checked first. Handles missing data._

| ID                      | Condition              | Decision              | Confidence Δ |
| :---------------------- | :--------------------- | :-------------------- | :----------- |
| `deny_no_signals`       | `signalCoverage` == 0  | **DENY**              | -100         |
| `limit_partial_signals` | `signalCoverage` < 0.5 | **ALLOW_WITH_LIMITS** | -30          |

### Phase 2: Hard Deny Rules (Critical Risks)

_Risk checks that apply globally (`*`)._

| ID                      | Condition                       | Decision | Confidence Δ |
| :---------------------- | :------------------------------ | :------- | :----------- |
| `deny_spam`             | `spamRisk` is HIGH or VERY_HIGH | **DENY** | -100         |
| `deny_low_social_trust` | `socialTrust` < NEUTRAL         | **DENY** | -100         |
| `deny_critical_trust`   | `trust` == VERY_LOW             | **DENY** | -100         |

### Phase 3: Allow Rules (Positive Access)

_Granting full access based on merit._

| ID                       | Context             | Condition (Summary)                                                                  | Confidence Δ |
| :----------------------- | :------------------ | :----------------------------------------------------------------------------------- | :----------- |
| `allow_strong_builder`   | `allowlist.general` | `builder` is EXPERT **OR** (`builder` ≥ ADVANCED **AND** `socialTrust` ≥ HIGH)       | +30          |
| `allow_strong_creator`   | `allowlist.general` | `creator` is EXPERT **OR** (`creator` ≥ ADVANCED **AND** `socialTrust` ≥ HIGH)       | +30          |
| `allow_high_trust`       | `allowlist.general` | `trust` ≥ HIGH **AND** `socialTrust` ≥ HIGH                                          | +25          |
| `allow_comment_trusted`  | `comment`           | `trust` ≥ NEUTRAL **AND** `socialTrust` ≥ NEUTRAL                                    | +15          |
| `allow_publish_verified` | `publish`           | `trust` ≥ HIGH **AND** `socialTrust` ≥ HIGH **AND** (builder/creator ≥ INTERMEDIATE) | +25          |
| `allow_apply_qualified`  | `apply`             | `trust` ≥ NEUTRAL **AND** (builder/creator ≥ ADVANCED)                               | +20          |
| `allow_governance_vote`  | `governance.vote`   | `trust` ≥ HIGH **AND** `socialTrust` ≥ NEUTRAL **AND** `recencyDays` ≤ 30            | +20          |

### Phase 4: Allow With Limits (Conditional Access)

_Granting restricted access._

| ID                          | Context             | Condition (Summary)                                           | Decision              | Confidence Δ |
| :-------------------------- | :------------------ | :------------------------------------------------------------ | :-------------------- | :----------- |
| `probation_inactive`        | `allowlist.general` | `trust` ≥ NEUTRAL **AND** `recencyDays` > 14                  | **ALLOW_WITH_LIMITS** | -10          |
| `probation_new_user`        | `allowlist.general` | `trust` ≥ NEUTRAL **AND** `socialTrust` ≥ NEUTRAL (No skills) | **ALLOW_WITH_LIMITS** | -15          |
| `probation_mixed_signals`   | `allowlist.general` | `trust` ≥ HIGH **AND** `socialTrust` < NEUTRAL                | **ALLOW_WITH_LIMITS** | -10          |
| `limit_comment_new`         | `comment`           | `trust` ≥ LOW **AND** `signalCoverage` ≥ 0.5                  | **ALLOW_WITH_LIMITS** | -5           |
| `limit_publish_unverified`  | `publish`           | `trust` ≥ NEUTRAL **AND** `socialTrust` ≥ NEUTRAL             | **ALLOW_WITH_LIMITS** | -10          |
| `limit_governance_inactive` | `governance.vote`   | `trust` ≥ HIGH **AND** `recencyDays` (30-90]                  | **ALLOW_WITH_LIMITS** | -15          |

### Phase 5: Default Deny

If no rule matches, the decision is **DENY** (Confidence: LOW).

## Rule Implementation Examples

### Fallback Rules

```ts
{
  id: "deny_no_signals",
  context: "*",
  when: s => s.signalCoverage === 0,
  decision: "DENY",
  reason: "No reputation signals available",
  confidenceDelta: -100
}
```

### Hard-Deny Rules

```ts
{
  id: "deny_spam",
  context: "*",
  when: s => s.spamRisk === "HIGH" || tierLt(s.socialTrust, "NEUTRAL"),
  decision: "DENY",
  reason: "High spam risk or low social trust detected",
  confidenceDelta: -100
}
```

### Allow Rules

```ts
{
  id: "allow_strong_builder",
  context: "allowlist.general",
  when: s =>
    s.builder === "EXPERT" ||
    (s.builder === "ADVANCED" && tierGte(s.socialTrust, "HIGH")),
  decision: "ALLOW",
  reason: "Strong builder credibility with sufficient social trust",
  confidenceDelta: +30
}
```

### Allow-With-Limits Rules

```ts
{
  id: "probation_inactive",
  context: "allowlist.general",
  when: s =>
    tierGte(s.trust, "NEUTRAL") && s.recencyDays > 14,
  decision: "ALLOW_WITH_LIMITS",
  reason: "Trustworthy but recently inactive",
  confidenceDelta: -10
}
```
