---
sidebar_position: 4
slug: schema
---

# Schema

## Unified Response (Locked Schema)

This schema defines **the product contract** of BaseCred.  
It must not change without reopening Phase 0.

**Authority rule:**  
All values, labels, and semantics are **authoritative to their source protocol**.  
BaseCred only fetches, assembles, and exposes them.

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
        "levelSource": "ethos",
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
        "levelSource": "talent_protocol",
        "levelPolicy": "builder@v1"
      },
      "creatorScore": 97,
      "creatorLevel": {
        "value": 97,
        "level": "Established",
        "levelSource": "talent_protocol",
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

## Availability Semantics

Each source must declare **exactly one** state:

- \`available\` — profile exists and data fetched
- \`not_found\` — no profile exists
- \`unlinked\` — identity exists but is not linked
- \`error\` — API error or failure

### Rules

- Partial responses are valid
- Absence must always be explicit
- Silent defaults are forbidden
