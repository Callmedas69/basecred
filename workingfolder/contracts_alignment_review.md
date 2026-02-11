# Smart Contract Alignment Review

**Date**: 2026-02-05
**Scope**: `packages/contracts` vs `packages/interface` and `packages/decision-engine`

---

## Executive Summary

The smart contracts package is well-implemented and deployed to Base Sepolia. However, there are **encoding gaps** between the decision-engine's TypeScript types and the circuit/contract's numeric representations. These gaps must be bridged for full on-chain integration.

---

## Deployment Status

| Contract | Address (Base Sepolia) | Status |
|----------|------------------------|--------|
| Groth16Verifier | `0x14E91Bb6d25A24E4201B4A32E11F1D3807a4d08c` | Deployed |
| DecisionRegistry | `0x5a74Fe2909Bf59D0361DbE329c6dB6F705165F86` | Deployed |

**Chain ID**: 84532 (Base Sepolia)

---

## Contracts Package Assessment

### Verifier.sol
- Auto-generated Groth16 verifier (snarkjs)
- Accepts 3 public signals: `[policyHash, contextId, decision]`
- Uses BN254 elliptic curve pairing checks
- **Status**: Complete

### DecisionRegistry.sol
- Stores decisions keyed by `keccak256(subjectHash, context, policyHash)`
- Replay protection via unique key constraint
- Access control: `restricted` flag + `authorizedSubmitters` mapping
- Validates public signal bindings (policyHash, contextId, decision)
- Emits `DecisionSubmitted` event for audit trail
- **Status**: Complete

### Circuit (DecisionCircuit.circom)
- 3 public signals, 7 private inputs
- Implements 5-phase rule evaluation matching decision-engine
- Range constraints enforced for all inputs
- **Status**: Complete

### Tests
- Success path, replay protection, policy hash mismatch, invalid proof, decision mismatch
- **Status**: Complete

### ABIs
- TypeScript modules exported from `packages/contracts/abi/`
- Both `DECISION_REGISTRY_ABI` and `VERIFIER_ABI` available
- **Status**: Complete

---

## Interface Package Assessment

### What's Working
- ABIs imported from `@basecred/contracts/abi`
- Contract addresses configured in `onChainContracts.ts`
- Server-side proof verification via snarkjs (`zkProofVerifier.ts`)
- Agent API at `/api/v1/agent/decide` accepts and verifies proofs
- Plaintext signals bypass for development

### What's Missing
- **No on-chain submission path** - proofs are verified but not submitted to DecisionRegistry
- **No encoding utilities** - cannot convert engine types to contract parameters
- **No relayer integration** - would need wallet to submit transactions

---

## Decision Engine Assessment

### What's Working
- `TIER_ORDER` and `CAPABILITY_ORDER` defined in `types/tiers.ts`
- Policy hash computation with deterministic serialization
- `executeDecisionWithProof` use case with injected verifier
- `InMemoryPolicyRepository` for policy lookup

### What's Missing
- **No encoding functions** to convert:
  - Context string → contextId number
  - Decision string → decision number
  - signalCoverage decimal → basis points
  - Policy hash string → BN254 field element

---

## Type Mapping Reference

### Context Mapping
| Engine String | Circuit/Contract ID |
|---------------|---------------------|
| `allowlist.general` | `0` |
| `comment` | `1` |
| `publish` | `2` |
| `apply` | `3` |
| `governance.vote` | `4` |

### Decision Mapping
| Engine String | Circuit/Contract Value |
|---------------|------------------------|
| `DENY` | `0` |
| `ALLOW_WITH_LIMITS` | `1` |
| `ALLOW` | `2` |

### Tier Mapping (already in `TIER_ORDER`)
| Engine Tier | Circuit Value |
|-------------|---------------|
| `VERY_LOW` | `0` |
| `LOW` | `1` |
| `NEUTRAL` | `2` |
| `HIGH` | `3` |
| `VERY_HIGH` | `4` |

### Capability Mapping (already in `CAPABILITY_ORDER`)
| Engine Capability | Circuit Value |
|-------------------|---------------|
| `EXPLORER` | `0` |
| `BUILDER` | `1` |
| `EXPERT` | `2` |
| `ELITE` | `3` |

### Signal Coverage
| Engine Format | Circuit Format |
|---------------|----------------|
| `0.75` (decimal 0-1) | `7500` (basis points 0-10000) |

### Policy Hash
| Engine Format | Circuit/Contract Format |
|---------------|-------------------------|
| `sha256:abc123...` | Raw `uint256` < BN254 field order |

**BN254 field order (r)**: `21888242871839275222246405745257275088548364400416034343698204186575808495617`

---

## Gap Analysis

### Gap 1: Policy Hash Format Mismatch

**Problem**: Engine produces `sha256:xxxx` prefixed hashes, but circuit/contract expects raw uint256 within BN254 scalar field.

**Solution**: Add `policyHashToFieldElement()` function:
```typescript
function policyHashToFieldElement(hash: string): bigint {
  const hex = hash.replace("sha256:", "")
  const value = BigInt("0x" + hex)
  return value % BN254_FIELD_ORDER
}
```

