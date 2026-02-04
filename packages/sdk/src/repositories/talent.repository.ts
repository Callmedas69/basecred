/**
 * Talent Repository — Data access layer for Talent Protocol API.
 */

import type { TalentConfig } from '../types/config.js';
import type { TalentFacet, TalentData, TalentSignals } from '../types/talent.js';
import type { AvailabilityState } from '../types/availability.js';

const BUILDER_SCORE_SLUGS = ['builder_score_2025', 'builder_score'];
const CREATOR_SCORE_SLUGS = ['creator_score_2025', 'creator_score'];

// Raw API response type (internal only)
interface TalentScoreItem {
  slug: string;
  points: number;
  last_calculated_at: string | null;
  rank_position: number | null;
}

interface TalentScoresResponse {
  scores: TalentScoreItem[];
}

// Repository result type
export interface TalentRepositoryResult {
  availability: AvailabilityState;
  facet?: TalentFacet;
}

function pickPreferredScore(
  scores: TalentScoreItem[],
  slugs: string[]
): TalentScoreItem | undefined {
  for (const slug of slugs) {
    const item = scores.find(score => score.slug === slug);
    if (item) return item;
  }
  return undefined;
}

function mostRecentTimestamp(items: TalentScoreItem[]): string | null {
  let latestMs = Number.NEGATIVE_INFINITY;
  let latestIso: string | null = null;

  for (const item of items) {
    const timestamp = item.last_calculated_at;
    if (!timestamp) continue;
    const ms = Date.parse(timestamp);
    if (Number.isNaN(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latestIso = timestamp;
    }
  }

  return latestIso;
}

export async function fetchTalentScore(
  address: string,
  config: TalentConfig
): Promise<TalentRepositoryResult> {
  try {
    const url = `${config.baseUrl}/scores?id=${address}&account_source=wallet`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': config.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { availability: 'not_found' };
      }
      return { availability: 'error' };
    }

    const data = (await response.json()) as TalentScoresResponse;

    if (!data || !data.scores || data.scores.length === 0) {
      return { availability: 'not_found' };
    }

    // Filter and map known scores only (versioned slugs supported)
    const builderScoreItems = data.scores.filter(s => BUILDER_SCORE_SLUGS.includes(s.slug));
    const creatorScoreItems = data.scores.filter(s => CREATOR_SCORE_SLUGS.includes(s.slug));

    const builderScoreItem = pickPreferredScore(data.scores, BUILDER_SCORE_SLUGS);
    const creatorScoreItem = pickPreferredScore(data.scores, CREATOR_SCORE_SLUGS);

    // If neither known score exists, treat as not found
    if (!builderScoreItem && !creatorScoreItem) {
      return { availability: 'not_found' };
    }

    // Build data object with available scores
    const talentData: TalentData = {
      builderScore: builderScoreItem?.points ?? 0,
      builderRankPosition: builderScoreItem?.rank_position ?? null,
      ...(creatorScoreItem ? { creatorScore: creatorScoreItem.points } : {}),
      ...(creatorScoreItem ? { creatorRankPosition: creatorScoreItem.rank_position ?? null } : {}),
    };

    // Build signals object
    const talentSignals: TalentSignals = {
      verifiedBuilder: (builderScoreItem?.points ?? 0) > 0,
      ...(creatorScoreItem ? { verifiedCreator: creatorScoreItem.points > 0 } : {}),
    };

    // Use most recent last_calculated_at from available scores
    const lastUpdatedAt = mostRecentTimestamp([...builderScoreItems, ...creatorScoreItems]);

    const facet: TalentFacet = {
      data: talentData,
      signals: talentSignals,
      meta: {
        lastUpdatedAt,
        lastUpdatedDaysAgo: null,  // Computed in use-case
      },
    };

    return { availability: 'available', facet };
  } catch {
    return { availability: 'error' };
  }
}
