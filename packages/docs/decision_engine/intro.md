---
sidebar_position: 1
---

# Decision Engine

> **"Should this identity be allowed to do this action, right now?"**

BaseCred is **not a scoring product**. BaseCred is a **Decision Engine** that helps platforms answer access control questions with deterministic, explainable decisions.

## Core Philosophy

1. **BaseCred does not create new scores** — Never invents or owns a proprietary reputation score
2. **BaseCred aggregates existing reputation systems** — Ethos, Talent Protocol, Neynar are first-class providers
3. **Decisions over scores** — Scores are inputs. Decisions are the product
4. **Deterministic core** — Same inputs → same decision. Always reproducible
5. **Context-aware** — Decisions depend on _where_ the action happens
6. **Explainable by default** — Every decision produces a human-readable reason
7. **Temporal first-class citizen** — Freshness matters more than absolute values
8. **AI is assistive, never authoritative** — Rules decide. AI explains

## High-Level Architecture

```
Signals → Scores → Rules → Decision → Action
                     ↓
                AI Explanation (optional)
```

| Component | Role                                                        |
| --------- | ----------------------------------------------------------- |
| Signals   | Raw onchain/offchain data                                   |
| Scores    | Normalized internal metrics                                 |
| Rules     | Deterministic decision logic                                |
| Decision  | ALLOW / DENY / ALLOW_WITH_LIMITS                            |
| AI        | Explanation, simulation, anomaly detection (never deciding) |

## Guiding Principle

> **If a feature does not help answer "yes or no", it does not belong in the Decision Engine.**
