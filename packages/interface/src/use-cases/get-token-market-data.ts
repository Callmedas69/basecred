/**
 * Get Token Market Data Use Case
 *
 * Transforms raw DexScreener data into typed market metrics.
 * No HTTP, no framework dependencies.
 */

import {
  fetchTokenMarketData,
  type RawTokenMarketData,
} from "@/repositories/tokenMarketRepository"

// =============================================================================
// Types
// =============================================================================

export interface TokenMarketData {
  price: number | null
  marketCap: number | null
  volume24h: number | null
  liquidity: number | null
  txns24h: number
  pairAddress: string
  dexId: string
  lastUpdated: string
}

// =============================================================================
// Use Case
// =============================================================================

const ZKB_TOKEN_ADDRESS = "0x1758b8d8ac471605772084af534438c781113ba3"

export async function getTokenMarketData(): Promise<TokenMarketData> {
  const raw: RawTokenMarketData = await fetchTokenMarketData(ZKB_TOKEN_ADDRESS)

  return {
    price: raw.priceUsd !== null ? parseFloat(raw.priceUsd) : null,
    marketCap: raw.marketCap,
    volume24h: raw.volume24h,
    liquidity: raw.liquidityUsd,
    txns24h: raw.txnsBuys24h + raw.txnsSells24h,
    pairAddress: raw.pairAddress,
    dexId: raw.dexId,
    lastUpdated: new Date().toISOString(),
  }
}
