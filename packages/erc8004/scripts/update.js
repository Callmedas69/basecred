#!/usr/bin/env node

/**
 * 8004-update: Update agent profile on-chain
 * 
 * Usage:
 *   node scripts/update.js <agentId> --read
 *   node scripts/update.js <agentId> --preview '{"name":"NewName",...}'
 *   node scripts/update.js <agentId> --submit '{"name":"NewName",...}'
 */

import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

const ABI = parseAbi([
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function setAgentURI(uint256 agentId, string newURI)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]);

function getPrivateKey() {
  if (process.env.MAIN_WALLET_PRIVATE_KEY) return process.env.MAIN_WALLET_PRIVATE_KEY;
  if (process.env.WALLET_PRIVATE_KEY) return process.env.WALLET_PRIVATE_KEY;
  throw new Error('No wallet private key found');
}

async function main() {
  const args = process.argv.slice(2);
  const agentId = args.find(a => !a.startsWith('--') && !a.startsWith('{')) || process.env.AGENT0_AGENT_ID;
  const isRead = args.includes('--read');
  const isPreview = args.includes('--preview');
  const isSubmit = args.includes('--submit');

  if (!agentId) {
    console.error(JSON.stringify({ error: 'Agent ID required' }));
    process.exit(1);
  }

  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  });

  // Read current profile
  const uri = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'tokenURI',
    args: [BigInt(agentId)],
  });

  let currentJSON = {};
  if (uri.startsWith('data:application/json;base64,')) {
    currentJSON = JSON.parse(Buffer.from(uri.slice(29), 'base64').toString('utf-8'));
  } else if (uri.startsWith('http')) {
    currentJSON = { _externalURI: uri };
  }

  if (isRead) {
    const owner = await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: ABI,
      functionName: 'ownerOf',
      args: [BigInt(agentId)],
    });
    console.log(JSON.stringify({ agentId: Number(agentId), owner, profile: currentJSON }, null, 2));
    return;
  }

  if (!isPreview && !isSubmit) {
    console.error(JSON.stringify({ error: 'Must specify --read, --preview, or --submit' }));
    process.exit(1);
  }

  const jsonArg = args.find(a => a.startsWith('{'));
  if (!jsonArg) {
    console.error(JSON.stringify({ error: 'Updated JSON payload required' }));
    process.exit(1);
  }

  const updatedJSON = JSON.parse(jsonArg);
  const encoded = Buffer.from(JSON.stringify(updatedJSON)).toString('base64');
  const dataURI = `data:application/json;base64,${encoded}`;

  const account = privateKeyToAccount(getPrivateKey());

  const gas = await publicClient.estimateContractGas({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'setAgentURI',
    args: [BigInt(agentId), dataURI],
    account,
  });

  const result = {
    action: isPreview ? 'preview' : 'submit',
    contract: IDENTITY_REGISTRY,
    chain: 'Base (8453)',
    function: 'setAgentURI(uint256, string)',
    agentId: Number(agentId),
    from: account.address,
    gasEstimate: gas.toString(),
    currentProfile: currentJSON,
    updatedProfile: updatedJSON,
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
    functionName: 'setAgentURI',
    args: [BigInt(agentId), dataURI],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log(JSON.stringify({
    success: true,
    txHash: hash,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
  }, null, 2));
}

main().catch(e => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});
