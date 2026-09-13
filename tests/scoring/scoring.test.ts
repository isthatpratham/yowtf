import { describe, it, expect } from 'vitest';
import type { Finding } from '../../src/domain/findings/finding.js';
import {
  calculateScore,
  DefaultScoreCalculator,
  getScoreBand,
  SEVERITY_PENALTIES,
  WARN_PENALTY_MULTIPLIER,
} from '../../src/scoring/index.js';

function createMockFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    ruleId: overrides.ruleId ?? 'SYS-001',
    category: overrides.category ?? 'system',
    status: overrides.status ?? 'FAIL',
    severity: overrides.severity ?? 'CRITICAL',
    confidence: overrides.confidence ?? 'HIGH',
    title: overrides.title ?? 'Test Finding',
    summary: overrides.summary ?? 'Test finding summary',
    ...overrides,
  };
}

describe('Health Scoring Engine (docs/SCORING.md)', () => {
  it('has authoritative penalty constants', () => {
    expect(SEVERITY_PENALTIES.CRITICAL).toBe(25);
    expect(SEVERITY_PENALTIES.HIGH).toBe(15);
    expect(SEVERITY_PENALTIES.MEDIUM).toBe(8);
    expect(SEVERITY_PENALTIES.LOW).toBe(3);
    expect(SEVERITY_PENALTIES.INFO).toBe(0);
    expect(WARN_PENALTY_MULTIPLIER).toBe(0.5);
  });

  it('evaluates perfect score (100) when findings list is empty', () => {
    const result = calculateScore([]);
    expect(result.score).toBe(100);
    expect(result.rawScore).toBe(100);
    expect(result.band).toBe('EXCELLENT');
    expect(result.totalPenalty).toBe(0);
    expect(result.totalFindings).toBe(0);
    expect(result.penalties).toHaveLength(0);
  });

  it('evaluates perfect score (100) when all findings are PASS', () => {
    const findings: Finding[] = [
      createMockFinding({ ruleId: 'SYS-001', status: 'PASS', severity: 'CRITICAL' }),
      createMockFinding({ ruleId: 'DSK-001', status: 'PASS', severity: 'HIGH' }),
    ];
    const result = calculateScore(findings);
    expect(result.score).toBe(100);
    expect(result.band).toBe('EXCELLENT');
    expect(result.totalPenalty).toBe(0);
  });

  it('deducts full base penalties for FAIL status', () => {
    // CRITICAL FAIL: -25
    const crit = calculateScore([createMockFinding({ severity: 'CRITICAL', status: 'FAIL' })]);
    expect(crit.score).toBe(75);
    expect(crit.totalPenalty).toBe(25);

    // HIGH FAIL: -15
    const high = calculateScore([createMockFinding({ severity: 'HIGH', status: 'FAIL' })]);
    expect(high.score).toBe(85);
    expect(high.totalPenalty).toBe(15);

    // MEDIUM FAIL: -8
    const med = calculateScore([createMockFinding({ severity: 'MEDIUM', status: 'FAIL' })]);
    expect(med.score).toBe(92);
    expect(med.totalPenalty).toBe(8);

    // LOW FAIL: -3
    const low = calculateScore([createMockFinding({ severity: 'LOW', status: 'FAIL' })]);
    expect(low.score).toBe(97);
    expect(low.totalPenalty).toBe(3);

    // INFO FAIL: -0
    const info = calculateScore([createMockFinding({ severity: 'INFO', status: 'FAIL' })]);
    expect(info.score).toBe(100);
    expect(info.totalPenalty).toBe(0);
  });

  it('deducts 50% penalty for WARN status', () => {
    // CRITICAL WARN: 25 * 0.5 = 12.5 -> rounded score = 88
    const critWarn = calculateScore([createMockFinding({ severity: 'CRITICAL', status: 'WARN' })]);
    expect(critWarn.score).toBe(88);
    expect(critWarn.rawScore).toBe(87.5);
    expect(critWarn.totalPenalty).toBe(12.5);

    // HIGH WARN: 15 * 0.5 = 7.5 -> rounded score = 93
    const highWarn = calculateScore([createMockFinding({ severity: 'HIGH', status: 'WARN' })]);
    expect(highWarn.score).toBe(93);
    expect(highWarn.rawScore).toBe(92.5);
    expect(highWarn.totalPenalty).toBe(7.5);

    // MEDIUM WARN: 8 * 0.5 = 4 -> score = 96
    const medWarn = calculateScore([createMockFinding({ severity: 'MEDIUM', status: 'WARN' })]);
    expect(medWarn.score).toBe(96);
    expect(medWarn.totalPenalty).toBe(4);

    // LOW WARN: 3 * 0.5 = 1.5 -> score = 99
    const lowWarn = calculateScore([createMockFinding({ severity: 'LOW', status: 'WARN' })]);
    expect(lowWarn.score).toBe(99);
    expect(lowWarn.rawScore).toBe(98.5);
    expect(lowWarn.totalPenalty).toBe(1.5);
  });

  it('deduplicates findings with the same ruleId by keeping the maximum penalty', () => {
    const findings: Finding[] = [
      // Rule 1: WARN (-12.5) and FAIL (-25)
      createMockFinding({ ruleId: 'SYS-001', severity: 'CRITICAL', status: 'WARN' }),
      createMockFinding({ ruleId: 'SYS-001', severity: 'CRITICAL', status: 'FAIL' }),
      // Rule 2: LOW FAIL (-3)
      createMockFinding({ ruleId: 'ENV-001', severity: 'LOW', status: 'FAIL' }),
    ];
    const result = calculateScore(findings);
    // SYS-001 penalty = 25 (FAIL wins over WARN)
    // ENV-001 penalty = 3
    // Total = 28 -> score = 72
    expect(result.score).toBe(72);
    expect(result.totalPenalty).toBe(28);
    expect(result.totalFindings).toBe(2);
  });

  it('does not penalize SKIPPED, UNAVAILABLE, or ERROR statuses in health score', () => {
    const findings: Finding[] = [
      createMockFinding({ ruleId: 'SYS-001', status: 'SKIPPED', severity: 'CRITICAL' }),
      createMockFinding({ ruleId: 'DSK-001', status: 'UNAVAILABLE', severity: 'HIGH' }),
      createMockFinding({ ruleId: 'ENV-001', status: 'ERROR', severity: 'HIGH' }),
    ];
    const result = calculateScore(findings);
    expect(result.score).toBe(100);
    expect(result.totalPenalty).toBe(0);
  });

  it('clamps minimum score to 0 regardless of overwhelming penalties', () => {
    // 5 CRITICAL FAILS = 5 * 25 = 125 penalty -> clamped to 0
    const findings: Finding[] = [
      createMockFinding({ ruleId: 'R1', severity: 'CRITICAL', status: 'FAIL' }),
      createMockFinding({ ruleId: 'R2', severity: 'CRITICAL', status: 'FAIL' }),
      createMockFinding({ ruleId: 'R3', severity: 'CRITICAL', status: 'FAIL' }),
      createMockFinding({ ruleId: 'R4', severity: 'CRITICAL', status: 'FAIL' }),
      createMockFinding({ ruleId: 'R5', severity: 'CRITICAL', status: 'FAIL' }),
    ];
    const result = calculateScore(findings);
    expect(result.score).toBe(0);
    expect(result.rawScore).toBe(-25);
    expect(result.totalPenalty).toBe(125);
    expect(result.band).toBe('CRITICAL');
  });

  it('correctly maps score bands according to docs/SCORING.md Section 28', () => {
    // EXCELLENT: 90 - 100
    expect(getScoreBand(100)).toBe('EXCELLENT');
    expect(getScoreBand(95)).toBe('EXCELLENT');
    expect(getScoreBand(90)).toBe('EXCELLENT');

    // GOOD: 75 - 89
    expect(getScoreBand(89)).toBe('GOOD');
    expect(getScoreBand(80)).toBe('GOOD');
    expect(getScoreBand(75)).toBe('GOOD');

    // FAIR: 60 - 74
    expect(getScoreBand(74)).toBe('FAIR');
    expect(getScoreBand(65)).toBe('FAIR');
    expect(getScoreBand(60)).toBe('FAIR');

    // POOR: 40 - 59
    expect(getScoreBand(59)).toBe('POOR');
    expect(getScoreBand(50)).toBe('POOR');
    expect(getScoreBand(40)).toBe('POOR');

    // CRITICAL: 0 - 39
    expect(getScoreBand(39)).toBe('CRITICAL');
    expect(getScoreBand(20)).toBe('CRITICAL');
    expect(getScoreBand(0)).toBe('CRITICAL');
  });

  it('works via DefaultScoreCalculator instance', () => {
    const calc = new DefaultScoreCalculator();
    const result = calc.calculate([
      createMockFinding({ ruleId: 'PORT-001', severity: 'MEDIUM', status: 'FAIL' }),
    ]);
    expect(result.score).toBe(92);
    expect(result.band).toBe('EXCELLENT');
  });
});
