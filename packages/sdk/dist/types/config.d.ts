/**
 * SDK Configuration.
 */
export interface EthosConfig {
    baseUrl: string;
    clientId: string;
}
export interface TalentConfig {
    baseUrl: string;
    apiKey: string;
}
export interface LevelConfig {
    enabled: boolean;
}
export interface FarcasterConfig {
    enabled: boolean;
    neynarApiKey: string;
    neynarBaseUrl?: string;
    qualityThreshold?: number;
}
export interface SDKConfig {
    ethos: EthosConfig;
    talent: TalentConfig;
    farcaster?: FarcasterConfig;
    levels?: LevelConfig;
}
//# sourceMappingURL=config.d.ts.map