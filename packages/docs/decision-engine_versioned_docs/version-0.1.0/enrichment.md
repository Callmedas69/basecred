---
sidebar_position: 7
---

# Signal Enrichment (Optional)

:::caution Not in authoritative engine doc
This section describes a possible **Signal Enrichment Layer**. It is **not** part of the current authoritative engine documentation (see [ENGINE-DOCUMENTATION.md](https://github.com/GeoartStudio/basecred/blob/main/packages/decision-engine/ENGINE-DOCUMENTATION.md)). Implementations may or may not include enrichment.
:::

BaseCred may introduce a **Signal Enrichment Layer** between normalized signals and rule evaluation. The purpose would be **not** to create new scores, but to extract additional meaning from:

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

When multiple providers agree positively, confidence can be increased (e.g. in explanation or eligibility for full ALLOW vs probation).

## Disagreement-Based Enrichment

Disagreement can be treated as **signal**, not noise (e.g. high ability + low trust → ALLOW_WITH_LIMITS).

## Enrichment Output

The enrichment layer would produce **contextual signal interpretations** consumed by the Rule Engine. No raw scores or provider-specific values would be exposed.
