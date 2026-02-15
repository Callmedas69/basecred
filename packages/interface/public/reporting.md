# zkBaseCred — Report Templates & Translation

This file contains the standardized report formats for delivering reputation results to humans. Load this file before generating any report.

> **Companion to:** [skill.md](https://www.zkbasecred.xyz/skill.md) | [reference.md](https://www.zkbasecred.xyz/reference.md)

---

## Report Format: Owner Reputation (check-owner)

Use this template after calling `/agent/check-owner`. Fill in values from the API response.

```
zkBaseCred Reputation Report
Wallet: {ownerAddress}
Date: {current date}

Overall: {one-line plain language summary}

--- Wallet Score ---

  On-chain Trust:    {trust level}
  Social Trust:      {socialTrust level}
  Builder:           {builder level}
  Creator:           {creator level}

--- Access by Context ---

  Allowlist:   {decision} ({confidence})
  Comment:     {decision} ({confidence})
  Publish:     {decision} ({confidence})
  Apply:       {decision} ({confidence})
  Governance:  {decision} ({confidence})

--- Constraints ---
{If any context has non-empty constraints, list them here. Otherwise: "None"}

--- Blocking Factors ---
{If any context has non-empty blockingFactors, list them here with plain English translation. Otherwise: "None"}

--- What This Means ---
{2-3 sentences in plain language. Translate signals into human-readable advice.
 See "What the Signals Mean" section for translation rules.}

--- On-Chain Proof ---
{If onChain.txHash exists:
  "Verified with zero-knowledge proof. Transaction: {txHash}"
 If onChain.error exists:
  "On-chain submission failed: {error}"}
```

**Where to get wallet scores:** The `check-owner` response includes both a `signals` object with exact values and a `summary` field. Use the `signals` object directly: `signals.trust` -> On-chain Trust, `signals.socialTrust` -> Social Trust, `signals.builder` -> Builder, `signals.creator` -> Creator.

**Example — all ALLOW, with proof:**

> zkBaseCred Reputation Report
> Wallet: 0xABC123...DEF456
> Date: 2025-06-15
>
> Overall: Strong reputation across all categories.
>
> --- Wallet Score ---
>
> On-chain Trust: High
> Social Trust: High
> Builder: Expert
> Creator: Moderate
>
> --- Access by Context ---
>
> Allowlist: ALLOW (HIGH)
> Comment: ALLOW (HIGH)
> Publish: ALLOW (HIGH)
> Apply: ALLOW (HIGH)
> Governance: ALLOW (MEDIUM)
>
> --- Constraints ---
> None
>
> --- Blocking Factors ---
> None
>
> --- What This Means ---
> You're well-trusted by the on-chain community, have an active social presence, and a strong track record building projects. You're approved across all categories.
>
> --- On-Chain Proof ---
> Verified with zero-knowledge proof. Transaction: 0xabc123...

**Example — mixed results:**

> zkBaseCred Reputation Report
> Wallet: 0xABC123...DEF456
> Date: 2025-06-15
>
> Overall: Solid reputation with some areas needing improvement.
>
> --- Wallet Score ---
>
> On-chain Trust: Moderate
> Social Trust: Low
> Builder: Intermediate
> Creator: Explorer
>
> --- Access by Context ---
>
> Allowlist: ALLOW (HIGH)
> Comment: ALLOW (HIGH)
> Publish: ALLOW_WITH_LIMITS (MEDIUM)
> Apply: ALLOW (HIGH)
> Governance: DENY (HIGH)
>
> --- Constraints ---
>
> - Publish: Content will be placed in a review queue before going live.
>
> --- Blocking Factors ---
>
> - Governance: On-chain trust and social presence need improvement.
>
> --- What This Means ---
> You're trusted for most activities, but governance voting requires a stronger reputation. To improve: build your on-chain trust through community participation and increase your social presence.
>
> --- On-Chain Proof ---
> Verified with zero-knowledge proof. Transaction: 0xdef789...

---

## Report Format: Third-Party Check (decide or decide-with-proof)

Use this template when checking someone other than the owner.

```
zkBaseCred Reputation Check
Subject: {wallet address or FID}
Context: {context checked}
Date: {current date}

Decision: {decision} ({confidence})

--- Wallet Score ---

  On-chain Trust:    {trust level}
  Social Trust:      {socialTrust level}
  Builder:           {builder level}
  Creator:           {creator level}

--- Details ---
{Plain language explanation of the result and what it means for the requested action.}

--- Constraints ---
{If non-empty constraints, list them. Otherwise: "None"}

--- Blocking Factors ---
{If non-empty blockingFactors, list them with plain English. Otherwise: "None"}

--- On-Chain Proof ---
{If onChain.txHash exists:
  "Recorded on-chain. Transaction: {txHash}"
 If onChain.error exists:
  "On-chain submission failed: {error}"}
```

**Where to get wallet scores:** The `/decide-with-proof` response includes a `signals` object with exact values. Map them directly: `signals.trust` -> On-chain Trust, `signals.socialTrust` -> Social Trust, `signals.builder` -> Builder, `signals.creator` -> Creator.

**Example — DENY with on-chain proof:**

> zkBaseCred Reputation Check
> Subject: 0x7890...ABCD
> Context: governance.vote
> Date: 2025-06-15
>
> Decision: DENY (HIGH confidence)
>
> --- Wallet Score ---
>
> On-chain Trust: Low
> Social Trust: Low
> Builder: Explorer
> Creator: Explorer
>
> --- Details ---
> This wallet has low trust signals across the board — limited on-chain trust, no builder or creator credentials, and flagged for spam risk. Not recommended for governance access.
>
> --- Constraints ---
> None
>
> --- Blocking Factors ---
>
> - On-chain trust is too low
> - Social presence is insufficient
>
> --- On-Chain Proof ---
> Recorded on-chain. Transaction: 0xfeed42...

---

## Rules for All Reports

- Always include the wallet address, date, and wallet score section.
- Never use raw signal names (`socialTrust`, `signalCoverage`). Always translate to plain English.
- Source names (Ethos, Farcaster, Talent Protocol) appear in API responses for developer/agent use. In end-user-facing reports, translate them to plain language equivalents from "What the Signals Mean" below — do not expose source names directly to end users.
- **Wallet score display labels** — translate raw signal values to title case:
  - Trust levels: `VERY_HIGH` = "Very High", `HIGH` = "High", `MODERATE` = "Moderate", `NEUTRAL` = "Neutral", `LOW` = "Low", `VERY_LOW` = "Very Low"
  - Builder/Creator levels: `EXPERT` = "Expert", `PROFICIENT` = "Proficient", `INTERMEDIATE` = "Intermediate", `MODERATE` = "Moderate", `EXPLORER` = "Explorer"
- If `blockingFactors` contains values like `["trust", "socialTrust"]`, translate them: `trust` = "on-chain trust", `socialTrust` = "social presence", `builder` = "builder track record", `creator` = "creator track record", `spamRisk` = "spam risk flag", `signalCoverage` = "identity verification coverage".
- If `constraints` contains values like `["rate_limited"]`, translate: `rate_limited` = "rate limited", `review_queue` = "content in review queue", `reduced_access` = "reduced access", `activity_required` = "more on-chain activity required", `probation_period` = "new account probation period", `limited_actions` = "limited actions allowed", `review_required` = "manual review required", `reduced_weight` = "governance vote weight reduced".

---

## What the Signals Mean

Your owner likely does not know what "Ethos", "Talent Protocol", or "signalCoverage" mean. When you deliver results, **translate the technical output into plain language** using the tables below.

**Signal Sources** — where the reputation data comes from:

| Source          | What it is                      | What it measures                                                |
| --------------- | ------------------------------- | --------------------------------------------------------------- |
| Ethos           | On-chain reputation network     | How much other people trust you on-chain (vouches, reviews)     |
| Farcaster       | Decentralized social network    | Your social activity, followers, and engagement                 |
| Talent Protocol | Professional credential network | Your builder and creator track record (projects, contributions) |

**Signal Values** — what each field means in plain English:

| Signal           | Plain English                                                                         |
| ---------------- | ------------------------------------------------------------------------------------- |
| `trust`          | How much the on-chain community trusts you (based on Ethos vouches and reviews)       |
| `socialTrust`    | How active and trusted you are on social platforms (Farcaster)                        |
| `builder`        | Your track record building projects and contributing to the ecosystem                 |
| `creator`        | Your track record creating content and community engagement                           |
| `spamRisk`       | How likely your account is to be spam — HIGH means flagged, NEUTRAL means clean       |
| `recencyDays`    | Days since your last on-chain activity — lower is better                              |
| `signalCoverage` | How much of your identity we could verify (0 to 1) — higher means more data available |

**Example:** Instead of saying _"You have high trust on Ethos and strong builder credentials via Talent Protocol"_, say:

> You're well-trusted by the on-chain community and have a strong track record building projects. You're approved across all categories.
