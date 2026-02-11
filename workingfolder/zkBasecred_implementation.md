# ZK BaseCred Implementation Plan

## Goal
Enable privacy-preserving reputation decisions where raw scores are not revealed. The system should only expose the final decision and interpretation while allowing policy thresholds to change without re-building the ZK circuit.

## Guiding Principles
- Keep the ZK circuit stable across policy changes.
- Bind proofs to a policy identifier so the engine can verify the correct policy was used.
- Do not expose raw scores or raw profile data in the decision response.
- Follow the unidirectional architecture flow: UI -> API -> Use Case -> Repository -> Chain/External.

## Target Flow
1. Agent fetches reputation data via SDK
2. Agent generates ZK proof for threshold compliance
3. API endpoint validates input and forwards to use case
4. Use case verifies proof and policy, then computes decision
5. Response returns decision + explanation (no raw score)

## Implementation Checklist (2026-02-04)
- [x] Add ZK decision use case scaffolding in decision-engine
  - packages/decision-engine/src/use-cases/decide-with-proof.ts
- [x] Add proof types and repository interfaces
  - packages/decision-engine/src/types/proofs.ts
  - packages/decision-engine/src/repositories/policyRepository.ts
- [x] Add in-memory policy repository and v1 policy definitions
  - packages/decision-engine/src/repositories/inMemoryPolicyRepository.ts
  - packages/decision-engine/src/policies/v1.ts
- [x] Export ZK types/use case/repository from decision-engine entrypoints
  - packages/decision-engine/src/index.ts
  - packages/decision-engine/src/types/index.ts
  - packages/decision-engine/src/use-cases/index.ts
  - packages/decision-engine/src/repositories/index.ts
- [x] Add agent API route (stub verifier)
  - packages/interface/src/app/api/v1/agent/decide/route.ts
  - Note: verifier is stubbed; use ZK_ALLOW_PLAINTEXT_SIGNALS=true for dev-only signals in publicInputs
- [x] Implement real proof verifier (Circom + SnarkJS adapter)
- [x] Compute and enforce real policy hashes (SHA-256 via policies/hash.ts)
- [x] Add policy versioning docs + change process
- [x] Add agent UI page (src/app/agent/page.tsx)
- [x] Add tests (proof verification + negative cases)
- [x] Run decision-engine tests (pnpm -C packages/decision-engine test)
- [x] Replace dev fallback in verifier with production-only flagging rules
- [x] Add integration examples for /api/v1/agent/decide payloads
- [x] Add UI helper to display current policy hashes
- [x] Add server-side validation for proof/publicInputs schema
- [x] Add integration tests for the agent API route
- [x] Run interface tests (pnpm -C packages/interface test)
- [x] Add policy hash display to docs/agent page (optional)
- [x] Add agent API examples to docs index (optional)
- [x] Add server-side policy hash to response headers (optional)
- [x] Add response header documentation to ZK agent docs
- [x] Validate context against allowed list in agent API schema
- [x] Align decision-engine VALID_CONTEXTS export with interface schema
- [x] Add policy hashes to decision-engine docs (optional)
- [x] Document policy hash header in API reference (optional)
- [x] Add validation tests for invalid context in agent API schema
- [x] Add server-side policy hash to non-ZK decide responses (optional)
- [x] Add changelog note for ZK agent endpoint (optional)
- [x] Add unit tests for policy listing API (optional)
- [x] Rerun interface tests after policy hash response changes

## Next Up
1. Optional: cache policy list lookup in non-ZK decide route.
2. Optional: add API response examples for policy listing.
3. Optional: add tests for non-ZK policy hash header.

## Status
v1 implementation complete. Optional enhancements remain.

## Phase 1: Policy and Proof Contract
1. Define policy schema per context:
   - Thresholds: trust, spamRisk, builder, socialTrust
   - Policy version or policy hash
2. Define ZK public inputs:
   - policyHash
   - thresholds (or a policy identifier that maps to thresholds)
   - context (optional)
3. Define ZK private inputs:
   - raw scores derived from SDK profile
4. Select proof system and tooling (best-practice default):
   - Circom + SnarkJS
5. Define canonical normalization logic:
   - Versioned normalization rules shared by agent and engine
   - Include normalization version/hash in policy or public inputs

## Phase 2: ZK Circuit
1. Implement constraints for each signal:
   - trust >= T_trust
   - spamRisk <= T_spam
   - builder >= T_builder
   - socialTrust >= T_social
2. Public inputs carry thresholds and policy hash.
3. Outputs are validity of each constraint.
4. Generate proving/verification keys and verifier module.

## Phase 3: Agent Proof Generation
1. Agent uses basecred-sdk to fetch profile data.
2. Agent normalizes scores using the canonical versioned logic.
3. Agent generates proof with:
   - Private inputs: raw or normalized scores
   - Public inputs: thresholds + policyHash + normalization version/hash
4. Agent sends proof payload to API endpoint.
5. Proof generation location (best-practice default):
   - Agent runtime (not browser)

## Phase 4: Decision Engine Verification (Use Case Layer)
1. Add proof verification in a use-case module (not API):
   - verifyProof(proof, publicInputs, verificationKey)
