# Developer Landing Page Copy

> Copy blocks for the developer-facing landing page. Each section maps to a page component.

---

## Hero Section

### Headline
**Reputation without opinion. ZK-proven on Base.**

### Subheadline
You do not need a reputation team. You need a reputation primitive. zkBaseCred aggregates signals from Ethos, Talent Protocol, and Neynar, runs them through a deterministic decision engine, and returns ALLOW / DENY / ALLOW_WITH_LIMITS — backed by a Groth16 ZK proof, verifiable on-chain. No opinions. No data exposed. Context, not credit scores.

### Primary CTA
**Start Integrating** (links to docs/quickstart)

### Secondary CTA
**View on Base** (links to DecisionRegistry on Basescan)

### Code Preview (Hero Visual)
```bash
curl -X POST https://basecred.xyz/api/v1/decide-with-proof \
  -H "Content-Type: application/json" \
  -d '{"subject": "0x867c...", "context": "governance.vote"}'
```
```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "explain": ["Active, trusted member eligible for governance"],
  "onChain": { "submitted": true, "txHash": "0xabc..." }
}
```

---

## Problem Statement Strip

### Heading
**Every protocol rebuilds reputation from scratch.**

### Three Pain Points (icon + text cards)

**Card 1: Fragmented Signals**
Trust data lives across Ethos, Farcaster, Talent Protocol, and dozens of other sources. Aggregating and normalizing it is weeks of engineering work — per integration.

**Card 2: Privacy Leaks**
Sharing raw reputation data with every app creates fingerprinting risk. Users deserve proof their reputation qualifies them, not a data dump.

**Card 3: One-Size-Fits-All**
A comment-spam filter and a DAO voting gate have completely different requirements. Generic reputation numbers do not capture context-specific trust. Context, not credit scores.

---

## Features Grid

### Heading
**Built for developers who ship on Base.**

### Feature 1: Context-Aware Decisions
Five built-in contexts — `allowlist.general`, `comment`, `publish`, `apply`, `governance.vote` — each with calibrated thresholds. Pick a context; the engine handles the rest.

### Feature 2: Prove Reputation. Reveal Nothing.
Groth16 proofs verify that the decision was correctly computed from real reputation data. Integrators see the decision, not the signals. Generated in ~500ms server-side.

### Feature 3: On-Chain Verifiable
Every decision is recorded in the DecisionRegistry on Base mainnet with counters for total decisions, unique subjects, and per-context breakdowns. Fully transparent aggregate stats.

### Feature 4: Three Signal Inputs
Ethos (long-term trust and credibility), Talent Protocol (builder and creator capability), Neynar (spam risk detection). These are signal inputs, not competitors — zkBaseCred normalizes and combines them into categorical tiers.

### Feature 5: Graceful Degradation
Signal coverage tracking ensures the engine produces safe decisions even when one or more providers are unavailable. Fallback rules handle partial data without false positives.

### Feature 6: Auditable Policy Rules
Rules are declarative JSON with SHA-256 hashes. Every policy is versioned, inspectable, and circuit-compatible. No black boxes.

---

## How It Works (Step Flow)

### Heading
**From wallet address to on-chain proof in under 2 seconds.**

### Step 1: Send a Request
POST a wallet address (or Farcaster FID) and a decision context to the API. The SDK and Agent SDK also support this flow.

### Step 2: Signal Aggregation
zkBaseCred fetches reputation data from Ethos, Talent Protocol, and Neynar in parallel. Raw signals are normalized into categorical tiers: trust (VERY_LOW to VERY_HIGH), capability (EXPLORER to ELITE), and spam risk.

### Step 3: Rule Evaluation
The 5-phase engine evaluates signals against context-specific policies. First-match-wins: Fallback rules handle missing data, hard-deny rules catch spam and critical risk, allow rules grant access, allow-with-limits applies constraints, and default deny catches everything else.

### Step 4: ZK Proof Generation
A Groth16 proof is generated over an 80-constraint circuit. The proof attests that the decision was correctly derived from the actual signals under the declared policy — without revealing the signals themselves.

### Step 5: On-Chain Record
The decision, proof, and policy hash are submitted to the DecisionRegistry on Base mainnet via a relayer. The transaction hash is returned in the API response.

---

## Integration Code Snippet

### Heading
**You do not need a reputation team. You need four lines of code.**

### REST API
```typescript
const response = await fetch("https://basecred.xyz/api/v1/decide-with-proof", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subject: walletAddress,
    context: "governance.vote"
  })
});

const { decision, confidence, constraints, onChain } = await response.json();

if (decision === "ALLOW") {
  // User is eligible to vote
} else if (decision === "ALLOW_WITH_LIMITS") {
  // User can vote with reduced weight
  console.log("Constraints:", constraints);
} else {
  // User does not meet governance requirements
}
```

### TypeScript SDK (for custom integrations)
```typescript
import { decide, normalizeSignals } from "basecred-decision-engine";

const signals = normalizeSignals(profileData);
const result = decide(signals, "publish");
// result.decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS"
// result.explain: ["Verified publisher with demonstrated capability"]
```

---

## Context Cards

### Heading
**Context, not credit scores. Five contexts. Five different problems.**

### Card: allowlist.general
**Community Gatekeeping**
Control who joins your community, accesses gated content, or enters your allowlist. Requires demonstrated trust and capability across multiple signals.
*Signals weighted: trust, socialTrust, builder, creator*

### Card: comment
**Spam Filtering**
Let legitimate users comment while blocking bots and spam accounts. Lowest barrier of any context — designed for volume.
*Signals weighted: trust, socialTrust*

### Card: publish
**Content Curation**
Gate content publishing behind verified reputation. Ensures publishers have both trust and demonstrated builder or creator capability.
*Signals weighted: trust, socialTrust, builder/creator*

### Card: apply
**Application Screening**
Screen job applications, grant submissions, or bounty claims based on builder and creator capability. Focuses on what applicants can do, not just who trusts them.
*Signals weighted: builder, creator (capability-focused)*

### Card: governance.vote
**Voting Eligibility**
The strictest context. Requires high trust, acceptable social standing, AND recent activity within 30 days. Designed to prevent governance manipulation by dormant or low-trust wallets.
*Signals weighted: trust, socialTrust, recency*

---

## Stats / Social Proof Section

### Heading
**Live on Base mainnet. Verifiable by anyone.**

### Stat Blocks
- **<2s** end-to-end latency (signal fetch + ZK proof + on-chain submission)
- **5** decision contexts with calibrated policy thresholds
- **3** independent signal sources aggregated per decision
- **~500ms** ZK proof generation time
- **100%** on-chain verifiable via DecisionRegistry

### Trust Signals
- Open-source TypeScript SDK on npm
- Auditable, declarative policy rules (JSON + SHA-256 hashed)
- UUPS-upgradeable contracts on Base mainnet
- Built on established providers: Ethos, Talent Protocol, Neynar

---

## Final CTA Section

### Heading
**Reputation without opinion. Prove reputation. Reveal nothing.**

### Subtext
Integrate zkBaseCred in minutes. Replace weeks of custom reputation engineering with a single API call that returns deterministic decisions, ZK proofs, and on-chain records. No opinions. No data leaks. No infrastructure to maintain.

### Primary CTA
**Read the Docs** (links to /docs/quickstart)

### Secondary CTA
**Explore the SDK** (links to npm package)

### Tertiary CTA
**View the Contract** (links to Basescan)
