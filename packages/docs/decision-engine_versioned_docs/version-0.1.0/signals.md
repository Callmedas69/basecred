---
sidebar_position: 2
---

# Signals (NormalizedSignals)

Raw data from providers (like Farcaster, Ethos, Talent Protocol) is normalized into a standard format before reaching the engine. The engine _only_ understands these normalized signals.

## Signal Providers

| Provider        | Primary Authority                 |
| --------------- | --------------------------------- |
| Ethos           | Long-term trust & credibility     |
| Talent Protocol | Ability & skill (builder/creator) |
| Neynar          | Social behavior & spam risk       |

These systems remain the **source of truth** for their respective domains. BaseCred **does not generate** a unified or proprietary score; scores are treated as **raw inputs**, normalized only for semantic comparison.

## Normalized Signals

Normalized signals exist **only at decision time** and are not persisted.

```ts
interface NormalizedSignals {
  trust: Tier;           // from Ethos
  socialTrust: Tier;      // from Neynar
  builder: Capability;    // from Talent Protocol
  creator: Capability;    // from Talent Protocol
  recencyDays: number;   // freshness
  spamRisk: Tier;        // from Neynar
  signalCoverage: number; // 0–1, data completeness
}
```

## Normalization Logic & Thresholds

Determined by `src/engine/normalizers/`.

| Signal        | Source          | Logic / Thresholds |
| :------------ | :-------------- | :----------------- |
| `trust`       | Ethos           | Based on `credibility_score`: • `VERY_HIGH` ≥ 40 • `HIGH` ≥ 20 • `NEUTRAL` ≥ 0 • `LOW` ≥ -20 • Else `VERY_LOW` |
| `socialTrust` | Neynar          | Based on `farcaster_user_score` (0-1): • `VERY_HIGH` ≥ 0.9 • `HIGH` ≥ 0.7 • `NEUTRAL` ≥ 0.4 • `LOW` ≥ 0.2 • Else `VERY_LOW` |
| `spamRisk`    | Neynar          | Inverse of `farcaster_user_score`: • `VERY_LOW` (Safe) ≥ 0.8 • `LOW` ≥ 0.6 • `NEUTRAL` ≥ 0.4 • `HIGH` ≥ 0.2 • Else `VERY_HIGH` (Risky) |
| `builder`     | Talent Protocol | Based on `builder.score`: • `EXPERT` ≥ 80 • `ADVANCED` ≥ 50 • `INTERMEDIATE` ≥ 20 • Else `NONE` |
| `creator`     | Talent Protocol | Based on `creator.score`: • `EXPERT` ≥ 80 • `ADVANCED` ≥ 50 • `INTERMEDIATE` ≥ 20 • Else `NONE` |

`recencyDays` is derived from last-activity timestamps. `signalCoverage` is the share of signals successfully fetched (0–1).
