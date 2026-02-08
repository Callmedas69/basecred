---
sidebar_position: 1
---

# Decision Engine

The **BaseCred Decision Engine** determines _if_ an identity should be allowed to perform an action based on their reputation signals. It is designed to be **deterministic**, **context-aware**, and **explainable**.

> **"Should this identity be allowed to do this action, right now?"**

BaseCred is **not a scoring product**. It is a **Decision Engine** that helps platforms answer access control questions with deterministic, explainable decisions.

## Core Philosophy

1. **BaseCred does not create new scores** — Never invents or owns a proprietary reputation score.
2. **BaseCred aggregates existing reputation systems** — Ethos, Talent Protocol, Neynar are first-class providers.
3. **Decisions over scores** — Scores are inputs. Decisions are the product.
4. **Deterministic core** — Same inputs → same decision. Always reproducible.
5. **Context-aware** — Decisions depend on _where_ the action happens.
6. **Explainable by default** — Every decision produces a human-readable reason.
7. **Temporal first-class citizen** — Freshness matters more than absolute values.
8. **AI is assistive, never authoritative** — Rules decide. AI explains.

## What the Engine Produces

- **Decision**: `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`.
- **Confidence**: `VERY_HIGH`, `HIGH`, `MEDIUM`, or `LOW`.
- **Rule IDs** and **explain** (human-readable reasons).

## Contexts

Decisions are always made within a specific **context**.

| Context             | Purpose                                   |
| :------------------ | :---------------------------------------- |
| `allowlist.general` | General gatekeeping for access.           |
| `comment`           | Permission to post comments.              |
| `publish`           | Permission to publish new content.        |
| `apply`             | Permission to submit applications/grants. |
| `governance.vote`   | Eligibility to participate in voting.     |

For full context definitions and parameters used to measure each context, see [Foundation → Policy → Context and Decision Scenarios](/foundation/policy/context-and-decision-scenarios).

## Policy Hashes

Policy hashes are the canonical identifiers for rule thresholds used by ZK flows. You can retrieve the current hashes via the interface endpoint:

- `GET /api/v1/policies`

Each response item includes `context`, `policyHash`, and `normalizationVersion`.

## Documentation Map

| Page        | Content                                                                 |
| :---------- | :---------------------------------------------------------------------- |
| [Signals](./signals) | Normalized signals, providers, and normalization thresholds.           |
| [Tiers & Capabilities](./tiers) | Tier and capability types and comparison helpers.                      |
| [Rules](./rules) | Rule model, evaluation order, and full rule catalog (5 phases).        |
| [Decision Output](./output) | Response shape, confidence mapping, constraints reference.            |
| [API Reference](./api) | `decide(signals, context)`, GET/POST endpoints, response example.      |

## Guiding Principle

> **If a feature does not help answer "yes or no", it does not belong in the Decision Engine.**
