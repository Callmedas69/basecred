````md
# Signal Coverage

## Overview

**Signal Coverage** represents how much reputation data is available for a given wallet address.

It is a **completeness indicator**, not a reputation score.

Signal Coverage answers one question only:

> **“How much of the expected reputation signal surface is available for this user?”**

It does **not** evaluate trust, quality, intent, or behavior.

---

## Purpose

Signal Coverage exists to ensure the decision engine behaves safely when data is missing or incomplete.

It is used exclusively by **Fallback Rules** to prevent enforcement decisions based on insufficient context.

---

## Signal Sources & Weights

Signal Coverage is calculated as a weighted sum of available reputation providers.

| Provider         | Weight   |
| ---------------- | -------- |
| Ethos            | 30%      |
| Neynar           | 30%      |
| Talent – Builder | 20%      |
| Talent – Creator | 20%      |
| **Total**        | **100%** |

Each provider contributes **its full weight** if data is available, or **0** if unavailable.

There is **no partial contribution**.

---

## Availability Semantics

For coverage purposes, each provider is treated as **binary**:

- **Available** → contributes its full weight
- **Unavailable** → contributes `0`

Availability is determined using provider-specific checks:

- `isEthosAvailable`
- `isNeynarAvailable`
- `isTalentBuilderAvailable`
- `isTalentCreatorAvailable`

No signal values (scores, levels, labels) are involved in coverage calculation.

---

## Calculation Logic

```ts
export function calculateSignalCoverage(profile: UnifiedProfileData): number {
  const weights = {
    ethos: 0.3,
    neynar: 0.3,
    talentBuilder: 0.2,
    talentCreator: 0.2,
  };

  let coverage = 0;

  if (isEthosAvailable(profile.ethos)) {
    coverage += weights.ethos;
  }

  if (isNeynarAvailable(profile.neynar)) {
    coverage += weights.neynar;
  }

  if (isTalentBuilderAvailable(profile.talent)) {
    coverage += weights.talentBuilder;
  }

  if (isTalentCreatorAvailable(profile.talent)) {
    coverage += weights.talentCreator;
  }

  return coverage;
}
```
````

The resulting value is a number between `0.0` and `1.0`.

---

## Example Scenarios

### No Available Signals

| Provider       | Available |
| -------------- | --------- |
| Ethos          | ❌        |
| Neynar         | ❌        |
| Talent Builder | ❌        |
| Talent Creator | ❌        |

**Signal Coverage:** `0.0`

---

### Social Signals Only

| Provider       | Available |
| -------------- | --------- |
| Ethos          | ✅        |
| Neynar         | ✅        |
| Talent Builder | ❌        |
| Talent Creator | ❌        |

**Signal Coverage:** `0.6`

---

### Builder Signal Only

| Provider       | Available |
| -------------- | --------- |
| Ethos          | ❌        |
| Neynar         | ❌        |
| Talent Builder | ✅        |
| Talent Creator | ❌        |

**Signal Coverage:** `0.2`

---

### Fully Covered Profile

| Provider       | Available |
| -------------- | --------- |
| Ethos          | ✅        |
| Neynar         | ✅        |
| Talent Builder | ✅        |
| Talent Creator | ✅        |

**Signal Coverage:** `1.0`

---

## Use in Fallback Rules

Signal Coverage is evaluated **before normal allow rules** as part of fallback handling.

| Coverage Threshold | Fallback Rule           | Result                 |
| ------------------ | ----------------------- | ---------------------- |
| `0%`               | `deny_no_signals`       | **DENY**               |
| `< 50%`            | `limit_partial_signals` | **ALLOW_WITH_LIMITS**  |
| `≥ 50%`            | —                       | Normal rule evaluation |

This ensures the system does not grant full access when reputation context is insufficient.

---

## Explicit Non-Goals

Signal Coverage **MUST NOT** be used to:

- Rank users
- Judge trustworthiness
- Compare users to one another
- Penalize missing platforms
- Infer behavior or intent
- Modify reputation scores

It is strictly a **data availability guardrail**.

---

## Design Principle

> **Signal Coverage measures how much is known — not what is true.**

It protects the decision engine from acting confidently on incomplete information while preserving neutrality and composability.

```

```
