import { DECISION_REGISTRY_ABI, VERIFIER_ABI } from "@basecred/contracts/abi";

export interface OnChainContractInfo {
  name: string;
  address: string;
  abi: readonly unknown[];
  description: string;
  explorerUrl: string;
}

export const BASE_CHAIN_ID = 8453;

export const ONCHAIN_CONTRACTS: OnChainContractInfo[] = [
  {
    name: "Groth16 Verifier",
    address: "0x66d6647261D5E36AFA61d1a29E2C636351Ecc441",
    abi: VERIFIER_ABI,
    description: "Validates Groth16 proofs against the policy hash + contextId + decision layout.",
    explorerUrl: "https://basescan.org/address/0x66d6647261D5E36AFA61d1a29E2C636351Ecc441",
  },
  {
    name: "Decision Registry",
    address: "0xde81CfD19B7Af704f17043789E8822352D9c179A",
    abi: DECISION_REGISTRY_ABI,
    description: "Stores audited decisions for on-chain proof submissions. Supports resubmission for updated decisions.",
    explorerUrl: "https://basescan.org/address/0xde81CfD19B7Af704f17043789E8822352D9c179A",
  },
];
