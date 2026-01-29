/**
 * Talent facet — Builder & Creator credibility.
 */

import type { BaseCredLevel } from './level.js';

export interface TalentData {
  builderScore: number;
  builderLevel?: BaseCredLevel;   // Optional: derived when levels.enabled
  creatorScore?: number;          // Optional: present when creator_score exists
  creatorLevel?: BaseCredLevel;   // Optional: derived when levels.enabled
}

export interface TalentSignals {
  verifiedBuilder: boolean;
  verifiedCreator?: boolean;      // Optional: true when creatorScore > 0
}

export interface TalentMeta {
  lastUpdatedAt: string | null;       // ISO 8601 or null if unknown
  lastUpdatedDaysAgo: number | null;  // Days since lastUpdatedAt (null if cannot compute)
}

export interface TalentFacet {
  data: TalentData;
  signals: TalentSignals;
  meta: TalentMeta;
}
