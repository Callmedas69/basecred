---
sidebar_position: 2
sidebar_label: "1.1: Ethos Repository"
---

# Sub-Phase 1.1: Ethos Repository

> Fetch social credibility from Ethos API without interpretation.

## Objective

- Use `POST /api/v2/users/by/address`
- Wallet-first only
- Approved Phase 0 fields only
- **FORBIDDEN**: influenceFactor, XP, percentile, ranking

## Exit Criteria

- Returns `available | not_found | error` (never throws)
- Maps only Phase 0 approved fields
- No extra fields exposed
- Configuration injected (no hardcoded URLs or headers)
- Uses `null` for unknown meta values

## API Reference

**Endpoint:** `POST https://api.ethos.network/api/v2/users/by/address`

**Request:**

```json
{
  "addresses": ["0xabc..."]
}
```

**Required Headers:**

- `X-Ethos-Client`: Application identifier
- `Content-Type`: `application/json`

## Field Mapping

| Phase 0 Field                | Ethos API Field                  | Notes                  |
| ---------------------------- | -------------------------------- | ---------------------- |
| `data.score`                 | `score`                          | Direct mapping         |
| `data.vouchesReceived`       | `stats.vouch.received.count`     | Direct mapping         |
| `data.reviews.positive`      | `stats.review.received.positive` | Direct mapping         |
| `data.reviews.neutral`       | `stats.review.received.neutral`  | Direct mapping         |
| `data.reviews.negative`      | `stats.review.received.negative` | Direct mapping         |
| `signals.hasNegativeReviews` | Computed                         | `reviews.negative > 0` |
| `signals.hasVouches`         | Computed                         | `vouchesReceived > 0`  |
| `meta.lastUpdatedAt`         | `null`                           | API doesn't provide    |
| `meta.firstSeenAt`           | `null`                           | API doesn't provide    |
| `meta.activeSinceDays`       | `null`                           | Cannot compute         |

### FORBIDDEN Fields

- `influenceFactor`
- `influenceFactorPercentile`
- `xpTotal`
- `xpStreakDays`
- `xpRemovedDueToAbuse`

## Meta Timestamps Decision

The Ethos API response does not include timestamp fields.

**Resolution:** Use `null` for all unknown values. Per Phase 0: **Explicit absence over fabricated defaults.**

## Exit Checklist

- [x] Repository compiles without errors
- [x] Returns `available | not_found | error` (never throws)
- [x] Maps only Phase 0 approved fields
- [x] No influenceFactor, XP, percentile, or ranking exposed
- [x] Configuration injected via `EthosConfig`
- [x] Uses `null` for unknown meta fields
- [x] No business logic in repository
