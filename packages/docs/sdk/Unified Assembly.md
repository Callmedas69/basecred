---
sidebar_position: 4
sidebar_label: "1.3: Unified Assembly"
---

# Sub-Phase 1.3: Unified Assembly

> Compose facets without bias.

## Objective

- Call adapters in parallel
- One failure must not block the other
- Always return: identity, availability, zero, one, or two facets

Per Phase 0:

- Partial responses are valid
- Absence must always be explicit
- Silent defaults are forbidden

## Exit Criteria

- Output matches Phase 0 schema **exactly**
- Both repositories called in parallel
- Ethos failure does not block Talent (and vice versa)
- Returns `UnifiedProfile` with:
  - `identity` (always present)
  - `availability` (always present, explicit states)
  - `ethos` (present only when `availability.ethos === 'available'`)
  - `talent` (present only when `availability.talent === 'available'`)
- Configuration injected via `SDKConfig`
- Never throws on valid input

## Design Decisions

### Parallel Execution

Both repositories are called concurrently using `Promise.allSettled`.

**Rationale:**

- `Promise.all` would fail-fast on first rejection
- `Promise.allSettled` allows both to complete independently
- Matches requirement: "One failure must not block the other"

### Conditional Facet Inclusion

Facets are included **if and only if** `availability === 'available'`.

```ts
// CORRECT: Conditional property inclusion
...(ethosResult.availability === 'available' && ethosResult.facet
  ? { ethos: ethosResult.facet }
  : {}),

// WRONG: Always including with undefined
ethos: ethosResult.facet, // undefined when not available
```

## Output Examples

### Both Available

```json
{
  "identity": { "address": "0xabc..." },
  "availability": { "ethos": "available", "talent": "available" },
  "ethos": { "data": {...}, "signals": {...}, "meta": {...} },
  "talent": { "data": {...}, "signals": {...}, "meta": {...} }
}
```

### Ethos Available, Talent Not Found

```json
{
  "identity": { "address": "0xabc..." },
  "availability": { "ethos": "available", "talent": "not_found" },
  "ethos": { "data": {...}, "signals": {...}, "meta": {...} }
}
```

### Both Error

```json
{
  "identity": { "address": "0xabc..." },
  "availability": { "ethos": "error", "talent": "error" }
}
```

## Exit Checklist

### Schema Compliance

- [x] Output matches Phase 0 `UnifiedProfile` exactly
- [x] `identity` always present with `address`
- [x] `availability` always present with both states
- [x] `ethos` present only when `availability.ethos === 'available'`
- [x] `talent` present only when `availability.talent === 'available'`

### Execution

- [x] Both repositories called in parallel (`Promise.allSettled`)
- [x] Ethos failure does not block Talent
- [x] Talent failure does not block Ethos
- [x] Never throws on valid input

### Phase 0 Neutrality

- [x] No interpretation of data
- [x] No ranking or judgment
- [x] Absence is explicit, not hidden
