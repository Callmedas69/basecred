---
sidebar_position: 2
slug: context-and-decision-scenarios
---

# Context and Decision Scenarios

This policy defines **decision contexts (scenarios)** and the **parameters used to measure** each. Context definitions must exist and be approved **before** any rules are written or changed for that context.

### Policy rule

- **Definitions before rules.** Each decision scenario has one canonical definition (purpose, measure, parameters). Rules implement that definition; they do not define it.
- **Single source of truth.** The scenario definitions below are authoritative. The Decision Engine and progression layer (e.g. blocking factors) must align to them.

---

### What is a context (scenario)?

A **context** (or **decision scenario**) is a named situation in which the engine answers: *"Is this identity allowed, limited, or denied for this situation?"*

Each context has:

- **Id** — Stable identifier (e.g. `allowlist.general`, `comment`).
- **Purpose** — What access or outcome the context gates.
- **Measure** — What the context "measures" or "cares about" (in terms of reputation and risk).
- **Parameters** — The normalized signals (parameters) used to evaluate the identity for this context. Rules may only use these parameters for this context's decisions.

---

### Parameters available for measurement

All contexts use **normalized signals** derived from reputation providers. The following parameters exist and may be used by scenario definitions and rules:

| Parameter        | Type / values                    | Source / meaning                                                                 |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| **trust**       | Tier (VERY_LOW → VERY_HIGH)      | Ethos credibility; long-term trust.                                               |
| **socialTrust** | Tier (VERY_LOW → VERY_HIGH)      | Neynar; social legitimacy and user quality.                                      |
| **builder**     | Capability (EXPLORER → ELITE)     | Talent Protocol; builder credibility.                                             |
| **creator**     | Capability (EXPLORER → ELITE)     | Talent Protocol; creator credibility.                                             |
| **spamRisk**    | Tier (VERY_LOW → VERY_HIGH)      | Neynar; spam/abuse risk (inverse of social trust).                                |
| **recencyDays** | number                            | Days since last activity; freshness.                                             |
| **signalCoverage** | number (0–1)                  | Share of signals successfully available; data completeness.                        |

Global rules (fallback and hard-deny) may use **signalCoverage**, **spamRisk**, **socialTrust**, and **trust** across all contexts. Context-specific rules use the parameters listed for that context below.

---

### Context definitions

The following contexts are defined. **Parameters used to measure** each context are listed; rules for that context must only rely on these parameters (and on global signals where applicable).

---

#### 1. allowlist.general

| Field       | Definition |
| ----------- | ---------- |
| **Id**      | `allowlist.general` |
| **Purpose** | General gatekeeping for base-level access. Answers whether an identity is eligible for general allowlist inclusion (full access), limited (probationary) access, or not yet ready. |
| **Measure** | Trust, builder/creator readiness, and social trust. Used to distinguish fully eligible identities, those suitable for limited access, and those not yet meeting the bar. |
| **Parameters used to measure** | `trust`, `socialTrust`, `builder`, `creator`, `recencyDays`. (Global: `signalCoverage`, `spamRisk`.) |

**Factors used for progression/explanation:** `trust`, `builder`, `creator`.

---

#### 2. comment

| Field       | Definition |
| ----------- | ---------- |
| **Id**      | `comment` |
| **Purpose** | Permission to post comments. Gates whether an identity may comment (full), comment with limits (e.g. rate-limited), or is denied. |
| **Measure** | Spam risk and social trust; sufficient trust for participation. |
| **Parameters used to measure** | `trust`, `socialTrust`, `spamRisk`, `signalCoverage`. (Global: `signalCoverage`, `spamRisk`, `socialTrust`, `trust`.) |

**Factors used for progression/explanation:** `spamRisk`, `socialTrust`.

---

#### 3. publish

| Field       | Definition |
| ----------- | ---------- |
| **Id**      | `publish` |
| **Purpose** | Permission to publish new content. Gates full publishing, publishing with review/limits, or denial. |
| **Measure** | Trust, social trust, and creator (or builder) capability; spam risk. |
| **Parameters used to measure** | `trust`, `socialTrust`, `builder`, `creator`, `spamRisk`. (Global: `signalCoverage`, `spamRisk`.) |

**Factors used for progression/explanation:** `creator`, `spamRisk`.

---

#### 4. apply

| Field       | Definition |
| ----------- | ---------- |
| **Id**      | `apply` |
| **Purpose** | Permission to submit job or grant applications. Gates whether an identity may apply (full), apply with limits, or is denied. |
| **Measure** | Trust and demonstrated capability (builder or creator). |
| **Parameters used to measure** | `trust`, `builder`, `creator`. (Global: `signalCoverage`, `spamRisk`, `socialTrust`.) |

**Factors used for progression/explanation:** `trust`.

---

#### 5. governance.vote

| Field       | Definition |
| ----------- | ---------- |
| **Id**      | `governance.vote` |
| **Purpose** | Eligibility to participate in governance voting. Gates full voting, reduced weight (e.g. inactive), or denial. |
| **Measure** | Trust, social trust, and recency (activity). |
| **Parameters used to measure** | `trust`, `socialTrust`, `recencyDays`. (Global: `signalCoverage`, `spamRisk`.) |

**Factors used for progression/explanation:** `trust`, `socialTrust`.

---

### Global rules (all contexts)

Some rules apply to **all** contexts (context `*`):

- **Fallback:** Use `signalCoverage` to handle missing or insufficient data (e.g. deny when no signals, allow-with-limits when coverage below threshold).
- **Hard-deny:** Use `spamRisk`, `socialTrust`, and `trust` to fail fast on critical risk (e.g. high spam, low social trust, very low trust).

These do not replace context definitions; they run before context-specific allow/allow-with-limits rules.

---

### Summary table

| Context            | Purpose (gates)           | Parameters used to measure                         | Progression factors     |
| ------------------ | ------------------------- | --------------------------------------------------- | ----------------------- |
| `allowlist.general`| General allowlist access  | trust, socialTrust, builder, creator, recencyDays   | trust, builder, creator |
| `comment`          | Commenting permission     | trust, socialTrust, spamRisk, signalCoverage        | spamRisk, socialTrust   |
| `publish`         | Publishing permission     | trust, socialTrust, builder, creator, spamRisk      | creator, spamRisk       |
| `apply`            | Job/grant applications    | trust, builder, creator                             | trust                   |
| `governance.vote`  | Governance voting         | trust, socialTrust, recencyDays                     | trust, socialTrust      |

All contexts are also subject to global parameters `signalCoverage`, `spamRisk`, `socialTrust`, and `trust` where fallback and hard-deny rules apply.
