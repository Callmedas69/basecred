/**
 * Talent Protocol Builder Level Policy v1
 *
 * Source: Talent Protocol Builder Score Levels documentation
 * Score range: 0+ (uncapped)
 * Levels are absolute score thresholds, not percentiles.
 *
 * IMMUTABLE: This file MUST NOT be modified.
 * Changes require a new version (v2.ts).
 */
export const BUILDER_LEVEL_POLICY_V1 = {
    id: 'builder@v1',
    thresholds: [
        { min: 0, max: 39, label: 'Novice' },
        { min: 40, max: 79, label: 'Apprentice' },
        { min: 80, max: 119, label: 'Practitioner' },
        { min: 120, max: 169, label: 'Advanced' },
        { min: 170, max: 249, label: 'Expert' },
        { min: 250, max: Infinity, label: 'Master' },
    ],
};
