# Contributing & Development Guide

> Auto-generated from `package.json` and `.env.example` sources of truth.
> Last updated: 2026-02-20

---

## Prerequisites

- **Node.js** >= 20.0
- **pnpm** 10.28.2 (enforced via `packageManager` field)
- **Foundry** (for smart contract development)
- **Circom** + **snarkjs** (for ZK circuit development)

---

## Repository Structure

```
basecred/                         # Monorepo root (pnpm workspaces)
├── packages/
│   ├── agent-sdk/               # Agent SDK — type-safe client for BaseCred API
│   ├── contracts/               # Solidity contracts (UUPS) + Circom ZK circuits
│   ├── decision-engine/         # Reputation decision engine library
│   ├── docs/                    # Docusaurus documentation site
│   ├── erc8004/                 # OpenClaw ERC-8004 agent identity scripts
│   ├── interface/               # Next.js 15 frontend application
│   └── sdk/                     # Public NPM SDK package (basecred-sdk)
├── docs/                        # Developer docs (CONTRIB, RUNBOOK)
├── CLAUDE.md                    # Engineering rules & architecture
└── CHANGELOG.md                 # Project changelog
```

---

## Environment Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy and fill in `.env.local` files for packages that need them:

| Package           | Env File         | Required Variables                |
|-------------------|------------------|-----------------------------------|
| `interface`       | `.env.local`     | See interface env vars below      |
| `sdk`             | `.env.local`     | `TALENT_API_KEY`                  |
| `decision-engine` | `.env.local`     | `TALENT_API_KEY`                  |
| Root              | `.env.local`     | `DEPLOYER_PRIVATE_KEY`, `BASE_SEPOLIA_RPC_URL`, `ZK_VKEY_PATH`, `ZK_ALLOW_PLAINTEXT_SIGNALS` |

### Environment Variables Reference

#### Interface (`packages/interface/.env.example`)

| Variable                              | Purpose                                          | Public? |
|---------------------------------------|--------------------------------------------------|---------|
| `ZK_ALLOW_PLAINTEXT_SIGNALS`          | Allow plaintext ZK signals (dev only)            | No      |
| `TALENT_API_KEY`                      | Talent Protocol API key                          | No      |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID                       | Yes     |
| `NEYNAR_API_KEY`                      | Neynar (Farcaster) API key                       | No      |
| `ALCHEMY_API_KEY`                     | Alchemy API key for reliable Base RPC            | No      |
| `ALCHEMY_RPC_URL`                     | Alchemy Base mainnet RPC endpoint                | No      |
| `ETHOS_CLIENT_ID`                     | Ethos Network client identifier                  | No      |
| `NEXT_PUBLIC_MAINNET_RPC_URL`         | Ethereum mainnet RPC (ENS resolution)            | Yes     |
| `NEXT_PUBLIC_BASE_RPC_URL`            | Base mainnet RPC                                 | Yes     |
| `NEXT_PUBLIC_URL`                     | Public URL of the deployed app                   | Yes     |

#### SDK (`packages/sdk/.env.example`)

| Variable         | Purpose                                          | Public? |
|------------------|--------------------------------------------------|---------|
| `TALENT_API_KEY` | Talent Protocol API key for builder credibility  | No      |

> Ethos Network does not require an API key.

#### Decision Engine (`packages/decision-engine/.env.example`)

| Variable         | Purpose                                          | Public? |
|------------------|--------------------------------------------------|---------|
| `TALENT_API_KEY` | Talent Protocol API key                          | No      |

---

## Available Scripts

### Root Scripts

| Script         | Command                | Description                                      |
|----------------|------------------------|--------------------------------------------------|
| `build`        | `pnpm build`           | Build all packages recursively                   |
| `typecheck`    | `pnpm typecheck`       | Type-check all packages recursively              |
| `dev`          | `pnpm dev`             | Run Interface (Next.js) on port 3000             |
| `start`        | `pnpm start`           | Run Docs (Docusaurus) on port 4000               |
| `dev:all`      | `pnpm dev:all`         | Run Interface + Docs concurrently                |

### Package: `@basecred/contracts`

| Script             | Command                                         | Description                            |
|--------------------|------------------------------------------------|----------------------------------------|
| `circuit:build`    | `pnpm --filter contracts circuit:build`         | Compile Circom circuit to R1CS + WASM  |
| `circuit:setup`    | `pnpm --filter contracts circuit:setup`         | Run Groth16 trusted setup              |
| `circuit:contribute` | `pnpm --filter contracts circuit:contribute`  | Contribute to ZK ceremony              |
| `circuit:verifier` | `pnpm --filter contracts circuit:verifier`      | Export Solidity verifier contract      |

### Package: `basecred-decision-engine`

| Script           | Command                                           | Description                          |
|------------------|---------------------------------------------------|--------------------------------------|
| `build`          | `pnpm --filter decision-engine build`             | Build with tsup (CJS + ESM + DTS)   |
| `dev`            | `pnpm --filter decision-engine dev`               | Build in watch mode                  |
| `test`           | `pnpm --filter decision-engine test`              | Run tests with Vitest                |
| `test:watch`     | `pnpm --filter decision-engine test:watch`        | Run tests in watch mode              |
| `test:coverage`  | `pnpm --filter decision-engine test:coverage`     | Run tests with coverage report       |
| `lint`           | `pnpm --filter decision-engine lint`              | Lint TypeScript source               |
| `typecheck`      | `pnpm --filter decision-engine typecheck`         | Type-check without emitting          |
| `clean`          | `pnpm --filter decision-engine clean`             | Remove dist/ directory               |

