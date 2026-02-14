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
    address: "0x60138da0c6103760864d829C128b9cA2Ea7C9158",
    abi: VERIFIER_ABI,
    description: "Validates Groth16 proofs against the policy hash + contextId + decision layout.",
    explorerUrl: "https://basescan.org/address/0x60138da0c6103760864d829C128b9cA2Ea7C9158",
  },
  {
    name: "Decision Registry",
    address: "0x8a8A3F95605F6980F6fFCC4C86110fe8d7b5E091",
    abi: DECISION_REGISTRY_ABI,
    description: "Stores audited decisions for on-chain proof submissions. Supports resubmission for updated decisions.",
    explorerUrl: "https://basescan.org/address/0x8a8A3F95605F6980F6fFCC4C86110fe8d7b5E091",
  },
];
