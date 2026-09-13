import { describe, expect, it } from 'vitest';
import { DetectionEngine } from '../../src/detection/engine.js';
import { DefaultRuleRegistry } from '../../src/detection/registry.js';
import type { DiagnosticRule } from '../../src/detection/types.js';
import type { EvidenceItem, EvidenceSet } from '../../src/domain/evidence.js';
import { createFinding } from '../../src/domain/findings/finding.js';

describe('DetectionEngine', () => {
  it('executes applicable rules deterministically and sorts findings by severity', async () => {
    const registry = new DefaultRuleRegistry();

    const lowRule: DiagnosticRule = {
      metadata: {
        id: 'system.uptime.short',
        name: 'Low Rule',
        category: 'system',
        description: 'Low severity rule',
        severity: 'LOW',
        confidence: 'HIGH',
      },
      isApplicable: () => true,
      evaluate: () => ({
        ruleId: 'system.uptime.short',
        status: 'WARN',
        finding: createFinding({
          ruleId: 'system.uptime.short',
          category: 'system',
          status: 'WARN',
          severity: 'LOW',
          confidence: 'HIGH',
          title: 'Low Rule',
          summary: 'Low warning',
        }),
      }),
    };

    const highRule: DiagnosticRule = {
      metadata: {
        id: 'system.memory.pressure',
        name: 'High Rule',
        category: 'system',
        description: 'High severity rule',
        severity: 'HIGH',
        confidence: 'HIGH',
      },
      isApplicable: () => true,
      evaluate: () => ({
        ruleId: 'system.memory.pressure',
        status: 'FAIL',
        finding: createFinding({
          ruleId: 'system.memory.pressure',
          category: 'system',
          status: 'FAIL',
          severity: 'HIGH',
          confidence: 'HIGH',
          title: 'High Rule',
          summary: 'High failure',
        }),
      }),
    };

    registry.register(lowRule);
    registry.register(highRule);

    const engine = new DetectionEngine(registry);
    const result = await engine.execute([]);

    expect(result.executedRules).toEqual(['system.uptime.short', 'system.memory.pressure']);
    expect(result.skippedRules).toHaveLength(0);
    expect(result.unavailableRules).toHaveLength(0);
    expect(result.errors).toHaveLength(0);

    // High severity finding must appear before Low severity finding in sorted output
    expect(result.findings).toHaveLength(2);
    expect(result.findings[0]?.severity).toBe('HIGH');
    expect(result.findings[1]?.severity).toBe('LOW');
  });

  it('records skipped rules when rule is not applicable', async () => {
    const registry = new DefaultRuleRegistry();
    const skippedRule: DiagnosticRule = {
      metadata: {
        id: 'process.development.zombie',
        name: 'Zombie Rule',
        category: 'process',
        description: 'Linux only rule',
        severity: 'LOW',
        confidence: 'HIGH',
      },
      isApplicable: (ctx) => ctx.platform === 'linux',
      evaluate: () => ({ ruleId: 'process.development.zombie', status: 'PASS' }),
    };

    registry.register(skippedRule);
    const engine = new DetectionEngine(registry);
    const result = await engine.execute([], { platform: 'win32' });

    expect(result.skippedRules).toContain('process.development.zombie');
    expect(result.executedRules).not.toContain('process.development.zombie');
    expect(result.findings).toHaveLength(0);
  });

  it('isolates rule errors without crashing engine and continues remaining rules', async () => {
    const registry = new DefaultRuleRegistry();

    const normalRule1: DiagnosticRule = {
      metadata: {
        id: 'system.platform.supported',
        name: 'Normal Rule 1',
        category: 'system',
        description: 'First rule',
        severity: 'INFO',
        confidence: 'HIGH',
      },
      isApplicable: () => true,
      evaluate: () => ({
        ruleId: 'system.platform.supported',
        status: 'PASS',
        finding: createFinding({
          ruleId: 'system.platform.supported',
          category: 'system',
          status: 'PASS',
          severity: 'INFO',
          confidence: 'HIGH',
          title: 'Normal 1',
          summary: 'Passed',
        }),
      }),
    };

    const faultyRule: DiagnosticRule = {
      metadata: {
        id: 'system.memory.pressure',
        name: 'Faulty Rule',
        category: 'system',
        description: 'Rule that throws',
        severity: 'HIGH',
        confidence: 'HIGH',
      },
      isApplicable: () => true,
      evaluate: () => {
        throw new Error('Unexpected catastrophic evaluation failure');
      },
    };

    const normalRule2: DiagnosticRule = {
      metadata: {
        id: 'system.uptime.short',
        name: 'Normal Rule 2',
        category: 'system',
        description: 'Third rule',
        severity: 'LOW',
        confidence: 'HIGH',
      },
      isApplicable: () => true,
      evaluate: () => ({
        ruleId: 'system.uptime.short',
        status: 'PASS',
        finding: createFinding({
          ruleId: 'system.uptime.short',
          category: 'system',
          status: 'PASS',
          severity: 'LOW',
          confidence: 'HIGH',
          title: 'Normal 2',
          summary: 'Passed',
        }),
      }),
    };

    registry.register(normalRule1);
    registry.register(faultyRule);
    registry.register(normalRule2);

    const engine = new DetectionEngine(registry);
    const result = await engine.execute([]);

    expect(result.errors).toContain('system.memory.pressure');
    expect(result.executedRules).toContain('system.platform.supported');
    expect(result.executedRules).toContain('system.uptime.short');

    // Findings must contain ERROR finding for faultyRule plus the other findings
    const errorFinding = result.findings.find((f) => f.ruleId === 'system.memory.pressure');
    expect(errorFinding).toBeDefined();
    expect(errorFinding?.status).toBe('ERROR');
    expect(errorFinding?.summary).toContain('Unexpected catastrophic evaluation failure');
  });

  it('flattens EvidenceSet[] inputs into individual EvidenceItem[] for rules', async () => {
    const registry = new DefaultRuleRegistry();
    let receivedEvidence: readonly EvidenceItem[] = [];

    const inspectorRule: DiagnosticRule = {
      metadata: {
        id: 'system.memory.pressure',
        name: 'Inspector Rule',
        category: 'system',
        description: 'Inspects evidence',
        severity: 'HIGH',
        confidence: 'HIGH',
      },
      isApplicable: () => true,
      evaluate: (_ctx, evidence) => {
        receivedEvidence = evidence;
        return { ruleId: 'system.memory.pressure', status: 'PASS' };
      },
    };

    registry.register(inspectorRule);
    const engine = new DetectionEngine(registry);

    const sets: readonly EvidenceSet[] = [
      {
        category: 'system',
        items: [
          {
            key: 'system.memory',
            source: 'os',
            availability: 'AVAILABLE',
            value: { utilizationPercent: 45 },
          },
        ],
      },
      {
        category: 'disk',
        items: [
          {
            key: 'disk.space',
            source: 'os',
            availability: 'AVAILABLE',
            value: { freePercent: 30 },
          },
        ],
      },
    ];

    await engine.execute(sets);
    expect(receivedEvidence).toHaveLength(2);
    expect(receivedEvidence[0]?.key).toBe('system.memory');
    expect(receivedEvidence[1]?.key).toBe('disk.space');
  });
});
