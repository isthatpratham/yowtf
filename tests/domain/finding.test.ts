import { describe, it, expect } from 'vitest';
import { createFinding, type Finding } from '../../src/domain/findings/finding.js';

describe('Domain - Finding Model', () => {
  it('creates an immutable finding with all required fields', () => {
    const finding = createFinding({
      ruleId: 'system.memory.pressure',
      category: 'system',
      status: 'FAIL',
      severity: 'HIGH',
      confidence: 'HIGH',
      title: 'High Memory Pressure',
      summary: 'System memory utilization is above 90%',
    });

    expect(finding.ruleId).toBe('system.memory.pressure');
    expect(finding.category).toBe('system');
    expect(finding.status).toBe('FAIL');
    expect(finding.severity).toBe('HIGH');
    expect(finding.confidence).toBe('HIGH');
    expect(finding.title).toBe('High Memory Pressure');
    expect(finding.summary).toBe('System memory utilization is above 90%');
    expect(finding.explanation).toBeUndefined();
    expect(finding.impact).toBeUndefined();
    expect(finding.remediationHint).toBeUndefined();
    expect(finding.evidence).toBeUndefined();

    // Verify immutability
    expect(Object.isFrozen(finding)).toBe(true);
  });

  it('preserves optional explanation, impact, remediationHint, and evidence', () => {
    const finding: Finding = createFinding({
      ruleId: 'runtime.node.unpinned',
      category: 'runtime',
      status: 'WARN',
      severity: 'MEDIUM',
      confidence: 'HIGH',
      title: 'Node.js Version Unpinned',
      summary: 'No .nvmrc or .node-version file was found in the project root',
      explanation:
        'Unpinned runtime versions can lead to subtle cross-environment inconsistencies.',
      impact:
        'Different developers or CI runners may execute the project with different Node versions.',
      remediationHint: 'Create a .nvmrc or .node-version file pinned to Node 20+.',
      evidence: {
        items: [
          {
            key: 'project.root.files',
            source: 'fs.readdir',
            availability: 'AVAILABLE',
            value: ['package.json', 'README.md'],
          },
        ],
      },
    });

    expect(finding.explanation).toContain('Unpinned runtime versions');
    expect(finding.impact).toContain('Different developers');
    expect(finding.remediationHint).toContain('Create a .nvmrc');
    expect(finding.evidence?.items).toHaveLength(1);

    // Verify deep immutability on nested evidence
    expect(Object.isFrozen(finding)).toBe(true);
    expect(Object.isFrozen(finding.evidence)).toBe(true);
    expect(Object.isFrozen(finding.evidence?.items)).toBe(true);
    expect(Object.isFrozen(finding.evidence?.items[0])).toBe(true);
  });

  it('can represent UNAVAILABLE status without being a failure', () => {
    const finding = createFinding({
      ruleId: 'tool.docker.daemon-down',
      category: 'tool',
      status: 'UNAVAILABLE',
      severity: 'INFO',
      confidence: 'HIGH',
      title: 'Docker Daemon Unavailable',
      summary: 'Docker CLI was found but daemon socket is not responding',
      explanation: 'Docker is optional and not required for normal workstation diagnostics.',
    });

    expect(finding.status).toBe('UNAVAILABLE');
    expect(finding.severity).toBe('INFO');
  });

  it('can represent SKIPPED status for non-applicable rules', () => {
    const finding = createFinding({
      ruleId: 'runtime.python.version',
      category: 'runtime',
      status: 'SKIPPED',
      severity: 'INFO',
      confidence: 'HIGH',
      title: 'Python Check Skipped',
      summary: 'No Python project files detected; Python inspection is not applicable',
    });

    expect(finding.status).toBe('SKIPPED');
  });

  it('rejects invalid rule IDs during creation', () => {
    expect(() =>
      createFinding({
        ruleId: 'InvalidRuleId',
        category: 'system',
        status: 'PASS',
        severity: 'INFO',
        confidence: 'HIGH',
        title: 'Title',
        summary: 'Summary',
      }),
    ).toThrow(/Invalid ruleId/);
  });

  it('rejects invalid category, status, severity, or confidence', () => {
    expect(() =>
      createFinding({
        ruleId: 'system.memory.pressure',
        category: 'invalid-cat' as never,
        status: 'PASS',
        severity: 'INFO',
        confidence: 'HIGH',
        title: 'Title',
        summary: 'Summary',
      }),
    ).toThrow(/Invalid diagnostic category/);

    expect(() =>
      createFinding({
        ruleId: 'system.memory.pressure',
        category: 'system',
        status: 'SUCCESS' as never,
        severity: 'INFO',
        confidence: 'HIGH',
        title: 'Title',
        summary: 'Summary',
      }),
    ).toThrow(/Invalid finding status/);

    expect(() =>
      createFinding({
        ruleId: 'system.memory.pressure',
        category: 'system',
        status: 'PASS',
        severity: 'CRITICAL_ERROR' as never,
        confidence: 'HIGH',
        title: 'Title',
        summary: 'Summary',
      }),
    ).toThrow(/Invalid finding severity/);

    expect(() =>
      createFinding({
        ruleId: 'system.memory.pressure',
        category: 'system',
        status: 'PASS',
        severity: 'INFO',
        confidence: 'MAYBE' as never,
        title: 'Title',
        summary: 'Summary',
      }),
    ).toThrow(/Invalid finding confidence/);
  });

  it('rejects empty title or summary', () => {
    expect(() =>
      createFinding({
        ruleId: 'system.memory.pressure',
        category: 'system',
        status: 'PASS',
        severity: 'INFO',
        confidence: 'HIGH',
        title: '   ',
        summary: 'Summary',
      }),
    ).toThrow(/Finding title must be a non-empty string/);

    expect(() =>
      createFinding({
        ruleId: 'system.memory.pressure',
        category: 'system',
        status: 'PASS',
        severity: 'INFO',
        confidence: 'HIGH',
        title: 'Title',
        summary: '',
      }),
    ).toThrow(/Finding summary must be a non-empty string/);
  });
});
