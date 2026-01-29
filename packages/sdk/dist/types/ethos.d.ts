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
    credibilityLevel?: BaseCredLevel;
}
export interface EthosSignals {
    hasNegativeReviews: boolean;
    hasVouches: boolean;
}
export interface EthosMeta {
    firstSeenAt: string | null;
    lastUpdatedAt: string | null;
    activeSinceDays: number | null;
    lastUpdatedDaysAgo: number | null;
}
export interface EthosFacet {
    data: EthosData;
    signals: EthosSignals;
    meta: EthosMeta;
}
//# sourceMappingURL=ethos.d.ts.map