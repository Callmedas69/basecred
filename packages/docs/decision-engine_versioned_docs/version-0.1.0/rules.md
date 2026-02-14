---
sidebar_position: 4
---

# Rule Catalog

The engine evaluates rules in a strict **5-phase order**. The **first** matching rule determines the result.

## Rule Model

A rule **never applies globally without a context** (except fallback and hard-deny, which use context `*`).

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

## Evaluation Order

1. **Fallback Rules** — Insufficient signals → fail fast.
2. **Hard-Deny Rules** — Critical risk → fail fast.
3. **Allow Rules** — Full access based on merit.
4. **Allow-With-Limits Rules** — Conditional / restricted access.
5. **Default Deny** — No rule matched → DENY (Confidence: LOW).

> **Semantics:** First-match wins. The engine returns immediately when a rule matches.

---

## Phase 1: Fallback Rules (Signal Quality)

_Checked first. Handles missing data._

| ID                      | Condition              | Decision              | Confidence Δ |
| :---------------------- | :--------------------- | :-------------------- | :----------- |
| `deny_no_signals`       | `signalCoverage` == 0   | **DENY**              | -100         |
| `limit_partial_signals` | `signalCoverage` < 0.5 | **ALLOW_WITH_LIMITS** | -30          |

---

## Phase 2: Hard Deny Rules (Critical Risks)

_Risk checks that apply globally (`*`)._

| ID                      | Condition                       | Decision | Confidence Δ |
| :---------------------- | :------------------------------ | :------- | :----------- |
| `deny_spam`             | `spamRisk` is HIGH or VERY_HIGH | **DENY** | -100         |
| `deny_low_social_trust` | `socialTrust` < NEUTRAL         | **DENY** | -100         |
| `deny_critical_trust`   | `trust` == VERY_LOW             | **DENY** | -100         |

---

## Phase 3: Allow Rules (Positive Access)

_Granting full access based on merit._

| ID                       | Context             | Condition (Summary)                                                                  | Confidence Δ |
| :----------------------- | :------------------ | :----------------------------------------------------------------------------------- | :----------- |
| `allow_strong_builder`   | `allowlist.general` | `builder` is ELITE **OR** (`builder` ≥ EXPERT **AND** `socialTrust` ≥ HIGH)       | +30          |
| `allow_strong_creator`   | `allowlist.general` | `creator` is ELITE **OR** (`creator` ≥ EXPERT **AND** `socialTrust` ≥ HIGH)       | +30          |
| `allow_high_trust`       | `allowlist.general` | `trust` ≥ HIGH **AND** `socialTrust` ≥ HIGH                                          | +25          |
| `allow_comment_trusted`  | `comment`           | `trust` ≥ NEUTRAL **AND** `socialTrust` ≥ NEUTRAL                                    | +15          |
| `allow_publish_verified` | `publish`           | `trust` ≥ HIGH **AND** `socialTrust` ≥ HIGH **AND** (builder/creator ≥ BUILDER) | +25          |
| `allow_apply_qualified`  | `apply`             | `trust` ≥ NEUTRAL **AND** (builder/creator ≥ EXPERT)                              | +20          |
| `allow_governance_vote`  | `governance.vote`   | `trust` ≥ HIGH **AND** `socialTrust` ≥ NEUTRAL **AND** `recencyDays` ≤ 30            | +20          |

---

## Phase 4: Allow With Limits (Conditional Access)

_Granting restricted access._

| ID                          | Context             | Condition (Summary)                                           | Decision              | Confidence Δ |
| :-------------------------- | :------------------ | :------------------------------------------------------------ | :-------------------- | :----------- |
| `probation_inactive`        | `allowlist.general` | `trust` ≥ NEUTRAL **AND** `recencyDays` > 14                 | **ALLOW_WITH_LIMITS** | -10          |
| `probation_new_user`        | `allowlist.general` | `trust` ≥ NEUTRAL **AND** `socialTrust` ≥ NEUTRAL **AND** builder=EXPLORER **AND** creator=EXPLORER  | **ALLOW_WITH_LIMITS** | 0          |
| `probation_mixed_signals`   | `allowlist.general` | `trust` ≥ HIGH **AND** `socialTrust` ≥ LOW                | **ALLOW_WITH_LIMITS** | -10          |
| `limit_comment_new`         | `comment`           | `trust` ≥ LOW **AND** `signalCoverage` ≥ 0.5                  | **ALLOW_WITH_LIMITS** | -5           |
| `limit_publish_unverified`  | `publish`           | `trust` ≥ NEUTRAL **AND** `socialTrust` ≥ NEUTRAL             | **ALLOW_WITH_LIMITS** | -10          |
| `limit_governance_inactive` | `governance.vote`   | `trust` ≥ HIGH **AND** `recencyDays` (30-90]                  | **ALLOW_WITH_LIMITS** | -15          |

---

## Phase 5: Default Deny

If no rule matches, the decision is **DENY** (Confidence: LOW).
