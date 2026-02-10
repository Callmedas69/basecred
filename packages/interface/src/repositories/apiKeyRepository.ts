/**
 * API Key Repository
 *
 * Abstracts Redis storage for API key management.
 * Follows repository pattern: fetches/persists data, no business logic.
 */

import { getRedis } from "@/lib/redis"
import type { ApiKeyRecord, ApiKeyInfo } from "@/types/apiKeys"

export interface IApiKeyRepository {
  createKey(walletAddress: string, label: string, keyHash: string, keyPrefix: string, maxKeys: number): Promise<boolean>
  validateKey(keyHash: string): Promise<ApiKeyRecord | null>
  listKeys(walletAddress: string): Promise<ApiKeyInfo[]>
  revokeKey(keyId: string, walletAddress: string): Promise<boolean>
  recordUsage(keyHash: string): Promise<void>
}

export function createApiKeyRepository(): IApiKeyRepository {
  const redis = getRedis()

  return {
    async createKey(walletAddress: string, label: string, keyHash: string, keyPrefix: string, maxKeys: number): Promise<boolean> {
      const record: ApiKeyRecord = {
        walletAddress: walletAddress.toLowerCase(),
        label,
        keyPrefix,
        createdAt: Date.now(),
        lastUsedAt: null,
        requestCount: 0,
      }

      // Atomic check-and-create: verify key count before adding
      const script = `
        local count = redis.call('SCARD', KEYS[1])
        if count >= tonumber(ARGV[1]) then return 0 end
        redis.call('SET', KEYS[2], ARGV[2])
        redis.call('SADD', KEYS[1], ARGV[3])
        return 1
      `
      const addr = walletAddress.toLowerCase()
      const result = await redis.eval(
        script,
        [`wallet:${addr}:keys`, `apikey:${keyHash}`],
        [maxKeys.toString(), JSON.stringify(record), keyHash]
      )
      return result === 1
    },

    async validateKey(keyHash: string): Promise<ApiKeyRecord | null> {
      const data = await redis.get<string>(`apikey:${keyHash}`)
      if (!data) return null
      return typeof data === "string" ? JSON.parse(data) : data as unknown as ApiKeyRecord
    },

    async listKeys(walletAddress: string): Promise<ApiKeyInfo[]> {
      const keyHashes = await redis.smembers(`wallet:${walletAddress.toLowerCase()}:keys`)
      if (!keyHashes || keyHashes.length === 0) return []

      // Batch fetch all keys in a single Redis call
      const redisKeys = keyHashes.map(h => `apikey:${h}`)
      const dataList = await redis.mget<(string | null)[]>(...redisKeys)

      const results: ApiKeyInfo[] = []
      for (let i = 0; i < keyHashes.length; i++) {
        const data = dataList[i]
        if (!data) continue
        const record: ApiKeyRecord = typeof data === "string" ? JSON.parse(data) : data as unknown as ApiKeyRecord
        results.push({
          keyId: keyHashes[i],
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
      // Atomic revocation: verify ownership, delete key, and remove from set in one operation
      const script = `
        local data = redis.call('GET', KEYS[1])
        if not data then return 0 end
        local record = cjson.decode(data)
        if record.walletAddress ~= ARGV[1] then return 0 end
        redis.call('DEL', KEYS[1])
        redis.call('SREM', KEYS[2], ARGV[2])
        return 1
      `
      const addr = walletAddress.toLowerCase()
      const result = await redis.eval(
        script,
        [`apikey:${keyId}`, `wallet:${addr}:keys`],
        [addr, keyId]
      )
      return result === 1
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
