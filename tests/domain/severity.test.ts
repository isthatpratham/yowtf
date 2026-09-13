import { describe, it, expect } from 'vitest';
import {
  FINDING_SEVERITIES,
  isFindingSeverity,
  type FindingSeverity,
} from '../../src/domain/severity.js';

describe('Domain - FindingSeverity', () => {
  it('defines the exact authoritative 5 severity levels', () => {
    expect(FINDING_SEVERITIES).toEqual(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);
  });

  it('validates canonical severities using isFindingSeverity', () => {
    for (const severity of FINDING_SEVERITIES) {
      expect(isFindingSeverity(severity)).toBe(true);
    }
  });

  it('rejects invalid or non-canonical severity values', () => {
    expect(isFindingSeverity('FATAL')).toBe(false);
    expect(isFindingSeverity('BLOCKER')).toBe(false);
    expect(isFindingSeverity('MODERATE')).toBe(false);
    expect(isFindingSeverity('critical')).toBe(false); // Case-sensitive
    expect(isFindingSeverity('')).toBe(false);
    expect(isFindingSeverity(null)).toBe(false);
    expect(isFindingSeverity(undefined)).toBe(false);
  });

  it('allows typed assignment of canonical severities', () => {
    const sev: FindingSeverity = 'CRITICAL';
    expect(sev).toBe('CRITICAL');
  });
});
