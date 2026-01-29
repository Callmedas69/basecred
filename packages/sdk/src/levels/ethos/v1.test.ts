/**
 * Ethos Credibility Level Policy v1 Tests
 */

import { describe, it, expect } from 'vitest';
import { ETHOS_LEVEL_POLICY_V1 } from './v1.js';
import { deriveEthosCredibilityLevel } from '../index.js';

describe('ETHOS_LEVEL_POLICY_V1', () => {
  it('has correct policy id', () => {
    expect(ETHOS_LEVEL_POLICY_V1.id).toBe('ethos@v1');
  });

  it('has 10 level thresholds', () => {
    expect(ETHOS_LEVEL_POLICY_V1.thresholds).toHaveLength(10);
  });

  it('policy snapshot matches expected definition', () => {
    expect(ETHOS_LEVEL_POLICY_V1).toMatchSnapshot();
  });
});

describe('deriveEthosCredibilityLevel', () => {
  describe('boundary values', () => {
    // Untrusted: 0-799
    it('returns Untrusted at score 0 (min)', () => {
      const result = deriveEthosCredibilityLevel(0);
      expect(result?.level).toBe('Untrusted');
      expect(result?.levelPolicy).toBe('ethos@v1');
      expect(result?.levelSource).toBe('sdk');
    });

    it('returns Untrusted at score 799 (max)', () => {
      const result = deriveEthosCredibilityLevel(799);
      expect(result?.level).toBe('Untrusted');
    });

    // Questionable: 800-1199
    it('returns Questionable at score 800 (min)', () => {
      const result = deriveEthosCredibilityLevel(800);
      expect(result?.level).toBe('Questionable');
    });

    it('returns Questionable at score 1199 (max)', () => {
      const result = deriveEthosCredibilityLevel(1199);
      expect(result?.level).toBe('Questionable');
    });

    // Neutral: 1200-1399
    it('returns Neutral at score 1200 (min / default)', () => {
      const result = deriveEthosCredibilityLevel(1200);
      expect(result?.level).toBe('Neutral');
    });

    it('returns Neutral at score 1399 (max)', () => {
      const result = deriveEthosCredibilityLevel(1399);
      expect(result?.level).toBe('Neutral');
    });

    // Known: 1400-1599
    it('returns Known at score 1400 (min)', () => {
      const result = deriveEthosCredibilityLevel(1400);
      expect(result?.level).toBe('Known');
    });

    it('returns Known at score 1599 (max)', () => {
      const result = deriveEthosCredibilityLevel(1599);
      expect(result?.level).toBe('Known');
    });

    // Established: 1600-1799
    it('returns Established at score 1600 (min)', () => {
      const result = deriveEthosCredibilityLevel(1600);
      expect(result?.level).toBe('Established');
    });

    it('returns Established at score 1799 (max)', () => {
      const result = deriveEthosCredibilityLevel(1799);
      expect(result?.level).toBe('Established');
    });

    // Reputable: 1800-1999
    it('returns Reputable at score 1800 (min)', () => {
      const result = deriveEthosCredibilityLevel(1800);
      expect(result?.level).toBe('Reputable');
    });

    it('returns Reputable at score 1999 (max)', () => {
      const result = deriveEthosCredibilityLevel(1999);
      expect(result?.level).toBe('Reputable');
    });

    // Exemplary: 2000-2199
    it('returns Exemplary at score 2000 (min)', () => {
      const result = deriveEthosCredibilityLevel(2000);
      expect(result?.level).toBe('Exemplary');
    });

    it('returns Exemplary at score 2199 (max)', () => {
      const result = deriveEthosCredibilityLevel(2199);
      expect(result?.level).toBe('Exemplary');
    });

    // Distinguished: 2200-2399
    it('returns Distinguished at score 2200 (min)', () => {
      const result = deriveEthosCredibilityLevel(2200);
      expect(result?.level).toBe('Distinguished');
    });

    it('returns Distinguished at score 2399 (max)', () => {
      const result = deriveEthosCredibilityLevel(2399);
      expect(result?.level).toBe('Distinguished');
    });

    // Revered: 2400-2599
    it('returns Revered at score 2400 (min)', () => {
      const result = deriveEthosCredibilityLevel(2400);
      expect(result?.level).toBe('Revered');
    });

    it('returns Revered at score 2599 (max)', () => {
      const result = deriveEthosCredibilityLevel(2599);
      expect(result?.level).toBe('Revered');
    });

    // Renowned: 2600-2800
    it('returns Renowned at score 2600 (min)', () => {
      const result = deriveEthosCredibilityLevel(2600);
      expect(result?.level).toBe('Renowned');
    });

    it('returns Renowned at score 2800 (max)', () => {
      const result = deriveEthosCredibilityLevel(2800);
      expect(result?.level).toBe('Renowned');
    });
  });

  describe('out of range values', () => {
    it('returns undefined for negative scores', () => {
      const result = deriveEthosCredibilityLevel(-1);
      expect(result).toBeUndefined();
    });

    it('returns undefined for scores above 2800', () => {
      const result = deriveEthosCredibilityLevel(2801);
      expect(result).toBeUndefined();
    });
  });

  describe('result structure', () => {
    it('returns correct BaseCredLevel structure', () => {
      const result = deriveEthosCredibilityLevel(1500);
      expect(result).toEqual({
        value: 1500,
        level: 'Known',
        levelSource: 'sdk',
        levelPolicy: 'ethos@v1',
      });
    });
  });
});
