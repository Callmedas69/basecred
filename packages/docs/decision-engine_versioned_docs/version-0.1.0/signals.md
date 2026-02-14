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
| `trust`       | Ethos           | Based on `credibility_score`: • `VERY_HIGH` ≥ 1800 • `HIGH` ≥ 1250 • `NEUTRAL` ≥ 900 • `LOW` ≥ 550 • Else `VERY_LOW` |
| `socialTrust` | Neynar          | Based on `farcaster_user_score` (0-1): • `VERY_HIGH` ≥ 0.85 • `HIGH` ≥ 0.6 • `NEUTRAL` ≥ 0.3 • `LOW` ≥ 0.15 • Else `VERY_LOW` |
| `spamRisk`    | Neynar          | Inverse of `farcaster_user_score`: • `VERY_LOW` (Safe) ≥ 0.7 • `LOW` ≥ 0.5 • `NEUTRAL` ≥ 0.3 • `HIGH` ≥ 0.15 • Else `VERY_HIGH` (Risky) |
| `builder`     | Talent Protocol | Based on `builder.score`: • `ELITE` ≥ 220 • `EXPERT` ≥ 140 • `BUILDER` ≥ 60 • Else `EXPLORER` |
| `creator`     | Talent Protocol | Based on `creator.score`: • `ELITE` ≥ 220 • `EXPERT` ≥ 140 • `BUILDER` ≥ 60 • Else `EXPLORER` |

`recencyDays` is derived from last-activity timestamps. `signalCoverage` is the share of signals successfully fetched (0–1).
