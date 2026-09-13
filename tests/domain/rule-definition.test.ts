import { describe, it, expect } from 'vitest';
import type { RuleMetadata, RuleEvaluation } from '../../src/domain/rules/rule-definition.js';

describe('Domain - Rule Definition Models', () => {
  it('defines pure declarative RuleMetadata including applicability and requiredEvidence', () => {
    const rule: RuleMetadata = {
      id: 'system.memory.pressure',
      name: 'System Memory Pressure',
      category: 'system',
      description: 'Checks if system memory utilization exceeds high watermark',
      severity: 'HIGH',
      confidence: 'HIGH',
      applicability: ['os.platform() in ["darwin", "linux", "win32"]'],
      requiredEvidence: ['system.memory.utilization'],
      explanation: 'High memory usage can cause swap thrashing.',
      remediationHint: 'Close unused applications.',
    };

    expect(rule.id).toBe('system.memory.pressure');
    expect(rule.category).toBe('system');
    expect(rule.applicability).toHaveLength(1);
    expect(rule.requiredEvidence).toEqual(['system.memory.utilization']);
  });

  it('defines pure RuleEvaluation outcome decoupled from scoring or rendering', () => {
    const evalOutcome: RuleEvaluation = {
      ruleId: 'system.memory.pressure',
      status: 'PASS',
    };

    expect(evalOutcome.ruleId).toBe('system.memory.pressure');
    expect(evalOutcome.status).toBe('PASS');
    expect(evalOutcome.finding).toBeUndefined();
  });
});
