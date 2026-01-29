/**
 * UnifiedProfile — The core SDK response type.
 *
 * Rules:
 * - Partial responses are valid (ethos/talent may be absent)
 * - Absence must always be explicit via availability
 * - Silent defaults are forbidden
 */
import type { Identity } from './identity.js';
import type { Availability } from './availability.js';
import type { EthosFacet } from './ethos.js';
import type { TalentFacet } from './talent.js';
import type { FarcasterFacet } from './farcaster.js';
/**
 * Recency bucket — Mechanical classification of data freshness.
 * - recent: ≤ windowDays
 * - stale: windowDays < days ≤ windowDays × 3
 * - dormant: > windowDays × 3
 */
export type RecencyBucket = 'recent' | 'stale' | 'dormant';
/**
 * Recency — Profile-level data freshness indicator.
 * Derived mechanically from facet timestamps. No behavioral inference.
 */
export interface Recency {
    bucket: RecencyBucket;
    windowDays: number;
    lastUpdatedDaysAgo: number;
    derivedFrom: ('ethos' | 'talent' | 'farcaster')[];
    computedAt: string;
    policy: 'recency@v1';
}
export interface UnifiedProfile {
    identity: Identity;
    availability: Availability;
    ethos?: EthosFacet;
    talent?: TalentFacet;
    farcaster?: FarcasterFacet;
    recency?: Recency;
}
//# sourceMappingURL=unified.d.ts.map