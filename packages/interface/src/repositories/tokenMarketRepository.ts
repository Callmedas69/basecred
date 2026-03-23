/**
 * Token Market Data Repository
 *
 * Fetches market data from DexScreener API.
 * 12-hour in-memory cache with stale-cache fallback on errors.
 */

// =============================================================================
// Types
// =============================================================================

export interface RawTokenMarketData {
  priceUsd: string | null
  marketCap: number | null
  fdv: number | null
  volume24h: number | null
  liquidityUsd: number | null
  txnsBuys24h: number
  txnsSells24h: number
  pairAddress: string
  dexId: string
}

interface DexScreenerPair {
  pairAddress: string
  dexId: string
  priceUsd?: string | null
  marketCap?: number | null
  fdv?: number | null
  volume?: { h24?: number }
  liquidity?: { usd?: number }
  txns?: { h24?: { buys?: number; sells?: number } }
}

// =============================================================================
// Cache
// =============================================================================

const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

interface CacheEntry {
  data: RawTokenMarketData
  expiresAt: number
}

let cached: CacheEntry | null = null

// =============================================================================
// Repository
// =============================================================================

export async function fetchTokenMarketData(
  tokenAddress: string
): Promise<RawTokenMarketData> {
  const now = Date.now()

  // Serve from cache if fresh
  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  const url = `https://api.dexscreener.com/tokens/v1/base/${tokenAddress}`

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      throw new Error(`DexScreener API responded with ${res.status}`)
    }

    const pairs: DexScreenerPair[] = await res.json()

    if (!Array.isArray(pairs) || pairs.length === 0) {
      throw new Error("No pairs found for token")
    }

    // Pick the pair with highest liquidity
    const bestPair = pairs.reduce((best, pair) => {
      const bestLiq = best.liquidity?.usd ?? 0
      const pairLiq = pair.liquidity?.usd ?? 0
      return pairLiq > bestLiq ? pair : best
    }, pairs[0])

    const data: RawTokenMarketData = {
      priceUsd: bestPair.priceUsd ?? null,
      marketCap: bestPair.marketCap ?? null,
      fdv: bestPair.fdv ?? null,
      volume24h: bestPair.volume?.h24 ?? null,
      liquidityUsd: bestPair.liquidity?.usd ?? null,
      txnsBuys24h: bestPair.txns?.h24?.buys ?? 0,
      txnsSells24h: bestPair.txns?.h24?.sells ?? 0,
      pairAddress: bestPair.pairAddress,
      dexId: bestPair.dexId,
    }

    cached = { data, expiresAt: now + CACHE_TTL_MS }
    return data
  } catch (error) {
    // Serve stale cache on error if available
    if (cached) {
      console.warn("[tokenMarketRepository] Fetch failed, serving stale cache")
      return cached.data
    }
    console.error("[tokenMarketRepository] Fetch error:", error)
    throw error
  }
}
