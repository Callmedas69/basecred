# Circuits

This folder contains the Circom circuits used to generate Groth16 proofs for on-chain verification.

## Status

`DecisionCircuit.circom` is a **template** only. It does **not** encode the Basecred decision logic yet.

You must replace the template constraints with the real decision logic before generating production keys.

## Build (Example)

```bash
circom DecisionCircuit.circom --r1cs --wasm --sym -o build
snarkjs groth16 setup build/DecisionCircuit.r1cs pot14_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="Contributor 1" -v
snarkjs zkey export solidityverifier circuit_final.zkey Verifier.sol
```

> Note: `circom` must be installed and available on PATH.
> Note: Place the Phase 2 Powers of Tau file at `circuits/pot14_final.ptau`.

## Public Signals

The contract assumes:

- `publicSignals[0]` == `policyHash`
- `publicSignals[1]` == `contextHash` (optional)
- `publicSignals[2]` == `decision` (optional, if included in circuit)

## Tooling

This package includes scripts in `packages/contracts/package.json` for build/setup/export.
