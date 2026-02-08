# Contributing & Development Guide

> Auto-generated from `package.json` and `.env.example` sources of truth.
> Last updated: 2026-02-06

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
│   ├── contracts/                # Solidity contracts + Circom ZK circuits
│   ├── decision-engine/          # Reputation decision engine library
│   ├── docs/                     # Docusaurus documentation site
│   ├── interface/                # Next.js 15 frontend application
│   └── sdk/                      # Public NPM SDK package
├── docs/                         # Developer docs (CONTRIB, RUNBOOK)
├── CLAUDE.md                     # Engineering rules & architecture
└── CHANGELOG.md                  # Project changelog
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
| `sdk`             | `.env.local`     | `TALENT_API_KEY`                  |
| `decision-engine` | `.env.local`     | (see package-specific config)     |
| `interface`       | `.env.local`     | (see package-specific config)     |
| Root              | `.env.local`     | `DEPLOYER_PRIVATE_KEY`, `BASE_SEPOLIA_RPC_URL`, `ZK_VKEY_PATH`, `ZK_ALLOW_PLAINTEXT_SIGNALS` |

### Environment Variables Reference (from `.env.example`)

| Variable         | Package | Purpose                                     | Format             |
|------------------|---------|---------------------------------------------|--------------------|
| `TALENT_API_KEY` | sdk     | Talent Protocol API key for builder credibility | String (API key) |

> Ethos Network does not require an API key.

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
- **Watch mode**: Available in decision-engine and SDK packages

---

## Architecture Rules

See `CLAUDE.md` for the full architecture specification. Key constraint:

```
UI → API/Controller → Business Logic/Use Case → Repository → DB/Chain/External API
```

Dependencies flow **downward only**. See `CLAUDE.md` for layer responsibilities and absolute prohibitions.
