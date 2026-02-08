---
sidebar_position: 6
---

# API Reference

## Programmatic: `decide(signals, context)`

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

---

## HTTP: GET /v1/contexts

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

---

## HTTP: POST /v1/decide

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
  "constraints": [],
  "retryAfter": null,
  "ruleIds": ["allow_strong_builder"],
  "version": "v1",
  "explain": ["Strong builder credibility with sufficient social trust"],
  "subjectHash": "subj_48c9a1",
  "policyHash": "sha256:<policy-hash>"
}
```

| Field         | Description                                                |
| :------------ | :--------------------------------------------------------- |
| `decision`    | `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`                     |
| `confidence`  | `LOW`, `MEDIUM`, `HIGH`, or `VERY_HIGH`                     |
| `ruleIds`     | Array of rule IDs that triggered the decision              |
| `explain`     | Human-readable array of reasons                            |
| `constraints` | Applied when decision is `ALLOW_WITH_LIMITS`               |

### Response Headers

| Header          | Description                                 |
| :-------------- | :------------------------------------------ |
| `x-policy-hash` | Policy hash used for the decision context   |

### Status Codes

| Code | Meaning                                   |
| ---- | ----------------------------------------- |
| 200  | Decision made successfully                |
| 400  | Invalid request (missing subject/context) |
| 500  | Internal server error                    |

---

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
