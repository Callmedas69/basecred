/**
 * Farcaster facet — Platform account quality (Neynar).
 *
 * This facet exposes Neynar user score as a parallel quality signal.
 * It does NOT merge with Ethos or Talent. Scope is Farcaster-only.
 */

export interface FarcasterData {
  userScore: number;  // Raw Neynar user score (0-1)
}

export interface FarcasterSignals {
  passesQualityThreshold: boolean;  // Derived from consumer-defined threshold
}

export interface FarcasterMeta {
  source: 'neynar';
  scope: 'farcaster';
  lastUpdatedAt: string | null;     // When score was retrieved
  lastUpdatedDaysAgo: number | null;
  updateCadence: 'weekly';
  timeMeaning: 'system_update';
}

export interface FarcasterFacet {
  data: FarcasterData;
  signals: FarcasterSignals;
  meta: FarcasterMeta;
}
