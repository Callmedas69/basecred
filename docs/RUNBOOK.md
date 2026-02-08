# Runbook

> Operational procedures for the BaseCred platform.
> Last updated: 2026-02-06

---

## System Overview

| Service            | Port | Technology        | Package              |
|--------------------|------|-------------------|----------------------|
| Interface (Web)    | 3000 | Next.js 15        | `@basecred/interface`|
| Documentation      | 4000 | Docusaurus 3.9    | `docs`               |
| Decision Engine    | N/A  | TypeScript library | `basecred-decision-engine` |
| SDK                | N/A  | TypeScript library | `basecred-sdk`       |
| Smart Contracts    | N/A  | Solidity + Circom  | `@basecred/contracts`|

**Primary Network**: Base (L2)

---

## Deployment Procedures

### 1. Pre-deployment Checklist

```bash
# 1. Ensure clean working tree
git status

# 2. Build all packages
pnpm build

# 3. Type-check all packages
pnpm typecheck

# 4. Run tests
pnpm --filter decision-engine test
pnpm --filter interface test
pnpm --filter sdk test
```

### 2. Deploy Interface (Next.js)

```bash
pnpm --filter interface build
pnpm --filter interface start
```

Ensure `.env.local` is configured in `packages/interface/` with all required environment variables for the target environment.

### 3. Deploy Documentation (Docusaurus)

```bash
pnpm --filter docs build
pnpm --filter docs serve    # Verify locally before deploy
pnpm --filter docs deploy   # Deploy to configured host
```

### 4. Publish SDK to NPM

```bash
pnpm --filter sdk build
pnpm --filter sdk prepublish:check
cd packages/sdk && npm publish
```

The SDK is published as a public package (`publishConfig.access: "public"`).

### 5. Deploy Smart Contracts

Contracts are deployed via Foundry scripts. Ensure:
- `DEPLOYER_PRIVATE_KEY` is set in root `.env.local`
- `BASE_SEPOLIA_RPC_URL` is configured
- Foundry toolchain is installed (`foundryup.ps1`)

```bash
cd packages/contracts
forge build
forge script scripts/<DeployScript>.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
```

### 6. ZK Circuit Deployment

```bash
pnpm --filter contracts circuit:build
pnpm --filter contracts circuit:setup
pnpm --filter contracts circuit:contribute
pnpm --filter contracts circuit:verifier
```

Then deploy the generated `Verifier.sol` contract.

---

## Monitoring & Alerts

### Health Checks

| Check                    | Method                          | Expected            |
|--------------------------|---------------------------------|----------------------|
| Interface running        | `curl http://localhost:3000`    | 200 OK               |
| Docs site running        | `curl http://localhost:4000`    | 200 OK               |
| Contract deployed        | Verify on BaseScan              | Contract verified    |
| SDK published            | `npm view basecred-sdk`         | Latest version shown |

### Log Locations

- **Interface**: Next.js stdout/stderr (container or process logs)
- **Docs**: Docusaurus stdout/stderr
- **Contracts**: Foundry broadcast logs in `packages/contracts/broadcast/`

---

## Common Issues & Fixes

### 1. `pnpm install` fails

**Cause**: Wrong pnpm version.
**Fix**: Ensure pnpm 10.28.2 is installed:
```bash
corepack enable
corepack prepare pnpm@10.28.2 --activate
```

### 2. Build fails with TypeScript errors

**Cause**: Type mismatches or missing dependencies.
**Fix**:
```bash
pnpm typecheck          # Identify errors
pnpm --filter <pkg> build   # Rebuild specific package
```

### 3. Decision engine tests fail

**Cause**: Missing `.env.local` with API keys.
**Fix**: Ensure `packages/decision-engine/.env.local` has required keys (e.g., `TALENT_API_KEY`).

### 4. Interface cannot connect to contracts

**Cause**: Wrong chain ID, missing contract addresses, or stale ABI.
**Fix**:
- Verify `.env.local` has correct contract addresses
- Verify the interface is targeting Base network
- Rebuild contract ABIs: `cd packages/contracts && forge build`
- Copy updated ABIs from `packages/contracts/out/`

### 5. ZK proof generation fails

**Cause**: Missing circuit build artifacts or wrong `ZK_VKEY_PATH`.
**Fix**:
```bash
pnpm --filter contracts circuit:build
# Ensure ZK_VKEY_PATH in .env.local points to correct file
```

### 6. Docusaurus cache issues

**Cause**: Stale cache after configuration changes.
**Fix**:
```bash
pnpm --filter docs clear
pnpm --filter docs start
```

### 7. SDK publish fails

**Cause**: Pre-publish check failed or not logged in to NPM.
**Fix**:
```bash
npm login
pnpm --filter sdk prepublish:check   # Review errors
pnpm --filter sdk build              # Rebuild
```

---

## Rollback Procedures

### Interface Rollback

1. Identify last known good commit: `git log --oneline`
2. Checkout or revert to that commit
3. Rebuild and redeploy:
   ```bash
   pnpm --filter interface build
   pnpm --filter interface start
   ```

### SDK Rollback

1. Publish previous version with `npm deprecate` on broken version:
   ```bash
   npm deprecate basecred-sdk@<broken-version> "Known issue, use <good-version>"
   ```
2. Or publish a patch version with the fix.

### Smart Contract Rollback

- Contracts are **immutable once deployed**.
- Deploy a new version of the contract.
- Update the interface to point to the new contract address.
- If using upgradeable proxies (not default), use the upgrade mechanism.

### Documentation Rollback

```bash
git revert <commit>
pnpm --filter docs build
pnpm --filter docs deploy
```

---

## Emergency Contacts & Escalation

- **Repository**: Check `package.json` repository field for source control
- **SDK Issues**: https://github.com/GeoartStudio/basecred-sdk
- **Contract Audit**: Review deployment logs in `packages/contracts/broadcast/`
