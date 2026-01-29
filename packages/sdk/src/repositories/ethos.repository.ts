/**
 * Ethos Repository — Data access layer for Ethos API.
 */

import type { EthosConfig } from '../types/config.js';
import type { EthosFacet } from '../types/ethos.js';
import type { AvailabilityState } from '../types/availability.js';

// Raw API response type for /profiles endpoint (internal only)
interface EthosProfilesApiResponse {
  values: Array<{
    profile: {
      id: number;
      archived: boolean;
      createdAt: number; // seconds since epoch (Unix timestamp)
      updatedAt: number; // seconds since epoch (Unix timestamp)
      invitesAvailable: number;
      invitedBy: number;
    };
    user: {
      id: number;
      profileId: number | null;
      score: number;
      status: string;
      stats: {
        review: {
          received: {
            positive: number;
            neutral: number;
            negative: number;
          };
        };
        vouch: {
          given: { amountWeiTotal: number; count: number };
          received: { amountWeiTotal: number; count: number };
        };
      };
    };
  }>;
  total: number;
  limit: number;
  offset: number;
}

// Convert Unix timestamp (seconds) to ISO 8601 string
function toISOString(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString();
}

// Repository result type
export interface EthosRepositoryResult {
  availability: AvailabilityState;
  facet?: EthosFacet;
}

export async function fetchEthosProfile(
  address: string,
  config: EthosConfig
): Promise<EthosRepositoryResult> {
  try {
    const response = await fetch(`${config.baseUrl}/api/v2/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ethos-Client': config.clientId,
      },
      body: JSON.stringify({ addresses: [address] }),
    });

    if (!response.ok) {
      return { availability: 'error' };
    }

    const data = (await response.json()) as EthosProfilesApiResponse;

    if (!data.values || data.values.length === 0) {
      return { availability: 'not_found' };
    }

    const entry = data.values[0];
    if (!entry) {
      return { availability: 'not_found' };
    }

    const { profile, user } = entry;

    const facet: EthosFacet = {
      data: {
        score: user.score,
        vouchesReceived: user.stats.vouch.received.count,
        reviews: {
          positive: user.stats.review.received.positive,
          neutral: user.stats.review.received.neutral,
          negative: user.stats.review.received.negative,
        },
      },
      signals: {
        hasNegativeReviews: user.stats.review.received.negative > 0,
        hasVouches: user.stats.vouch.received.count > 0,
      },
      meta: {
        firstSeenAt: toISOString(profile.createdAt),
        lastUpdatedAt: toISOString(profile.updatedAt),
        activeSinceDays: null,     // Computed in use-case
        lastUpdatedDaysAgo: null,  // Computed in use-case
      },
    };

    return { availability: 'available', facet };
  } catch {
    return { availability: 'error' };
  }
}
