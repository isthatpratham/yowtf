import { describe, it, expect } from 'vitest';
import {
  FINDING_CONFIDENCES,
  isFindingConfidence,
  type FindingConfidence,
} from '../../src/domain/confidence.js';

describe('Domain - FindingConfidence', () => {
  it('defines the exact authoritative 3 confidence levels', () => {
    expect(FINDING_CONFIDENCES).toEqual(['HIGH', 'MEDIUM', 'LOW']);
  });

  it('validates canonical confidence levels using isFindingConfidence', () => {
    for (const conf of FINDING_CONFIDENCES) {
      expect(isFindingConfidence(conf)).toBe(true);
    }
  });

  it('rejects invalid or non-canonical confidence values', () => {
    expect(isFindingConfidence('CERTAIN')).toBe(false);
    expect(isFindingConfidence('VERY_HIGH')).toBe(false);
    expect(isFindingConfidence('high')).toBe(false); // Case-sensitive
    expect(isFindingConfidence('')).toBe(false);
    expect(isFindingConfidence(null)).toBe(false);
    expect(isFindingConfidence(undefined)).toBe(false);
  });

  it('allows typed assignment of canonical confidences', () => {
    const conf: FindingConfidence = 'HIGH';
    expect(conf).toBe('HIGH');
  });
});
