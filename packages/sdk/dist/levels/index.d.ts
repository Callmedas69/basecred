/**
 * Level derivation service.
 */
import type { BaseCredLevel } from '../types/level.js';
/**
 * Derives Ethos credibility level from score.
 * Returns undefined if score is out of valid range (0-2800).
 */
export declare function deriveEthosCredibilityLevel(score: number): BaseCredLevel | undefined;
/**
 * Derives Talent builder level from score.
 * Returns undefined if score is negative.
 */
export declare function deriveBuilderLevel(score: number): BaseCredLevel | undefined;
/**
 * Derives Talent creator level from score.
 * Returns undefined if score is negative.
 */
export declare function deriveCreatorLevel(score: number): BaseCredLevel | undefined;
export { ETHOS_LEVEL_POLICY_V1 } from './ethos/v1.js';
export { BUILDER_LEVEL_POLICY_V1 } from './talent/v1.js';
export { CREATOR_LEVEL_POLICY_V1 } from './talent/creator-v1.js';
//# sourceMappingURL=index.d.ts.map