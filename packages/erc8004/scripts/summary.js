#!/usr/bin/env node

/**
 * 8004-summary: View feedback summary for an agent
 * Usage: node scripts/summary.js <agentId> [--detailed]
 */

import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import 'dotenv/config';

const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';

const ABI = parseAbi([
  'function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)',
  'function getClients(uint256 agentId) view returns (address[])',
  'function readAllFeedback(uint256 agentId, address[] clientAddresses, string tag1, string tag2, bool includeRevoked) view returns (address[], uint64[], int128[], uint8[], string[], string[], bool[])',
  'function getLastIndex(uint256 agentId, address clientAddress) view returns (uint64)',
]);

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

async function main() {
  const args = process.argv.slice(2);
  const agentId = args.find(a => !a.startsWith('--')) || process.env.AGENT0_AGENT_ID;
  const detailed = args.includes('--detailed');

  if (!agentId) {
    console.error(JSON.stringify({ error: 'Agent ID required. Usage: node summary.js <agentId> [--detailed]' }));
    process.exit(1);
  }

  try {
    // Get clients
    const clients = await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: ABI,
      functionName: 'getClients',
      args: [BigInt(agentId)],
    });

    if (clients.length === 0) {
      console.log(JSON.stringify({ agentId: Number(agentId), clients: 0, count: 0, score: null, message: 'No feedback yet' }));
      return;
    }

    // Get summary
    const [count, summaryValue, summaryValueDecimals] = await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: ABI,
      functionName: 'getSummary',
      args: [BigInt(agentId), clients, '', ''],
    });

    const score = Number(summaryValue) / Math.pow(10, summaryValueDecimals);

    const result = {
      agentId: Number(agentId),
      clients: clients.length,
      count: Number(count),
      score,
      scoreRaw: summaryValue.toString(),
      scoreDecimals: summaryValueDecimals,
    };

    // Detailed feedback
    if (detailed) {
      const [addrs, indices, values, decimals, tag1s, tag2s, revoked] = await publicClient.readContract({
        address: REPUTATION_REGISTRY,
        abi: ABI,
        functionName: 'readAllFeedback',
        args: [BigInt(agentId), clients, '', '', false],
      });

      result.feedback = addrs.map((addr, i) => ({
        client: addr,
        index: Number(indices[i]),
        value: Number(values[i]) / Math.pow(10, decimals[i]),
        valueRaw: values[i].toString(),
        valueDecimals: decimals[i],
        tag1: tag1s[i],
        tag2: tag2s[i],
        revoked: revoked[i],
      }));
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}

main();
