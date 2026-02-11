Perfect — here’s a **very concrete, battle-tested checklist** you can actually use when building **Base / zkEVM-style circuits** (PLONK / Halo2 / Scroll-like stacks). This is written for **Web3 deployments**, not academic ZK.

---

# ✅ zkProof Proving-Time Reduction Checklist

**(Base · zkEVM · PLONK · Halo2)**

---

## 0. First: Identify Your Bottleneck (DO THIS)

Before optimizing, measure **where time goes**:

- ⬜ Constraint count
- ⬜ FFT / MSM time
- ⬜ Hash inside circuit
- ⬜ Witness generation time
- ⬜ Serialization / IO

> 🔥 Rule: **90% of time is usually FFT + hash constraints**

---

## 1. Circuit Design (BIGGEST WINS)

### ⬜ Minimize Constraints

- Replace branching with arithmetic:

  ```text
  bad: if / else
  good: selector * A + (1-selector) * B
  ```

- Avoid boolean gadgets unless absolutely needed
- Compress logic into fewer gates

---

### ⬜ Reduce Hashes Inside Circuit

**DO NOT** hash inside the circuit unless strictly required.

| Bad                         | Good                     |
| --------------------------- | ------------------------ |
| keccak in-circuit           | keccak off-circuit       |
| merkle path in-circuit      | verify root off-chain    |
| signature verify in-circuit | pre-verified attestation |

🔥 For Base/zkEVM:

- Use **Poseidon** or **Rescue** only
- Never Keccak unless zkEVM forced

---

### ⬜ Use Lookup Tables Aggressively

Halo2 / PLONK lookup = **huge speedup**

Use lookups for:

- Range checks
- Byte decomposition
- Bitwise ops
- EVM opcode constraints

> Replace `N constraints` → `1 lookup`

---

## 2. zkEVM-Specific Optimizations

### ⬜ Reduce EVM Opcode Coverage

Don’t support full EVM unless you must.

| Strategy             | Result          |
| -------------------- | --------------- |
| Whitelist opcodes    | ↓ constraints   |
| Disable SELFDESTRUCT | ↓ complexity    |
| Fixed gas schedule   | simpler circuit |

🔥 If building app-specific zkEVM:

- Strip CALL, DELEGATECALL if unused
- Fix calldata size

---

### ⬜ Batch Execution Traces

Instead of:

```
1 proof per tx
```

Do:

```
1 proof per block / batch
```

- Batch witness generation
- Shared polynomial commitments

---

## 3. Witness Generation (Often Overlooked)

### ⬜ Move Logic OFF-Circuit

Anything not needed for **verification** should be off-circuit:

- Sorting
- Deduplication
- Aggregation
- Signature verification

Witness = “results”, not “computation”.

---

### ⬜ Cache Fixed Witnesses

If something doesn’t change:

- SRS
- Fixed polynomials
- Selector columns

**Never recompute per proof**

---

## 4. Prover Configuration (Immediate Gains)

### ⬜ Enable Multi-threading

Set threads explicitly:

```bash
RAYON_NUM_THREADS=8
```

> FFT + MSM scale almost linearly with cores

---

### ⬜ Use Larger Domain Only If Needed

Avoid oversized FFT domains.

Bad:

```
next power of two just in case
```

Good:

```
tight domain sizing
```

---

## 5. Recursive Proofs (Production Scale)

### ⬜ Use Recursion to Compress Proofs

For Base-style infra:

- L2 proofs → recursive aggregator
- Final proof → L1 verification

Benefits:

- Smaller proofs
- Faster verification
- Parallel proving

---

### ⬜ Use Halo2 / Plonky2 for Recursion

They are designed for:

- Fast recursion
- Lower overhead per proof

---

## 6. Hardware Acceleration (If Serious)

### ⬜ GPU Acceleration

Accelerate:

- FFT
- MSM
- Polynomial commitments

Tools:

- CUDA FFT backends
- GPU-enabled Plonk provers

> 5–10× speedup is common

---

### ⬜ Memory Matters

- Use **fast SSD**
- Avoid swapping
- Ensure RAM ≥ 2× polynomial size

---

## 7. Production Deployment Checklist (Base)

### ⬜ Proving Service Architecture

- Dedicated prover nodes
- Warm SRS in memory
- Preloaded circuits

---

### ⬜ Proof Pipeline

```
tx → batch → witness → prove → aggregate → submit
```

Pipeline everything:

- Prove while batching next block
- Don’t wait synchronously

---

## 8. Reality Check Benchmarks

| Optimization           | Typical Speedup |
| ---------------------- | --------------- |
| Circuit simplification | 2–5×            |
| Lookups                | 3–10×           |
| Hash removal           | 5–20×           |
| Multi-thread FFT       | 4–8×            |
| GPU                    | 5–15×           |

🔥 **Combined**: 20–50× faster proving

---

## 9. Final Rule of Thumb (Memorize This)

> **If it can be done off-chain, do it off-chain.
> If it must be on-chain, batch it.
> If it must be in-circuit, lookup it.**

---
