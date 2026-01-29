---
sidebar_position: 4
---

# Response Schema

> The canonical output format.

The BaseCred Decision Engine returns a `DecideUseCaseOutput` object. This schema is strict and will not change without a major version bump.

## JSON Structure

```json
{
  "decision": "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS",
  "confidence": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
  "explain": [
    "String explanation of why the decision was made",
    "Multiple reasons may be provided"
  ],
  "constraints": [], // Array of specific limitations if ALLOW_WITH_LIMITS
  "ruleIds": ["rule_id_1", "rule_id_2"], // IDs of rules that triggered
  "version": "1.0.0", // Engine version
  "requestId": "req_...", // Trace ID
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Field Definitions

| Field        | Type       | Description                                                                      |
| :----------- | :--------- | :------------------------------------------------------------------------------- |
| `decision`   | Enum       | The final recommendation. One of `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`.        |
| `confidence` | Enum       | A qualitative measure of certainty derived from signal coverage and consistency. |
| `explain`    | `string[]` | Human-readable reasons. Safe to display to end-users.                            |
