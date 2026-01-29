# basecred-sdk

A neutral, composable SDK that fetches and assembles reputation data from [Ethos Network](https://ethos.network), [Talent Protocol](https://talentprotocol.com), and [Neynar](https://neynar.com) (Farcaster).

This SDK exists to make reputation data observable without turning it into judgment.

## What This SDK Does

- Fetches Ethos social credibility signals (vouches, reviews, raw score)
- Fetches Talent Protocol builder and creator credibility (builder score, creator score)
- Fetches Neynar Farcaster account quality score (opt-in)
- Derives semantic levels from scores (enabled by default)
- Computes time semantics (days active, recency buckets)
- Returns a unified, neutral profile
- Explicitly declares absence and failure states

## What This SDK Does NOT Do

- No rankings
- No percentiles
- No trust verdicts
- No aggregation or interpretation
- No gamification logic

## Installation

```bash
npm install basecred-sdk
```

> Requires Node.js 18+ (uses native `fetch`).

This SDK is intended for applications that need neutral access to reputation signals without embedded judgment or ranking logic.

## Usage

```ts
import { getUnifiedProfile } from 'basecred-sdk';

const profile = await getUnifiedProfile(
  '0xabc...',
  {
    ethos: {
      baseUrl: 'https://api.ethos.network',
      clientId: 'your-app@0.1.0',
    },
    talent: {
      baseUrl: 'https://api.talentprotocol.com',
      apiKey: process.env.TALENT_API_KEY!,
    },
    // Optional: Enable Farcaster quality scoring
    farcaster: {
      enabled: true,
      neynarApiKey: process.env.NEYNAR_API_KEY!,
      qualityThreshold: 0.5,  // Optional, default: 0.5
    },
  }
);

// Level derivation is enabled by default.
// To disable level derivation:
const profileWithoutLevels = await getUnifiedProfile(
  '0xabc...',
  {
    ethos: { /* ... */ },
    talent: { /* ... */ },
    levels: { enabled: false },
  }
);
```

**Note:**
- Ethos Network does not require an API key
- Talent Protocol requires an API key (request one at [talentprotocol.com](https://talentprotocol.com))
- Farcaster (Neynar) requires an API key (get one at [neynar.com](https://neynar.com))

## Output Schema

```json
{
  "identity": {
    "address": "0xabc..."
  },
  "availability": {
    "ethos": "available",
    "talent": "available",
    "farcaster": "available"
  },
  "ethos": {
    "data": {
      "score": 1732,
      "credibilityLevel": {
        "value": 1732,
        "level": "Established",
        "levelSource": "sdk",
        "levelPolicy": "ethos@v1"
      },
      "vouchesReceived": 5,
      "reviews": {
        "positive": 12,
        "neutral": 1,
        "negative": 0
      }
    },
    "signals": {
      "hasNegativeReviews": false,
      "hasVouches": true
    },
    "meta": {
      "firstSeenAt": "2024-03-15T10:00:00Z",
      "lastUpdatedAt": "2026-01-20T14:30:00Z",
      "activeSinceDays": 679,
      "lastUpdatedDaysAgo": 3
    }
  },
  "talent": {
    "data": {
      "builderScore": 196,
      "builderLevel": {
        "value": 196,
        "level": "Expert",
        "levelSource": "sdk",
        "levelPolicy": "builder@v1"
      },
      "creatorScore": 97,
      "creatorLevel": {
        "value": 97,
        "level": "Established",
        "levelSource": "sdk",
        "levelPolicy": "creator@v1"
      }
    },
    "signals": {
      "verifiedBuilder": true,
      "verifiedCreator": true
    },
    "meta": {
      "lastUpdatedAt": "2026-01-22T15:22:46Z",
      "lastUpdatedDaysAgo": 1
    }
  },
  "farcaster": {
    "data": {
      "userScore": 0.97
    },
    "signals": {
      "passesQualityThreshold": true
    },
    "meta": {
      "source": "neynar",
      "scope": "farcaster",
      "lastUpdatedAt": "2026-01-25T08:00:00Z",
      "lastUpdatedDaysAgo": 0,
      "updateCadence": "weekly",
      "timeMeaning": "system_update"
    }
  },
  "recency": {
    "bucket": "recent",
    "windowDays": 30,
    "lastUpdatedDaysAgo": 0,
    "derivedFrom": ["talent", "farcaster"],
    "computedAt": "2026-01-25T12:00:00Z",
    "policy": "recency@v1"
  }
}
```

### Level Derivation

The SDK derives semantic levels from raw scores using documented upstream protocol thresholds.

**Ethos Credibility Levels** (`ethos@v1`):

| Score | Level |
|-------|-------|
| 0-799 | Untrusted |
| 800-1199 | Questionable |
| 1200-1399 | Neutral |
| 1400-1599 | Known |
| 1600-1799 | Established |
| 1800-1999 | Reputable |
| 2000-2199 | Exemplary |
| 2200-2399 | Distinguished |
| 2400-2599 | Revered |
| 2600-2800 | Renowned |

**Talent Builder Levels** (`builder@v1`):

| Score | Level |
|-------|-------|
| 0-39 | Novice |
| 40-79 | Apprentice |
| 80-119 | Practitioner |
| 120-169 | Advanced |
| 170-249 | Expert |
| 250+ | Master |

**Talent Creator Levels** (`creator@v1`):

| Score | Level |
|-------|-------|
| 0-39 | Emerging |
| 40-79 | Growing |
| 80-119 | Established |
| 120-169 | Accomplished |
| 170-249 | Prominent |
| 250+ | Elite |

Level derivation is:
- **Enabled by default** — set `levels: { enabled: false }` to disable
- **Deterministic** — same score always maps to same level
- **Versioned** — policy identifier included in output (e.g., `ethos@v1`)

### Time Semantics

The SDK computes time-based fields from timestamps:

| Field | Source | Description |
|-------|--------|-------------|
| `ethos.meta.activeSinceDays` | `firstSeenAt` | Days since profile creation |
| `ethos.meta.lastUpdatedDaysAgo` | `lastUpdatedAt` | Days since last profile update |
| `talent.meta.lastUpdatedDaysAgo` | `lastUpdatedAt` | Days since score recalculation |

### Recency

Profile-level data freshness indicator (`recency@v1`):

| Bucket | Condition |
|--------|-----------|
| `recent` | Updated within 30 days |
| `stale` | Updated 31-90 days ago |
| `dormant` | Updated more than 90 days ago |

Recency is:
- Derived from the most recently updated facet
- Omitted if no facet has `lastUpdatedAt`
- Computed at query time (UTC)

### Availability States

Each source declares exactly one state:

| State | Meaning |
|-------|---------|
| `available` | Profile exists, data fetched |
| `not_found` | No profile exists |
| `unlinked` | Identity exists but not linked |
| `error` | API error or failure |

Partial responses are valid. Both facets are optional based on availability.

## Design Principles

- **Absence is explicit** — Missing data is declared, never hidden
- **Time matters more than score** — Temporal fields enable continuity analysis
- **Sources are parallel** — Ethos and Talent are peers, not ranked
- **Data is reported, not judged** — Consumers interpret meaning

## Non-Goals

This SDK intentionally does NOT:

- Decide trustworthiness
- Rank users
- Compare users
- Produce composite scores
- Replace human judgment

## Error Handling

This SDK never throws on valid input.

All failures are surfaced explicitly via the `availability` field for each source. Consumers should check `availability.ethos` and `availability.talent` to determine data presence.

## Changelog

**v0.6.0 — Farcaster Account Quality**

Optional Neynar score integration for Farcaster platform account quality.

**v0.5.2 — Bug Fix**

Talent API 404 now correctly maps to `'not_found'` instead of `'error'`.

**v0.5.1 — Documentation**

Pre-publish checklist, cleaned up comments, updated docs.

**v0.5.0 — Time Semantics**

The SDK now computes time-based fields (days active, recency buckets) from upstream timestamps.

**v0.4.0 — Ethos Timestamps**

Ethos profile creation and update times now exposed via `firstSeenAt` and `lastUpdatedAt`.

**v0.3.0 — Creator Score**

Talent facet expanded with `creatorScore` and `creatorLevel` as parallel axes to builder credibility.

## License

MIT
