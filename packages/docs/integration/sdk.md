---
sidebar_position: 4
---

# SDK Reference

> Using the decision engine in your application.

The `basecred-decision-engine` package is the core SDK for evaluating reputation decisions. It contains the rule engine, signal normalizers, encoding utilities, and all TypeScript types.

## Installation

```bash
npm install basecred-decision-engine
```

## Core Usage

The primary entry point is `executeDecision`, which takes a subject identifier, a context, and a profile fetcher function:

```typescript
import { executeDecision } from "basecred-decision-engine";
import type { DecideUseCaseInput } from "basecred-decision-engine";

const input: DecideUseCaseInput = {
  subject: "0x1234...abcd", // wallet address or FID
  context: "allowlist.general",
  profileFetcher: async (subject) => {
    // Fetch profile data from Ethos, Neynar, Talent Protocol
    // Return a UnifiedProfileData object
    return fetchProfileFromProviders(subject);
  },
};

const result = await executeDecision(input);

console.log(result.decision);   // "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS"
console.log(result.confidence); // "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
console.log(result.explain);    // Human-readable reasons
```

The `profileFetcher` pattern allows you to control how profile data is sourced — from live APIs, a cache, or test fixtures.

## Key Types

| Type | Description |
| :---------------------- | :--------------------------------------------------------------- |
| `Decision` | `"ALLOW" \| "DENY" \| "ALLOW_WITH_LIMITS"` |
| `DecisionOutput` | Full engine output. See [Response Schema](./schema). |
| `NormalizedSignals` | Normalized signal values consumed by the rule engine. |
| `Tier` | `"VERY_LOW" \| "LOW" \| "MEDIUM" \| "HIGH" \| "VERY_HIGH"` |
| `Capability` | `"NONE" \| "LOW" \| "MEDIUM" \| "HIGH"` |
| `ConfidenceTier` | `"LOW" \| "MEDIUM" \| "HIGH" \| "VERY_HIGH"` |
| `DecisionContext` | Valid context strings (see below). |
| `DecideUseCaseInput` | Input shape for `executeDecision`. |
| `DecideUseCaseOutput` | Output shape from `executeDecision` (extends `DecisionOutput`). |

## Contexts

The `VALID_CONTEXTS` constant exports all supported context strings:

```typescript
import { VALID_CONTEXTS } from "basecred-decision-engine";

// ["allowlist.general", "apply", "comment", "publish", "governance.vote"]
```

Each context activates a different subset of rules. See the [Decision Engine rules catalog](/decision-engine/rules) for details on which rules apply per context.

## ZK Proof Support

For on-chain decision submission with ZK proofs, use `executeDecisionWithProof`:

```typescript
import { executeDecisionWithProof } from "basecred-decision-engine";
import type { DecideWithProofUseCaseInput } from "basecred-decision-engine";
```

This use case extends `executeDecision` with proof generation. See the [ZK Agent Integration](./zk-agent) page for the full flow.

## Encoding Utilities

The SDK also exports encoding functions for converting between engine types and circuit/contract-compatible values. See [Encoding & ZK Utilities](./encoding) for the full reference.

## Further Reading

- [Response Schema](./schema) — canonical output format
- [Decision Engine Introduction](/decision-engine/intro) — how the engine works
- [Decision Engine Rules](/decision-engine/rules) — the full rule catalog
