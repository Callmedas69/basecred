# ERC-8004 Management Scripts

Interactive CLI tools for managing your ERC-8004 agent identity on Base.

## Quick Start

### Interactive Menu

```bash
cd /home/phan_harry/.openclaw/workspace/basecred/packages/erc8004
source ~/.openclaw/.env
npm run menu
```

Features:
- 📊 View agent info (owner, payment wallet, reputation)
- 💰 Update payment wallet with EIP-712 proof
- 🌐 Quick links to 8004agents.ai and BaseScan

### Update Payment Wallet

```bash
# Set the new wallet's private key (to sign proof of control)
export NEW_WALLET_PRIVATE_KEY=0x...

# Run the script
node scripts/set-agent-wallet.js 0xNewWalletAddress [agentId]
```

**How it works:**
1. Generates EIP-712 signature from the new wallet (proves you control it)
2. Sends transaction from owner wallet calling `setAgentWallet()`
3. Contract verifies the signature and updates the `agentWallet` metadata

**Requirements:**
- `MAIN_WALLET_PRIVATE_KEY` — Owner's wallet (encrypted in GPG secrets)
- `NEW_WALLET_PRIVATE_KEY` — New payment wallet's key (must match address)
- `AGENT0_AGENT_ID` — Your agent ID (defaults to 14482)

## GPG Integration

To use the encrypted main wallet:

```bash
# Decrypt and extract the main wallet key
source ~/.openclaw/.env
export MAIN_WALLET_PRIVATE_KEY=$(gpg --batch --decrypt --passphrase "$OPENCLAW_GPG_PASSPHRASE" \
  ~/.openclaw/.env.secrets.gpg 2>/dev/null | jq -r '.MAIN_WALLET_PRIVATE_KEY')

# Now run the menu or scripts
npm run menu
```

## EIP-712 Signature Details

The `setAgentWallet` function requires an EIP-712 typed signature to prevent unauthorized wallet updates.

**Domain:**
```javascript
{
  name: 'AgentIdentityRegistry',
  version: '1',
  chainId: 8453,
  verifyingContract: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'
}
```

**Types:**
```javascript
{
  SetAgentWallet: [
    { name: 'agentId', type: 'uint256' },
    { name: 'newWallet', type: 'address' },
    { name: 'deadline', type: 'uint256' }
  ]
}
```

The signature must come from the **new wallet's private key**, proving you control it.

## Security Notes

- The payment wallet is used for x402 payments and revenue routing
- Only the NFT owner can update it (via `setAgentWallet`)
- The signature prevents front-running and unauthorized updates
- Deadline prevents replay attacks (1 hour default)
- Never commit private keys to version control
- Use GPG encryption for high-value keys

## Contract Reference

- **IdentityRegistry:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- **ReputationRegistry:** `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- **Chain:** Base (8453)
- **Standard:** ERC-8004 (ERC-721 based)

## Troubleshooting

**"NEW_WALLET_PRIVATE_KEY does not match the provided address"**
- The private key must correspond to the address you're setting
- Verify with: `cast wallet address --private-key $NEW_WALLET_PRIVATE_KEY`

**"You don't own agent X"**
- Confirm your wallet owns the agent NFT
- Check on BaseScan or 8004agents.ai

**"MAIN_WALLET_PRIVATE_KEY not set"**
- Decrypt from GPG secrets (see GPG Integration above)
- Or set directly if not using GPG

## Development

Built with:
- viem ^2.45.3 (Ethereum library)
- Node.js ESM modules
- EIP-712 typed signatures
- dotenv for environment variables
