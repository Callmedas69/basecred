---
sidebar_position: 6
---

# Signal Enrichment

BaseCred introduces a **Signal Enrichment Layer** between normalized signals and rule evaluation.

The purpose is **not** to create new scores, but to extract additional meaning from:

- Agreement between independent systems
- Disagreement between independent systems
- Missing or asymmetric signals

## Semantic Roles of Providers

| Provider        | Primary Authority                 |
| --------------- | --------------------------------- |
| Ethos           | Long-term trust & credibility     |
| Talent Protocol | Ability & skill (builder/creator) |
| Neynar          | Social behavior & spam risk       |

BaseCred never treats any single provider as complete.

## Agreement-Based Enrichment

When multiple providers agree positively, BaseCred increases decision confidence.

**Example:**

- Ethos = NEUTRAL
- Talent.Builder = EXPERT
- Neynar = VERY_HIGH

**Interpretation:** Capable and well-behaved actor with low overall risk.

This affects:

- Decision confidence
- Explanation clarity
- Eligibility for full ALLOW vs probation

## Disagreement-Based Enrichment

Disagreement is treated as **signal**, not noise.

**Examples:**

- High ability + low trust → ALLOW_WITH_LIMITS
- High social trust + low ability → context-dependent

This enables nuanced outcomes rather than binary rejection.

## Enrichment Output

The enrichment layer produces **contextual signal interpretations** consumed by the Rule Engine.

No raw scores or provider-specific values are exposed.
