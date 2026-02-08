---
sidebar_position: 5
---

# Response Schema

> The canonical output format.

The BaseCred Decision Engine returns a `DecisionOutput` object. This schema is strict and will not change without a major version bump.

## JSON Structure

```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "explain": [
    "String explanation of why the decision was made",
    "Multiple reasons may be provided"
  ],
  "constraints": [],
  "retryAfter": null,
  "ruleIds": ["rule_id_1", "rule_id_2"],
  "version": "1.0.0"
}
```

## Field Definitions

| Field | Type | Description |
| :------------ | :-------------- | :------------------------------------------------------------------------------- |
| `decision` | Enum | The final recommendation. One of `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`. |
| `confidence` | Enum | Qualitative certainty: `LOW`, `MEDIUM`, `HIGH`, or `VERY_HIGH`. Derived from signal coverage and consistency. |
| `explain` | `string[]` | Human-readable reasons. Safe to display to end-users. |
| `constraints` | `string[]` | Limitations when decision is `ALLOW_WITH_LIMITS`. Empty array for `ALLOW` or `DENY`. |
| `retryAfter` | `number \| null` | Seconds to wait before retrying, for rate-limited or temporary denials. `null` if not applicable. |
| `ruleIds` | `string[]` | IDs of rules that contributed to this decision. Useful for debugging and auditing. |
| `version` | `string` | Engine version used to produce this decision (SemVer). |

### Optional Fields

These fields are populated by the progression layer and are **not** part of the core decision output:

| Field | Type | Description |
| :----------------- | :----------- | :------------------------------------------------------------------------------- |
| `accessStatus` | Enum \| undefined | Retail-facing access status: `eligible`, `limited`, `not_ready`, or `blocked`. |
| `blockingFactors` | `string[]` \| undefined | High-level, fixable guidance list. Does not expose raw scores. |

## Decision Values

| Value | Meaning |
| :------------------ | :---------------------------------------------------------------------- |
| `ALLOW` | Subject meets all requirements for this context. |
| `DENY` | Subject does not meet requirements. Check `explain` for reasons. |
| `ALLOW_WITH_LIMITS` | Subject is allowed with restrictions. Check `constraints` for details. |

## Confidence Tiers

| Tier | Meaning |
| :---------- | :------------------------------------------------------------- |
| `LOW` | Few signals available. Decision is a best-effort estimate. |
| `MEDIUM` | Partial signal coverage. Decision is reasonably reliable. |
| `HIGH` | Good signal coverage. Decision is reliable. |
| `VERY_HIGH` | Full or near-full signal coverage. Decision is highly reliable. |
