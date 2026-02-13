#!/usr/bin/env node

/**
 * ERC-8004 Agent Management Menu
 * 
 * Interactive CLI for managing your ERC-8004 agent identity on Base.
 * 
 * Usage:
 *   node scripts/menu.js
 * 
 * Environment:
 *   AGENT0_AGENT_ID - Your agent ID (default: 14482)
 *   MAIN_WALLET_PRIVATE_KEY - Owner wallet private key
 */

import readline from 'readline';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Contract addresses
const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';

// ABI (minimal)
const IDENTITY_ABI = parseAbi([
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function getAgentWallet(uint256 agentId) view returns (address)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getMetadata(uint256 agentId, string key) view returns (bytes)',
]);

const REPUTATION_ABI = parseAbi([
  'function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)',
  'function getClients(uint256 agentId) view returns (address[])',
]);

// Create public client
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function runScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, scriptName);
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script exited with code ${code}`));
    });
  });
}

async function viewAgentInfo() {
  const agentId = process.env.AGENT0_AGENT_ID || '14482';
  
  console.log('\n📊 Agent Information\n');
  console.log(`Agent ID: ${agentId}`);
  console.log(`Profile: https://8004agents.ai/base/agent/${agentId}\n`);

  try {
    // Get owner
    const owner = await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_ABI,
      functionName: 'ownerOf',
      args: [BigInt(agentId)],
    });
    console.log(`Owner: ${owner}`);

    // Get payment wallet
    const wallet = await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_ABI,
      functionName: 'getAgentWallet',
      args: [BigInt(agentId)],
    });
    console.log(`Payment Wallet: ${wallet}`);

    // Get reputation
    const clients = await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: REPUTATION_ABI,
      functionName: 'getClients',
      args: [BigInt(agentId)],
    });

    if (clients.length > 0) {
      const summary = await publicClient.readContract({
        address: REPUTATION_REGISTRY,
        abi: REPUTATION_ABI,
        functionName: 'getSummary',
        args: [BigInt(agentId), clients, '', ''],
      });

      const score = Number(summary[1]) / Math.pow(10, summary[2]);
      console.log(`\nReputation: ${score.toFixed(2)} (${summary[0]} reviews)`);
    } else {
      console.log(`\nReputation: No reviews yet`);
    }

    // Get tokenURI
    const uri = await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_ABI,
      functionName: 'tokenURI',
      args: [BigInt(agentId)],
    });

    if (uri.startsWith('data:application/json;base64,')) {
      const json = JSON.parse(
        Buffer.from(uri.slice(29), 'base64').toString('utf-8')
      );
      console.log(`\nProfile:`);
      console.log(`  Name: ${json.name || 'N/A'}`);
      console.log(`  Bio: ${json.description || 'N/A'}`);
      console.log(`  Active: ${json.active ? '✅' : '❌'}`);
    }

    console.log();
  } catch (error) {
    console.error('❌ Error fetching agent info:', error.message);
  }
}

async function updatePaymentWallet() {
  console.log('\n💰 Update Payment Wallet\n');
  console.log('This requires:');
  console.log('1. New wallet address');
  console.log('2. NEW_WALLET_PRIVATE_KEY in environment (to sign proof)\n');
  
  const newAddress = await question('Enter new wallet address (or "cancel"): ');
  
  if (newAddress.toLowerCase() === 'cancel') {
    console.log('Cancelled.\n');
    return;
  }

  if (!newAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.log('❌ Invalid address format\n');
    return;
  }

  if (!process.env.NEW_WALLET_PRIVATE_KEY) {
    console.log('❌ NEW_WALLET_PRIVATE_KEY not set in environment\n');
    console.log('Set it with:');
    console.log(`  export NEW_WALLET_PRIVATE_KEY=0x...\n`);
    return;
  }

  console.log();
  await runScript('set-agent-wallet.js', [newAddress]);
}

async function showMenu() {
  console.clear();
  console.log('╔════════════════════════════════════════╗');
  console.log('║   ERC-8004 Agent Management Menu       ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const agentId = process.env.AGENT0_AGENT_ID || '14482';
  console.log(`Agent: #${agentId} (Mr. Tee)\n`);
  
  console.log('1. 📊 View Agent Info');
  console.log('2. 💰 Update Payment Wallet');
  console.log('3. 🌐 View on 8004agents.ai');
  console.log('4. 📜 View on BaseScan');
  console.log('5. ❌ Exit\n');
}

async function main() {
  const agentId = process.env.AGENT0_AGENT_ID || '14482';

  while (true) {
    await showMenu();
    const choice = await question('Select option (1-5): ');

    switch (choice.trim()) {
      case '1':
        await viewAgentInfo();
        await question('\nPress Enter to continue...');
        break;

      case '2':
        await updatePaymentWallet();
        await question('\nPress Enter to continue...');
        break;

      case '3':
        console.log(`\n🌐 https://8004agents.ai/base/agent/${agentId}\n`);
        await question('Press Enter to continue...');
        break;

      case '4':
        console.log(`\n📜 https://basescan.org/nft/${IDENTITY_REGISTRY}/${agentId}\n`);
        await question('Press Enter to continue...');
        break;

      case '5':
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);

      default:
        console.log('\n❌ Invalid option\n');
        await question('Press Enter to continue...');
    }
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
