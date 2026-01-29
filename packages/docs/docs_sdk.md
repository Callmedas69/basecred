Here’s the **clean `.md` version** of the document you uploaded, faithfully converted and structured for docs usage (Docusaurus-ready, GitHub-friendly).
Source:

---

````md
# BaseCred SDK

**Unified Reputation Protocol**  
Ethos + Talent Protocol Integration

**Version:** 0.5.0  
**Date:** January 2026

---

## Executive Summary

BaseCred is a unified reputation SDK that aggregates credibility data from multiple on-chain protocols **without judgment, ranking, or interpretation**.

It provides developers with clean, composable reputation signals that respect user privacy and resist gamification.

---

## Core Principles

- **No aggregation** – facets remain independent and parallel
- **No judgment** – expose signals without verdicts
- **No ranking** – no user comparisons or leaderboards
- **Explicit absence** – missing data is never hidden
- **Time over snapshots** – continuity matters more than scores

---

## Key Features

- **Unified API** – Single function returns all reputation data
- **Multiple facets** – Social (Ethos) and Builder (Talent Protocol) credibility
- **Semantic levels** – Official protocol-defined score interpretations
- **Time semantics** – Explicit freshness and temporal integrity
- **Graceful failures** – Partial responses when one source is unavailable

---

## Architecture Overview

### Layer Architecture

BaseCred follows a strict unidirectional architecture:

| Layer        | Responsibility                                    |
| ------------ | ------------------------------------------------- |
| Public API   | `getUnifiedProfile(address, config)`              |
| Use Case     | Orchestrates repositories, applies business logic |
| Repository   | Fetches & maps raw API data                       |
| External API | Ethos Network API, Talent Protocol API            |

### Data Flow

1. Consumer calls `getUnifiedProfile(address, config)`
2. Use case orchestrates parallel calls
3. Repositories fetch raw data (no business logic)
4. Use case applies levels and signals
5. Facets assembled (no aggregation)
6. Response includes identity, availability, optional facets

---

## Development Phases

### Phase 0: Foundation (Ratified)

**Immutable constraints**

- Facets, not scores
- No aggregation
- No judgment
- Explicit absence
- Partial responses allowed

#### Locked Schema

```json
{
  "identity": { "address": "0x..." },
  "availability": {
    "ethos": "available",
    "talent": "available"
  },
  "ethos": { "data": {}, "signals": {}, "meta": {} },
  "talent": { "data": {}, "signals": {}, "meta": {} }
}
```
````

---

### Phase 1: Feasibility (Complete)

- Repo & Type Lock
- Ethos Adapter
- Talent Adapter
- Unified Assembly
- Failure Hardening
- Validation

---

### Phase 2: Score Expansion (Complete)

- `creatorScore`
- `creatorLevel` (`creator@v1`)
- `verifiedCreator` signal
- `/scores` endpoint

---

### Phase 3: Ethos Refactor (Complete)

- Migrated to `/profiles`
- Added timestamps
- Backward compatible

---

### Phase 4: Time Semantics (Complete)

- `recency` (recent / stale / dormant)
- `timeMeaning`
- `lastUpdatedDaysAgo`
- Immutable policies: `recency@v1`, `time@v1`

---

### Phase 5: Temporal Integrity (Deferred)

- Historical observations
- Stability classification

---

### Phase 6: Farcaster Account Quality (Draft)

**Purpose:**
“How healthy is this Farcaster account according to Neynar?”

**Explicitly NOT:**

- Humanity verification
- Trust inference
- Cross-platform judgment

#### Characteristics

- Platform-specific
- Opt-in only
- Parallel facet
- Consumer-defined thresholds
- Weekly updates

#### Facet Schema

```json
{
  "farcaster": {
    "data": { "userScore": 0.82 },
    "signals": { "passesQualityThreshold": true },
    "meta": {
      "source": "neynar",
      "scope": "farcaster",
      "lastUpdatedAt": "2026-01-20T00:00:00Z",
      "updateCadence": "weekly",
      "timeMeaning": "system_update"
    }
  }
}
```

---

## API Reference

### Installation

