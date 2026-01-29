/**
 * Ethos Repository — Data access layer for Ethos API.
 */
import type { EthosConfig } from '../types/config.js';
import type { EthosFacet } from '../types/ethos.js';
import type { AvailabilityState } from '../types/availability.js';
export interface EthosRepositoryResult {
    availability: AvailabilityState;
    facet?: EthosFacet;
}
export declare function fetchEthosProfile(address: string, config: EthosConfig): Promise<EthosRepositoryResult>;
//# sourceMappingURL=ethos.repository.d.ts.map