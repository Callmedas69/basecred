---
sidebar_position: 2
---

# Context vs Decision

**Status:** Public · Contractual

This page defines the **hard boundary** between what BaseCred provides and what applications must own.

If this boundary is unclear, BaseCred will be misused.

---

## The Core Rule

> **BaseCred provides context. Applications make decisions.**

This separation is intentional and non-negotiable.

---

## What We Mean by Context

**Context** is descriptive information about an identity at a point in time.

Context answers:

> _“What signals are observable right now, and what is their condition?”_

Context is:

- neutral
- read-only
- deterministic
- source-traceable

Context can be:

- logged
- cached
- compared
- audited

Context **must not**:

- recommend actions
- imply permission or restriction
- label users
- rank users
- infer intent or future behavior

BaseCred outputs **context only**.

---

## What We Mean by Decision

A **decision** is an application-owned action taken in response to context.

Decisions answer:

> _“Given our goals, values, and risk tolerance, what do we do?”_

Decisions are:

- subjective
- business-specific
- environment-specific
- reversible

Decisions include:

- allowing or denying access
- publishing or hiding content
- rate-limiting or throttling
- gating participation

All decisions must live **outside BaseCred**.

---

## The Contractual Boundary

### BaseCred Guarantees

BaseCred guarantees that:

- signals are descriptive, not evaluative
- absence of data is explicit
- time describes freshness, not behavior
- sources are not merged into a verdict
- no hidden weighting or aggregation exists

BaseCred will **never**:

- return a final score
- recommend an action
- enforce a threshold
- compare users against each other

---

### Application Responsibilities

Applications are responsible for:

- defining thresholds
- implementing business logic
- enforcing outcomes
- explaining decisions to users
- accepting accountability for consequences

If an application needs BaseCred to justify a decision, the design is invalid.

---

## Reference Flow

```mermaid
graph TD
    A[Identity] --> B[Context (BaseCred)]
    B --> C[Decision Logic (Application)]
    C --> D[Outcome]
```

BaseCred stops **before** the decision layer.

---

## Reference Decision Matrix (Illustrative Only)

The table below shows **example** application logic. It is not guidance. It is not recommended behavior.

| Use Case      | Context Observed                      | Application Decision |
| :------------ | :------------------------------------ | :------------------- |
| Allowlist     | Sufficient coverage, low risk signals | Allow                |
| Commenting    | No negative social signals            | Publish              |
| Rate limiting | Low coverage or stale data            | Throttle             |
| Governance    | Full source availability              | Permit               |
| Submission    | Recent or corroborated signals        | Accept               |

Different applications may reach different decisions using the same context.

---

## Common Violations

- treating context as authorization
- exposing a single reputation verdict
- auto-blocking users based on signals
- hiding decision logic behind the SDK
- presenting BaseCred output as “trust”

These are design errors, not configuration issues.

---

## Why This Boundary Exists

Reputation systems fail when:

- interpretation is hidden
- power is centralized
- responsibility is blurred

This boundary ensures:

- misuse is harder than correct use
- decisions remain explainable
- responsibility stays with the application

---

## Summary

- BaseCred provides **context only**
- Applications own **all decisions**
- The boundary is explicit and permanent

**Breaking this contract breaks the system.**
