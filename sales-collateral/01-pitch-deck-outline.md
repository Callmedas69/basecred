# zkBaseCred Pitch Deck Outline

> 10-slide deck for investor, partner, and protocol conversations.
> Target length: 3-5 minutes unassisted, 15-20 minutes presented.

---

## Slide 1: Title

**zkBaseCred**
Reputation without opinion.

- Primary tagline: "Reputation without opinion."
- ZK tagline: "Prove reputation. Reveal nothing."
- Differentiation tagline: "Context, not credit scores."
- Logo / visual: ZK shield + Base chain mark
- URL: basecred.xyz

---

## Slide 2: The Problem

**Every onchain app asks the same question: can this wallet be trusted to do this thing, right now?**

- DAOs get sybil-attacked by sock puppets gaming governance votes
- Farcaster channels are overrun by spam bots that pass basic follower-count checks
- Grant programs have no way to verify applicant capability without doxxing them
- Content platforms either let everything through or gatekeep with arbitrary rules
- Every protocol rebuilds access control from scratch with ad-hoc, fragile heuristics

**The cost:**
- Millions lost to governance manipulation across major DAOs
- Significant portion of social interactions flagged as low-quality
- Grant reviewers spend hours manually vetting applicants who could be verified programmatically

**The current alternatives all fall short:**
- Gitcoin Passport requires stamps. Worldcoin requires an orb. Galxe requires quests. Karma3Labs outputs numbers, not decisions.
- None of them give you a context-aware, privacy-preserving decision you can act on directly.

> "Everyone wants reputation. Nobody wants to build the plumbing."

---

## Slide 3: The Solution

**zkBaseCred: The privacy-preserving reputation primitive for Base.**

Every onchain app needs to answer: can this wallet be trusted to do this thing, right now? zkBaseCred aggregates signals from Ethos, Talent Protocol, and Neynar, runs them through a deterministic decision engine across 5 contexts, and returns ALLOW / DENY / ALLOW_WITH_LIMITS. No opinions. Every decision backed by a Groth16 ZK proof verifiable on-chain without revealing data. You get the context. Your app makes the call.

- Aggregates signals from 3 established providers (Ethos, Talent Protocol, Neynar) — they are inputs, not competitors
- Normalizes into categorical tiers, not numeric outputs
- Evaluates against auditable, versioned policy rules
- Generates ZK proofs that verify decisions without revealing underlying data
- Records decisions on-chain via DecisionRegistry on Base mainnet

**What you get back:**
```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "constraints": [],
  "explain": ["High trust across multiple reputation systems"],
  "onChain": { "submitted": true, "txHash": "0x..." }
}
```

---

## Slide 4: How It Works

**5-Phase Decision Engine**

```
Input: wallet address or Farcaster FID + context
                    |
        [1] Signal Fetch (Ethos, Neynar, Talent)
                    |
        [2] Normalize to categorical tiers
                    |
        [3] 5-phase rule evaluation:
            Fallback -> Hard-Deny -> Allow -> Allow-With-Limits -> Default Deny
                    |
        [4] ZK proof generation (Groth16, ~500ms)
                    |
        [5] On-chain submission via relayer
                    |
Output: Decision + Proof + On-Chain Record
```

**Key architectural properties:**
- First-match-wins evaluation: deterministic, auditable, fast
- Rules are declarative JSON: hashable, versionable, circuit-compatible
- Signal coverage tracking: graceful degradation when providers are unavailable
- Progression layer: tells users what to improve, not just "denied"

---

## Slide 5: The ZK Advantage

**Prove reputation. Reveal nothing.**

| Without ZK | With zkBaseCred |
|---|---|
| Raw data leaked to every integration | Only categorical decision visible |
| Users can be fingerprinted by signal combinations | Proof verifies decision without revealing inputs |
| Data scraping enables targeted manipulation | Underlying signals remain private |
| Trust requires trusting the platform | Trust requires only math |

**Technical specifics:**
- Groth16 proofs over an 80-constraint circuit
- ~500ms proof generation server-side
- On-chain verification via deployed Verifier contract
- Policy hash anchors ensure proofs are tied to specific, auditable rulesets
- DecisionRegistry is UUPS-upgradeable: rules can evolve without breaking verification

---

## Slide 6: Five Contexts, Five Products

