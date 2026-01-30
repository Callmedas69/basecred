# Signal Normalization Logic

This document explains how the BaseCred Decision Engine normalizes raw scores from various providers into standardized **Tiers** and **Capabilities**. This allows the decision rules to operate on consistent signals (e.g., `HIGH`, `NEUTRAL`) rather than provider-specific metrics.

## 1. Neynar (Farcaster)

**Source**: User profiles and scores from Neynar.

Neynar provides a single **Farcaster User Score** (0-1). We derive two distinct signals from this score.

### Social Trust (`socialTrust`)

Represents the user's general reputation and social standing on Farcaster.

| Tier          | Score Threshold |
| :------------ | :-------------- |
| **VERY_HIGH** | Score ≥ 0.9     |
| **HIGH**      | Score ≥ 0.7     |
| **NEUTRAL**   | Score ≥ 0.4     |
| **LOW**       | Score ≥ 0.2     |
| **VERY_LOW**  | Score < 0.2     |

### Spam Risk (`spamRisk`)

Represents the likelihood of the user being a spammer. This is the **inverse** of the quality score (high quality = low spam risk).

| Tier                  | Score Threshold | Note              |
| :-------------------- | :-------------- | :---------------- |
| **VERY_LOW** (Safe)   | Score ≥ 0.8     | High quality user |
| **LOW**               | Score ≥ 0.6     |                   |
| **NEUTRAL**           | Score ≥ 0.4     |                   |
| **HIGH**              | Score ≥ 0.2     |                   |
| **VERY_HIGH** (Risky) | Score < 0.2     | Low quality user  |

---

## 2. Talent Protocol

**Source**: Builder and Creator scores from Talent Protocol.

### Builder Score

Measures a user's technical and project-building achievements.

| Level | Score Range | Original Status | Normalized Level |
| :---- | :---------- | :-------------- | :--------------- |
| **6** | 250+        | Master          | **EXPERT**       |
| **5** | 170-249     | Expert          | **EXPERT**       |
| **4** | 120-169     | Advanced        | **ADVANCED**     |
| **3** | 80-119      | Practitioner    | **INTERMEDIATE** |
| **2** | 40-79       | Apprentice      | **NONE**         |
| **1** | 0-39        | Novice          | **NONE**         |

### Creator Score

Measures a user's content creation and audience engagement.

| Level | Score Range | Original Status | Normalized Level |
| :---- | :---------- | :-------------- | :--------------- |
| **6** | 250+        | Elite           | **EXPERT**       |
| **5** | 170-249     | Top-tier        | **EXPERT**       |
| **4** | 120-169     | Accomplished    | **ADVANCED**     |
| **3** | 80-119      | Established     | **INTERMEDIATE** |
| **2** | 40-79       | Growing         | **NONE**         |
| **1** | 0-39        | Starter         | **NONE**         |

---

## 3. Ethos

**Source**: Credibility scores from Ethos.

Ethos provides a **Credibility Score** which we map to a **Trust Tier**.

| Tier          | Score Threshold | Original Level          |
| :------------ | :-------------- | :---------------------- |
| **VERY_HIGH** | Score ≥ 2200    | Distinguished+          |
| **HIGH**      | Score ≥ 1600    | Established - Exemplary |
| **NEUTRAL**   | Score ≥ 1200    | Neutral - Known         |
| **LOW**       | Score ≥ 800     | Questionable            |
| **VERY_LOW**  | Score < 800     | Untrusted               |

_Note: Thresholds are aligned with Ethos v1 Credibility Levels._

---

## 4. Signal Coverage

The engine calculates a **Coverage Score** (0-1) to determine the completeness of a user's profile. This score is used by fallback rules to handle users with partial data.

**Weight Distribution:**

- **30%**: Ethos data available
- **30%**: Neynar (Farcaster) data available
- **20%**: Talent Builder score available
- **20%**: Talent Creator score available

**Example:**
If a user has Neynar and Talent Builder data but is missing Ethos and Talent Creator data:
`Coverage = 0.3 (Neynar) + 0.2 (Talent Builder) = 0.5 (50%)`
