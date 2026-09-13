import { describe, it, expect } from 'vitest';
import type { DetectionResult } from '../../src/domain/detection-result.js';
import type { DiagnosticResult } from '../../src/domain/index.js';
import { createFinding } from '../../src/domain/findings/finding.js';

describe('Domain - DetectionResult & DiagnosticResult', () => {
  it('preserves coverage transparency with executed, skipped, unavailable rules and errors', () => {
    const finding = createFinding({
      ruleId: 'system.memory.pressure',
      category: 'system',
      status: 'PASS',
      severity: 'INFO',
      confidence: 'HIGH',
      title: 'Memory Healthy',
      summary: 'System memory is within normal limits',
    });

    const result: DetectionResult = {
      findings: [finding],
      executedRules: ['system.memory.pressure', 'disk.space.low'],
      skippedRules: ['runtime.python.version'],
      unavailableRules: ['tool.docker.daemon-down'],
      errors: [],
    };

    expect(result.findings).toHaveLength(1);
    expect(result.executedRules).toEqual(['system.memory.pressure', 'disk.space.low']);
    expect(result.skippedRules).toEqual(['runtime.python.version']);
    expect(result.unavailableRules).toEqual(['tool.docker.daemon-down']);
    expect(result.errors).toEqual([]);
  });

  it('allows DiagnosticResult to aggregate detection result for reporting without non-deterministic metadata', () => {
    const finding = createFinding({
      ruleId: 'system.memory.pressure',
      category: 'system',
      status: 'PASS',
      severity: 'INFO',
      confidence: 'HIGH',
      title: 'Memory Healthy',
      summary: 'System memory is within normal limits',
    });

    const diagResult: DiagnosticResult = {
      findings: [finding],
      executedRules: ['system.memory.pressure'],
      skippedRules: [],
      unavailableRules: [],
      errors: [],
      status: 'PASS',
      summary: 'All checks passed',
    };

    expect(diagResult.status).toBe('PASS');
    expect(diagResult.findings).toHaveLength(1);
    expect(diagResult.executedRules).toEqual(['system.memory.pressure']);
  });
});