**Location**: `packages/decision-engine/src/encoding/policyHash.ts`

---

### Gap 2: Context Encoding

**Problem**: Engine uses string contexts, contract uses numeric contextId.

**Solution**: Add bidirectional mapping:
```typescript
const CONTEXT_ID_MAP = {
  "allowlist.general": 0,
  "comment": 1,
  "publish": 2,
  "apply": 3,
  "governance.vote": 4,
}

function encodeContextId(context: DecisionContext): number
function decodeContextId(id: number): DecisionContext
```

**Location**: `packages/decision-engine/src/encoding/context.ts`

---

### Gap 3: Decision Encoding

**Problem**: Engine uses string decisions, contract uses uint8.

**Solution**: Add bidirectional mapping:
```typescript
const DECISION_VALUE_MAP = {
  "DENY": 0,
  "ALLOW_WITH_LIMITS": 1,
  "ALLOW": 2,
}

function encodeDecision(decision: Decision): number
function decodeDecision(value: number): Decision
```

**Location**: `packages/decision-engine/src/encoding/decision.ts`

---

### Gap 4: Signal Coverage Conversion

**Problem**: Engine uses 0-1 decimal, circuit uses 0-10000 basis points.

**Solution**: Add conversion functions:
```typescript
function signalCoverageToBps(coverage: number): number {
  return Math.round(coverage * 10000)
}

function bpsToSignalCoverage(bps: number): number {
  return bps / 10000
}
```

**Location**: `packages/decision-engine/src/encoding/signals.ts`

---

### Gap 5: No On-Chain Submission Path

**Problem**: Interface verifies proofs server-side but cannot submit to DecisionRegistry.

**Solution**: Implement submission flow following architecture layers:

1. **Repository** (`decisionRegistryRepository.ts`)
   - Abstracts viem contract calls
   - `submitDecision()`, `getDecision()`, `getDecisionKey()`

2. **Use Case** (`submitDecisionOnChain.ts`)
   - Orchestrates encoding and submission
   - Converts snarkjs proof format to contract format
   - Builds public signals array

3. **API Endpoint** (`/api/v1/agent/submit/route.ts`)
   - Validates request
   - Uses relayer wallet from env
   - Returns transaction hash

**Location**: `packages/interface/src/repositories/` and `packages/interface/src/use-cases/`

---

## Architecture Compliance

The proposed solution follows CLAUDE.md architecture rules:

```
UI (Agent Page)
    ↓
API/Controller (/api/v1/agent/submit)
    ↓
Business Logic (submitDecisionOnChain use case)
    ↓
Repository (decisionRegistryRepository)
    ↓
Infrastructure (viem → Base Sepolia)
```

---

## Recommendations

### Immediate (Required for Integration)

1. **Create encoding module** in decision-engine with all type converters
2. **Export encoding utilities** from decision-engine package
3. **Create repository** for on-chain contract access
4. **Create use case** for submission orchestration
5. **Create API endpoint** for on-chain submission

### Short-term

6. **Add unit tests** for all encoding functions
7. **Add integration test** for submission flow on Base Sepolia
8. **Update plan document** (`zkBasecred_smartcontract_plan.md`) with completed items

### Future

9. **Deploy to Base mainnet** after testnet validation
10. **Client-side submission option** for dApps wanting direct submission
11. **Event indexing** for decision history queries

---

## Files Reference

### Contracts Package
| File | Purpose |
|------|---------|
| `contracts/Verifier.sol` | Groth16 proof verification |
| `contracts/DecisionRegistry.sol` | Decision storage and proof binding |
| `circuits/DecisionCircuit.circom` | ZK circuit with rule logic |
| `circuits/CIRCUIT_SPEC.md` | Canonical encoding specification |
| `abi/DecisionRegistry.ts` | TypeScript ABI export |
| `abi/Groth16Verifier.ts` | TypeScript ABI export |
| `test/DecisionRegistry.t.sol` | Foundry tests |
| `scripts/Deploy.s.sol` | Deployment script |

### Decision Engine Package
| File | Purpose |
|------|---------|
| `src/types/tiers.ts` | TIER_ORDER, CAPABILITY_ORDER |
| `src/types/proofs.ts` | ProofVerifier, VerifiedProof interfaces |
| `src/policies/hash.ts` | Policy hash computation |
| `src/use-cases/decide-with-proof.ts` | Proof-verified decision flow |

### Interface Package
| File | Purpose |
|------|---------|
| `src/lib/onChainContracts.ts` | Contract addresses and metadata |
| `src/lib/zkProofVerifier.ts` | Server-side proof verification |
| `src/lib/agentSchemas.ts` | Zod validation schemas |
| `src/app/api/v1/agent/decide/route.ts` | Agent decision API |

---

## Conclusion

The contracts package is production-ready and correctly deployed. The primary work remaining is bridging the type gap between TypeScript and Solidity through encoding utilities, and implementing the on-chain submission path. This aligns with the smart contract plan and follows the established architecture patterns.
