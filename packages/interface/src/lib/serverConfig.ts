/**
 * Server Configuration
 *
 * Validates required environment variables at import time (startup).
 * Throws immediately if critical config is missing — fail fast.
 *
 * ONLY import this in server-side code (API routes, use cases).
 */

import type { SDKConfig } from "basecred-sdk"
import { ConfigError } from "@/lib/errors"

// =============================================================================
// Validation Helpers
// =============================================================================

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback
}

// =============================================================================
// SDK Configuration (Ethos, Talent, Neynar)
// =============================================================================

let _sdkConfig: SDKConfig | null = null

export function getSDKConfig(): SDKConfig {
  if (_sdkConfig) return _sdkConfig

  _sdkConfig = {
    ethos: {
      baseUrl: optionalEnv("ETHOS_BASE_URL", "https://api.ethos.network"),
      clientId: requireEnv("ETHOS_CLIENT_ID"),
    },
    talent: {
      baseUrl: optionalEnv("TALENT_BASE_URL", "https://api.talentprotocol.com"),
      apiKey: requireEnv("TALENT_API_KEY"),
    },
    farcaster: {
      enabled: true,
      neynarApiKey: requireEnv("NEYNAR_API_KEY"),
    },
  }

  return _sdkConfig
}

// =============================================================================
// Relayer Configuration
// =============================================================================

let _relayerKey: string | null = null
let _relayerKeyChecked = false

/**
 * Returns the relayer private key, or null if not configured.
 * Does NOT throw — on-chain submission is optional.
 */
export function getRelayerPrivateKey(): string | null {
  if (_relayerKeyChecked) return _relayerKey
  _relayerKey = process.env.RELAYER_PRIVATE_KEY || null
  _relayerKeyChecked = true
  return _relayerKey
}

/**
 * Returns the relayer private key. Throws if not configured.
 */
export function requireRelayerPrivateKey(): string {
  const key = getRelayerPrivateKey()
  if (!key) {
    throw new ConfigError("RELAYER_PRIVATE_KEY is not configured")
  }
  return key
}
