import { describe, expect, it } from 'vitest';
import { DetectionEngine } from '../../src/detection/engine.js';
import { createDefaultRuleRegistry } from '../../src/detection/registry.js';
import type { EvidenceItem } from '../../src/domain/evidence.js';

describe('Detection Layer Privacy & Read-Only Invariants', () => {
  it('does not expose secret values in findings when evaluating environment or config rules', async () => {
    const SECRET_VALUE_1 = 'super-secret-password-12345';
    const SECRET_VALUE_2 = 'sk-live-abcdef1234567890';

    const evidenceWithSecrets: EvidenceItem[] = [
      {
        key: 'environment.variables',
        source: 'test',
        availability: 'AVAILABLE',
        value: {
          variableNames: ['AWS_SECRET_ACCESS_KEY', 'DATABASE_PASSWORD'],
          // Intentionally checking that if a collector leaked a value or a test had it, the rule does not print it
          rawSecrets: [SECRET_VALUE_1, SECRET_VALUE_2],
        },
      },
      {
        key: 'config.required.keys',
        source: 'test',
        availability: 'AVAILABLE',
        value: {
          requiredKeys: ['DATABASE_URL', 'API_KEY'],
          missingKeys: ['API_KEY'],
        },
      },
    ];

    const engine = new DetectionEngine(createDefaultRuleRegistry());
    const result = await engine.execute(evidenceWithSecrets);

    for (const finding of result.findings) {
      const serialized = JSON.stringify(finding);
      expect(serialized).not.toContain(SECRET_VALUE_1);
      expect(serialized).not.toContain(SECRET_VALUE_2);
    }
  });

  it('preserves evidence immutability and does not mutate input evidence objects', async () => {
    const originalEvidence: EvidenceItem[] = [
      {
        key: 'system.memory',
        source: 'test',
        availability: 'AVAILABLE',
        value: { utilizationPercent: 50 },
      },
      {
        key: 'disk.space',
        source: 'test',
        availability: 'AVAILABLE',
        value: { freePercent: 25 },
      },
    ];

    const snapshot = JSON.stringify(originalEvidence);
    const engine = new DetectionEngine(createDefaultRuleRegistry());
    await engine.execute(originalEvidence);

    expect(JSON.stringify(originalEvidence)).toBe(snapshot);
  });
});
