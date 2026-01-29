---
sidebar_position: 8
---

# API Reference

## GET /v1/contexts

Returns a list of all available decision contexts.

### Response

```json
{
  "contexts": [
    "allowlist.general",
    "comment",
    "publish",
    "apply",
    "governance.vote"
  ]
}
```

## POST /v1/decide

The **authoritative, billable surface** of BaseCred.

### Request

```json
{
  "subject": "0xabc...",
  "context": "allowlist.general"
}
```

### Response

```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "ruleIds": ["allow_strong_builder"],
  "explain": ["Expert-level builder credibility", "High social trust"],
  "constraints": [],
  "retryAfter": null,
  "version": "v1"
}
```

| Field        | Description                                          |
| :----------- | :--------------------------------------------------- |
| `decision`   | `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`              |
| `confidence` | `LOW`, `MEDIUM`, `HIGH`, or `VERY_HIGH`              |
| `ruleIds`    | Array of strict rule IDs that triggered the decision |
| `explain`    | Human-readable array of reasons                      |

### Status Codes

| Code | Meaning                                   |
| ---- | ----------------------------------------- |
| 200  | Decision made successfully                |
| 400  | Invalid request (missing subject/context) |
| 500  | Internal server error                     |

## AI Integration Policy

AI **must never**:

- Decide ALLOW / DENY
- Override deterministic rules
- Act as source of truth

AI **may**:

- Generate explanations
- Suggest rule tuning
- Detect anomalies
- Simulate what-if scenarios

**Rule:** _Rules decide. AI explains._
