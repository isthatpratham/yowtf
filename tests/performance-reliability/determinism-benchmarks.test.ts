import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { runCli } from '../../src/cli/cli.js';
import { DetectionEngine } from '../../src/detection/engine.js';
import { DefaultRuleRegistry } from '../../src/detection/registry.js';
import type { DiagnosticRule } from '../../src/detection/types.js';

function createDummyRule(id: string, category: 'system', name: string): DiagnosticRule {
  return {
    metadata: {
      id,
      name,
      category,
      severity: 'HIGH',
      confidence: 'HIGH',
      description: `Test rule ${id}`,
      explanation: 'Explanation',
      remediationHint: 'Hint',
    },
    isApplicable: () => true,
    evaluate: () => ({
      ruleId: id,
      status: 'FAIL',
      finding: {
        ruleId: id,
        category,
        status: 'FAIL',
        severity: 'HIGH',
        confidence: 'HIGH',
        title: name,
        summary: `Failure for ${id}`,
      },
    }),
  };
}

describe('Determinism & Sorting Stability (Phase 9 Hardening)', () => {
  let stdoutSpy: MockInstance<typeof process.stdout.write>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('guarantees identical outputs across 10 repeated full scan executions on identical input', async () => {
    const outputs: string[] = [];

    for (let i = 0; i < 10; i++) {
      stdoutSpy.mockClear();
      const exitCode = await runCli(['node', 'yowtf', '--json']);
      expect(exitCode).toBe(0);

      const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
      outputs.push(lastCall);
    }

    const firstOutput = outputs[0]!;
    for (let i = 1; i < 10; i++) {
      expect(outputs[i]).toBe(firstOutput);
    }
  });

  it('enforces deterministic findings sorting by ruleId when severity and category are equal', async () => {
    // Register rules in scrambled order: Z, A, M, B
    const ruleZ = createDummyRule('system.zzz', 'system', 'Rule Z');
    const ruleA = createDummyRule('system.aaa', 'system', 'Rule A');
    const ruleM = createDummyRule('system.mmm', 'system', 'Rule M');
    const ruleB = createDummyRule('system.bbb', 'system', 'Rule B');

    const registry = new DefaultRuleRegistry([ruleZ, ruleA, ruleM, ruleB]);
    const engine = new DetectionEngine(registry);

    const result = await engine.execute([]);
    const ruleIds = result.findings.map((f) => f.ruleId);

    // Should be sorted alphabetically by ruleId: aaa, bbb, mmm, zzz
    expect(ruleIds).toEqual(['system.aaa', 'system.bbb', 'system.mmm', 'system.zzz']);
  });
});
