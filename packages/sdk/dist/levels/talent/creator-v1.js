/**
 * Talent Protocol Creator Level Policy v1
 *
 * Source: Talent Protocol Creator Score Levels documentation
 * Score range: 0+ (uncapped)
 * Levels are absolute score thresholds, not percentiles.
 *
 * IMMUTABLE: This file MUST NOT be modified.
 * Changes require a new version (creator-v2.ts).
 */
export const CREATOR_LEVEL_POLICY_V1 = {
    id: 'creator@v1',
    thresholds: [
        { min: 0, max: 39, label: 'Emerging' },
        { min: 40, max: 79, label: 'Growing' },
        { min: 80, max: 119, label: 'Established' },
        { min: 120, max: 169, label: 'Accomplished' },
        { min: 170, max: 249, label: 'Prominent' },
        { min: 250, max: Infinity, label: 'Elite' },
    ],
};
