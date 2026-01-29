---
sidebar_position: 1
sidebar_label: "1.0: Repo & Type Lock"
---

# Sub-Phase 1.0: Repo & Type Lock

> Encode the **Phase 0 unified response** into types so that **schema drift becomes impossible by accident**.

## Objective

If someone wants to change meaning later, they must **edit Phase 0 first**.

## Exit Criteria

- Types compile
- No implementation logic exists
- Schema matches Phase 0 exactly

## Project Structure

```
scoreSDK/
├── src/
│   └── types/
│       ├── index.ts          # Re-exports all types
│       ├── unified.ts        # UnifiedProfile root type
│       ├── identity.ts       # Identity type
│       ├── availability.ts   # Availability states
│       ├── ethos.ts          # Ethos facet types
│       ├── talent.ts         # Talent facet types
│       └── config.ts         # SDK configuration types
├── package.json
├── tsconfig.json
└── .gitignore
```

## TypeScript Types

### Availability States

```ts
export type AvailabilityState =
  | "available" // profile exists and data fetched
  | "not_found" // no profile exists
  | "unlinked" // identity exists but is not linked
  | "error"; // API error or failure

export interface Availability {
  ethos: AvailabilityState;
  talent: AvailabilityState;
}
```

### Ethos Facet

```ts
export interface EthosFacet {
  data: {
    score: number;
    vouchesReceived: number;
    reviews: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  signals: {
    hasNegativeReviews: boolean;
    hasVouches: boolean;
  };
  meta: {
    firstSeenAt: string | null;
    lastUpdatedAt: string | null;
    activeSinceDays: number | null;
  };
}
```

**FORBIDDEN fields:** `influenceFactor`, `XP`, `percentile`, `ranking`

### Talent Facet

```ts
export interface TalentFacet {
  data: {
    builderScore: number;
  };
  signals: {
    verifiedBuilder: boolean;
  };
  meta: {
    lastUpdatedAt: string | null;
  };
}
```

**FORBIDDEN fields:** `ranking`, `scorer variants`

### UnifiedProfile

```ts
export interface UnifiedProfile {
  identity: Identity;
  availability: Availability;
  ethos?: EthosFacet; // Present only when available
  talent?: TalentFacet; // Present only when available
}
```

## Architecture

```
Public API (getUnifiedProfile)
       ↓
Use Case / Business Logic (unified assembly)
       ↓
Repository (Ethos + Talent adapters)
       ↓
External API (Ethos API, Talent Protocol API)
```

## Exit Checklist

- [x] Types compile (`npm run typecheck` passes)
- [x] No network code exists
- [x] No adapter logic exists
- [x] Unified schema matches Phase 0 exactly
- [x] No "future" fields sneaked in
