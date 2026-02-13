#!/usr/bin/env node

/**
 * 8004-register: Register a new agent on-chain
 * 
 * Usage:
 *   node scripts/register.js --preview '{"name":"...","description":"..."}'
 *   node scripts/register.js --submit '{"name":"...","description":"..."}'
 * 
 * --preview: Show transaction details without submitting
 * --submit: Actually submit the transaction
 */

import { createWalletClient, createPublicClient, http, parseAbi, decodeEventLog } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

const ABI = parseAbi([
  'function register(string agentURI) returns (uint256)',
  'function setAgentURI(uint256 agentId, string newURI)',
  'event Registered(uint256 indexed agentId, string agentURI, address indexed owner)',
]);

function getPrivateKey() {
  if (process.env.MAIN_WALLET_PRIVATE_KEY) return process.env.MAIN_WALLET_PRIVATE_KEY;
  if (process.env.WALLET_PRIVATE_KEY) return process.env.WALLET_PRIVATE_KEY;
  throw new Error('No wallet private key found (MAIN_WALLET_PRIVATE_KEY or WALLET_PRIVATE_KEY)');
}

async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview');
  const isSubmit = args.includes('--submit');
  const isUpdateReg = args.includes('--update-registration');

  if (!isPreview && !isSubmit && !isUpdateReg) {
    console.error(JSON.stringify({ error: 'Must specify --preview or --submit or --update-registration' }));
    process.exit(1);
  }

  const jsonArg = args.find(a => a.startsWith('{'));
  if (!jsonArg && !isUpdateReg) {
    console.error(JSON.stringify({ error: 'JSON payload required' }));
    process.exit(1);
  }

  const account = privateKeyToAccount(getPrivateKey());
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  });

  if (isUpdateReg) {
    // Update registration with agentId after initial register
    const agentId = args.find(a => !a.startsWith('--') && !a.startsWith('{'));
    const jsonPayload = JSON.parse(args.find(a => a.startsWith('{')));
    
    // Add registration info
    jsonPayload.registrations = [{
      agentId: Number(agentId),
      agentRegistry: `eip155:8453:${IDENTITY_REGISTRY}`,
    }];

    const encoded = Buffer.from(JSON.stringify(jsonPayload)).toString('base64');
    const dataURI = `data:application/json;base64,${encoded}`;

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
    });

    const gas = await publicClient.estimateContractGas({
      address: IDENTITY_REGISTRY,
      abi: ABI,
      functionName: 'setAgentURI',
      args: [BigInt(agentId), dataURI],
      account,
    });

    console.log(JSON.stringify({
      action: 'update-registration',
      agentId: Number(agentId),
      contract: IDENTITY_REGISTRY,
      function: 'setAgentURI(uint256, string)',
      gasEstimate: gas.toString(),
      registrationJSON: jsonPayload,
    }, null, 2));

    if (args.includes('--execute')) {
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
      }));
    }
    return;
  }

  const registrationJSON = JSON.parse(jsonArg);

  // Build registration
  if (!registrationJSON.type) {
    registrationJSON.type = 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
  }
  if (registrationJSON.active === undefined) {
    registrationJSON.active = true;
  }
  if (!registrationJSON.registrations) {
    registrationJSON.registrations = [];
  }

  const encoded = Buffer.from(JSON.stringify(registrationJSON)).toString('base64');
  const dataURI = `data:application/json;base64,${encoded}`;

  // Gas estimate
  const gas = await publicClient.estimateContractGas({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'register',
    args: [dataURI],
    account,
  });

  const result = {
    action: isPreview ? 'preview' : 'submit',
    contract: IDENTITY_REGISTRY,
    chain: 'Base (8453)',
    function: 'register(string agentURI)',
    from: account.address,
    gasEstimate: gas.toString(),
    registrationJSON,
    dataURILength: dataURI.length,
  };

  if (isPreview) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Submit
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
  });

  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY,
    abi: ABI,
    functionName: 'register',
    args: [dataURI],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Extract agentId from Registered event
  let agentId = null;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi: ABI, data: log.data, topics: log.topics });
      if (decoded.eventName === 'Registered') {
        agentId = Number(decoded.args.agentId);
        break;
      }
    } catch (e) {}
  }

  console.log(JSON.stringify({
    success: true,
    txHash: hash,
    agentId,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
  }, null, 2));
}

main().catch(e => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});
