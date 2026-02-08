/**
 * API Key Repository
 *
 * Abstracts Redis storage for API key management.
 * Follows repository pattern: fetches/persists data, no business logic.
 */

import { getRedis } from "@/lib/redis"
import type { ApiKeyRecord, ApiKeyInfo } from "@/types/apiKeys"

export interface IApiKeyRepository {
  createKey(walletAddress: string, label: string, keyHash: string, keyPrefix: string): Promise<void>
  validateKey(keyHash: string): Promise<ApiKeyRecord | null>
  listKeys(walletAddress: string): Promise<ApiKeyInfo[]>
  revokeKey(keyId: string, walletAddress: string): Promise<boolean>
  recordUsage(keyHash: string): Promise<void>
}

export function createApiKeyRepository(): IApiKeyRepository {
  const redis = getRedis()

  return {
    async createKey(walletAddress: string, label: string, keyHash: string, keyPrefix: string): Promise<void> {
      const record: ApiKeyRecord = {
        walletAddress: walletAddress.toLowerCase(),
        label,
        keyPrefix,
        createdAt: Date.now(),
        lastUsedAt: null,
        requestCount: 0,
      }

      await redis.set(`apikey:${keyHash}`, JSON.stringify(record))
      await redis.sadd(`wallet:${walletAddress.toLowerCase()}:keys`, keyHash)
    },

    async validateKey(keyHash: string): Promise<ApiKeyRecord | null> {
      const data = await redis.get<string>(`apikey:${keyHash}`)
      if (!data) return null
      return typeof data === "string" ? JSON.parse(data) : data as unknown as ApiKeyRecord
    },

    async listKeys(walletAddress: string): Promise<ApiKeyInfo[]> {
      const keyHashes = await redis.smembers(`wallet:${walletAddress.toLowerCase()}:keys`)
      if (!keyHashes || keyHashes.length === 0) return []

      const results: ApiKeyInfo[] = []
      for (const keyHash of keyHashes) {
        const data = await redis.get<string>(`apikey:${keyHash}`)
        if (!data) continue
        const record: ApiKeyRecord = typeof data === "string" ? JSON.parse(data) : data as unknown as ApiKeyRecord
        results.push({
          keyId: keyHash,
          keyPrefix: record.keyPrefix,
          label: record.label,
          createdAt: record.createdAt,
          lastUsedAt: record.lastUsedAt,
          requestCount: record.requestCount,
        })
      }

      return results.sort((a, b) => b.createdAt - a.createdAt)
    },

    async revokeKey(keyId: string, walletAddress: string): Promise<boolean> {
      const data = await redis.get<string>(`apikey:${keyId}`)
      if (!data) return false

      const record: ApiKeyRecord = typeof data === "string" ? JSON.parse(data) : data as unknown as ApiKeyRecord
      if (record.walletAddress !== walletAddress.toLowerCase()) return false

      await redis.del(`apikey:${keyId}`)
      await redis.srem(`wallet:${walletAddress.toLowerCase()}:keys`, keyId)
      return true
    },

    async recordUsage(keyHash: string): Promise<void> {
      // Use a Lua script for atomic read-modify-write to avoid race conditions.
      // This increments requestCount and sets lastUsedAt in a single Redis roundtrip.
      const script = `
        local data = redis.call('GET', KEYS[1])
        if not data then return nil end
        local record = cjson.decode(data)
        record.requestCount = (record.requestCount or 0) + 1
        record.lastUsedAt = tonumber(ARGV[1])
        redis.call('SET', KEYS[1], cjson.encode(record))
        return 1
      `
      await redis.eval(script, [`apikey:${keyHash}`], [Date.now().toString()])
    },
  }
}
