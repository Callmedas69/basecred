export interface ApiKeyRecord {
  walletAddress: string
  label: string
  keyPrefix: string // "bc_abc1...ef23"
  createdAt: number
  lastUsedAt: number | null
  requestCount: number
}

export interface ApiKeyInfo {
  keyId: string
  keyPrefix: string
  label: string
  createdAt: number
  lastUsedAt: number | null
  requestCount: number
}

export interface ActivityEntry {
  timestamp: number
  apiKeyPrefix: string
  subject: string // wallet address that was checked
  context: string
  decision: string // "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS"
  confidence: string // "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
}
