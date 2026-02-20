# Runbook

> Operational procedures for the BaseCred platform.
> Last updated: 2026-02-20

---

## System Overview

| Service            | Port | Technology        | Package              |
|--------------------|------|-------------------|----------------------|
| Interface (Web)    | 3000 | Next.js 15        | `@basecred/interface`|
| Documentation      | 4000 | Docusaurus 3.9    | `docs`               |
| Decision Engine    | N/A  | TypeScript library | `basecred-decision-engine` |
| SDK                | N/A  | TypeScript library | `basecred-sdk`       |
| Agent SDK          | N/A  | TypeScript library | `@basecred/agent-sdk` |
| ERC-8004 Scripts   | N/A  | Node.js scripts    | `@basecred/openclaw-8004` |
| Smart Contracts    | N/A  | Solidity + Circom  | `@basecred/contracts`|

**Primary Network**: Base (L2)

### Deployed Contracts (Base Mainnet — 8453)

| Contract                  | Address                                      | Type         |
|---------------------------|----------------------------------------------|--------------|
| Verifier                  | `0x708FB78d97b32250e302F33A1A81936C8B618625` | Standalone   |
| DecisionRegistry (Proxy)  | `0x694A54Bf1b7659e8A7e63CD8a45de378458659D8` | UUPS Proxy   |

The DecisionRegistry uses a **UUPS proxy pattern** (ERC-1967). The proxy address is permanent — only the implementation behind it can be upgraded by the owner.

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
pnpm --filter agent-sdk test
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

### 5. Deploy Smart Contracts (UUPS Proxy)

Contracts use the UUPS proxy pattern and are deployed/upgraded via Foundry scripts.

**Initial deployment** (new proxy + implementation):

```bash
cd packages/contracts
forge build
forge script scripts/DeployProxy.s.sol --rpc-url $BASE_RPC_URL --broadcast --env-file .env.local
```

**Upgrade existing proxy** (new implementation only):

```bash
cd packages/contracts
forge build
forge script scripts/UpgradeRegistry.s.sol --rpc-url $BASE_RPC_URL --broadcast --env-file .env.local
```

Ensure:
- `DEPLOYER_PRIVATE_KEY` is set in `.env.local` (never inline in commands)
- Deployer address is the current proxy owner
- The new implementation passes all tests before upgrading

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
- Verify `.env.local` has correct RPC URLs
- Verify the interface is targeting Base network (chain ID 8453)
- Rebuild contract ABIs: `cd packages/contracts && forge build`
- Copy updated ABIs from `packages/contracts/out/`
- Ensure `packages/interface/src/lib/onChainContracts.ts` points to the correct proxy address

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

### 8. UUPS upgrade fails

**Cause**: Deployer is not the proxy owner, or implementation is incompatible.
**Fix**:
- Verify the deployer address matches the current proxy owner on BaseScan
- Ensure `renounceOwnership()` was never called (it reverts by design)
- Verify the new implementation is storage-compatible with the previous version
- Check Foundry broadcast logs in `packages/contracts/broadcast/`

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

### Smart Contract Rollback (UUPS)

The DecisionRegistry uses a **UUPS proxy pattern**, which allows implementation upgrades:

1. **To roll back**: Deploy the previous implementation contract and call `upgradeToAndCall` on the proxy.
2. Use `UpgradeRegistry.s.sol` with the previous implementation's bytecode.
3. Verify on BaseScan that the proxy now points to the correct implementation.
4. The proxy address (`0x694A54Bf1b7659e8A7e63CD8a45de378458659D8`) does **not** change during upgrades.

The Verifier contract is **immutable** — deploy a new one and call `setVerifier(newAddress)` on the registry if needed.

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
