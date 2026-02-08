# Circuit Spec (DecisionCircuit)

This spec defines the inputs, encodings, and decision rules enforced by the Groth16 circuit.

## Public Signals (order matters)

1. `policyHash` (field) - must match the policy hash used on-chain.
2. `contextId` (field) - numeric context identifier used for rule selection.
3. `decision` (field) - numeric decision output enforced by the circuit.

## Context IDs

- `0` -> `allowlist.general`
- `1` -> `comment`
- `2` -> `publish`
- `3` -> `apply`
- `4` -> `governance.vote`

## Decision Encoding

- `0` -> `DENY`
- `1` -> `ALLOW_WITH_LIMITS`
- `2` -> `ALLOW`

## Private Inputs

- `trust` (Tier, 0-4)
- `socialTrust` (Tier, 0-4)
- `builder` (Capability, 0-3)
- `creator` (Capability, 0-3)
- `recencyDays` (uint)
- `spamRisk` (Tier, 0-4)
- `signalCoverageBps` (uint, 0-10000)

## Tier Encoding

- `VERY_LOW=0`, `LOW=1`, `NEUTRAL=2`, `HIGH=3`, `VERY_HIGH=4`

## Capability Encoding

- `EXPLORER=0`, `BUILDER=1`, `EXPERT=2`, `ELITE=3`

## Signal Coverage Encoding

- Use basis points (bps), `0..10000`.
- `signalCoverage == 0` -> no signals
- `signalCoverage < 5000` -> partial coverage

## Rule Order (matches decision engine)

1. Fallback rules
2. Hard-deny rules
3. Allow rules
4. Allow-with-limits rules
5. Default deny

## Notes

- The circuit enforces the decision output; the contract must bind `decision` to the public signals.
- `contextId` is a numeric selector. The on-chain `context` value should be `bytes32(uint256(contextId))`.
- `policyHash` must be a field element (< BN254 scalar field). If hashing, reduce mod `r`.
