# zkBaseCred — Report Templates & Translation

This file contains the standardized report formats for delivering reputation results to humans. Load this file before generating any report.

> **Companion to:** [skill.md](https://www.zkbasecred.xyz/skill.md) | [reference.md](https://www.zkbasecred.xyz/reference.md)

---

## Report Format: Owner Reputation (check-owner)

> **MANDATORY:** The `check-owner` response includes a `formattedReport` field. You MUST forward it directly to your owner **verbatim**. Do NOT build your own report. Do NOT use any example values from this file. The `formattedReport` is the single source of truth.

The template below is provided ONLY as a formatting reference for manual report building (e.g., `/decide-with-proof` responses or cached data). It is NOT needed for `check-owner` — always use `formattedReport` instead.

**CRITICAL: You MUST read each context's decision individually from the `results` object. Different contexts can and often do have different decisions (ALLOW, DENY, ALLOW_WITH_LIMITS). Do NOT assume all contexts have the same decision.**

### Context Key Mapping

The API response uses dotted keys in the `results` object. Map them to report labels as follows:

| API Response Key     | Report Label   |
| -------------------- | -------------- |
| `allowlist.general`  | Allowlist      |
| `comment`            | Comment        |
| `publish`            | Publish        |
| `apply`              | Apply          |
| `governance.vote`    | Governance     |

For each line in "Access by Context", you must look up the **specific** decision:
- Allowlist decision = `results["allowlist.general"].decision`
- Comment decision = `results["comment"].decision`
- Publish decision = `results["publish"].decision`
- Apply decision = `results["apply"].decision`
- Governance decision = `results["governance.vote"].decision`

### Template

```
zkBaseCred Reputation Report
Wallet: {ownerAddress}
Date: {current date}

Overall: {one-line plain language summary}

--- Wallet Score ---

  On-chain Trust:    {signals.trust}
  Social Trust:      {signals.socialTrust}
  Builder:           {signals.builder}
  Creator:           {signals.creator}

--- Access by Context ---

  Allowlist:   {results["allowlist.general"].decision} ({results["allowlist.general"].confidence})
  Comment:     {results["comment"].decision} ({results["comment"].confidence})
  Publish:     {results["publish"].decision} ({results["publish"].confidence})
  Apply:       {results["apply"].decision} ({results["apply"].confidence})
  Governance:  {results["governance.vote"].decision} ({results["governance.vote"].confidence})

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

> **REMINDER: For `check-owner` responses, forward `formattedReport` verbatim. Do NOT rebuild the report. The examples below are ONLY for `/decide-with-proof` manual formatting.**

**Formatting reference — mixed results (FICTIONAL values, do NOT copy):**

> zkBaseCred Reputation Report
> Wallet: 0xEXAMPLE_ONLY_NOT_REAL
> Date: {current date}
>
> Overall: {summary from API response}
>
> --- Wallet Score ---
>
> On-chain Trust: {signals.trust}
> Social Trust: {signals.socialTrust}
> Builder: {signals.builder}
> Creator: {signals.creator}
>
> --- Access by Context ---
>
> Allowlist: {results["allowlist.general"].decision} ({results["allowlist.general"].confidence})
> Comment: {results["comment"].decision} ({results["comment"].confidence})
> Publish: {results["publish"].decision} ({results["publish"].confidence})
> Apply: {results["apply"].decision} ({results["apply"].confidence})
> Governance: {results["governance.vote"].decision} ({results["governance.vote"].confidence})
>
> --- Constraints ---
> {List constraints from API response, or "None"}
>
> --- Blocking Factors ---
> {List blocking factors from API response, or "None"}
>
> --- What This Means ---
> {2-3 sentences translated from signals — see "What the Signals Mean" section}
>
> --- On-Chain Proof ---
> {If onChain.txHash: "Verified with zero-knowledge proof. Transaction: {txHash}"}

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

---

## Verification Checklist (Required Before Sending Any Report)

If you are manually building a report (NOT using `formattedReport`), verify EVERY value against the actual API response before sending:

1. For EACH context in "Access by Context", confirm the decision matches `results[contextKey].decision` from the API response
2. For EACH context, confirm the confidence matches `results[contextKey].confidence` from the API response
3. Confirm all signal values match the `signals` object from the API response
4. If ANY value in your report does not match the API response, fix it before sending
5. NEVER use values from the examples in this file — they are fictional placeholders

> **If the `check-owner` response includes `formattedReport`, skip this checklist and forward `formattedReport` verbatim.**
