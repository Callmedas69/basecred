/**
 * Ethos Repository — Data access layer for Ethos API.
 */
// Convert Unix timestamp (seconds) to ISO 8601 string
function toISOString(epochSeconds) {
    return new Date(epochSeconds * 1000).toISOString();
}
export async function fetchEthosProfile(address, config) {
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
}
