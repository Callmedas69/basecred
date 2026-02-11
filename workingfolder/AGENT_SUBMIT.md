# Connect Agent Flow to On-Chain Submission

## Context

The agent `check-owner` flow generates ZK proofs but stops at returning JSON — it never submits decisions on-chain to the `DecisionRegistry` contract. This means the protocol's core value proposition (verifiable, portable, on-chain reputation proofs readable by other platforms) is broken. The two flows exist independently:

- **check-owner** → generates proof → returns JSON (stops here)
- **submit endpoint** → takes proof → submits on-chain (never called by check-owner)

**Goal**: When an agent calls `check-owner?withProof=true`, automatically submit each decision on-chain via the relayer after proof generation. Default to on-chain submission, with an opt-out flag.

## Approach

Modify the `checkOwnerReputation` use case to call `submitDecisionOnChain` for each context result that has a proof. The submission happens **after** proofs are generated, **in parallel** for all 5 contexts, and is **fire-and-forget** (failures don't block the API response).

### Design Decisions

1. **Default on-chain, opt-out via `?submitOnChain=false`** — Makes the protocol work by default
2. **Fire-and-forget** — On-chain submission runs in parallel, errors are logged but don't fail the API response. The agent still gets its JSON result immediately.
3. **Graceful replay handling** — If a decision was already submitted (same subject+context+policy), catch the "already submitted" revert and skip silently. This makes repeat calls safe.
4. **On-chain results included in response** — Add `onChain` field to each context result indicating submission status + tx hash when available

## Files to Modify

### 1. `packages/interface/src/use-cases/check-owner-reputation.ts`

**Changes:**
- Add `submitOnChain` option to `CheckOwnerReputationOptions` (default: `true` when `withProof` is true)
- Add `IDecisionRegistryRepository` to `CheckOwnerReputationDeps`
- After `buildResultsWithProof()` completes, submit each context's decision on-chain in parallel
- Add `onChain` field to `ContextResult` interface: `{ submitted: boolean, txHash?: string, error?: string }`
- Handle "Decision already submitted" reverts gracefully (mark as `{ submitted: true, existing: true }`)
- Submission is **awaited** (not fire-and-forget) so we can include tx hashes in the response, but with a timeout so it doesn't block forever

Implementation outline for the new submission step (after step 6, before step 7):

```typescript
// 6b. Submit proofs on-chain (parallel, with timeout)
if (withProof && submitOnChain) {
  const relayerKey = process.env.RELAYER_PRIVATE_KEY
  if (relayerKey) {
    const registryRepo = deps!.decisionRegistryRepository
      ?? createDecisionRegistryRepository(relayerKey)

    await Promise.allSettled(
      Object.entries(results).map(async ([contextKey, result]) => {
        if (!result.proof || !result.publicSignals || !result.policyHash) return
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
      })
    )
  } else {
    // No relayer key — mark all as not submitted
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
- When `submitOnChain=true`, inject `decisionRegistryRepository` into deps (same pattern as `withProof` injects `proofRepository`)
- Increase timeout from 45s to 60s (on-chain submissions add ~5-15s)

### 3. `packages/interface/src/use-cases/check-owner-reputation.ts` — Types

Add to `ContextResult`:
```typescript
onChain?: {
  submitted: boolean
  txHash?: string
  existing?: boolean  // true if decision was already on-chain
  error?: string
}
```

Add to `CheckOwnerReputationOptions`:
```typescript
submitOnChain?: boolean  // default: true when withProof is true
```

Add to `CheckOwnerReputationDeps`:
```typescript
decisionRegistryRepository?: IDecisionRegistryRepository
```

## Files NOT Modified

- `submit-decision-onchain.ts` — Reused as-is, no changes needed
- `decisionRegistryRepository.ts` — Reused as-is
- `DecisionRegistry.sol` — No contract changes

## Edge Cases

1. **No `RELAYER_PRIVATE_KEY`** — Skip on-chain submission, log warning, mark results as `submitted: false`
2. **Decision already exists on-chain** — Contract reverts with "Decision already submitted". Catch and mark `existing: true`
3. **Relayer out of gas** — Transaction fails, mark `submitted: false` with error. Agent still gets off-chain result.
4. **One context fails, others succeed** — `Promise.allSettled` ensures each context is independent
5. **`withProof=false`** — No proofs generated, no on-chain submission possible (no change from current behavior)
6. **`withProof=true&submitOnChain=false`** — Proofs generated but not submitted (opt-out)

## Verification

1. **Build check**: `pnpm --filter interface build` — no type errors
2. **Manual test with `withProof=true` (default)**:
   - Call `POST /api/v1/agent/check-owner?withProof=true` with valid API key
   - Verify response includes `onChain.submitted: true` and `onChain.txHash` for each context
   - Verify transactions appear on Base Sepolia explorer
3. **Manual test with opt-out**:
   - Call `POST /api/v1/agent/check-owner?withProof=true&submitOnChain=false`
   - Verify no `onChain` field or `submitted: false` — no transactions sent
4. **Replay test**: Call the same endpoint again for the same owner
   - Should see `onChain.existing: true` (decision already on-chain)
5. **No relayer key**: Remove `RELAYER_PRIVATE_KEY` from env
   - Verify response still works, `onChain.submitted: false, error: "Relayer not configured"`
