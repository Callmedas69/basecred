/**
 * BaseCredLevel — Tiered score with semantic level interpretation.
 */
export interface BaseCredLevel {
    value: number;
    level: string;
    levelSource: 'protocol' | 'sdk';
    levelPolicy: string;
}
//# sourceMappingURL=level.d.ts.map