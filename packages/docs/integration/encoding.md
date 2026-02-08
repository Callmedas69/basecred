---
sidebar_position: 13
---

# Encoding & ZK Utilities

> Converting between engine types and circuit/contract-compatible values.

The `basecred-decision-engine` package exports a full set of encoding utilities for converting decisions, signals, and identifiers into formats compatible with ZK circuits and Solidity contracts.

All functions below are imported from `basecred-decision-engine`.

## Subject Hashing

### `subjectToBytes32(subject: string): 0x${string}`

Hashes a subject identifier (wallet address or FID) to a `bytes32` value using SHA-256.

```typescript
import { subjectToBytes32 } from "basecred-decision-engine";

const hash = subjectToBytes32("0x1234...abcd");
// "0x<64 hex chars>"
```

:::warning Node.js only
`subjectToBytes32` uses Node.js `crypto.createHash`. It is **not** browser-compatible. If you need subject hashing in the browser, use the Web Crypto API equivalent (`crypto.subtle.digest("SHA-256", ...)`).
:::

### `isValidBytes32(value: string): boolean`

Validates that a string is a properly formatted `0x`-prefixed 64-character hex string.

## Context Encoding

### `CONTEXT_ID_MAP`

Maps `DecisionContext` strings to numeric IDs for circuit inputs:

| Context | ID |
| :------------------- | :- |
| `allowlist.general` | 0 |
| `comment` | 1 |
| `publish` | 2 |
| `apply` | 3 |
| `governance.vote` | 4 |

### `encodeContextId(context: DecisionContext): number`

Returns the numeric ID for a given context. Throws if the context is invalid.

### `contextToBytes32(context: DecisionContext): 0x${string}`

Converts a context to `bytes32` format for on-chain use. The contract expects `bytes32(uint256(contextId))`.

```typescript
import { contextToBytes32 } from "basecred-decision-engine";

const ctx = contextToBytes32("allowlist.general");
// "0x0000...0000" (64 hex chars, value 0)
```

## Decision Encoding

### `DECISION_VALUE_MAP`

Maps `Decision` strings to numeric values:

| Decision | Value |
| :------------------ | :---- |
| `DENY` | 0 |
| `ALLOW_WITH_LIMITS` | 1 |
| `ALLOW` | 2 |

### `encodeDecision(decision: Decision): number`

Returns the numeric value for a decision. Throws if invalid.

### `decodeDecision(value: number): Decision`

Converts a numeric value back to a `Decision` string.

## Policy Hash Encoding

Policy hashes identify rulesets. They must be reduced to valid BN254 field elements for ZK circuit use.

### `BN254_FIELD_ORDER`

The BN254 scalar field order as a `bigint`. All field elements must be less than this value.

### `policyHashToFieldElement(hash: string): bigint`

Converts a policy hash (with or without `sha256:` prefix) to a field element by interpreting the hex as a big-endian unsigned integer and reducing mod `BN254_FIELD_ORDER`.

### `policyHashToBytes32(hash: string): 0x${string}`

Converts a policy hash to `bytes32` for on-chain use. Internally calls `policyHashToFieldElement` and left-pads to 32 bytes.

```typescript
import { policyHashToBytes32 } from "basecred-decision-engine";

const bytes = policyHashToBytes32("sha256:abcdef...");
```

### `isPolicyHashValidFieldElement(hash: string): boolean`

Returns `true` if the policy hash is already a valid field element (less than `BN254_FIELD_ORDER`) without reduction.

## Signal Encoding

### `encodeSignalsForCircuit(signals: NormalizedSignals): CircuitSignals`

Converts all normalized signals to circuit-compatible numeric values in a single call.

```typescript
import { encodeSignalsForCircuit } from "basecred-decision-engine";
import type { CircuitSignals } from "basecred-decision-engine";

const circuitInputs: CircuitSignals = encodeSignalsForCircuit(normalizedSignals);
// { trust: 3, socialTrust: 2, builder: 1, creator: 0, recencyDays: 5, spamRisk: 0, signalCoverageBps: 8500 }
```

The `CircuitSignals` interface:

| Field | Type | Range | Source |
| :------------------ | :----- | :---------- | :------------------------------- |
| `trust` | number | 0–4 | Tier (VERY_LOW=0 ... VERY_HIGH=4) |
| `socialTrust` | number | 0–4 | Tier |
| `builder` | number | 0–3 | Capability (NONE=0 ... HIGH=3) |
| `creator` | number | 0–3 | Capability |
| `recencyDays` | number | 0+ | Days since last activity |
| `spamRisk` | number | 0–4 | Tier |
| `signalCoverageBps` | number | 0–10000 | Coverage as basis points |

### Helper Functions

- `encodeTier(tier: Tier): number` — Tier to numeric (0–4)
- `decodeTier(value: number): Tier` — numeric to Tier
- `encodeCapability(cap: Capability): number` — Capability to numeric (0–3)
- `decodeCapability(value: number): Capability` — numeric to Capability
- `signalCoverageToBps(coverage: number): number` — decimal (0–1) to basis points (0–10000)
- `bpsToSignalCoverage(bps: number): number` — basis points to decimal

## Proof Format Conversion

These utilities convert between snarkjs proof output and Solidity-compatible proof structs.

### `snarkjsProofToContract(proof: SnarkjsProof): ContractProof`

Converts a snarkjs Groth16 proof to contract-compatible format. Handles the B-point coordinate swap required by the on-chain verifier.

### `contractProofToStrings(proof: ContractProof): ContractProofStrings`

Converts `bigint` proof values to strings for JSON serialization (e.g., sending proofs via API).

### `stringProofToContract(proof: ContractProofStrings): ContractProof`

Parses string proof values back to `bigint` format for contract calls.

### `snarkjsSignalsToContract(signals: string[]): bigint[]`

Converts snarkjs public signal strings to `bigint[]` for contract use.
