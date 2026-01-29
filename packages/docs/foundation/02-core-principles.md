---
sidebar_position: 2
slug: core-principles
---

# Core Principles

## Facets, Not Scores

Reputation is represented as **independent facets**, not a verdict.

**Social credibility** → Ethos  
_How others relate to this person_

**Builder credibility** → Talent Protocol  
_Evidence of building over time_

**Creator credibility** → Talent Protocol  
_Evidence of sustained creative contribution over time_

Facets are parallel, composable, and non-hierarchical.

Semantic labels (levels) are authoritative only when provided by the source protocol.

**No facet dominates another.**

## Infrastructure Is Not Credibility

Some systems are used to **access, verify, or filter data**, but do not express credibility.

For example, Neynar is used to access Farcaster identities and observe **social activity**, including patterns relevant to spam or abuse detection.

Any score, ranking, or heuristic exposed by Neynar is treated strictly as an **internal infrastructure signal**. Such values are used only for filtering, integrity checks, or abuse prevention and are **never surfaced, interpreted, or propagated** as reputation, credibility, or standing within BaseCred.

Infrastructure systems like Neynar do not define reputation, do not contribute credibility, and do not imply trust, quality, or standing.

They enable data access only.  
Credibility is defined **exclusively** by explicit credibility facets.

## Non-Goals (Hard Constraints)

BaseCred will **never**:

- merge Ethos and Talent scores
- merge builder and creator credibility into a single metric
- label users as good or bad
- act as a trust oracle
- optimize for engagement
- replace source protocols

:::danger
Any proposal violating these constraints is out of scope.
:::
