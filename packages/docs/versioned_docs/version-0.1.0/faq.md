---
sidebar_position: 10
---

# FAQ

> Common questions.

### Is this a token?

No. BaseCred is a read-only reputation primitive. There is no token, no staking, and no financial component.

### Can I pay to increase my score?

No. BaseCred aggregates external behavior from Ethos, Neynar, and Talent Protocol. Genuine activity on those platforms improves your standing. There is no way to pay for a better decision outcome.

### How do I integrate?

See the [Integration Guide](./integration) for API details and the [SDK Reference](./sdk) for using the decision engine directly in your application.

### What contexts are available?

The engine supports these contexts: `allowlist.general`, `apply`, `comment`, `publish`, and `governance.vote`. Each context applies a different subset of rules. See the [Decision Engine rules catalog](/decision-engine/rules) for details on which rules apply per context.

### What happens if a provider is down?

If a signal provider (Ethos, Neynar, or Talent Protocol) is unreachable, the engine reduces `signalCoverage` and lowers the `confidence` tier accordingly. Fallback rules may apply. See [Availability Semantics](./availability) for the full explanation.

### Can I use BaseCred without ZK proofs?

Yes. ZK proofs are optional. The core decision engine works without any ZK integration — you call the API or SDK, get a decision, and use it in your application. ZK proofs are only needed if you want to submit decisions on-chain with privacy-preserving verification.

### Are decisions deterministic?

Yes, given the same input signals. The engine is a pure function: same normalized signals + same context = same decision. However, because signals are fetched from live providers, two requests seconds apart may receive different raw data, leading to different decisions.

### Where are the contracts deployed?

The `DecisionRegistry` contract is deployed on Base mainnet at [`0x8a8A3F95605F6980F6fFCC4C86110fe8d7b5E091`](https://basescan.org/address/0x8a8A3F95605F6980F6fFCC4C86110fe8d7b5E091). See the [ZK Contracts](./zk-contracts) page for ABI details and integration guidance.
