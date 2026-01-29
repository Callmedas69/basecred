/**
 * Ethos facet — Social credibility.
 */

import type { BaseCredLevel } from './level.js';

export interface EthosReviews {
  positive: number;
  neutral: number;
  negative: number;
}

export interface EthosData {
  score: number;
  vouchesReceived: number;
  reviews: EthosReviews;
  credibilityLevel?: BaseCredLevel;  // Optional: derived when levels.enabled
}

export interface EthosSignals {
  hasNegativeReviews: boolean;
  hasVouches: boolean;
}

export interface EthosMeta {
  firstSeenAt: string | null;         // ISO 8601 or null if unknown
  lastUpdatedAt: string | null;       // ISO 8601 or null if unknown
  activeSinceDays: number | null;     // Days since firstSeenAt (null if cannot compute)
  lastUpdatedDaysAgo: number | null;  // Days since lastUpdatedAt (null if cannot compute)
}

export interface EthosFacet {
  data: EthosData;
  signals: EthosSignals;
  meta: EthosMeta;
}
