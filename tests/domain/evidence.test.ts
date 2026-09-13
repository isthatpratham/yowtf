import { describe, it, expect } from 'vitest';
import {
  EVIDENCE_AVAILABILITIES,
  isEvidenceAvailability,
  type EvidenceItem,
  type FindingEvidence,
} from '../../src/domain/evidence.js';

describe('Domain - Evidence Models', () => {
  it('defines the 4 authoritative evidence availability states', () => {
    expect(EVIDENCE_AVAILABILITIES).toEqual([
      'AVAILABLE',
      'UNAVAILABLE',
      'FAILED',
      'NOT_APPLICABLE',
    ]);
  });

  it('validates availability states with isEvidenceAvailability', () => {
    for (const state of EVIDENCE_AVAILABILITIES) {
      expect(isEvidenceAvailability(state)).toBe(true);
    }
  });

  it('rejects invalid availability states', () => {
    expect(isEvidenceAvailability('MISSING')).toBe(false);
    expect(isEvidenceAvailability('available')).toBe(false);
    expect(isEvidenceAvailability(null)).toBe(false);
  });

  it('structures evidence items deterministically with normalized values, type, and units', () => {
    const item: EvidenceItem<number> = {
      key: 'system.memory.utilization',
      source: 'os.freemem',
      type: 'percentage',
      availability: 'AVAILABLE',
      value: 92.5,
      unit: 'percent',
      metadata: { threshold: 90 },
    };

    expect(item.key).toBe('system.memory.utilization');
    expect(item.source).toBe('os.freemem');
    expect(item.type).toBe('percentage');
    expect(item.availability).toBe('AVAILABLE');
    expect(item.value).toBe(92.5);
    expect(item.unit).toBe('percent');
    expect(item.metadata?.threshold).toBe(90);
  });

  it('distinguishes NOT_APPLICABLE from UNAVAILABLE and FAILED', () => {
    const notApplicableItem: EvidenceItem = {
      key: 'runtime.python.version',
      source: 'python3',
      availability: 'NOT_APPLICABLE',
    };
    expect(notApplicableItem.availability).toBe('NOT_APPLICABLE');
  });

  it('attaches structured evidence items to FindingEvidence container', () => {
    const item: EvidenceItem<string> = {
      key: 'runtime.node.version',
      source: 'process.version',
      availability: 'AVAILABLE',
      value: 'v20.11.1',
    };

    const evidence: FindingEvidence = {
      items: [item],
      details: { detectedEngine: '>=20.0.0' },
    };

    expect(evidence.items).toHaveLength(1);
    expect(evidence.items[0]?.key).toBe('runtime.node.version');
    expect(evidence.details?.detectedEngine).toBe('>=20.0.0');
  });
});
