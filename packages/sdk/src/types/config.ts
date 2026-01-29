/**
 * SDK Configuration.
 */

export interface EthosConfig {
  baseUrl: string;        // e.g., "https://api.ethos.network"
  clientId: string;       // Required for X-Ethos-Client header
}

export interface TalentConfig {
  baseUrl: string;        // e.g., "https://api.talentprotocol.com"
  apiKey: string;         // Required for Talent Protocol
}

export interface LevelConfig {
  enabled: boolean;  // default: true
}

export interface FarcasterConfig {
  enabled: boolean;            // Must explicitly opt-in
  neynarApiKey: string;        // Required when enabled
  neynarBaseUrl?: string;      // Default: "https://api.neynar.com"
  qualityThreshold?: number;   // Consumer-defined threshold (default: 0.5)
}

export interface SDKConfig {
  ethos: EthosConfig;
  talent: TalentConfig;
  farcaster?: FarcasterConfig; // Optional: Phase 6 opt-in
  levels?: LevelConfig;        // Optional, defaults to { enabled: true }
}
