---
sidebar_position: 3
sidebar_label: "1.2: Talent Repository"
---

# Sub-Phase 1.2: Talent Repository

> Fetch builder credibility from Talent Protocol API without inference.

## Objective

- Use `GET /score`
- `account_source=wallet`
- API key required
- **FORBIDDEN**: ranking, scorer variants

## Exit Criteria

- `builderScore = points` (direct mapping)
- `verifiedBuilder = points > 0` (computed)
- Returns `available | not_found | error` (never throws)
- Availability explicit
- Configuration injected (no hardcoded URLs or API keys)
- Uses `null` for unknown meta values

## API Reference

**Endpoint:** `GET https://api.talentprotocol.com/score`

**Query Parameters:**

- `id`: Wallet address
- `account_source`: Must be `wallet`

**Required Headers:**

- `X-API-KEY`: Talent Protocol API key
- `Accept`: `application/json`

**Response:**

```json
{
  "score": {
    "points": 187,
    "last_calculated_at": "2026-01-21T09:36:53Z",
    "rank_position": 739,
    "slug": "builder_score"
  }
}
```

**Behavior Notes:**

- API returns `points: 0` for unknown wallets (NOT 404)
- `rank_position` may be `null` for low-activity wallets

## Field Mapping

| Phase 0 Field             | Talent API Field           | Notes                    |
| ------------------------- | -------------------------- | ------------------------ |
| `data.builderScore`       | `score.points`             | Direct mapping           |
| `signals.verifiedBuilder` | Computed                   | `points > 0`             |
| `meta.lastUpdatedAt`      | `score.last_calculated_at` | Direct, `null` if absent |

### FORBIDDEN Fields

- `rank_position` (present in response - DO NOT MAP)
- `slug` (internal identifier - DO NOT MAP)
- Any percentile or leaderboard data

## Availability Mapping

| API Response                    | Availability State |
| ------------------------------- | ------------------ |
| 200 with valid score object     | `available`        |
| 200 with missing/malformed data | `not_found`        |
| 401 (invalid key)               | `error`            |
| Network failure                 | `error`            |

## Exit Checklist

- [x] Endpoint path verified against live Talent Protocol API
- [x] Repository compiles without errors
- [x] Returns `available | not_found | error` (never throws)
- [x] `builderScore` maps directly from `points`
- [x] `verifiedBuilder` computed as `points > 0`
- [x] No ranking or scorer variants exposed
- [x] Configuration injected via `TalentConfig`
- [x] Uses `null` for unknown meta fields
- [x] No business logic in repository
