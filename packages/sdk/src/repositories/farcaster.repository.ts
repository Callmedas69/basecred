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

// Raw Neynar API response type (internal only)
// Based on /v2/farcaster/user/bulk-by-address/ endpoint
interface NeynarBulkByAddressUser {
    object: 'user';
    fid: number;
    username: string;
    display_name?: string;
    custody_address: string;
    score?: number;  // Neynar user score (0-1), probability account is not spam
    verified_addresses?: {
        eth_addresses: string[];
        sol_addresses: string[];
    };
}

interface NeynarBulkByAddressResponse {
    [address: string]: NeynarBulkByAddressUser[];
}

// Repository result type
export interface FarcasterRepositoryResult {
    availability: AvailabilityState;
    rawScore?: number;        // Raw score for use-case threshold logic
    fid?: number;             // Farcaster ID for reference
    username?: string;        // Farcaster username for reference
    lastUpdatedAt?: string;   // When the data was fetched (approximated as now)
}

const DEFAULT_NEYNAR_BASE_URL = 'https://api.neynar.com';

export async function fetchFarcasterScore(
    address: string,
    config: FarcasterConfig
): Promise<FarcasterRepositoryResult> {
    // Normalize address to lowercase for consistent lookup
    const normalizedAddress = address.toLowerCase();
    const baseUrl = config.neynarBaseUrl ?? DEFAULT_NEYNAR_BASE_URL;

    try {
        const url = new URL(`${baseUrl}/v2/farcaster/user/bulk-by-address`);
        url.searchParams.set('addresses', normalizedAddress);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'x-api-key': config.neynarApiKey,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            // Handle specific error codes
            if (response.status === 401 || response.status === 403) {
                // Authentication error - invalid API key
                return { availability: 'error' };
            }
            if (response.status === 404) {
                // No user found for this address
                return { availability: 'not_found' };
            }
            // Other errors
            return { availability: 'error' };
        }

        const data = (await response.json()) as NeynarBulkByAddressResponse;

        // Response is keyed by address - look up our address
        const users = data[normalizedAddress];

        if (!users || users.length === 0) {
            // No Farcaster account linked to this wallet
            return { availability: 'unlinked' };
        }

        // Use the first user (in case of multiple linked accounts)
        const user = users[0];

        // Guard against undefined (shouldn't happen after length check, but TypeScript needs this)
        if (!user) {
            return { availability: 'unlinked' };
        }

        // Check if score is available
        if (user.score === undefined || user.score === null) {
            // User exists but no score available
            return {
                availability: 'available',
                rawScore: undefined,
                fid: user.fid,
                username: user.username,
                lastUpdatedAt: new Date().toISOString(),
            };
        }

        return {
            availability: 'available',
            rawScore: user.score,
            fid: user.fid,
            username: user.username,
            lastUpdatedAt: new Date().toISOString(),
        };
    } catch {
        // Network or parsing error
        return { availability: 'error' };
    }
}
