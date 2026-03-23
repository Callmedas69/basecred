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
    address: "0x1206a8779f862430Cff4759481E076b002a0a967",
    abi: VERIFIER_ABI,
    description: "Validates Groth16 proofs against the policy hash + contextId + decision layout.",
    explorerUrl: "https://basescan.org/address/0x1206a8779f862430Cff4759481E076b002a0a967",
  },
  {
    name: "Decision Registry (Proxy)",
    address: "0x53c730CbC9832a31f77B0EF7eD31E0cbAD6501Ab",
    abi: DECISION_REGISTRY_ABI,
    description: "UUPS proxy — stores audited decisions for on-chain proof submissions. Supports resubmission for updated decisions.",
    explorerUrl: "https://basescan.org/address/0x53c730CbC9832a31f77B0EF7eD31E0cbAD6501Ab",
  },
  {
    name: "Decision Registry (Implementation)",
    address: "0x7fd58140F7F996Cf44b3f6721a607830DFFb3D80",
    abi: DECISION_REGISTRY_ABI,
    description: "UUPS implementation contract for the Decision Registry. All calls should go through the proxy.",
    explorerUrl: "https://basescan.org/address/0x7fd58140F7F996Cf44b3f6721a607830DFFb3D80",
  },
];
