---
sidebar_position: 2.5
slug: contexts
---

# Contexts Explained

BaseCred evaluates identities within a **context** — a named scenario that determines which signals matter and how strictly they are judged. The same wallet can receive different decisions depending on the context.

This page explains each context in plain language: what it gates, what it looks at, and what outcomes to expect.

:::tip Picking a context
Choose the context that matches the action you are gating. If you are unsure, start with `allowlist.general` — it is the broadest and most commonly used.
:::

---

## allowlist.general

**Gates base-level access to your application or community.**

Use this context when you need a general eligibility check — can this identity participate at all?

### What it looks at

- **Trust** — long-term credibility across the ecosystem
- **Social trust** — social legitimacy and peer recognition
- **Builder / Creator capability** — demonstrated ability to ship or create
- **Recent activity** — how recently the identity has been active

### Possible outcomes

| Decision | What it means |
|---|---|
| **ALLOW** | Identity has strong trust and proven capability (EXPERT-level builder or creator, or HIGH trust with HIGH social trust). Full access. |
| **ALLOW_WITH_LIMITS** | Identity shows promise but has gaps — inactive for more than 14 days, new with no track record, or mixed signals between trust and social trust. Probationary access with constraints like `limited_actions` or `activity_required`. |
| **DENY** | Identity does not meet the minimum bar, or has critical risk signals (spam, very low trust). |

### When to use it

- Allowlist gating for a token launch or community
- General "is this identity credible?" check
- First-pass filter before more specific context checks

---

## comment

**Gates permission to post comments.**

This is the lowest-barrier context. It is designed to keep spam out while letting most legitimate users participate.

### What it looks at

- **Spam risk** — likelihood of abuse (primary signal)
- **Social trust** — social legitimacy
- **Trust** — baseline credibility
- **Signal coverage** — how much data is available

### Possible outcomes

| Decision | What it means |
|---|---|
| **ALLOW** | Identity has at least NEUTRAL trust and NEUTRAL social trust. No restrictions. |
| **ALLOW_WITH_LIMITS** | Identity has LOW trust but enough signal coverage. Can comment, but rate-limited. |
| **DENY** | Identity is flagged as spam risk, has very low social trust, or has no available signals. |

### When to use it

- Comment sections on content platforms
- Forum or discussion board posting
- Any low-stakes user interaction where you want spam prevention without heavy gatekeeping

---

## publish

**Gates permission to publish new content.**

Publishing carries more weight than commenting — the bar is higher. This context checks both trustworthiness and creative capability.

### What it looks at

- **Trust** — long-term credibility
- **Social trust** — social legitimacy
- **Builder or Creator capability** — at least BUILDER-level skill
- **Spam risk** — abuse likelihood

### Possible outcomes

| Decision | What it means |
|---|---|
| **ALLOW** | Identity has HIGH trust, HIGH social trust, and proven builder or creator capability. Full publishing rights. |
| **ALLOW_WITH_LIMITS** | Identity has NEUTRAL trust and social trust but lacks proven capability. Content goes through a review queue. |
| **DENY** | Identity falls below NEUTRAL trust or social trust, or has critical risk signals. |

### When to use it

- Article or blog publishing platforms
- Content creation workflows that need quality control
- Any scenario where published content represents the platform

---

## apply

**Gates permission to submit job or grant applications.**

This is a capability-focused context. It cares most about demonstrated ability — can this identity actually deliver? There is no middle ground: you either qualify or you don't.

### What it looks at

- **Builder or Creator capability** — needs EXPERT level or above
- **Trust** — at least NEUTRAL credibility

### Possible outcomes

| Decision | What it means |
|---|---|
| **ALLOW** | Identity has EXPERT-level (or higher) builder or creator capability with at least NEUTRAL trust. Qualified to apply. |
| **DENY** | Identity does not demonstrate sufficient capability, or has critical risk signals. There is no limited path — this context is binary. |

### When to use it

- Job application portals
- Grant programs where applicants need a proven track record
- Bounty systems that require demonstrated skill

---

## governance.vote

**Gates eligibility to participate in governance voting.**

This context prioritizes trust and recent activity. Governance needs active, trusted participants — not dormant wallets.

### What it looks at

- **Trust** — needs HIGH level
- **Social trust** — at least NEUTRAL level
- **Recent activity** — must have been active within the last 30 days for full voting; 31-90 days gets reduced weight; beyond 90 days is denied

### Possible outcomes

| Decision | What it means |
|---|---|
| **ALLOW** | Identity has HIGH trust, NEUTRAL social trust, and has been active within the last 30 days. Full voting rights. |
| **ALLOW_WITH_LIMITS** | Identity has HIGH trust but has been inactive for 31-90 days. Can vote, but with reduced weight. |
| **DENY** | Identity does not have HIGH trust, has been inactive for more than 90 days, or has critical risk signals. |

### When to use it

- DAO governance proposals
- Community voting on platform decisions
- Any scenario where votes carry weight and need to come from active, trusted participants

---

## Which context should I use?

| You want to... | Use this context |
|---|---|
| Check if an identity is generally credible | `allowlist.general` |
| Let users comment with spam protection | `comment` |
| Gate content publishing | `publish` |
| Filter job or grant applicants by capability | `apply` |
| Ensure governance voters are trusted and active | `governance.vote` |

If none of these fit your use case exactly, `allowlist.general` is the safest default — it provides the broadest eligibility check.

---

## Global safety checks

All contexts share a set of global rules that run first, regardless of which context you choose:

- **No signals available** (`signalCoverage = 0`) — always DENY
- **Partial signals** (`signalCoverage < 0.5`) — ALLOW_WITH_LIMITS with reduced access
- **High spam risk** — always DENY
- **Very low social trust** — always DENY
- **Very low trust** — always DENY

These rules ensure that critical risk signals are caught before any context-specific evaluation.

---

## Further reading

- [Context vs Decision](./context-vs-decision) — understand the boundary between what BaseCred provides and what your application owns
- [Integration Guide](./integration) — API endpoints and code examples
- [Foundation Policy: Context and Decision Scenarios](/foundation/policy/context-and-decision-scenarios) — formal, authoritative definitions of each context
