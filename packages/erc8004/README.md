# OpenClaw ERC-8004 Agent Registration

An OpenClaw skill that teaches AI agents to register and manage **fully on-chain** identities on Base mainnet via [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) using **viem + ABI** direct contract calls.

> **Scope: Fully on-chain agent identity + registration file schema.** All identity operations are on-chain transactions against the IdentityRegistry and ReputationRegistry contracts (ERC-721 on Base). This skill covers agent identity minting, updates, search, feedback, reputation, transfers, on-chain contract functions, and the EIP-8004 registration file schema. IPFS-based metadata URIs and subgraph queries are not covered — see [References in SKILL.md](./SKILL.md#references).

## Install

```bash
npm install @basecred/openclaw-8004
```

Or copy `SKILL.md` directly into your agent's skill directory.

## Prerequisites

- **Node.js** >= 22
- **viem** `^2.0.0` (direct contract calls via ABI)
- A private key with ETH on **Base mainnet** (for gas)
- A Base RPC URL (default: `https://mainnet.base.org`)

## What This Skill Does

| Operation | Contract | Gas |
|-----------|----------|-----|
| **Register** — mint an on-chain agent identity (ERC-721 NFT) | `IdentityRegistry.register()` | Yes |
| **Update** — modify name, description, services, skills, metadata | `IdentityRegistry.setAgentURI()` | Yes |
| **Search** — query reputation summaries and feedback history | `ReputationRegistry.getSummary()` | No (view) |
| **Feedback** — submit on-chain reputation scores for other agents | `ReputationRegistry.giveFeedback()` | Yes |
| **Transfer** — move agent ownership to a new wallet | `IdentityRegistry.transferFrom()` | Yes |

## Architecture: viem + ABI (No SDK)

This skill uses **direct contract calls** via viem and contract ABIs. No agent0-sdk dependency. You control the full transaction flow:

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`);
const publicClient = createPublicClient({ 
  chain: base, 
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org') 
});
const walletClient = createWalletClient({ 
  account, 
  chain: base, 
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org') 
});

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';
```

Full ABI definitions and transaction examples in [SKILL.md](./SKILL.md).

## Files

| File | Description |
|---|---|
| **SKILL.md** | Full agent instructions — all 5 flows with step-by-step guides |
| **README.md** | Quick-start guide (this file) |
| **IDENTITY.md** | Agent profile card (created after registration) |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `WALLET_PRIVATE_KEY` | Yes | Private key for signing transactions |
| `BASE_RPC_URL` | No | Base RPC endpoint (default: `https://mainnet.base.org`) |
| `AGENT0_AGENT_ID` | Auto | Set after registration (e.g. `8453:42`) |

Store these in a `.env` file in the project root. Never commit `.env` to version control.

## Contracts (Base Mainnet)

| Contract | Address | Source |
|----------|---------|--------|
| Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | [erc-8004-contracts](https://github.com/erc-8004/erc-8004-contracts) |
| Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | [erc-8004-contracts](https://github.com/erc-8004/erc-8004-contracts) |

## How It Works

1. **First run** — the agent asks the owner for credentials and saves them to `.env`
2. **Registration** — gathers profile info, previews draft, mints ERC-721 identity on-chain after owner approval
3. **IDENTITY.md** — after registration, offers to save a local profile card
4. **Subsequent runs** — presents action menu (update, search, feedback, transfer, view profile) and waits for the owner's choice
5. **Every transaction** — previews a draft and waits for explicit owner approval before signing

## Multi-Agent Support

**Detection:** Config-first approach. Agent IDs listed in `TOOLS.md` under "Owned Agents:", primary ID in `.env` as `AGENT0_AGENT_ID`. No RPC enumeration or subgraph queries.

**Why this matters:** If you manage multiple agent identities, track them in your config files rather than querying the chain each time.

## Safety Features

- **Preview-first:** Every transaction shows a draft and waits for explicit owner approval
- **No blind execution:** Agent never signs without confirmation
- **Event parsing:** Confirms minting/updates via on-chain events
- **Burn protection:** Burning requires 2 steps (set `active: false` → transfer to `0xdEaD`)

## SKILL.md Contents

See [SKILL.md](./SKILL.md) for complete agent instructions:

| Section | Description |
|---------|-------------|
| Quick Reference | viem setup and contract mappings at a glance |
| On-Chain Contract Functions | IdentityRegistry and ReputationRegistry ABI reference |
| Registration File Schema | EIP-8004 JSON format, field reference, service types |
| Register Agent | 8-step flow: pre-fill → gather → configure → preview → mint → save |
| Update Agent | 6-step flow: load → modify → preview → submit → confirm |
| Search Feedback | 3-step flow: get ID → query → deliver results (no gas) |
| Give Feedback | 4-step flow: gather → preview → submit → confirm |
| Transfer Ownership | 5-step flow: verify → preview → execute → verify → confirm |

## License

MIT