| Context | Use Case | Strictness | Key Signals |
|---|---|---|---|
| `allowlist.general` | Community gatekeeping, token gates, allowlists | Medium-High | trust + socialTrust + builder + creator |
| `comment` | Spam filtering for forums, channels, social | Low | trust + socialTrust (low barrier) |
| `publish` | Content publishing, curation, editorial access | High | trust + socialTrust + creator/builder |
| `apply` | Job applications, grant submissions, bounties | Medium | builder + creator (capability-focused) |
| `governance.vote` | DAO voting eligibility, proposal rights | Highest | trust + socialTrust + recency (<30 days) |

Each context has its own policy thresholds, constraint mappings, and blocking factor requirements. Developers pick a context; the engine does the rest.

---

## Slide 7: Developer Experience

**You do not need a reputation team. You need a reputation primitive.**

Three ways to integrate:

1. **REST API** - Single POST to `/v1/decide-with-proof`
2. **TypeScript SDK** - `npm install basecred-decision-engine`
3. **Agent SDK** - Autonomous agent registration and decision submission

**Integration in 4 lines:**
```typescript
const response = await fetch("https://basecred.xyz/api/v1/decide-with-proof", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ subject: "0x867c...", context: "allowlist.general" })
});
const { decision, confidence, onChain } = await response.json();
// decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS"
```

**What developers do NOT have to build:**
- Signal aggregation from 3+ APIs
- Signal normalization and tier mapping
- Policy management and versioning
- ZK circuit compilation and proof generation
- On-chain submission and gas management
- Graceful degradation when providers are down

---

## Slide 8: Traction and On-Chain Data

**Deployed and live on Base mainnet.**

- DecisionRegistry with on-chain counters: totalDecisions, uniqueSubjectCount, decisionsByOutcome, decisionsByContext
- V2 UUPS-upgradeable proxy architecture
- TypeScript SDK published on npm: `basecred-decision-engine`
- 5 context-specific policies live with versioned, hashable rulesets
- Agent SDK with wallet registration, verification, and autonomous submission

**Performance:**
- Profile fetch: 400-1000ms (3 parallel API calls)
- ZK proof generation: ~500ms
- Total end-to-end: <2 seconds including on-chain submission

---

## Slide 9: Roadmap

**Near-term:**
- Protocol partnerships (2-3 Base-native protocols)
- Custom policy builder: protocols define their own thresholds
- Additional signal sources (on-chain activity, ENS, attestations)

**Mid-term:**
- Client-side proof generation (browser WASM)
- Cross-chain verification (OP Stack L2s)
- Governance-weighted voting via reputation tiers

**Long-term:**
- Decentralized policy governance
- Signal marketplace: third-party providers can contribute signals
- Enterprise API tier with SLAs

---

## Slide 10: The Ask

**What we are looking for:**

- **Protocol Partners**: Integrate zkBaseCred into your access control. We provide the API, SDK, and on-chain infrastructure. You get sybil-resistant reputation without building it.

- **Signal Partners**: If you produce reputation data (attestations, activity metrics, identity verification), we can normalize and include it as an additional signal input.

- **Ecosystem Support**: Grants, accelerator participation, or co-marketing with Base ecosystem projects.

---

## Appendix Slides (if needed)

### A1: Rule Architecture Detail
- DSL conditions, policy hashing, confidence scoring
- Show actual rule definitions from the engine

### A2: Security Model
- Read-only primitive (never writes to user data)
- Neynar used strictly for spam detection, never as positive credibility
- Privacy-by-default: subject hashing, no raw signal data exposure
- Hard-deny rules catch critical risks before any allow evaluation

### A3: Comparison Matrix
- vs. Gitcoin Passport: requires stamps, outputs a single number — zkBaseCred outputs context-aware decisions with ZK proofs
- vs. Worldcoin: requires a biometric orb scan — zkBaseCred uses behavioral signals, no hardware
- vs. Galxe: requires users to complete quests — zkBaseCred reads existing reputation passively
- vs. Karma3Labs: outputs numeric rankings — zkBaseCred outputs categorical decisions (ALLOW/DENY/ALLOW_WITH_LIMITS)
- Note: Ethos, Talent Protocol, and Neynar are signal INPUTS to zkBaseCred, not competitors
