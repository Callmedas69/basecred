# zkBaseCred One-Pager

> Concise product summary for partnership conversations and quick reference.

---

## What is zkBaseCred?

> **Reputation without opinion.**

zkBaseCred is a **privacy-preserving reputation primitive** deployed on Base mainnet. Every onchain app needs to answer: can this wallet be trusted to do this thing, right now? zkBaseCred aggregates signals from Ethos, Talent Protocol, and Neynar, runs them through a deterministic decision engine across 5 contexts, and returns ALLOW / DENY / ALLOW_WITH_LIMITS. No opinions. Every decision backed by a Groth16 ZK proof verifiable on-chain without revealing data. You get the context. Your app makes the call.

**For developers:** You do not need a reputation team. You need a reputation primitive.
**For DAOs:** Governance that verifies trust without centralizing it.
**For content platforms:** Let real creators publish. Keep the spam out. Explain why.

---

## How It Works

```
Your App  -->  zkBaseCred API  -->  Decision + ZK Proof + On-Chain Record
```

1. **Send** a wallet address (or Farcaster FID) and a context (e.g., `governance.vote`)
2. **Receive** a categorical decision: `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`
3. **Verify** on-chain via the DecisionRegistry on Base mainnet

Under the hood, zkBaseCred:
- Fetches signals from **Ethos** (long-term trust), **Talent Protocol** (builder/creator capability), and **Neynar** (spam risk)
- Normalizes raw signals into categorical tiers (never exposes numeric values)
- Evaluates a 5-phase rule engine: Fallback, Hard-Deny, Allow, Allow-With-Limits, Default Deny
- Generates a **Groth16 ZK proof** (~500ms) that verifies the decision without revealing inputs
- Auto-submits to the on-chain **DecisionRegistry** via a relayer

---

## Five Decision Contexts

| Context | What It Solves | Strictness |
|---|---|---|
| **allowlist.general** | Community access, token gates | Medium-High |
| **comment** | Spam filtering for social platforms | Low barrier |
| **publish** | Content curation and editorial access | High |
| **apply** | Job/grant application screening | Capability-focused |
| **governance.vote** | DAO voting eligibility | Highest (requires recent activity) |

---

## Key Differentiators

**Context, not credit scores.** Decisions are ALLOW/DENY/ALLOW_WITH_LIMITS with confidence tiers. Different contexts apply different thresholds. A spam filter and a governance gate are not the same problem — zkBaseCred treats them differently.

**Prove reputation. Reveal nothing.** Groth16 proofs verify that the decision was correctly computed without revealing the underlying Ethos, Neynar, or Talent data. Integrators see the decision, not the signals.

**On-chain verifiable.** Every decision is recorded in the DecisionRegistry with on-chain counters for totalDecisions, uniqueSubjectCount, and per-context/per-outcome breakdowns.

**Deterministic, not opinionated.** Rules are declarative JSON with SHA-256 hashes. The exact policy used for any decision can be inspected and verified. No black boxes, no subjective weighting.

**Graceful degradation.** Signal coverage tracking ensures the engine handles partial data (e.g., if Talent Protocol is down) without false positives.

**Not another reputation number.** Unlike Gitcoin Passport (requires stamps), Worldcoin (requires orb), Galxe (requires quests), or Karma3Labs (outputs numbers), zkBaseCred outputs actionable decisions. Ethos, Talent Protocol, and Neynar are signal inputs, not competitors.

---

## Integration

**REST API:**
```
POST /api/v1/decide-with-proof
{ "subject": "0x...", "context": "allowlist.general" }
```

**TypeScript SDK:**
```
npm install basecred-decision-engine
```

**Agent SDK:** Autonomous agents can register wallets, request decisions, and submit on-chain.

---

## Technical Specs

| Metric | Value |
|---|---|
| Signal sources | 3 (Ethos, Talent Protocol, Neynar) |
| Decision contexts | 5 |
| ZK proof system | Groth16, 80-constraint circuit |
| Proof generation time | ~500ms |
| End-to-end latency | <2 seconds |
| Chain | Base mainnet |
| Contract architecture | UUPS-upgradeable proxy |
| SDK | TypeScript, npm published |

---

## What We Are Looking For

- **Protocol integrations**: Replace ad-hoc reputation checks with a single API call
- **Signal partnerships**: Additional data sources we can normalize and include
- **Ecosystem support**: Grants, co-marketing, accelerator participation

---

## Contact

- Website: basecred.xyz
- npm: basecred-decision-engine