### Package: `docs` (Docusaurus)

| Script               | Command                                    | Description                          |
|----------------------|--------------------------------------------|--------------------------------------|
| `start`             | `pnpm --filter docs start`                 | Start dev server on port 4000        |
| `build`             | `pnpm --filter docs build`                 | Production build                     |
| `serve`             | `pnpm --filter docs serve`                 | Serve production build               |
| `clear`             | `pnpm --filter docs clear`                 | Clear Docusaurus cache               |
| `typecheck`         | `pnpm --filter docs typecheck`             | Type-check with tsc                  |
| `write-translations`| `pnpm --filter docs write-translations`    | Extract translation strings          |
| `write-heading-ids` | `pnpm --filter docs write-heading-ids`     | Generate heading IDs                 |

### Package: `@basecred/interface`

| Script    | Command                                    | Description                          |
|-----------|--------------------------------------------|--------------------------------------|
| `dev`     | `pnpm --filter interface dev`              | Next.js dev server (port 3000)       |
| `build`   | `pnpm --filter interface build`            | Production build                     |
| `start`   | `pnpm --filter interface start`            | Start production server              |
| `lint`    | `pnpm --filter interface lint`             | Run ESLint                           |
| `test`    | `pnpm --filter interface test`             | Run tests with Vitest                |

### Package: `basecred-sdk`

| Script             | Command                                    | Description                          |
|--------------------|--------------------------------------------|--------------------------------------|
| `build`            | `pnpm --filter sdk build`                  | Compile TypeScript                   |
| `typecheck`        | `pnpm --filter sdk typecheck`              | Type-check without emitting          |
| `test`             | `pnpm --filter sdk test`                   | Run tests with Vitest                |
| `test:watch`       | `pnpm --filter sdk test:watch`             | Run tests in watch mode              |
| `prepublish:check` | `pnpm --filter sdk prepublish:check`       | Pre-publish validation               |

### Package: `@basecred/agent-sdk`

| Script      | Command                                      | Description                          |
|-------------|----------------------------------------------|--------------------------------------|
| `build`     | `pnpm --filter agent-sdk build`              | Build with tsup (CJS + ESM + DTS)   |
| `dev`       | `pnpm --filter agent-sdk dev`                | Build in watch mode                  |
| `test`      | `pnpm --filter agent-sdk test`               | Run tests with Vitest                |
| `test:watch`| `pnpm --filter agent-sdk test:watch`         | Run tests in watch mode              |
| `typecheck` | `pnpm --filter agent-sdk typecheck`          | Type-check without emitting          |
| `clean`     | `pnpm --filter agent-sdk clean`              | Remove dist/ directory               |

### Package: `@basecred/openclaw-8004` (erc8004)

| Script       | Command                                       | Description                          |
|--------------|-----------------------------------------------|--------------------------------------|
| `menu`       | `pnpm --filter erc8004 menu`                  | Interactive agent management menu    |
| `set-wallet` | `pnpm --filter erc8004 set-wallet`            | Set agent wallet                     |
| `summary`    | `pnpm --filter erc8004 summary`               | View agent summary                   |
| `register`   | `pnpm --filter erc8004 register`              | Register an agent on-chain           |
| `update`     | `pnpm --filter erc8004 update`                | Update agent metadata                |
| `feedback`   | `pnpm --filter erc8004 feedback`              | Submit feedback                      |
| `revoke`     | `pnpm --filter erc8004 revoke`                | Revoke an agent                      |
| `respond`    | `pnpm --filter erc8004 respond`               | Respond to feedback                  |
| `transfer`   | `pnpm --filter erc8004 transfer`              | Transfer agent ownership             |

---

## Development Workflow

### Daily development

```bash
# Start both Interface and Docs
pnpm dev:all

# Or run individually:
pnpm dev          # Interface only (port 3000)
pnpm start        # Docs only (port 4000)
```

### Before committing

```bash
pnpm build        # Ensure all packages build
pnpm typecheck    # Ensure no type errors
```

### Running tests

```bash
# All tests
pnpm --filter decision-engine test
pnpm --filter interface test
pnpm --filter sdk test
pnpm --filter agent-sdk test

# With coverage
pnpm --filter decision-engine test:coverage
```

### Building the SDK for publish

```bash
pnpm --filter sdk build
pnpm --filter sdk prepublish:check
```

---

## Testing Procedures

- **Framework**: Vitest (across all packages)
- **Run all tests**: Execute test scripts per package (no root-level `test` script)
- **Coverage**: Available via `test:coverage` in the decision-engine package
- **Watch mode**: Available in decision-engine, SDK, and agent-sdk packages

---

## Architecture Rules

See `CLAUDE.md` for the full architecture specification. Key constraint:

```
UI → API/Controller → Business Logic/Use Case → Repository → DB/Chain/External API
```

Dependencies flow **downward only**. See `CLAUDE.md` for layer responsibilities and absolute prohibitions.
