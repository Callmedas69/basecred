---
sidebar_position: 3
---

# Tiers & Capabilities

## Tiers (Ordered)

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

> **Implementation Note:** Never use string comparison (`>=`) on Tier values directly. Always use `tierGte()` or equivalent numeric comparison.

## Capabilities (Ordered)

```ts
type Capability = "NONE" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

const CAPABILITY_ORDER: Record<Capability, number> = {
  NONE: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
  EXPERT: 3,
};
```

## Tier Comparison Helpers

```ts
function tierLt(a: Tier, b: Tier): boolean {
  return TIER_ORDER[a] < TIER_ORDER[b];
}

function capabilityGte(a: Capability, b: Capability): boolean {
  return CAPABILITY_ORDER[a] >= CAPABILITY_ORDER[b];
}
```
