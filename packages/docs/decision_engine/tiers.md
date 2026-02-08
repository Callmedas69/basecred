---
sidebar_position: 3
---

# Tiers & Capabilities

The engine uses **Tier** for trust/social/spam signals and **Capability** for builder/creator. Never use string comparison (`>=`) on these values directly; always use the comparison helpers.

## Tiers (Ordered)

Used for `trust`, `socialTrust`, `spamRisk`.

```ts
type Tier = "VERY_LOW" | "LOW" | "NEUTRAL" | "HIGH" | "VERY_HIGH";

const TIER_ORDER: Record<Tier, number> = {
  VERY_LOW: 0,
  LOW: 1,
  NEUTRAL: 2,
  HIGH: 3,
  VERY_HIGH: 4,
};

function tierGte(a: Tier, b: Tier): boolean {
  return TIER_ORDER[a] >= TIER_ORDER[b];
}
```

## Capabilities (Ordered)

Used for `builder`, `creator`. Documented here with the same ordering semantics as in the rule catalog (e.g. EXPERT, ADVANCED, INTERMEDIATE, NONE).

```ts
type Capability = "NONE" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

const CAPABILITY_ORDER: Record<Capability, number> = {
  NONE: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
  EXPERT: 3,
};

function capabilityGte(a: Capability, b: Capability): boolean {
  return CAPABILITY_ORDER[a] >= CAPABILITY_ORDER[b];
}
```

## Comparison Helpers

```ts
function tierLt(a: Tier, b: Tier): boolean {
  return TIER_ORDER[a] < TIER_ORDER[b];
}

function tierGte(a: Tier, b: Tier): boolean {
  return TIER_ORDER[a] >= TIER_ORDER[b];
}

function capabilityGte(a: Capability, b: Capability): boolean {
  return CAPABILITY_ORDER[a] >= CAPABILITY_ORDER[b];
}
```

:::note Implementation
The codebase may use different enum names (e.g. EXPLORER, BUILDER, ELITE). The ordering semantics and rule logic align with the catalog in [Rules](./rules).
:::
