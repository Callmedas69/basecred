# BaseCred Decision Engine

> **Decision-as-a-Service** — Not a scoring product

BaseCred is a **Decision Engine** that helps platforms answer:

> *"Should this identity be allowed to do this action, right now?"*

## Philosophy

1. **BaseCred does not create new scores** — It aggregates existing reputation systems
2. **Decisions over scores** — Scores are inputs, decisions are the product
3. **Deterministic core** — Same inputs → same decision. Always reproducible
4. **Context-aware** — Decisions depend on *where* the action happens
5. **Explainable by default** — Every decision produces a human-readable reason

## Installation

```bash
npm install basecred-decision-engine
```

## Quick Start

```typescript
import { decide, normalizeSignals } from 'basecred-decision-engine'

// Normalize signals directly from the SDK output schema (no mapping required)
const signals = normalizeSignals({
  ethos: { data: { score: 75 } },
  farcaster: { data: { userScore: 0.8 } },
  talent: { data: { builderScore: 60, creatorScore: 40 } },
  recency: { lastUpdatedDaysAgo: 2 }
})

// Make a decision
const decision = decide(signals, "allowlist.general")

console.log(decision)
// {
//   decision: "ALLOW",
//   confidence: "HIGH",
//   ruleIds: ["allow_strong_builder"],
//   explain: ["Strong builder credibility with sufficient social trust"],
//   version: "v1"
// }
```

## Signal Providers

| Provider | Signal | Meaning |
|----------|--------|---------|
| Ethos | `trust` | Long-term credibility |
| Farcaster | `socialTrust`, `spamRisk` | Social trust and spam risk |
| Talent Protocol | `builder`, `creator` | Skills and abilities |

## Decision Contexts

Decisions are evaluated within a **context**:

- `allowlist.general` — General access control
- `comment` — Commenting permissions
- `publish` — Publishing permissions
- `apply` — Job/grant applications
- `governance.vote` — Governance participation

## Rule Evaluation Order

1. **Fallback Rules** (insufficient signals → fail fast)
2. **Hard-Deny Rules** (critical risks)
3. **Allow Rules** (positive signals)
4. **Allow-With-Limits Rules** (conditional access)
5. **Default Deny** (no rule matched)

First match wins.

## API Response

```typescript
interface DecisionOutput {
  decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS"
  confidence: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
  constraints: string[]
  retryAfter: number | null
  ruleIds: string[]
  version: string
  explain: string[]
}
```

## Architecture

```
src/
├── types/           # Type definitions
├── engine/
│   ├── normalizers/ # Signal normalization
│   ├── rules/       # Rule definitions
│   ├── decide.ts    # Core decision function
│   └── confidence.ts
└── use-cases/       # Business logic orchestration
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npm run typecheck
```

## License

MIT
