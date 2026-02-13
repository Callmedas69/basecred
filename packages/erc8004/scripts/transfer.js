#!/usr/bin/env node

/**
 * 8004-transfer: Transfer agent ownership
 * 
 * Usage:
 *   node scripts/transfer.js --preview <agentId> <newOwner>
 *   node scripts/transfer.js --submit <agentId> <newOwner>
 */

import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

const ABI = parseAbi([
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getAgentWallet(uint256 agentId) view returns (address)',
]);

function getPrivateKey() {
  if (process.env.MAIN_WALLET_PRIVATE_KEY) return process.env.MAIN_WALLET_PRIVATE_KEY;
  if (process.env.WALLET_PRIVATE_KEY) return process.env.WALLET_PRIVATE_KEY;
  throw new Error('No wallet private key found');
}

async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview');
  const isSubmit = args.includes('--submit');

  if (!isPreview && !isSubmit) {
    console.error(JSON.stringify({ error: 'Must specify --preview or --submit' }));
    process.exit(1);
  }

  const positional = args.filter(a => !a.startsWith('--'));
  const [agentIdStr, newOwner] = positional;

  if (!agentIdStr || !newOwner) {
    console.error(JSON.stringify({ error: 'Usage: transfer.js --preview|--submit <agentId> <newOwner>' }));
    process.exit(1);
  }

  const account = privateKeyToAccount(getPrivateKey());
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  });

  // Verify current owner
  const currentOwner = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'ownerOf',
    args: [BigInt(agentIdStr)],
  });

  if (currentOwner.toLowerCase() !== account.address.toLowerCase()) {
    console.error(JSON.stringify({
      error: 'You do not own this agent',
      currentOwner,
      yourAddress: account.address,
    }));
    process.exit(1);
  }

  // Get current wallet
  const agentWallet = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'getAgentWallet',
    args: [BigInt(agentIdStr)],
  });

  const gas = await publicClient.estimateContractGas({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'transferFrom',
    args: [account.address, newOwner, BigInt(agentIdStr)],
    account,
  });

  const result = {
    action: isPreview ? 'preview' : 'submit',
    contract: IDENTITY_REGISTRY,
    chain: 'Base (8453)',
    function: 'transferFrom(address, address, uint256)',
    params: {
      from: account.address,
      to: newOwner,
      agentId: Number(agentIdStr),
    },
    currentOwner,
    newOwner,
    agentWalletWillBeCleared: agentWallet,
    warning: '⚠️ IRREVERSIBLE: You will lose all control of this agent. agentWallet will be cleared.',
    from: account.address,
    gasEstimate: gas.toString(),
  };

  if (isPreview) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  });

  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'transferFrom',
    args: [account.address, newOwner, BigInt(agentIdStr)],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Verify new owner
  const verifiedOwner = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'ownerOf',
    args: [BigInt(agentIdStr)],
  });

  console.log(JSON.stringify({
    success: true,
    txHash: hash,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
    verifiedNewOwner: verifiedOwner,
  }, null, 2));
}

main().catch(e => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});