2. Validate policy hash matches current policy for context.
3. If proof valid, compute decision using policy rules.
4. Return decision + explain, no raw score.

## Phase 4A: Decision Engine Modifications (Explicit)
1. Add a new ZK-aware use case in packages/decision-engine/src/use-cases:
   - decideWithProof.ts (or similar)
   - Inputs: context, proof, publicInputs, policyHash
   - Outputs: DecisionOutput + explain
2. Add a proof verification adapter in packages/decision-engine/src/engine:
   - verifyProof() interface injected into the use case
3. Add a policy lookup interface in packages/decision-engine/src/repositories:
   - getPolicyByContext() returns thresholds, policyHash, normalizationVersion
4. Keep executeDecision unchanged for non-ZK flows.

## Phase 5: API Endpoint (Transport Layer)
1. Create POST /api/v1/agent/decide
2. Request body:
   - subject
   - context
   - proof
   - publicInputs (policyHash, thresholds, normalizationVersion)
3. Endpoint flow:
   - validate request shape
   - call use case
   - return decision response
4. Error handling:
   - invalid proof -> 400 with clear message
   - policy mismatch -> 409 with clear message
   - unsupported context -> 404 with clear message

## Phase 6: Interface (Agent UI)
1. Add page: src/app/agent/page.tsx
2. Inputs:
   - subject address
   - context selector
   - proof payload (generated client-side or uploaded)
3. Outputs:
   - decision
   - explanation
   - policy version/hash

## Phase 7: Backward Compatibility
1. Keep existing /api/v1/decide for non-ZK flows.
2. Add feature flag for ZK verification on server.
3. Fallback to non-ZK path only when explicitly allowed by config/policy.

## Phase 8: Fallback Policy (Required)
1. Define per-context fallback rules:
   - Example: governance.vote = ZK required
   - Example: comment = ZK optional
2. If ZK is required and proof is missing:
   - Reject with code ZK_REQUIRED
   - Do not compute decision from raw scores
3. If ZK is optional and proof is missing:
   - Allow fallback to non-ZK decision flow
4. In production:
   - Default to ZK required unless explicitly overridden

## Phase 9: Testing and Security
1. Unit tests for proof verification.
2. Golden test vectors (score -> proof -> decision).
3. Negative tests:
   - invalid proof
   - policy mismatch
   - unsupported context
   - ZK required but proof missing

## Phase 10: On-Chain Verification (Optional, Out of Scope v1)
1. If on-chain verification is added, use Context7 to confirm ABI and contract behavior.
2. Keep contract logic minimal: verify proof, store decision, expose read-only state.

## Scope Lock (v1)
- Includes: server-side proof verification and decision output.
- Excludes: on-chain verification, wallet factory, custody flows.
- Keeps existing non-ZK decision endpoint intact.

## Defaults Locked (Best Practice)
- Proof system: Circom + SnarkJS
- Proof generation: agent runtime (not browser)
- Policy storage: versioned JSON in decision-engine with hashes
- Normalization source of truth: decision-engine normalizer exported for agent use

## Policy Versioning (Process)
1. Policy source of truth lives in `packages/decision-engine/src/policies/v1.ts`.
2. Any policy change requires:
   - Update thresholds in `v1.ts` (or introduce `v2.ts` for breaking changes).
   - Recompute hashes via `computePolicyHash()` (auto on build).
   - Update any client/agent that pins `policyHash`.
3. Non-breaking change definition:
   - Tightening thresholds within same schema version.
4. Breaking change definition:
   - Changing threshold keys or normalization version.
   - Requires new policy file (`v2.ts`) and new policy hashes.
5. Publish policy updates:
   - Record policy hash and version in release notes.
   - Keep old policies available for verification of historical proofs.

## Integration Examples (/api/v1/agent/decide)

### Example A: snarkjs proof + public signals
```json
{
  "subject": "0xabc123...",
  "context": "allowlist.general",
  "proof": {
    "snarkjsProof": {
      "pi_a": ["1", "2"],
      "pi_b": [["1", "2"], ["3", "4"]],
      "pi_c": ["1", "2"],
      "protocol": "groth16"
    }
  },
  "publicInputs": {
    "policyHash": "sha256:<policy-hash>",
    "snarkjsPublicSignals": ["1", "2"]
  }
}
```

### Example B: dev-only plaintext signals
Requires `ZK_ALLOW_PLAINTEXT_SIGNALS=true` and `NODE_ENV != \"production\"`.
```json
{
  "subject": "0xabc123...",
  "context": "comment",
  "proof": {
    "proof": "dev"
  },
  "publicInputs": {
    "policyHash": "sha256:<policy-hash>",
    "signals": {
      "trust": "HIGH",
      "socialTrust": "HIGH",
      "builder": "EXPERT",
      "creator": "EXPERT",
      "recencyDays": 10,
      "spamRisk": "NEUTRAL",
      "signalCoverage": 1
    }
  }
}
```

## Open Questions
1. Whether proofs are generated in a trusted agent service vs. user-local runtime.
2. Policy storage and versioning strategy details (file layout, change process).

## Deliverables
- ZK circuit + verification keys
- Decision engine verification use case
- New API endpoint with proof validation
- Agent UI page for ZK-based requests
- Documentation of policy and proof contracts
