# Add ZK Proof Generation to Agent Check-Owner Flow

## Context

The `POST /api/v1/agent/check-owner` endpoint currently runs the decision engine for all 5 contexts without generating ZK proofs. The existing ZK proof pipeline (`/api/v1/decide-with-proof`) already works for single-context requests. This plan adds ZK proof generation to the agent check-owner flow so agents receive cryptographic proofs alongside reputation results.

**Approach**: Optional via query param `?withProof=true`. Default behavior (no proofs) stays fast and backward-compatible. When proofs are requested, the endpoint generates a Groth16 proof for each of the 5 contexts.

**Performance**: Profile fetch (~400-1000ms) happens once regardless. Proof generation adds ~450-525ms per context. snarkjs WASM is CPU-bound and Node.js is single-threaded, so 5 proofs run **sequentially** (~2.5s total for proofs). Total with proofs: ~3-4s vs ~1s without.

**Error strategy**: If any single proof generation fails, the entire request fails. No partial results — agents should not receive an incomplete proof set.

---

## Architecture Flow

```
Route (route.ts) — Transport Layer
  ├─ Parses ?withProof=true from query string
  ├─ Extracts API key hash from middleware header
  ├─ Creates concrete ProofRepository
  └─ Calls checkOwnerReputation(apiKeyHash, { withProof }, { proofRepository })

Use Case (check-owner-reputation.ts) — Business Logic
  ├─ Looks up API key via ApiKeyRepository
  ├─ Fetches profile (existing flow)
  ├─ Normalizes signals (pure function)
  ├─ If withProof: calls proofRepository.areCircuitFilesAvailable()
  ├─ If withProof: calls proofRepository.generateProof() per context
  ├─ If !withProof: calls executeDecision() (existing flow, unchanged)
  ├─ Builds natural language summary
  ├─ Logs activity
  └─ Returns result

ProofRepository (proofRepository.ts) — Data Access Boundary (NEW)
  ├─ Wraps proofGenerator.ts infrastructure
  ├─ Abstracts fs access, snarkjs, circuit file paths
  └─ Testable via mock injection
```

Dependencies flow downward only. Use case never touches fs, snarkjs, or process.env directly.

---

## Files

### NEW: `packages/interface/src/repositories/proofRepository.ts`

Wraps the existing `@/lib/proofGenerator` infrastructure behind a clean interface so the use case stays testable without file system or snarkjs dependencies.

```typescript
export interface IProofRepository {
  areCircuitFilesAvailable(): Promise<boolean>
  generateProof(input: ProofGenerationInput): Promise<GeneratedProof>
}

export function createProofRepository(): IProofRepository {
  return {
    areCircuitFilesAvailable: () => import("@/lib/proofGenerator").then(m => m.areCircuitFilesAvailable()),
    generateProof: (input) => import("@/lib/proofGenerator").then(m => m.generateProof(input)),
  }
}
```

The use case receives `IProofRepository` via dependency injection. Tests can provide a mock that returns fake proofs without touching disk or WASM.

### MODIFY: `packages/interface/src/app/api/v1/agent/check-owner/route.ts`

**Changes:**
- Add `export const runtime = "nodejs"` and `export const maxDuration = 60` (required for snarkjs WASM)
- Parse `?withProof=true` from query string
- Create concrete `ProofRepository` and inject into use case
- Add 45s timeout safeguard on the use case call (AbortController or Promise.race) so the endpoint returns a meaningful error rather than being killed by the hosting platform
- Response shape unchanged when `withProof=false` (backward-compatible)

### MODIFY: `packages/interface/src/use-cases/check-owner-reputation.ts`

**Changes:**
- Add `withProof` option and `proofRepository` dependency to function signature:
  ```typescript
  export async function checkOwnerReputation(
    apiKeyHash: string,
    options?: { withProof?: boolean },
    deps?: { proofRepository?: IProofRepository }
  ): Promise<CheckOwnerReputationOutput>
  ```
- Import `encodeSignalsForCircuit`, `encodeContextId`, `InMemoryPolicyRepository`, `listPolicies` from `basecred-decision-engine` (pure functions and in-memory data — not infrastructure)
- When `withProof=true`:
  1. Validate `deps.proofRepository` is provided, throw if missing
  2. Check circuit file availability via `proofRepository.areCircuitFilesAvailable()` — fail fast with typed error if unavailable
  3. After normalizing signals, call `encodeSignalsForCircuit(signals)` (pure function)
  4. Load policies via `listPolicies({ policyRepository })` to get `policyHash` per context
  5. For each of 5 contexts **sequentially** (`for...of` loop, not `Promise.all`):
     - Find policy for context
     - Call `proofRepository.generateProof({ circuitSignals, policyHash, contextId })`
     - Map proof result to ContextResult with proof fields
  6. Decision is extracted from the proof result (`proofResult.decision`)
