/**
 * Blockchain Configuration
 *
 * Centralized chain definition, block explorer URLs, and RPC endpoints.
 * All blockchain-related constants should be imported from here.
 */

import { defineChain } from "viem"

// =============================================================================
// Chain Configuration
// =============================================================================

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"
const explorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "https://sepolia.basescan.org"

export const CHAIN_CONFIG = {
  id: chainId,
  rpcUrl,
  explorerUrl,
  txUrl: (hash: string) => `${explorerUrl}/tx/${hash}`,
  addressUrl: (address: string) => `${explorerUrl}/address/${address}`,
} as const

// =============================================================================
// Viem Chain Definition
// =============================================================================

export const targetChain = defineChain({
  id: chainId,
  name: process.env.NEXT_PUBLIC_CHAIN_NAME || "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: explorerUrl },
  },
  testnet: chainId !== 8453,
})
