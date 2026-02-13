#!/usr/bin/env node

/**
 * 8004-respond: Append response to feedback
 * 
 * Usage:
 *   node scripts/respond.js --preview <agentId> <clientAddress> <feedbackIndex> [responseURI]
 *   node scripts/respond.js --submit <agentId> <clientAddress> <feedbackIndex> [responseURI]
 */

import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';

const ABI = parseAbi([
  'function appendResponse(uint256 agentId, address clientAddress, uint64 feedbackIndex, string responseURI, bytes32 responseHash)',
  'function readFeedback(uint256 agentId, address clientAddress, uint64 feedbackIndex) view returns (int128 value, uint8 valueDecimals, string tag1, string tag2, bool isRevoked)',
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
  const [agentIdStr, clientAddress, feedbackIndexStr, responseURI] = positional;

  if (!agentIdStr || !clientAddress || !feedbackIndexStr) {
    console.error(JSON.stringify({ error: 'Usage: respond.js --preview|--submit <agentId> <clientAddress> <feedbackIndex> [responseURI]' }));
    process.exit(1);
  }

  const account = privateKeyToAccount(getPrivateKey());
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  });

  // Read the feedback being responded to
  let feedbackInfo = null;
  try {
    const [value, valueDecimals, tag1, tag2, isRevoked] = await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: ABI,
      functionName: 'readFeedback',
      args: [BigInt(agentIdStr), clientAddress, BigInt(feedbackIndexStr)],
    });
    feedbackInfo = {
      value: value.toString(),
      displayValue: Number(value) / Math.pow(10, valueDecimals),
      valueDecimals,
      tag1,
      tag2,
      isRevoked,
    };
  } catch (e) {
    feedbackInfo = { error: 'Could not read feedback: ' + e.message };
  }

  const callArgs = [
    BigInt(agentIdStr),
    clientAddress,
    BigInt(feedbackIndexStr),
    responseURI || '',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ];

  const gas = await publicClient.estimateContractGas({
    address: REPUTATION_REGISTRY,
    abi: ABI,
    functionName: 'appendResponse',
    args: callArgs,
    account,
  });

  const result = {
    action: isPreview ? 'preview' : 'submit',
    contract: REPUTATION_REGISTRY,
    chain: 'Base (8453)',
    function: 'appendResponse(uint256, address, uint64, string, bytes32)',
    params: {
      agentId: Number(agentIdStr),
      clientAddress,
      feedbackIndex: Number(feedbackIndexStr),
      responseURI: responseURI || '',
    },
    feedbackBeingRespondedTo: feedbackInfo,
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
    functionName: 'appendResponse',
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
