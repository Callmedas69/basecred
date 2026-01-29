/**
 * Talent Protocol Creator Level Policy v1 Tests
 */

import { describe, it, expect } from 'vitest';
import { CREATOR_LEVEL_POLICY_V1 } from './creator-v1.js';
import { deriveCreatorLevel } from '../index.js';

describe('CREATOR_LEVEL_POLICY_V1', () => {
  it('has correct policy id', () => {
    expect(CREATOR_LEVEL_POLICY_V1.id).toBe('creator@v1');
  });

  it('has 6 level thresholds', () => {
    expect(CREATOR_LEVEL_POLICY_V1.thresholds).toHaveLength(6);
  });

  it('policy snapshot matches expected definition', () => {
    expect(CREATOR_LEVEL_POLICY_V1).toMatchSnapshot();
  });
});

describe('deriveCreatorLevel', () => {
  describe('boundary values', () => {
    // Emerging: 0-39
    it('returns Emerging at score 0 (min)', () => {
      const result = deriveCreatorLevel(0);
      expect(result?.level).toBe('Emerging');
      expect(result?.levelPolicy).toBe('creator@v1');
      expect(result?.levelSource).toBe('sdk');
    });

    it('returns Emerging at score 39 (max)', () => {
      const result = deriveCreatorLevel(39);
      expect(result?.level).toBe('Emerging');
    });

    // Growing: 40-79
    it('returns Growing at score 40 (min)', () => {
      const result = deriveCreatorLevel(40);
      expect(result?.level).toBe('Growing');
    });

    it('returns Growing at score 79 (max)', () => {
      const result = deriveCreatorLevel(79);
      expect(result?.level).toBe('Growing');
    });

    // Established: 80-119
    it('returns Established at score 80 (min)', () => {
      const result = deriveCreatorLevel(80);
      expect(result?.level).toBe('Established');
    });

    it('returns Established at score 119 (max)', () => {
      const result = deriveCreatorLevel(119);
      expect(result?.level).toBe('Established');
    });

    // Accomplished: 120-169
    it('returns Accomplished at score 120 (min)', () => {
      const result = deriveCreatorLevel(120);
      expect(result?.level).toBe('Accomplished');
    });

    it('returns Accomplished at score 169 (max)', () => {
      const result = deriveCreatorLevel(169);
      expect(result?.level).toBe('Accomplished');
    });

    // Prominent: 170-249
    it('returns Prominent at score 170 (min)', () => {
      const result = deriveCreatorLevel(170);
      expect(result?.level).toBe('Prominent');
    });

    it('returns Prominent at score 249 (max)', () => {
      const result = deriveCreatorLevel(249);
      expect(result?.level).toBe('Prominent');
    });

    // Elite: 250+
    it('returns Elite at score 250 (min)', () => {
      const result = deriveCreatorLevel(250);
      expect(result?.level).toBe('Elite');
    });

    it('returns Elite at very high scores', () => {
      const result = deriveCreatorLevel(1000);
      expect(result?.level).toBe('Elite');
    });

    it('returns Elite at extremely high scores', () => {
      const result = deriveCreatorLevel(10000);
      expect(result?.level).toBe('Elite');
    });
  });

  describe('out of range values', () => {
    it('returns undefined for negative scores', () => {
      const result = deriveCreatorLevel(-1);
      expect(result).toBeUndefined();
    });
  });

  describe('result structure', () => {
    it('returns correct BaseCredLevel structure', () => {
      const result = deriveCreatorLevel(150);
      expect(result).toEqual({
        value: 150,
        level: 'Accomplished',
        levelSource: 'sdk',
        levelPolicy: 'creator@v1',
      });
    });
  });
});
