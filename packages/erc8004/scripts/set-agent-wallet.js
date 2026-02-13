#!/usr/bin/env node

/**
 * Set Agent Wallet (Payment Address)
 * 
 * Updates the agentWallet metadata for an ERC-8004 agent.
 * Requires EIP-712 signature from the new wallet to prove control.
 * 
 * Usage:
 *   node scripts/set-agent-wallet.js <new_wallet_address> [agent_id]
 * 
 * Environment:
 *   AGENT0_AGENT_ID - Agent ID (optional if passed as argument)
 *   MAIN_WALLET_PRIVATE_KEY - Owner's wallet (sends transaction)
 *   NEW_WALLET_PRIVATE_KEY - New wallet's key (signs proof of control)
 * 
 * Example:
 *   export NEW_WALLET_PRIVATE_KEY=0x...
 *   node scripts/set-agent-wallet.js 0x1234...5678 14482
 */

import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

// Contract addresses
const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

// ABI (minimal - only setAgentWallet function)
const ABI = parseAbi([
  'function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes signature)',
  'function getAgentWallet(uint256 agentId) view returns (address)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]);

// EIP-712 Domain
const DOMAIN = {
  name: 'AgentIdentityRegistry',
  version: '1',
  chainId: 8453, // Base
  verifyingContract: IDENTITY_REGISTRY,
};

// EIP-712 Types
const TYPES = {
  SetAgentWallet: [
    { name: 'agentId', type: 'uint256' },
    { name: 'newWallet', type: 'address' },
    { name: 'deadline', type: 'uint256' },
  ],
};

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('❌ Usage: node set-agent-wallet.js <new_wallet_address> [agent_id]');
    console.error('   NEW_WALLET_PRIVATE_KEY environment variable must be set');
    process.exit(1);
  }

  const newWalletAddress = args[0];
  const agentId = args[1] || process.env.AGENT0_AGENT_ID;

  if (!agentId) {
    console.error('❌ Agent ID required (arg or AGENT0_AGENT_ID env var)');
    process.exit(1);
  }

  if (!process.env.MAIN_WALLET_PRIVATE_KEY) {
    console.error('❌ MAIN_WALLET_PRIVATE_KEY not set');
    process.exit(1);
  }

  if (!process.env.NEW_WALLET_PRIVATE_KEY) {
    console.error('❌ NEW_WALLET_PRIVATE_KEY not set (needed to sign proof of control)');
    process.exit(1);
  }

  // Create accounts
  const ownerAccount = privateKeyToAccount(process.env.MAIN_WALLET_PRIVATE_KEY);
  const newWalletAccount = privateKeyToAccount(process.env.NEW_WALLET_PRIVATE_KEY);

  // Verify new wallet address matches the private key
  if (newWalletAccount.address.toLowerCase() !== newWalletAddress.toLowerCase()) {
    console.error('❌ NEW_WALLET_PRIVATE_KEY does not match the provided address');
    console.error(`   Provided: ${newWalletAddress}`);
    console.error(`   Derived: ${newWalletAccount.address}`);
    process.exit(1);
  }

  // Create clients
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const walletClient = createWalletClient({
    account: ownerAccount,
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  console.log('🔐 Agent Wallet Update\n');
  console.log(`Agent ID: ${agentId}`);
  console.log(`Owner: ${ownerAccount.address}`);
  console.log(`New Wallet: ${newWalletAddress}\n`);

  // Verify ownership
  const currentOwner = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'ownerOf',
    args: [BigInt(agentId)],
  });

  if (currentOwner.toLowerCase() !== ownerAccount.address.toLowerCase()) {
    console.error(`❌ You don't own agent ${agentId}`);
    console.error(`   Current owner: ${currentOwner}`);
    console.error(`   Your address: ${ownerAccount.address}`);
    process.exit(1);
  }

  // Get current wallet
  const currentWallet = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'getAgentWallet',
    args: [BigInt(agentId)],
  });

  console.log(`📊 Current Status:`);
  console.log(`   Current Wallet: ${currentWallet}`);
  console.log(`   New Wallet: ${newWalletAddress}\n`);

  // Set deadline (1 hour from now)
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
  console.log(`⏰ Deadline: ${new Date(Number(deadline) * 1000).toISOString()}\n`);

  // Create EIP-712 signature from new wallet
  console.log('📝 Generating EIP-712 signature from new wallet...');
  
  const message = {
    agentId: BigInt(agentId),
    newWallet: newWalletAddress,
    deadline: deadline,
  };

  const signature = await newWalletAccount.signTypedData({
    domain: DOMAIN,
    types: TYPES,
    primaryType: 'SetAgentWallet',
    message: message,
  });

  console.log(`   Signature: ${signature}\n`);

  // Estimate gas
  console.log('⚡ Estimating gas...');
  const gasEstimate = await publicClient.estimateContractGas({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'setAgentWallet',
    args: [BigInt(agentId), newWalletAddress, deadline, signature],
    account: ownerAccount,
  });

  console.log(`   Gas estimate: ${gasEstimate}\n`);

  // Submit transaction
  console.log('📤 Submitting transaction...');
  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'setAgentWallet',
    args: [BigInt(agentId), newWalletAddress, deadline, signature],
  });

  console.log(`   Transaction: ${hash}`);
  console.log('   Waiting for confirmation...\n');

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log('✅ Agent Wallet Updated!\n');
  console.log(`   Block: ${receipt.blockNumber}`);
  console.log(`   Gas used: ${receipt.gasUsed}`);
  console.log(`   Status: ${receipt.status === 'success' ? 'Success' : 'Failed'}\n`);

  // Verify update
  const updatedWallet = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'getAgentWallet',
    args: [BigInt(agentId)],
  });

  console.log(`💰 New Wallet Address: ${updatedWallet}`);
  console.log(`\nView on BaseScan: https://basescan.org/tx/${hash}`);
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
