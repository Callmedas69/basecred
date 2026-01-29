/**
 * Talent Repository — Data access layer for Talent Protocol API.
 */

import type { TalentConfig } from '../types/config.js';
import type { TalentFacet, TalentData, TalentSignals } from '../types/talent.js';
import type { AvailabilityState } from '../types/availability.js';

const BUILDER_SCORE_SLUG = 'builder_score';
const CREATOR_SCORE_SLUG = 'creator_score';

// Raw API response type (internal only)
interface TalentScoreItem {
  slug: string;
  points: number;
  last_calculated_at: string | null;
  // FORBIDDEN: rank_position - do not map
}

interface TalentScoresResponse {
  scores: TalentScoreItem[];
}

// Repository result type
export interface TalentRepositoryResult {
  availability: AvailabilityState;
  facet?: TalentFacet;
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

    // Filter and map known scores only
    const builderScoreItem = data.scores.find(s => s.slug === BUILDER_SCORE_SLUG);
    const creatorScoreItem = data.scores.find(s => s.slug === CREATOR_SCORE_SLUG);

    // If neither known score exists, treat as not found
    if (!builderScoreItem && !creatorScoreItem) {
      return { availability: 'not_found' };
    }

    // Build data object with available scores
    const talentData: TalentData = {
      builderScore: builderScoreItem?.points ?? 0,
      ...(creatorScoreItem ? { creatorScore: creatorScoreItem.points } : {}),
    };

    // Build signals object
    const talentSignals: TalentSignals = {
      verifiedBuilder: (builderScoreItem?.points ?? 0) > 0,
      ...(creatorScoreItem ? { verifiedCreator: creatorScoreItem.points > 0 } : {}),
    };

    // Use most recent last_calculated_at from available scores
    const lastUpdatedAt = builderScoreItem?.last_calculated_at
      ?? creatorScoreItem?.last_calculated_at
      ?? null;

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
