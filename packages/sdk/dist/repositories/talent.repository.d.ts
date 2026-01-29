/**
 * Talent Repository — Data access layer for Talent Protocol API.
 */
import type { TalentConfig } from '../types/config.js';
import type { TalentFacet } from '../types/talent.js';
import type { AvailabilityState } from '../types/availability.js';
export interface TalentRepositoryResult {
    availability: AvailabilityState;
    facet?: TalentFacet;
}
export declare function fetchTalentScore(address: string, config: TalentConfig): Promise<TalentRepositoryResult>;
//# sourceMappingURL=talent.repository.d.ts.map