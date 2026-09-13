import { describe, it, expect } from 'vitest';
import { FINDING_STATUSES, isFindingStatus, type FindingStatus } from '../../src/domain/status.js';

describe('Domain - FindingStatus', () => {
  it('defines the exact authoritative 6 finding statuses', () => {
    expect(FINDING_STATUSES).toEqual(['PASS', 'FAIL', 'WARN', 'SKIPPED', 'UNAVAILABLE', 'ERROR']);
  });

  it('validates canonical statuses using isFindingStatus', () => {
    for (const status of FINDING_STATUSES) {
      expect(isFindingStatus(status)).toBe(true);
    }
  });

  it('rejects invalid or non-canonical status values', () => {
    expect(isFindingStatus('UNKNOWN')).toBe(false);
    expect(isFindingStatus('INFO')).toBe(false);
    expect(isFindingStatus('SUCCESS')).toBe(false);
    expect(isFindingStatus('FAILED')).toBe(false);
    expect(isFindingStatus('WARNING')).toBe(false);
    expect(isFindingStatus('NOT_APPLICABLE')).toBe(false);
    expect(isFindingStatus('pass')).toBe(false); // Case-sensitive
    expect(isFindingStatus('')).toBe(false);
    expect(isFindingStatus(null)).toBe(false);
    expect(isFindingStatus(undefined)).toBe(false);
    expect(isFindingStatus(123)).toBe(false);
  });

  it('allows typed assignment of canonical statuses', () => {
    const status: FindingStatus = 'PASS';
    expect(status).toBe('PASS');
  });
});
