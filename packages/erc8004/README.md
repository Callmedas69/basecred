# @basecred/openclaw-8004

OpenClaw skill for registering and managing AI agent identities on-chain via [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004).

## What This Is

An AI-agent skill (SKILL.md) that enables any LLM agent to register, update, and manage on-chain identities using the ERC-8004 standard on Base. Covers all three registries:

- **IdentityRegistry** — Agent registration, metadata, ownership (ERC-721 NFT)
- **ReputationRegistry** — Feedback, scoring, and responses
- **ValidationRegistry** — Third-party validation requests and responses (not yet deployed)

## Approach

**Fully on-chain. No SDK. No external storage.**

- All metadata stored as base64-encoded data URIs directly on-chain
- Instructions are at the ABI level — use any web3 library (ethers.js, viem, wagmi, web3.js)
- No dependency on `agent0-sdk` or any other wrapper
- Zero IPFS, zero HTTP URLs for metadata

## Key Behaviors

- **`agentWallet` is managed specially** — auto-set to the owner's address on registration, updated only via `setAgentWallet()` with EIP-712/ERC-1271 proof, and cleared on ownership transfer
- **Self-feedback is prevented** — the agent owner and approved operators cannot give feedback to their own agent
- **Anyone can respond to feedback** — `appendResponse()` is not restricted to the agent owner
- **`getSummary()` requires non-empty `clientAddresses`** — use `getClients(agentId)` first to discover feedback givers (anti-Sybil/spam design)

## Quick Start

1. **Read the skill:** See [SKILL.md](./SKILL.md) for complete instructions
2. **Get the ABIs:** From [erc-8004-contracts](https://github.com/erc-8004/erc-8004-contracts/tree/master/abis)
3. **Connect to Base:** Chain ID 8453, any RPC endpoint

### Contract Addresses (Base Mainnet)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| ValidationRegistry | Not yet deployed |

### Register an Agent (Pseudocode)

```
// 1. Build registration JSON
json = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "My Agent",
  description: "What it does",
  services: [...],
  active: true
}

// 2. Encode as data URI
uri = "data:application/json;base64," + base64(JSON.stringify(json))

// 3. Call register
agentId = IdentityRegistry.register(uri)

// 4. Update with agentId in registrations array
json.registrations = [{ agentId, agentRegistry: "eip155:8453:0x8004..." }]
uri = "data:application/json;base64," + base64(JSON.stringify(json))
IdentityRegistry.setAgentURI(agentId, uri)
```

## SKILL.md Contents

| Section | Topic |
|---------|-------|
| 1-2 | Overview and quick reference |
| 3 | Contract interfaces (all three registries) |
| 4 | On-chain data model (base64 data URI) |
| 5-6 | Decision tree and first-time setup |
| 7 | Agent registration |
| 8 | Profile updates |
| 9-12 | Reputation (search, give, revoke, respond) |
| 13-15 | Validation (request, respond, check) |
| 16 | Ownership transfer |
| 17-19 | Transaction safety, error handling, security |
| 20-21 | IDENTITY.md schema and references |

## References

- [EIP-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Contract Source](https://github.com/erc-8004/erc-8004-contracts)
- [Deployed Addresses](https://github.com/erc-8004/erc-8004-contracts/blob/master/README.md)
