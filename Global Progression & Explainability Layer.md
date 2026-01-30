# Decision Engine — Global Progression & Explainability

## Overview

The Decision Engine evaluates wallets across multiple **contexts (scenarios)** such as:

- `allowlist.general`
- `apply`
- `comment`
- `publish`
- `governance.vote`

Its primary responsibility is to produce a **machine-authoritative decision**  
(`ALLOW`, `ALLOW_WITH_LIMITS`, or `DENY`) with a measurable confidence level.

This document describes how the engine also supports **retail-friendly explainability
and progression** — **without weakening any decision logic or thresholds**.

---

## Core Principle

> **Decisions remain strict and context-specific.  
> Progression and explanations are global and non-decisional.**

The engine answers:

- _“Is this wallet allowed in this context?”_

The progression layer answers:

- _“If not, why — and what can be improved?”_

---

## Decision Output (Unchanged)

The canonical engine output remains authoritative:

```ts
export interface DecisionOutput {
  decision: Decision;
  confidence: ConfidenceTier;
  constraints: string[];
  retryAfter: number | null;
  ruleIds: string[];
  version: string;
  explain: string[];
}
```

````

- This output is **machine-readable**
- Used for **auditing, enforcement, and integrations**
- **Must not be overridden** by UX logic

---

## New Concept: Access Status (Derived)

To support retail UX, a **derived, optional layer** is added.

### AccessStatus

```ts
export type AccessStatus =
  | "eligible" // ALLOW
  | "limited" // ALLOW_WITH_LIMITS
  | "not_ready" // DENY but fixable
  | "blocked"; // HARD_DENY or irrecoverable
```

### Mapping (Global, All Contexts)

| Engine Decision   | Access Status |
| ----------------- | ------------- |
| ALLOW             | eligible      |
| ALLOW_WITH_LIMITS | limited       |
| DENY (safe)       | not_ready     |
| HARD_DENY         | blocked       |

> This mapping is **derived after decision evaluation**
> and does **not affect engine behavior**.

---

## Extended Decision Output (Non-Breaking)

Optional fields may be added for retail consumption:

```ts
export interface DecisionOutput {
  decision: Decision;
  confidence: ConfidenceTier;
  constraints: string[];
  retryAfter: number | null;
  ruleIds: string[];
  version: string;
  explain: string[];

  /** Derived, retail-facing status */
  accessStatus?: AccessStatus;

  /** Context-aware reasons blocking access */
  blockingFactors?: string[];
}
```

These fields:

- are optional
- do not change existing API contracts
- do not affect enforcement

---

## Global Blocking Factor Resolution

### Purpose

Blocking factors explain **why no allow rule matched**, without re-evaluating rules.

They describe **signal readiness**, not eligibility.

### Global Resolver (Context-Agnostic)

```ts
resolveBlockingFactors(signals) => {
  trust,
  socialTrust,
  builder,
  creator,
  spamRisk,
  signalCoverage
}
```

This resolver:

- does not apply thresholds
- does not decide
- only reports current signal state

---

## Context Requirements (Interpretation Layer)

Each context defines **which factors matter**.

```ts
export const CONTEXT_REQUIREMENTS = {
  "allowlist.general": ["trust", "builder", "creator"],
  apply: ["trust"],
  comment: ["spamRisk", "socialTrust"],
  publish: ["creator", "spamRisk"],
  "governance.vote": ["trust", "socialTrust"],
};
```

This allows the system to say:

> “You are blocked _here_ because these factors matter in this context.”

---

## How It Works (All Contexts)

```
Signals
 → Normalizers
 → Confidence
 → Rules (context-specific)
 → Decision (authoritative)
 → AccessStatus (derived)
 → BlockingFactors (context-aware)
```

This pipeline runs **identically for all scenarios**.

---

## Example Outputs

### allowlist.general

```json
{
  "decision": "DENY",
  "confidence": "HIGH",
  "accessStatus": "not_ready",
  "blockingFactors": ["trust", "builder"]
}
```

UI meaning:

> Full access locked. Improve trust or builder credibility.

---

### comment

```json
{
  "decision": "DENY",
  "confidence": "VERY_HIGH",
  "accessStatus": "not_ready",
  "blockingFactors": ["spamRisk"]
}
```

UI meaning:

> Commenting disabled due to spam risk signals.

---

### governance.vote

```json
{
  "decision": "DENY",
  "confidence": "HIGH",
  "accessStatus": "not_ready",
  "blockingFactors": ["trust"]
}
```

UI meaning:

> Voting requires higher trust reputation.

---

## What This Design Does NOT Do

- ❌ Does not lower thresholds
- ❌ Does not change rule order
- ❌ Does not override hard-deny
- ❌ Does not expose raw scores
- ❌ Does not affect confidence math

---

## Why This Matters

- Product owners retain **strict quality filtering**
- Retail users gain **clarity and progression**
- Decisions remain **auditable and deterministic**
- The engine scales across **multiple scenarios**

---

## Final Mental Model

| Layer           | Responsibility        |
| --------------- | --------------------- |
| Rules           | Decide eligibility    |
| Decision        | Machine truth         |
| AccessStatus    | Retail interpretation |
| BlockingFactors | Fixable guidance      |
| Context         | What matters here     |

---

## Summary

> **The Decision Engine remains a gatekeeper.
> The progression layer turns the gate into a ladder.**

This architecture ensures the system is:

- secure
- fair
- explainable
- scalable across all contexts

```

---

If you want next, I can:
- align this doc **line-by-line** with your current `decide.ts`
- add a **DecisionOutput JSON schema**
- generate **partner-facing docs**
- add a **glossary for retail users**

Just say the word.
```
````
