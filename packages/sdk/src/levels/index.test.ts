/**
 * Level derivation integration tests.
 *
 * Tests the level derivation functions exported from the levels module.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveEthosCredibilityLevel,
  deriveBuilderLevel,
  ETHOS_LEVEL_POLICY_V1,
  BUILDER_LEVEL_POLICY_V1,
} from './index.js';

describe('Level derivation exports', () => {
  it('exports deriveEthosCredibilityLevel function', () => {
    expect(typeof deriveEthosCredibilityLevel).toBe('function');
  });

  it('exports deriveBuilderLevel function', () => {
    expect(typeof deriveBuilderLevel).toBe('function');
  });

  it('exports ETHOS_LEVEL_POLICY_V1', () => {
    expect(ETHOS_LEVEL_POLICY_V1.id).toBe('ethos@v1');
  });

  it('exports BUILDER_LEVEL_POLICY_V1', () => {
    expect(BUILDER_LEVEL_POLICY_V1.id).toBe('builder@v1');
  });
});

describe('Level derivation determinism', () => {
  it('Ethos derivation is deterministic', () => {
    const score = 1500;
    const result1 = deriveEthosCredibilityLevel(score);
    const result2 = deriveEthosCredibilityLevel(score);
    expect(result1).toEqual(result2);
  });

  it('Builder derivation is deterministic', () => {
    const score = 150;
    const result1 = deriveBuilderLevel(score);
    const result2 = deriveBuilderLevel(score);
    expect(result1).toEqual(result2);
  });
});
