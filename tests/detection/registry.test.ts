import { describe, expect, it } from 'vitest';
import { DefaultRuleRegistry, createDefaultRuleRegistry } from '../../src/detection/registry.js';
import type { DiagnosticRule } from '../../src/detection/types.js';

describe('DefaultRuleRegistry', () => {
  it('registers and lists rules deterministically', () => {
    const registry = new DefaultRuleRegistry();
    const dummyRule: DiagnosticRule = {
      metadata: {
        id: 'system.memory.pressure',
        name: 'Test Rule',
        category: 'system',
        description: 'Test Description',
        severity: 'HIGH',
        confidence: 'HIGH',
      },
      isApplicable: () => true,
      evaluate: () => ({ ruleId: 'system.memory.pressure', status: 'PASS' }),
    };

    registry.register(dummyRule);
    expect(registry.list()).toHaveLength(1);
    expect(registry.get('system.memory.pressure')).toBe(dummyRule);
  });

  it('rejects duplicate rule ID registration', () => {
    const registry = new DefaultRuleRegistry();
    const dummyRule: DiagnosticRule = {
      metadata: {
        id: 'system.memory.pressure',
        name: 'Test Rule',
        category: 'system',
        description: 'Test Description',
        severity: 'HIGH',
        confidence: 'HIGH',
      },
      isApplicable: () => true,
      evaluate: () => ({ ruleId: 'system.memory.pressure', status: 'PASS' }),
    };

    registry.register(dummyRule);
    expect(() => registry.register(dummyRule)).toThrowError(/Duplicate rule registration/);
  });

  it('createDefaultRuleRegistry populates exactly 60 V1 rules', () => {
    const registry = createDefaultRuleRegistry();
    const rules = registry.list();
    expect(rules).toHaveLength(60);

    const ids = rules.map((r) => r.metadata.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(60);
  });

  it('filters rules by command scope', () => {
    const registry = createDefaultRuleRegistry();

    const systemRules = registry.select({ commandScope: 'system' });
    expect(systemRules.length).toBe(5);
    expect(systemRules.every((r) => r.metadata.category === 'system')).toBe(true);

    const portRules = registry.select({ commandScope: 'ports' });
    expect(portRules.length).toBe(4);
    expect(portRules.every((r) => r.metadata.category === 'port')).toBe(true);

    const allRules = registry.select({ commandScope: 'all' });
    expect(allRules.length).toBe(60);

    const doctorRules = registry.select({ commandScope: 'doctor' });
    expect(doctorRules.length).toBe(60);
  });
});
