# BaseCred Decision Engine Documentation

The **BaseCred Decision Engine** determines _if_ an identity should be allowed to perform an action based on their reputation signals. It is designed to be deterministic, context-aware, and explainable.

## Core Concepts

### 1. Signals (`NormalizedSignals`)

Raw data from providers (like Farcaster, Ethos, Talent Protocol) is normalized into a standard format before reaching the engine. The engine _only_ understands these normalized signals.

#### Normalization Logic & Thresholds

Determined by `src/engine/normalizers/`.

| Signal        | Source          | Logic / Thresholds                                                                                                                                    |
| :------------ | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trust`       | Ethos           | Based on `credibility_score`:<br>• `VERY_HIGH` ≥ 40<br>• `HIGH` ≥ 20<br>• `NEUTRAL` ≥ 0<br>• `LOW` ≥ -20<br>• Else `VERY_LOW`                         |
| `socialTrust` | Neynar          | Based on `farcaster_user_score` (0-1):<br>• `VERY_HIGH` ≥ 0.9<br>• `HIGH` ≥ 0.7<br>• `NEUTRAL` ≥ 0.4<br>• `LOW` ≥ 0.2<br>• Else `VERY_LOW`            |
| `spamRisk`    | Neynar          | Inverse of `farcaster_user_score`:<br>• `VERY_LOW` (Safe) ≥ 0.8<br>• `LOW` ≥ 0.6<br>• `NEUTRAL` ≥ 0.4<br>• `HIGH` ≥ 0.2<br>• Else `VERY_HIGH` (Risky) |
| `builder`     | Talent Protocol | Based on `builder.score`:<br>• `EXPERT` ≥ 80<br>• `ADVANCED` ≥ 50<br>• `INTERMEDIATE` ≥ 20<br>• Else `NONE`                                           |
| `creator`     | Talent Protocol | Based on `creator.score`:<br>• `EXPERT` ≥ 80<br>• `ADVANCED` ≥ 50<br>• `INTERMEDIATE` ≥ 20<br>• Else `NONE`                                           |

### 2. Contexts

Decisions are always made within a specific **context**.

| Context             | Purpose                                   |
| :------------------ | :---------------------------------------- |
| `allowlist.general` | General gatekeeping for access.           |
| `comment`           | Permission to post comments.              |
| `publish`           | Permission to publish new content.        |
| `apply`             | Permission to submit applications/grants. |
| `governance.vote`   | Eligibility to participate in voting.     |

### 3. Decisions & Confidence

The engine produces:

- **Decision**: `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`.
- **Confidence**: `VERY_HIGH`, `HIGH`, `MEDIUM`, or `LOW`.

#### Confidence Calculation

Base Confidence = **50**. Each rule applies a `confidenceDelta`.

- `VERY_HIGH`: Score ≥ 80
- `HIGH`: Score ≥ 60
- `MEDIUM`: Score ≥ 40
- `LOW`: Score < 40

## Rule Catalog

The engine evaluates rules in a strict 5-phase order. The **first** matching rule determines the result.

### Phase 1: Fallback Rules (Signal Quality)

_Checked first. Handles missing data._

| ID                      | Condition              | Decision              | Confidence Δ |
| :---------------------- | :--------------------- | :-------------------- | :----------- |
| `deny_no_signals`       | `signalCoverage` == 0  | **DENY**              | -100         |
| `limit_partial_signals` | `signalCoverage` < 0.5 | **ALLOW_WITH_LIMITS** | -30          |

### Phase 2: Hard Deny Rules (Critical Risks)

_Risk checks that apply globally (`_`).\*

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

## Constraints Reference

When a decision is `ALLOW_WITH_LIMITS`, one or more constraints are returned based on the Rule ID.

| Rule ID                     | Constraints Applied                   | Meaning                               |
| :-------------------------- | :------------------------------------ | :------------------------------------ |
| `probation_inactive`        | `reduced_access`, `activity_required` | User needs to be active/verify again. |
| `probation_new_user`        | `probation_period`, `limited_actions` | New user trial period.                |
| `probation_mixed_signals`   | `review_required`                     | Manual review flagged.                |
| `limit_partial_signals`     | `reduced_access`                      | Limited features due to data gaps.    |
| `limit_comment_new`         | `rate_limited`                        | E.g. 5 comments/hour.                 |
| `limit_publish_unverified`  | `review_queue`                        | Content goes to mod queue.            |
| `limit_governance_inactive` | `reduced_weight`                      | Vote counts for less.                 |

## API Reference

### `decide(signals, context)`

```typescript
import { decide } from "basecred-decision-engine";
import type { NormalizedSignals } from "basecred-decision-engine/types";

const decision = decide(signals, "allowlist.general");
```

### Response Example

```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "constraints": [],
  "retryAfter": null,
  "ruleIds": ["allow_strong_builder"],
  "version": "v1",
  "explain": ["Strong builder credibility with sufficient social trust"],
  "subjectHash": "subj_48c9a1"
}
```
