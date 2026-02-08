---
sidebar_position: 8
---

# Time & Recency

> How time affects decisions.

Reputation is not static. BaseCred weighs recency heavily — a user who was active a year ago but dormant since may present different risk than one who is active today.

## What `recencyDays` Represents

The `recencyDays` signal is the number of days since the user's most recent meaningful on-chain or off-chain activity, as reported by the signal providers. It is calculated at request time and reflects the freshest data available.

A lower value means more recent activity. A value of `0` means activity was observed today.

## Rule Interactions

Several rules in the engine's rule catalog use `recencyDays` to adjust decisions:

- **`probation_inactive`**: Triggers when `recencyDays >= 14`. Users with no recent activity within two weeks may be placed under additional scrutiny or limited access.
- **`limit_governance_inactive`**: Triggers when `recencyDays` is between 30 and 90 days. Users inactive for this period are restricted from governance actions like voting, to prevent stale identities from influencing active decisions.

These thresholds are defined in the rule catalog and vary by context. A context like `governance.vote` is stricter about recency than `comment`.

## Point-in-Time Semantics

Decisions are **ephemeral**. They represent the engine's assessment at the exact moment of the request. The same subject queried five minutes later may receive a different decision if:

- New activity was recorded by a provider
- A provider that was erroring is now available
- Signal coverage changed

This is by design. BaseCred decisions are not verdicts — they are snapshots.

## Stale Data Anti-Pattern

:::warning Do not cache decisions as permanent state
Caching a BaseCred decision and treating it as a lasting authorization is an anti-pattern. Decisions should be re-requested when the action occurs, not stored and replayed. See [Anti-Patterns](./anti-patterns.md) for more.
:::
