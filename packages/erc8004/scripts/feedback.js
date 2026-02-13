#!/usr/bin/env node

/**
 * 8004-feedback: Give feedback to an agent
 * 
 * Usage:
 *   node scripts/feedback.js --preview <agentId> <value> <decimals> [tag1] [tag2] [endpoint]
 *   node scripts/feedback.js --submit <agentId> <value> <decimals> [tag1] [tag2] [endpoint]
 */

import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';

const ABI = parseAbi([
  'function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)',
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
  const [agentIdStr, valueStr, decimalsStr, tag1, tag2, endpoint] = positional;

  if (!agentIdStr || !valueStr || !decimalsStr) {
    console.error(JSON.stringify({ error: 'Usage: feedback.js --preview|--submit <agentId> <value> <decimals> [tag1] [tag2] [endpoint]' }));
    process.exit(1);
  }

  const account = privateKeyToAccount(getPrivateKey());
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  });

  const callArgs = [
    BigInt(agentIdStr),
    BigInt(valueStr),
    Number(decimalsStr),
    tag1 || '',
    tag2 || '',
    endpoint || '',
    '',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ];

  const gas = await publicClient.estimateContractGas({
    address: REPUTATION_REGISTRY,
    abi: ABI,
    functionName: 'giveFeedback',
    args: callArgs,
    account,
  });

  const result = {
    action: isPreview ? 'preview' : 'submit',
    contract: REPUTATION_REGISTRY,
    chain: 'Base (8453)',
    function: 'giveFeedback(uint256, int128, uint8, string, string, string, string, bytes32)',
    params: {
      agentId: Number(agentIdStr),
      value: valueStr,
      valueDecimals: Number(decimalsStr),
      displayValue: Number(valueStr) / Math.pow(10, Number(decimalsStr)),
      tag1: tag1 || '',
      tag2: tag2 || '',
      endpoint: endpoint || '',
    },
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
    address: REPUTATION_REGISTRY,
    abi: ABI,
    functionName: 'giveFeedback',
    args: callArgs,
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