- When `withProof=false`: keep existing `executeDecision` flow (zero changes)
- Extend `ContextResult` type with optional proof fields:
  ```typescript
  interface ContextResult {
    decision: string
    confidence: string
    constraints: string[]
    blockingFactors?: string[]
    verified?: boolean                        // NEW: true when ZK proof is present
    proof?: ContractProofStrings              // NEW (only when withProof=true)
    publicSignals?: [string, string, string]  // NEW
    policyHash?: string                       // NEW
    contextId?: number                        // NEW
  }
  ```
- Extend `CheckOwnerReputationOutput` with `zkEnabled: boolean`

**Note:** The use case throws `CheckOwnerReputationError` with appropriate status codes following the established pattern (e.g., `new CheckOwnerReputationError("ZK circuit files are not available", 503)`). The route maps these to HTTP responses.

---

## Implementation Detail

### Use case logic when `withProof=true`:

```
1.  Look up API key → ownerAddress (same as now)
2.  Validate proofRepository is injected
3.  proofRepository.areCircuitFilesAvailable() → throw error if not
4.  Fetch profile once (same as now)
5.  normalizeSignals(profile) (same as now)
6.  encodeSignalsForCircuit(signals) → circuitSignals (NEW, pure function)
7.  listPolicies() → get policyHash per context (NEW, in-memory)
8.  For each of 5 contexts SEQUENTIALLY:
    - Find policy for context
    - proofRepository.generateProof({ circuitSignals, policyHash, contextId })
    - Map proof result → ContextResult with proof + verified fields
9.  Build summary (same as now, decisions come from proof results)
10. Log activity (same as now)
11. Return results with proofs included
```

### Confidence and Verification fields

The existing `executeDecision` returns a `confidence` field (HIGH, MEDIUM, LOW, VERY_HIGH). When ZK proofs are present, the decision is cryptographically verified — a fundamentally different quality than statistical confidence.

**Approach:** Keep the existing `confidence` field as-is (set to the value from the decision engine for consistency). Add a separate `verified: boolean` field that is `true` when a ZK proof is present. This avoids breaking consumers who parse confidence as a level, while clearly communicating cryptographic verification.

- `withProof=false`: `{ confidence: "HIGH", verified: undefined }` (field omitted)
- `withProof=true`: `{ confidence: "HIGH", verified: true, proof: {...} }`

---

## Response Example

**Without proof** (existing, unchanged):
```json
{
  "ownerAddress": "0x...",
  "agentName": "my_agent",
  "zkEnabled": false,
  "summary": "Your reputation is strong...",
  "results": {
    "comment": { "decision": "ALLOW", "confidence": "HIGH", "constraints": [] }
  }
}
```

**With proof** (`?withProof=true`):
```json
{
  "ownerAddress": "0x...",
  "agentName": "my_agent",
  "zkEnabled": true,
  "summary": "Your reputation is strong...",
  "results": {
    "comment": {
      "decision": "ALLOW",
      "confidence": "HIGH",
      "verified": true,
      "constraints": [],
      "proof": { "a": ["...","..."], "b": [["...","..."],["...","..."]], "c": ["...","..."] },
      "publicSignals": ["policyHashField", "1", "2"],
      "policyHash": "sha256:abc...",
      "contextId": 1
    }
  }
}
```

---

## Files Summary

| File | Action | Purpose |
|---|---|---|
| `src/repositories/proofRepository.ts` | **NEW** | Wraps proofGenerator.ts behind interface for testability |
| `src/app/api/v1/agent/check-owner/route.ts` | MODIFY | Parse withProof, inject ProofRepository, add runtime/timeout |
| `src/use-cases/check-owner-reputation.ts` | MODIFY | Accept ProofRepository via DI, generate proofs sequentially |

All paths relative to `packages/interface/`.

---

## Verification

1. **Without flag** (backward compat): `POST /api/v1/agent/check-owner` with API key → same response as before, `zkEnabled: false`, no proof fields
2. **With flag**: `POST /api/v1/agent/check-owner?withProof=true` → response includes `zkEnabled: true`, `verified: true`, and proof data for each context
3. **No circuit files**: `?withProof=true` when circuit files missing → 503 with clear error message
4. **Single proof failure**: Any proof generation error → entire request fails with 500 (no partial results)
5. **Timeout**: Request exceeding 45s → returns 504 with timeout error
6. **Testability**: Use case can be unit tested with mock `IProofRepository` — no fs/snarkjs needed
7. **Build**: `pnpm --filter interface build` passes cleanly
