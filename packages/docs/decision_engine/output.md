---
sidebar_position: 5
---

# Decision Output

## Machine-Readable Response

```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "constraints": [],
  "retryAfter": null,
  "ruleIds": ["allow_strong_builder"],
  "version": "v1"
}
```

| Field        | Description                                          |
| :----------- | :--------------------------------------------------- |
| `decision`   | `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`              |
| `confidence` | `LOW`, `MEDIUM`, `HIGH`, or `VERY_HIGH`              |
| `ruleIds`    | Array of strict rule IDs that triggered the decision |
| `explain`    | Human-readable array of reasons                      |

## Human-Readable Explanation

```json
{
  "summary": "User is eligible",
  "explain": [
    "Expert-level builder credibility",
    "High social trust",
    "No negative trust indicators"
  ]
}
```

## Confidence Mapping

Rules produce a `confidenceDelta` (numeric). The final output uses a categorical `confidence` tier.

```ts
function mapConfidence(numericConfidence: number): ConfidenceTier {
  if (numericConfidence >= 80) return "VERY_HIGH";
  if (numericConfidence >= 60) return "HIGH";
  if (numericConfidence >= 40) return "MEDIUM";
  return "LOW";
}

type ConfidenceTier = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
```

> **Note:** `confidenceDelta` in rules is additive to a base of 50. The final numeric value is mapped to a tier for the API response.

## Decision Logging (Minimal & Optional)

BaseCred **does not log score history**.

Optionally, systems may log **decision metadata only**:

```ts
interface DecisionLog {
  subjectHash: string; // hashed identity
  context: string;
  decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS";
  confidence: ConfidenceTier;
  ruleIds: string[];
  signalCoverage: number;
  timestamp: number;
}
```

This enables audits, analytics, and rule evaluation — without storing raw scores or signals.

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
