/**
 * Talent facet — Builder & Creator credibility.
 */
import type { BaseCredLevel } from './level.js';
export interface TalentData {
    builderScore: number;
    builderLevel?: BaseCredLevel;
    creatorScore?: number;
    creatorLevel?: BaseCredLevel;
}
export interface TalentSignals {
    verifiedBuilder: boolean;
    verifiedCreator?: boolean;
}
export interface TalentMeta {
    lastUpdatedAt: string | null;
    lastUpdatedDaysAgo: number | null;
}
export interface TalentFacet {
    data: TalentData;
    signals: TalentSignals;
    meta: TalentMeta;
}
//# sourceMappingURL=talent.d.ts.map