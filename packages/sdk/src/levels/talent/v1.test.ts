/**
 * Talent Protocol Builder Level Policy v1 Tests
 */

import { describe, it, expect } from 'vitest';
import { BUILDER_LEVEL_POLICY_V1 } from './v1.js';
import { deriveBuilderLevel } from '../index.js';

describe('BUILDER_LEVEL_POLICY_V1', () => {
  it('has correct policy id', () => {
    expect(BUILDER_LEVEL_POLICY_V1.id).toBe('builder@v1');
  });

  it('has 6 level thresholds', () => {
    expect(BUILDER_LEVEL_POLICY_V1.thresholds).toHaveLength(6);
  });

  it('policy snapshot matches expected definition', () => {
    expect(BUILDER_LEVEL_POLICY_V1).toMatchSnapshot();
  });
});

describe('deriveBuilderLevel', () => {
  describe('boundary values', () => {
    // Novice: 0-39
    it('returns Novice at score 0 (min)', () => {
      const result = deriveBuilderLevel(0);
      expect(result?.level).toBe('Novice');
      expect(result?.levelPolicy).toBe('builder@v1');
      expect(result?.levelSource).toBe('sdk');
    });

    it('returns Novice at score 39 (max)', () => {
      const result = deriveBuilderLevel(39);
      expect(result?.level).toBe('Novice');
    });

    // Apprentice: 40-79
    it('returns Apprentice at score 40 (min)', () => {
      const result = deriveBuilderLevel(40);
      expect(result?.level).toBe('Apprentice');
    });

    it('returns Apprentice at score 79 (max)', () => {
      const result = deriveBuilderLevel(79);
      expect(result?.level).toBe('Apprentice');
    });

    // Practitioner: 80-119
    it('returns Practitioner at score 80 (min)', () => {
      const result = deriveBuilderLevel(80);
      expect(result?.level).toBe('Practitioner');
    });

    it('returns Practitioner at score 119 (max)', () => {
      const result = deriveBuilderLevel(119);
      expect(result?.level).toBe('Practitioner');
    });

    // Advanced: 120-169
    it('returns Advanced at score 120 (min)', () => {
      const result = deriveBuilderLevel(120);
      expect(result?.level).toBe('Advanced');
    });

    it('returns Advanced at score 169 (max)', () => {
      const result = deriveBuilderLevel(169);
      expect(result?.level).toBe('Advanced');
    });

    // Expert: 170-249
    it('returns Expert at score 170 (min)', () => {
      const result = deriveBuilderLevel(170);
      expect(result?.level).toBe('Expert');
    });

    it('returns Expert at score 249 (max)', () => {
      const result = deriveBuilderLevel(249);
      expect(result?.level).toBe('Expert');
    });

    // Master: 250+
    it('returns Master at score 250 (min)', () => {
      const result = deriveBuilderLevel(250);
      expect(result?.level).toBe('Master');
    });

    it('returns Master at very high scores', () => {
      const result = deriveBuilderLevel(1000);
      expect(result?.level).toBe('Master');
    });

    it('returns Master at extremely high scores', () => {
      const result = deriveBuilderLevel(10000);
      expect(result?.level).toBe('Master');
    });
  });

  describe('out of range values', () => {
    it('returns undefined for negative scores', () => {
      const result = deriveBuilderLevel(-1);
      expect(result).toBeUndefined();
    });
  });

  describe('result structure', () => {
    it('returns correct BaseCredLevel structure', () => {
      const result = deriveBuilderLevel(150);
      expect(result).toEqual({
        value: 150,
        level: 'Advanced',
        levelSource: 'sdk',
        levelPolicy: 'builder@v1',
      });
    });
  });
});
