/**
 * Farcaster facet — Platform account quality (Neynar).
 *
 * This facet exposes Neynar user score as a parallel quality signal.
 * It does NOT merge with Ethos or Talent. Scope is Farcaster-only.
 */
export interface FarcasterData {
    userScore: number;
}
export interface FarcasterSignals {
    passesQualityThreshold: boolean;
}
export interface FarcasterMeta {
    source: 'neynar';
    scope: 'farcaster';
    lastUpdatedAt: string | null;
    lastUpdatedDaysAgo: number | null;
    updateCadence: 'weekly';
    timeMeaning: 'system_update';
}
export interface FarcasterFacet {
    data: FarcasterData;
    signals: FarcasterSignals;
    meta: FarcasterMeta;
}
//# sourceMappingURL=farcaster.d.ts.map