/**
 * Internal types for level policies.
 */

export interface LevelThreshold {
  min: number;
  max: number;
  label: string;
}

export interface LevelPolicy {
  id: string;                    // e.g., "ethos@v1"
  thresholds: LevelThreshold[];  // Ordered by min ascending
}
