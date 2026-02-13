---
sidebar_position: 5
---

# Decision Output

The engine produces a **decision**, **confidence**, **rule IDs**, **explain**, and optional **constraints**. This page describes the response shape, confidence calculation, and constraints reference.

## Decisions & Confidence

- **Decision**: `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`.
- **Confidence**: `VERY_HIGH`, `HIGH`, `MEDIUM`, or `LOW`.

### Confidence Calculation

Base Confidence = **50**. Each rule applies a `confidenceDelta`.

- `VERY_HIGH`: Score ≥ 80
- `HIGH`: Score ≥ 60
- `MEDIUM`: Score ≥ 40
- `LOW`: Score < 40

```ts
function mapConfidence(numericConfidence: number): ConfidenceTier {
  if (numericConfidence >= 80) return "VERY_HIGH";
  if (numericConfidence >= 60) return "HIGH";
  if (numericConfidence >= 40) return "MEDIUM";
  return "LOW";
}

type ConfidenceTier = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
```

## Machine-Readable Response

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

| Field         | Description                                                |
| :------------ | :--------------------------------------------------------- |
| `decision`    | `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`                     |
| `confidence`  | `LOW`, `MEDIUM`, `HIGH`, or `VERY_HIGH`                    |
| `constraints` | Applied when decision is `ALLOW_WITH_LIMITS` (see below)   |
| `retryAfter`  | Seconds to wait before retry; `null` if not applicable     |
| `ruleIds`     | Array of rule IDs that triggered the decision              |
| `version`     | Engine version (e.g. `v1`)                                 |
| `explain`     | Human-readable array of reasons                            |
| `subjectHash` | Hashed identity (when returned by API)                     |

## Constraints Reference

When a decision is `ALLOW_WITH_LIMITS`, one or more constraints are returned based on the Rule ID.

| Rule ID                     | Constraints Applied                   | Meaning                               |
| :-------------------------- | :------------------------------------ | :------------------------------------ |
| `probation_inactive`        | `reduced_access`, `activity_required` | User needs to be active/verify again. |
| `probation_new_user`        | `probation_period`, `limited_actions`| New user trial period.                |
| `probation_mixed_signals`   | `review_required`                     | Manual review flagged.                |
| `limit_partial_signals`     | `reduced_access`                      | Limited features due to data gaps.    |
| `limit_comment_new`         | `rate_limited`                        | E.g. 5 comments/hour.                 |
| `limit_publish_unverified`  | `review_queue`                        | Content goes to mod queue.            |
| `limit_governance_inactive` | `reduced_weight`                      | Vote counts for less.                 |

## Decision Logging (Optional)

BaseCred **does not log score history**. Optionally, systems may log **decision metadata only**:

```ts
interface DecisionLog {
  subjectHash: string;
  context: string;
  decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS";
  confidence: ConfidenceTier;
  ruleIds: string[];
  signalCoverage: number;
  timestamp: number;
}
```

This enables audits and rule evaluation without storing raw scores or signals.
