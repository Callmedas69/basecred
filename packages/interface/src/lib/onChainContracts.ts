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
    address: "0x11FA4bB9E7e0d664f1781C9dc32D2F173E2150c7",
    abi: DECISION_REGISTRY_ABI,
    description: "Stores audited decisions and replay keys for on-chain proof submissions.",
    explorerUrl: "https://basescan.org/address/0x11FA4bB9E7e0d664f1781C9dc32D2F173E2150c7",
  },
];
