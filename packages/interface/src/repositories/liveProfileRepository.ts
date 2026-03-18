import { UnifiedProfileData } from "basecred-decision-engine"
import { getUnifiedProfile, SDKConfig } from "basecred-sdk"

// In-memory cache — 2-minute TTL, max 100 entries
// Reuses proven pattern from stats/route.ts
const CACHE_TTL_MS = 2 * 60 * 1000
const CACHE_MAX_ENTRIES = 100

interface CacheEntry {
    data: UnifiedProfileData
    expiresAt: number
}

const profileCache = new Map<string, CacheEntry>()

function getSDKConfig(): SDKConfig {
    return {
        ethos: {
            baseUrl: process.env.ETHOS_BASE_URL || "https://api.ethos.network",
            clientId: process.env.ETHOS_CLIENT_ID || "",
        },
        talent: {
            baseUrl: process.env.TALENT_BASE_URL || "https://api.talentprotocol.com",
            apiKey: process.env.TALENT_API_KEY || "",
        },
        farcaster: {
            enabled: true,
            neynarApiKey: process.env.NEYNAR_API_KEY || "",
        },
    }
}

export async function fetchLiveProfile(address: string): Promise<UnifiedProfileData> {
    const cacheKey = address.toLowerCase()
    const now = Date.now()

    // Check cache
    const cached = profileCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
        return cached.data
    }

    const config = getSDKConfig()

    try {
        const profile = await getUnifiedProfile(address, config) as UnifiedProfileData

        // Evict oldest entry if at capacity (FIFO — Map iteration is insertion-ordered)
        if (profileCache.size >= CACHE_MAX_ENTRIES) {
            const firstKey = profileCache.keys().next().value
            if (firstKey !== undefined) {
                profileCache.delete(firstKey)
            }
        }

        profileCache.set(cacheKey, { data: profile, expiresAt: now + CACHE_TTL_MS })
        return profile
    } catch (error) {
        // Serve stale cache on error if available
        if (cached) {
            console.warn("[liveProfileRepository] Fetch failed, serving stale cache for", cacheKey)
            return cached.data
        }
        console.error("SDK Fetch Error:", error)
        throw error
    }
}
