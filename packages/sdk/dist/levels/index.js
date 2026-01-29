/**
 * Level derivation service.
 */
import { ETHOS_LEVEL_POLICY_V1 } from './ethos/v1.js';
import { BUILDER_LEVEL_POLICY_V1 } from './talent/v1.js';
import { CREATOR_LEVEL_POLICY_V1 } from './talent/creator-v1.js';
/**
 * Derives a level from a score using the given policy.
 * Returns undefined if score is out of range.
 */
function deriveLevel(score, policy) {
    // Find matching threshold (thresholds are ordered by min ascending)
    for (const threshold of policy.thresholds) {
        if (score >= threshold.min && score <= threshold.max) {
            return {
                value: score,
                level: threshold.label,
                levelSource: 'sdk',
                levelPolicy: policy.id,
            };
        }
    }
    // Out of range — graceful degradation
    return undefined;
}
/**
 * Derives Ethos credibility level from score.
 * Returns undefined if score is out of valid range (0-2800).
 */
export function deriveEthosCredibilityLevel(score) {
    return deriveLevel(score, ETHOS_LEVEL_POLICY_V1);
}
/**
 * Derives Talent builder level from score.
 * Returns undefined if score is negative.
 */
export function deriveBuilderLevel(score) {
    return deriveLevel(score, BUILDER_LEVEL_POLICY_V1);
}
/**
 * Derives Talent creator level from score.
 * Returns undefined if score is negative.
 */
export function deriveCreatorLevel(score) {
    return deriveLevel(score, CREATOR_LEVEL_POLICY_V1);
}
// Re-export policies for testing
export { ETHOS_LEVEL_POLICY_V1 } from './ethos/v1.js';
export { BUILDER_LEVEL_POLICY_V1 } from './talent/v1.js';
export { CREATOR_LEVEL_POLICY_V1 } from './talent/creator-v1.js';
