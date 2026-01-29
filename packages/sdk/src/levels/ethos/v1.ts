/**
 * Ethos Credibility Level Policy v1
 *
 * Source: Ethos Credibility Score documentation
 * Score range: 0-2800
 * Default starting score: 1200 ("Neutral")
 *
 * IMMUTABLE: This file MUST NOT be modified.
 * Changes require a new version (v2.ts).
 */

import type { LevelPolicy } from '../types.js';

export const ETHOS_LEVEL_POLICY_V1: LevelPolicy = {
  id: 'ethos@v1',
  thresholds: [
    { min: 0, max: 799, label: 'Untrusted' },
    { min: 800, max: 1199, label: 'Questionable' },
    { min: 1200, max: 1399, label: 'Neutral' },
    { min: 1400, max: 1599, label: 'Known' },
    { min: 1600, max: 1799, label: 'Established' },
    { min: 1800, max: 1999, label: 'Reputable' },
    { min: 2000, max: 2199, label: 'Exemplary' },
    { min: 2200, max: 2399, label: 'Distinguished' },
    { min: 2400, max: 2599, label: 'Revered' },
    { min: 2600, max: 2800, label: 'Renowned' },
  ],
} as const;
