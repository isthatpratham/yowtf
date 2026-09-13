import { describe, expect, it } from 'vitest';
import { DetectionService } from '../../src/application/services/detection.service.js';
import type { EvidenceItem } from '../../src/domain/evidence.js';

describe('DetectionService', () => {
  it('orchestrates detection against evidence and returns structured DetectionResult', async () => {
    const service = new DetectionService();
    const evidence: EvidenceItem[] = [
      {
        key: 'system.platform.supported',
        source: 'test',
        availability: 'AVAILABLE',
        value: { platform: 'win32', isSupported: true },
      },
    ];

    const result = await service.runDetection(evidence, { platform: 'win32' });
    expect(result.executedRules).toContain('system.platform.supported');
    expect(result.findings.some((f) => f.ruleId === 'system.platform.supported')).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
