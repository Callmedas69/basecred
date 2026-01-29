---
sidebar_position: 2
---

# Signal Providers

BaseCred consumes **existing reputation systems** as signals. It does not replace them.

## External Reputation Signals

| Provider        | Primary Authority                 |
| --------------- | --------------------------------- |
| Ethos           | Long-term trust & credibility     |
| Talent Protocol | Ability & skill (builder/creator) |
| Neynar          | Social behavior & spam risk       |

These systems remain the **source of truth** for their respective domains.

## BaseCred Stance on Scores

- BaseCred **does not generate** a unified or proprietary score
- BaseCred **does not persist** score history
- BaseCred **does not compete** with signal providers

Scores are treated as **raw inputs**, normalized only for semantic comparison.

## Ephemeral Scores

BaseCred **does not store score history**.

- Scores are **derived on demand** from current signals
- Scores are **ephemeral** and recomputable
- Scores are **not treated as state**

This reduces data liability, avoids stale reputation, and keeps the system deterministic.

## Normalized Signals

```ts
interface NormalizedSignals {
  trust: Tier; // from Ethos
  socialTrust: Tier; // from Neynar
  builder: Capability; // from Talent
  creator: Capability; // from Talent
  recencyDays: number; // freshness
  spamRisk: Tier; // from Neynar
  signalCoverage: number; // 0-1
}
```

Normalized signals exist **only at decision time** and are not persisted.

## Normalization Logic & Thresholds

Determined by `src/engine/normalizers/`.

| Signal        | Source          | Logic / Thresholds                                                                                                                                              |
| :------------ | :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trust`       | Ethos           | Based on `credibility_score`:<br />• `VERY_HIGH` ≥ 40<br />• `HIGH` ≥ 20<br />• `NEUTRAL` ≥ 0<br />• `LOW` ≥ -20<br />• Else `VERY_LOW`                         |
| `socialTrust` | Neynar          | Based on `farcaster_user_score` (0-1):<br />• `VERY_HIGH` ≥ 0.9<br />• `HIGH` ≥ 0.7<br />• `NEUTRAL` ≥ 0.4<br />• `LOW` ≥ 0.2<br />• Else `VERY_LOW`            |
| `spamRisk`    | Neynar          | Inverse of `farcaster_user_score`:<br />• `VERY_LOW` (Safe) ≥ 0.8<br />• `LOW` ≥ 0.6<br />• `NEUTRAL` ≥ 0.4<br />• `HIGH` ≥ 0.2<br />• Else `VERY_HIGH` (Risky) |
| `builder`     | Talent Protocol | Based on `builder.score`:<br />• `EXPERT` ≥ 80<br />• `ADVANCED` ≥ 50<br />• `INTERMEDIATE` ≥ 20<br />• Else `NONE`                                             |
| `creator`     | Talent Protocol | Based on `creator.score`:<br />• `EXPERT` ≥ 80<br />• `ADVANCED` ≥ 50<br />• `INTERMEDIATE` ≥ 20<br />• Else `NONE`                                             |