```bash
npm install @basednouns/ethos-tp-sdk
```

### Basic Usage

```ts
import { getUnifiedProfile } from "@basednouns/ethos-tp-sdk";

const profile = await getUnifiedProfile(
  "0x168D8b4f50BB3aA67D05a6937B643004257118ED",
  {
    ethos: {
      baseUrl: "https://api.ethos.network",
      clientId: "your-app@1.0.0",
    },
    talent: {
      baseUrl: "https://api.talentprotocol.com",
      apiKey: "your-api-key",
    },
  },
);
```

---

## Configuration

| Parameter                  | Type    | Description             |
| -------------------------- | ------- | ----------------------- |
| ethos.baseUrl              | string  | Ethos API URL           |
| ethos.clientId             | string  | X-Ethos-Client header   |
| talent.baseUrl             | string  | Talent API URL          |
| talent.apiKey              | string  | Talent API key          |
| levels.enabled             | boolean | Enable level derivation |
| farcaster.enabled          | boolean | Enable Farcaster facet  |
| farcaster.neynarApiKey     | string  | Neynar API key          |
| farcaster.qualityThreshold | number  | Threshold (0–1)         |

---

## Response Schema

### UnifiedProfile

| Field        | Description             |
| ------------ | ----------------------- |
| identity     | Wallet address          |
| availability | Source states           |
| ethos        | Ethos facet (optional)  |
| talent       | Talent facet (optional) |

### Availability States

- `available`
- `not_found`
- `unlinked`
- `error`

---

## Facet Details

### Ethos Facet (Social Credibility)

**Data**

- score (0–2800)
- vouchesReceived
- reviews
- credibilityLevel

**Signals**

- hasNegativeReviews
- hasVouches

#### Credibility Levels (`ethos@v1`)

| Score     | Level         |
| --------- | ------------- |
| 0–799     | Untrusted     |
| 800–1199  | Questionable  |
| 1200–1399 | Neutral       |
| 1400–1599 | Known         |
| 1600–1799 | Established   |
| 1800–1999 | Reputable     |
| 2000–2199 | Exemplary     |
| 2200–2399 | Distinguished |
| 2400–2599 | Revered       |
| 2600–2800 | Renowned      |

---

### Talent Facet (Builder Credibility)

**Data**

- builderScore
- builderLevel
- creatorScore
- creatorLevel

**Signals**

- verifiedBuilder
- verifiedCreator

#### Builder Levels (`builder@v1`)

| Score   | Level        |
| ------- | ------------ |
| 0–39    | Novice       |
| 40–79   | Apprentice   |
| 80–119  | Practitioner |
| 120–169 | Advanced     |
| 170–249 | Expert       |
| 250+    | Master       |

#### Creator Levels (`creator@v1`)

| Score   | Level        |
| ------- | ------------ |
| 0–39    | Emerging     |
| 40–79   | Growing      |
| 80–119  | Established  |
| 120–169 | Accomplished |
| 170–249 | Prominent    |
| 250+    | Elite        |

---

## Best Practices

### Do

- Check availability first
- Use facets independently
- Respect time semantics
- Handle partial responses
- Use signals for decisions

### Don’t

- Aggregate scores
- Rank users
- Label trust
- Infer from missing data
- Hardcode credentials

---

## Error Handling Example

```ts
if (profile.availability.ethos === "available" && profile.ethos) {
  console.log(profile.ethos.data.score);
} else {
  console.log("Ethos unavailable:", profile.availability.ethos);
}
```

---

## Appendix

### Level Policies

- ethos@v1
- builder@v1
- creator@v1

### Time Policies

- recency@v1
- time@v1

### Version History

| Version | Change                   |
| ------- | ------------------------ |
| 0.1.0   | Foundation + feasibility |
| 0.2.0   | Semantic levels          |
| 0.3.0   | Creator score            |
| 0.4.0   | Ethos refactor           |
| 0.5.0   | Time semantics           |
| 0.6.0   | Farcaster quality        |

---

## Support

For issues or contributions, visit the repository or contact the maintainers.

**Built for builders who care about real users and long-term contributors.**

```

---
```
