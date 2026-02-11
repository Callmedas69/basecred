export interface AgentRegistration {
  claimId: string
  verificationCode: string
  agentName: string
  telegramId: string
  ownerAddress: string
  status: "pending_claim" | "verified" | "revoked"
  apiKeyHash: string
  apiKeyPrefix: string
  webhookUrl: string | null
  tweetUrl: string | null
  createdAt: number
  verifiedAt: number | null
  expiresAt: number
}

export interface GlobalFeedEntry {
  agentName: string
  ownerAddress: string
  context: string
  txHash?: string
  timestamp: number
}
