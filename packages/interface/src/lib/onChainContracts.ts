import { DECISION_REGISTRY_ABI, VERIFIER_ABI } from "@basecred/contracts/abi";

export interface OnChainContractInfo {
  name: string;
  address: string;
  abi: readonly unknown[];
  description: string;
  explorerUrl: string;
}

export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const ONCHAIN_CONTRACTS: OnChainContractInfo[] = [
  {
    name: "Groth16 Verifier",
    address: "0x14E91Bb6d25A24E4201B4A32E11F1D3807a4d08c",
    abi: VERIFIER_ABI,
    description: "Validates Groth16 proofs against the policy hash + contextId + decision layout.",
    explorerUrl: "https://base-sepolia.basescan.org/address/0x14E91Bb6d25A24E4201B4A32E11F1D3807a4d08c",
  },
  {
    name: "Decision Registry",
    address: "0x5a74Fe2909Bf59D0361DbE329c6dB6F705165F86",
    abi: DECISION_REGISTRY_ABI,
    description: "Stores audited decisions and replay keys for on-chain proof submissions.",
    explorerUrl: "https://base-sepolia.basescan.org/address/0x5a74Fe2909Bf59D0361DbE329c6dB6F705165F86",
  },
];
