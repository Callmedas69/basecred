Here you go — **clean, copy-paste ready Markdown** for both the **Flow Diagram** and the **Docs-Ready Partner Explanation**.
No fluff, no prose bloat, written like real system docs.

---

```md
# BaseCred Decision Flow

This document defines the **authoritative evaluation order** for BaseCred decisions.

Evaluation is **order-dependent**.  
**First matching rule wins** and immediately stops evaluation.

---

## Decision Flow (Evaluation Order)
```

Incoming Request + Context
(comment, publish, governance.vote, etc.)
│
▼
┌────────────────────────────┐
│ FALLBACK RULES │ (Evaluated FIRST)
│ ───────────────────────── │
│ • signalCoverage == 0 │ → DENY
│ • signalCoverage < 50% │ → ALLOW_WITH_LIMITS
└─────────────┬──────────────┘
│
▼
┌────────────────────────────┐
│ HARD-DENY RULES │ (Fail Fast)
│ ───────────────────────── │
│ • spamRisk HIGH / VERY_HIGH│ → DENY
│ • socialTrust < NEUTRAL │ → DENY
│ • trust == VERY_LOW │ → DENY
└─────────────┬──────────────┘
│
▼
┌────────────────────────────┐
│ ALLOW RULES │ (Full Access)
│ ───────────────────────── │
│ Context-specific positive │ → ALLOW
│ reputation checks │
└─────────────┬──────────────┘
│
▼
┌────────────────────────────┐
│ ALLOW_WITH_LIMITS RULES │ (Probationary)
│ ───────────────────────── │
│ Context-specific partial │ → ALLOW_WITH_LIMITS
│ trust conditions │
└─────────────┬──────────────┘
│
▼
┌────────────────────────────┐
│ DEFAULT │
│ ───────────────────────── │
│ No rule matched │ → DENY
└────────────────────────────┘

```

---

## Core Properties

- **Fallback rules override all others**
- **Hard-deny rules cannot be overridden**
- **ALLOW takes precedence over ALLOW_WITH_LIMITS**
- **Context matters** (`*` applies globally)
- **Evaluation stops on first match**

This flow defines the system’s security and trust guarantees.
```

---

````md
# BaseCred Partner Integration Guide

This document explains **how BaseCred decisions work** and **how partners should integrate them**.

---

## Decision Outcomes

BaseCred returns one of three decisions for a given wallet and context:

| Decision              | Meaning                          |
| --------------------- | -------------------------------- |
| **ALLOW**             | Full access granted              |
| **ALLOW_WITH_LIMITS** | Access granted with restrictions |
| **DENY**              | Access blocked                   |

---

## Required Inputs

Partners must supply (directly or via SDK):

- `trust` (VERY_LOW → HIGH)
- `socialTrust` (VERY_LOW → HIGH)
- `builder` capability (EXPLORER → ELITE)
- `creator` capability (EXPLORER → ELITE)
- `spamRisk` (LOW → VERY_HIGH)
- `recencyDays` (days since last activity)
- `signalCoverage` (0.0 → 1.0)
- `context` (e.g. `comment`, `publish`, `governance.vote`)

---

## How Decisions Are Made

1. **Insufficient data**
   - No signals → **DENY**
   - Less than 50% signal coverage → **ALLOW_WITH_LIMITS**

2. **Critical risk detected**
   - High spam risk
   - Social trust below minimum
   - Very low trust  
     → **Immediate DENY**

3. **Strong positive reputation**
   - High trust and social trust
   - Proven builder or creator capability
   - Recent activity  
     → **ALLOW**

4. **Borderline but acceptable**
   - New users
   - Inactive users
   - Mixed signals  
     → **ALLOW_WITH_LIMITS**

5. **No matching rule**
   → **DENY**

---

## What “ALLOW_WITH_LIMITS” Means

`ALLOW_WITH_LIMITS` is **not a denial**.

It signals **probationary access**, such as:

- Rate-limited commenting
- Publishing through moderation queues
- Reduced governance voting weight
- Lower API quotas
- Manual review requirements

> BaseCred determines **trust level**.  
> Partners enforce **specific limitations**.

---

## Integration Pattern

```ts
const decision = evaluate({
  wallet,
  context: "publish",
  signals,
});

if (decision === "ALLOW") {
  enableFullAccess();
} else if (decision === "ALLOW_WITH_LIMITS") {
  enableRestrictedAccess();
} else {
  blockAction();
}
```
````

---

## Guarantees

- Hard-deny rules always win
- Higher trust never reduces access
- Activity and signal coverage matter
- Context changes outcomes
- First matching rule stops evaluation

---

## Partner Responsibility

BaseCred answers:

> “Should this wallet be trusted here?”

Partners decide:

> “What does limited access mean in our system?”

```

---

If you want next, I can:
- Convert the flow into **Mermaid diagrams**
- Split docs into **public vs internal**
- Define **standard limit profiles** (comment, publish, governance)
- Tighten this into a **formal spec** for audits

Just say the word.
```
