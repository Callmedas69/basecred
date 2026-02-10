# Changelog

## [0.6.2] — 2026-02-10

### Fixed

- Neynar score now returns the actual decimal value (e.g., `0.98`) instead of the rounded integer (`1`)
  - Reads `experimental.neynar_user_score` (decimal 0-1) with fallback to `score` (rounded)
  - Sends `x-neynar-experimental: true` header to enable the experimental response field

---

## [0.6.1] — 2026-02-04

### Fixed

- Talent score slugs now support versioned variants (e.g., `builder_score_2025`, `creator_score_2025`)
- `talent.meta.lastUpdatedAt` now uses the most recent timestamp across known builder/creator scores

### Added

- Talent score rank positions are now exposed in the SDK (`builderRankPosition`, `creatorRankPosition`)
  - Mapped from Talent Protocol `/scores` response (`rank_position`, `last_calculated_at`)

---

## [0.6.0] — 2026-01-25

### Added

- **Farcaster Account Quality (Phase 6)** — Optional Neynar score integration
  - New facet: `farcaster` with platform-scoped quality signal
  - New types: `FarcasterFacet`, `FarcasterData`, `FarcasterSignals`, `FarcasterMeta`
  - New config: `FarcasterConfig` with `enabled`, `neynarApiKey`, `qualityThreshold`
  - `FarcasterData.userScore` — Raw Neynar user score (0-1)
  - `FarcasterSignals.passesQualityThreshold` — Consumer-defined threshold check
  - `FarcasterMeta.timeMeaning: 'system_update'` — Explicit time semantics
- Extended `Availability` with optional `farcaster` state
- Extended `Recency.derivedFrom` to include `'farcaster'`

### Characteristics

- **Opt-in only** — Set `farcaster: { enabled: true, neynarApiKey: '...' }` to activate
- **Consumer-defined threshold** — Default 0.5, configurable via `qualityThreshold`
- **Parallel facet** — Does not affect Ethos or Talent, no cross-facet aggregation
- **Backwards compatible** — Existing consumers work unchanged

---

## [0.5.2] — 2026-01-23

### Fixed

- Talent API 404 responses now correctly map to `'not_found'` instead of `'error'`
  - Addresses without Talent profiles show "Not found" instead of "Error"
  - Consistent semantic behavior with Ethos API handling

---

## [0.5.1] — 2026-01-23

### Added

- Pre-publish checklist script (`scripts/prepublish-check.js`)

### Changed

- Cleaned up internal comments (removed external references)
- Updated documentation (README, DESIGN, CHANGELOG)

---

## [0.5.0] — 2026-01-23

### Added

- **Time Semantics** — First-class time interpretation
  - `EthosMeta.activeSinceDays` — Days since profile creation (computed from `firstSeenAt`)
  - `EthosMeta.lastUpdatedDaysAgo` — Days since last update (computed from `lastUpdatedAt`)
  - `TalentMeta.lastUpdatedDaysAgo` — Days since score recalculation
- **Recency** — Profile-level data freshness indicator
  - `Recency.bucket` — Classification: `recent` (≤30d), `stale` (31-90d), `dormant` (>90d)
  - `Recency.windowDays` — Policy window (30 days)
  - `Recency.lastUpdatedDaysAgo` — Minimum days ago from available facets
  - `Recency.derivedFrom` — Sources contributing to recency (`ethos` | `talent`)
  - `Recency.computedAt` — ISO 8601 timestamp of computation
  - `Recency.policy` — Immutable policy version (`recency@v1`)

### Characteristics

- Time calculations are mechanical (floor, UTC only)
- Future timestamps return 0 days ago
- Missing timestamps result in `null` for computed fields
- Recency computed from most recent available facet
- Recency omitted if no facet has `lastUpdatedAt`

---

## [0.4.0] — 2026-01-23

### Added

- **Ethos timestamp support** — Profile creation and update times now exposed
  - `EthosMeta.firstSeenAt` — ISO 8601 timestamp of profile creation
  - `EthosMeta.lastUpdatedAt` — ISO 8601 timestamp of last profile update

### Changed

- Ethos repository now uses `/profiles` endpoint instead of `/users/by/address`
- Timestamps converted from Unix seconds to ISO 8601 strings

### Characteristics

- Backward compatible — no breaking changes to public API
- `EthosMeta.activeSinceDays` remains `null` (computed in v0.5.0)

---

## [0.3.0] — 2026-01-22

### Added

- **Creator Score support** — Expanded Talent facet with creator credibility
  - New field: `TalentData.creatorScore` (optional)
  - New field: `TalentData.creatorLevel` (optional, derived when levels enabled)
  - New signal: `TalentSignals.verifiedCreator` (true when creatorScore > 0)
  - New level policy: `creator@v1` (Emerging → Elite, 6 levels)

### Changed

- Talent repository now uses `/scores` endpoint to fetch all scores in one call
- Builder and Creator scores are parallel axes of credibility (non-hierarchical)

### Characteristics

- Creator Score levels use same thresholds as Builder Score with different labels
- All new fields are optional — existing consumers work unchanged
- Initial release ignored undocumented score variants; updated in 0.6.1 to accept versioned slugs

---

## [0.2.0] — 2026-01-22

### Added

- **Level derivation system** — Derives semantic levels from raw scores
  - Ethos credibility levels (`ethos@v1`): Untrusted → Renowned (10 levels)
  - Talent builder levels (`builder@v1`): Novice → Master (6 levels)
- New types: `BaseCredLevel`, `LevelConfig`
- New fields: `EthosData.credibilityLevel`, `TalentData.builderLevel`
- Level derivation enabled by default, opt-out via `levels: { enabled: false }`

### Characteristics

- Levels are derived from documented upstream protocol thresholds
- Derivation is deterministic and versioned (e.g., `ethos@v1`)
- Graceful degradation for out-of-range scores
- Additive changes only — existing code continues to work

---

## [0.1.1] — 2026-01-22

### Changed

- Updated repository URL to `github.com/GeoartStudio/basecred-sdk`
- Added homepage: `basecredsdk.geoart.studio`

---

## [0.1.0] — 2026-01-22

### Added

- Initial release of `basecred-sdk`
- Unified, neutral profile assembly from:
  - Ethos Network (social credibility signals)
  - Talent Protocol (builder credibility score)

### Characteristics

- Explicit availability states for each source
- Partial responses supported
- No rankings, percentiles, or trust verdicts
- No aggregation or interpretation logic
