# Connect Agent Flow to On-Chain Submission

## Context

The agent `check-owner` flow generates ZK proofs but stops at returning JSON — it never submits decisions on-chain to the `DecisionRegistry` contract. This means the protocol's core value proposition (verifiable, portable, on-chain reputation proofs readable by other platforms) is broken. The two flows exist independently:

- **check-owner** → generates proof → returns JSON (stops here)
- **submit endpoint** → takes proof → submits on-chain (never called by check-owner)

**Goal**: When an agent calls `check-owner?withProof=true`, automatically submit each decision on-chain via the relayer after proof generation. Default to on-chain submission, with an opt-out flag.

## Approach

Modify the `checkOwnerReputation` use case to call `submitDecisionOnChain` for each context result that has a proof. The submission happens **after** proofs are generated, **sequentially** (to avoid nonce collisions from the same relayer wallet).

### Design Decisions

1. **Default on-chain, opt-out via `?submitOnChain=false`** — Makes the protocol work by default
2. **Sequential submission** — Submit one context at a time to avoid nonce collisions from the single relayer wallet. Adds ~15-25s but is safe and simple.
3. **Graceful replay handling** — If a decision was already submitted (same subject+context+policy), catch the "already submitted" revert and mark `existing: true`. Repeat calls are safe.
4. **On-chain results included in response** — Add `onChain` field to each context result indicating submission status + tx hash

## Files to Modify

### 1. `packages/interface/src/use-cases/check-owner-reputation.ts`

**Changes:**
- Add `submitOnChain` option to `CheckOwnerReputationOptions` (default: `true` when `withProof` is true)
- Add `IDecisionRegistryRepository` to `CheckOwnerReputationDeps`
- After `buildResultsWithProof()` completes, submit each context's decision on-chain **sequentially**
- Add `onChain` field to `ContextResult` interface
- Handle "Decision already submitted" reverts gracefully

**New types:**
```typescript
// Add to ContextResult
onChain?: {
  submitted: boolean
  txHash?: string
  existing?: boolean  // true if decision was already on-chain
  error?: string
}

// Add to CheckOwnerReputationOptions
submitOnChain?: boolean  // default: true when withProof is true

// Add to CheckOwnerReputationDeps
decisionRegistryRepository?: IDecisionRegistryRepository
```

**New imports:**
```typescript
import type { Decision, DecisionContext } from "basecred-decision-engine"
import { submitDecisionOnChain } from "@/use-cases/submit-decision-onchain"
import { createDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
import type { IDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
```

**Implementation — new step between step 6 and step 7 (sequential loop):**
```typescript
// 6b. Submit proofs on-chain (sequential to avoid nonce collisions)
const submitOnChain = options?.submitOnChain ?? withProof  // default: true when withProof
if (withProof && submitOnChain) {
  const relayerKey = process.env.RELAYER_PRIVATE_KEY
  if (relayerKey) {
    const registryRepo = deps?.decisionRegistryRepository
      ?? createDecisionRegistryRepository(relayerKey)

    for (const [contextKey, result] of Object.entries(results)) {
      if (!result.proof || !result.publicSignals || !result.policyHash) continue
      try {
        const output = await submitDecisionOnChain(
          {
            subject: ownerAddress,
            context: contextKey as DecisionContext,
            decision: result.decision as Decision,
            policyHash: result.policyHash,
            proof: result.proof,
            publicSignals: result.publicSignals,
          },
          { decisionRegistryRepository: registryRepo }
        )
        result.onChain = { submitted: true, txHash: output.transactionHash }
      } catch (err: any) {
        if (err.message?.includes("already submitted")) {
          result.onChain = { submitted: true, existing: true }
        } else {
          console.error(`On-chain submit failed for ${contextKey}:`, err.message)
          result.onChain = { submitted: false, error: err.message }
        }
      }
    }
  } else {
    for (const result of Object.values(results)) {
      if (result.proof) {
        result.onChain = { submitted: false, error: "Relayer not configured" }
      }
    }
  }
}
```

### 2. `packages/interface/src/app/api/v1/agent/check-owner/route.ts`

**Changes:**
- Parse `submitOnChain` query param (default: `true` when `withProof=true`)
- Pass to `checkOwnerReputation` options
- When `submitOnChain=true`, inject `decisionRegistryRepository` into deps
- Increase timeout from 45s to 90s (sequential on-chain submissions add ~15-25s)

```typescript
const submitOnChain = req.nextUrl.searchParams.get("submitOnChain") !== "false"

// Update deps construction:
const deps = withProof
  ? {
      proofRepository: createProofRepository(),
      ...(submitOnChain ? { decisionRegistryRepository: createDecisionRegistryRepository(process.env.RELAYER_PRIVATE_KEY) } : {}),
    }
  : undefined

// Update timeout:
const TIMEOUT_MS = 90_000

// Pass to use case:
checkOwnerReputation(apiKeyHash, { withProof, submitOnChain }, deps)
```

## Files NOT Modified

- `submit-decision-onchain.ts` — Reused as-is, no changes needed
- `decisionRegistryRepository.ts` — Reused as-is
- `DecisionRegistry.sol` — No contract changes

## Edge Cases

1. **No `RELAYER_PRIVATE_KEY`** — Skip on-chain submission, mark results as `submitted: false`
2. **Decision already exists on-chain** — Contract reverts "Decision already submitted". Catch and mark `existing: true`
3. **Relayer out of gas** — Transaction fails, mark `submitted: false` with error. Agent still gets off-chain result.
4. **One context fails, others continue** — Sequential loop catches per-context, doesn't abort
5. **`withProof=false`** — No proofs, no on-chain submission (unchanged behavior)
6. **`withProof=true&submitOnChain=false`** — Proofs generated but not submitted (opt-out)

## Verification

1. **Build check**: `pnpm --filter interface build` — no type errors
2. **Manual test with `withProof=true` (default)**:
   - Call `POST /api/v1/agent/check-owner?withProof=true` with valid API key
   - Verify response includes `onChain.submitted: true` and `onChain.txHash` for each context
   - Verify transactions appear on Base Sepolia explorer
3. **Manual test with opt-out**:
   - Call `POST /api/v1/agent/check-owner?withProof=true&submitOnChain=false`
   - Verify `onChain` field absent — no transactions sent
4. **Replay test**: Call the same endpoint again for the same owner
   - Should see `onChain.existing: true` (decision already on-chain)
5. **No relayer key**: Remove `RELAYER_PRIVATE_KEY` from env
   - Verify response still works, `onChain.submitted: false, error: "Relayer not configured"`
