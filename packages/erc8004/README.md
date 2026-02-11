# OpenClaw ERC-8004 Agent Registration

An OpenClaw skill that teaches AI agents to register and manage on-chain identities on Base mainnet via [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) using the [agent0-sdk](https://github.com/agent0lab/agent0-ts).

> **HTTP registration only.** This skill covers on-chain registration via HTTP URIs (`agent.registerHTTP()`). IPFS registration is **not** covered.

## Install

```bash
npm install @basecred/openclaw-8004
```

Or copy `SKILL.md` directly into your agent's skill directory.

## Prerequisites

- **Node.js** >= 22
- **agent0-sdk** `^1.5.3`
- A private key with ETH on **Base mainnet** (for gas)
- A Base RPC URL (default: `https://mainnet.base.org`)

## What This Skill Does

| Operation | Description |
|-----------|-------------|
| **Register** | Create an on-chain agent identity (ERC-721 NFT) |
| **Update** | Modify name, description, endpoints, skills, metadata |
| **Give Feedback** | Submit on-chain reputation scores for other agents |
| **Search Feedback** | Query reputation summaries and feedback history |
| **Transfer** | Move agent ownership to a new wallet |

## Files

| File | Description |
|---|---|
| **SKILL.md** | Full agent instructions |
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

| Contract | Address |
|----------|---------|
| Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

## How It Works

1. **First run** — the agent asks the owner for credentials and saves them to `.env`
2. **Registration** — the agent gathers profile info, previews a draft, and registers on-chain after owner approval
3. **IDENTITY.md** — after registration, the agent offers to save a local profile card
4. **Subsequent runs** — the agent presents an action menu (update, feedback, search, transfer, view profile) and waits for the owner's choice
5. **Every transaction** — the agent always previews a draft and waits for explicit owner approval before signing

## Usage

See [SKILL.md](./SKILL.md) for complete agent instructions including:

- Decision tree with action menu for returning users
- Draft preview before every on-chain transaction
- Step-by-step registration flow with IDENTITY.md generation
- SDK code examples for every operation
- Error handling table
- Security guidelines
- Full example interaction

## License

MIT
