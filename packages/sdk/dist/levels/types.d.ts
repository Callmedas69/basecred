/**
 * Internal types for level policies.
 */
export interface LevelThreshold {
    min: number;
    max: number;
    label: string;
}
export interface LevelPolicy {
    id: string;
    thresholds: LevelThreshold[];
}
//# sourceMappingURL=types.d.ts.map