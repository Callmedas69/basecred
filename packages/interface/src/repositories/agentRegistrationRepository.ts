/**
 * Agent Registration Repository
 *
 * Abstracts Redis storage for agent self-registration.
 * Follows repository pattern: fetches/persists data, no business logic.
 */

import { getRedis } from "@/lib/redis"
import type { AgentRegistration } from "@/types/agentRegistration"

const TTL_24H = 60 * 60 * 24

export interface IAgentRegistrationRepository {
  create(registration: AgentRegistration): Promise<boolean>
  getByClaimId(claimId: string): Promise<AgentRegistration | null>
  getByVerificationCode(code: string): Promise<string | null>
  getByAgentName(agentName: string): Promise<string | null>
  listByOwner(address: string): Promise<AgentRegistration[]>
  markVerified(claimId: string, tweetUrl: string): Promise<void>
  revoke(claimId: string): Promise<AgentRegistration | null>
}

export function createAgentRegistrationRepository(): IAgentRegistrationRepository {
  const redis = getRedis()

  return {
    async create(registration: AgentRegistration): Promise<boolean> {
      const { claimId, verificationCode, agentName, ownerAddress } = registration

      // Atomically claim the agent name (SETNX prevents race conditions)
      const nameKey = `agent:name:${agentName.toLowerCase()}`
      const claimed = await redis.setnx(nameKey, claimId)
      if (!claimed) return false

      // Set TTL on the name key
      await redis.expire(nameKey, TTL_24H)

      // Store the main record with 24h TTL
      await redis.set(`agent:reg:${claimId}`, JSON.stringify(registration), { ex: TTL_24H })

      // Indexes (also 24h TTL while pending)
      await redis.set(`agent:code:${verificationCode}`, claimId, { ex: TTL_24H })
      await redis.sadd(`agent:owner:${ownerAddress.toLowerCase()}`, claimId)

      return true
    },

    async getByClaimId(claimId: string): Promise<AgentRegistration | null> {
      const data = await redis.get<string>(`agent:reg:${claimId}`)
      if (!data) return null
      return typeof data === "string" ? JSON.parse(data) : data as unknown as AgentRegistration
    },

    async getByVerificationCode(code: string): Promise<string | null> {
      const claimId = await redis.get<string>(`agent:code:${code}`)
      return claimId || null
    },

    async getByAgentName(agentName: string): Promise<string | null> {
      const claimId = await redis.get<string>(`agent:name:${agentName.toLowerCase()}`)
      return claimId || null
    },

    async listByOwner(address: string): Promise<AgentRegistration[]> {
      const claimIds = await redis.smembers(`agent:owner:${address.toLowerCase()}`)
      if (!claimIds || claimIds.length === 0) return []

      const results: AgentRegistration[] = []
      for (const claimId of claimIds) {
        const data = await redis.get<string>(`agent:reg:${claimId}`)
        if (!data) continue
        const reg: AgentRegistration = typeof data === "string" ? JSON.parse(data) : data as unknown as AgentRegistration
        results.push(reg)
      }

      return results.sort((a, b) => b.createdAt - a.createdAt)
    },

    async markVerified(claimId: string, tweetUrl: string): Promise<void> {
      const data = await redis.get<string>(`agent:reg:${claimId}`)
      if (!data) throw new Error("Registration not found")

      const reg: AgentRegistration = typeof data === "string" ? JSON.parse(data) : data as unknown as AgentRegistration
      reg.status = "verified"
      reg.tweetUrl = tweetUrl
      reg.verifiedAt = Date.now()

      // Store without TTL (verified records persist)
      await redis.set(`agent:reg:${claimId}`, JSON.stringify(reg))

      // Remove the verification code index (single-use)
      await redis.del(`agent:code:${reg.verificationCode}`)

      // Update name index to persist (remove TTL by re-setting)
      await redis.set(`agent:name:${reg.agentName.toLowerCase()}`, claimId)
    },

    async revoke(claimId: string): Promise<AgentRegistration | null> {
      const data = await redis.get<string>(`agent:reg:${claimId}`)
      if (!data) return null

      const reg: AgentRegistration = typeof data === "string" ? JSON.parse(data) : data as unknown as AgentRegistration
      const snapshot = { ...reg }
      reg.status = "revoked"

      await redis.set(`agent:reg:${claimId}`, JSON.stringify(reg))

      // Clean up indexes
      await redis.del(`agent:code:${reg.verificationCode}`)
      await redis.del(`agent:name:${reg.agentName.toLowerCase()}`)
      await redis.srem(`agent:owner:${reg.ownerAddress.toLowerCase()}`, claimId)

      return snapshot
    },
  }
}
