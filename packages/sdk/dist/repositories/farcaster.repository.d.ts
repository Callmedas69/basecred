/**
 * Farcaster Repository — Data access layer for Neynar API.
 *
 * Rules (CLAUDE.md Compliance):
 * - Maps raw API response to domain model
 * - Does NOT apply threshold logic (use-case responsibility)
 * - Returns raw score for use-case to process
 * - Handles all error states explicitly
 * - MUST NOT contain business rules
 * - MUST NOT perform authorization or validation
 * - MUST NOT make time-based decisions
 */
import type { FarcasterConfig } from '../types/config.js';
import type { AvailabilityState } from '../types/availability.js';
export interface FarcasterRepositoryResult {
    availability: AvailabilityState;
    rawScore?: number;
    fid?: number;
    username?: string;
    lastUpdatedAt?: string;
}
export declare function fetchFarcasterScore(address: string, config: FarcasterConfig): Promise<FarcasterRepositoryResult>;
//# sourceMappingURL=farcaster.repository.d.ts.map