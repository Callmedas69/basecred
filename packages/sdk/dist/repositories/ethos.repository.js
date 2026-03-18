/**
 * Ethos Repository — Data access layer for Ethos API.
 */
import { retryFetch } from './retry.js';
// Convert Unix timestamp (seconds) to ISO 8601 string
function toISOString(epochSeconds) {
    return new Date(epochSeconds * 1000).toISOString();
}
const FETCH_TIMEOUT_MS = 10_000;
export async function fetchEthosProfile(address, config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await retryFetch(() => fetch(`${config.baseUrl}/api/v2/profiles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Ethos-Client': config.clientId,
            },
            body: JSON.stringify({ addresses: [address] }),
            signal: controller.signal,
        }));
        if (!response.ok) {
            if (response.status === 429) {
                return { availability: 'rate_limited' };
            }
            return { availability: 'error' };
        }
        const data = (await response.json());
        if (!data.values || data.values.length === 0) {
            return { availability: 'not_found' };
        }
        const entry = data.values[0];
        if (!entry) {
            return { availability: 'not_found' };
        }
        const { profile, user } = entry;
        const facet = {
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
                activeSinceDays: null, // Computed in use-case
                lastUpdatedDaysAgo: null, // Computed in use-case
            },
        };
        return { availability: 'available', facet };
    }
    catch {
        return { availability: 'error' };
    }
    finally {
        clearTimeout(timeoutId);
    }
}
