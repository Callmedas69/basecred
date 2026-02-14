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

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "8453")

// Build RPC URL: prefer Alchemy (server-side, more reliable) over public Base RPC.
// ALCHEMY_RPC_URL + ALCHEMY_API_KEY are server-only env vars (not NEXT_PUBLIC_).
const alchemyBase = process.env.ALCHEMY_RPC_URL
const alchemyKey = process.env.ALCHEMY_API_KEY
const alchemyUrl = alchemyBase && alchemyKey ? `${alchemyBase}${alchemyKey}` : undefined

const rpcUrl = alchemyUrl
    || process.env.NEXT_PUBLIC_RPC_URL
    || "https://mainnet.base.org"

const explorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "https://basescan.org"

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
  name: process.env.NEXT_PUBLIC_CHAIN_NAME || "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: explorerUrl },
  },
  testnet: chainId !== 8453,
})
