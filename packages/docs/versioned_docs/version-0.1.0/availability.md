---
sidebar_position: 7
---

# Availability Semantics

> Understanding signal presence and absence.

Every signal in BaseCred has an `availability` state. This is critical: **missing data does not mean low quality.** A user who has never used Farcaster has no Neynar signals — that is absence, not evidence of bad behavior.

## Why Availability Matters

BaseCred aggregates signals from multiple providers (Ethos, Neynar, Talent Protocol). Any provider can be unavailable for a given user — either because the user has no presence on that platform, or because the provider API failed at request time.

The engine must distinguish between these cases to avoid penalizing users for missing data.

## Availability States

### `AVAILABLE`

Data was successfully fetched and is present. The signal values are current and can be used at full weight in decision rules.

### `UNAVAILABLE`

The data provider returned no record for this user. This typically means the user does not exist on that platform. The engine treats this as **neutral absence** — it does not contribute negatively to the decision.

### `ERROR`

The provider was unreachable or returned an unexpected failure. The engine cannot determine whether the user exists on the platform. This state triggers **partial-data logic**: the engine reduces confidence and may apply fallback rules.

## How the Engine Handles Partial Data

The engine tracks a `signalCoverage` value (0 to 1) representing how many signal sources returned usable data. This directly affects the `confidence` tier in the output:

- **Full coverage** (all providers available): confidence starts at `HIGH` or above.
- **Partial coverage** (some providers errored): confidence is reduced proportionally.
- **Minimal coverage** (most providers errored): confidence drops to `LOW`.

When signal coverage is low, the engine activates **Phase 1 fallback rules** from the rule catalog. These rules are more conservative — they may limit or deny access when the engine lacks enough data to make a confident decision.

## Key Principle

> If you cannot observe a signal, you cannot draw conclusions from its absence.

Applications consuming BaseCred decisions should check the `confidence` field. A `LOW` confidence decision with a `DENY` outcome may simply reflect insufficient data, not genuine risk.
