import { describe, it, expect } from 'vitest';
import type { Finding } from '../../src/domain/findings/finding.js';
import type { DetectionResult } from '../../src/domain/detection-result.js';
import {
  JsonReporter,
  TerminalReporter,
  createReportModel,
  type ReportModel,
} from '../../src/reporting/index.js';
import { calculateScore } from '../../src/scoring/index.js';

function createSampleFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    ruleId: overrides.ruleId ?? 'SYS-001',
    category: overrides.category ?? 'system',
    status: overrides.status ?? 'FAIL',
    severity: overrides.severity ?? 'HIGH',
    confidence: overrides.confidence ?? 'HIGH',
    title: overrides.title ?? 'High Memory Usage',
    summary: overrides.summary ?? 'Workstation free memory is below recommended thresholds.',
    explanation: overrides.explanation ?? 'Low free memory can cause system freezing and swapping.',
    impact: overrides.impact ?? 'Builds and dev servers may experience OOM kills.',
    remediationHint:
      overrides.remediationHint ?? 'Close unused applications or increase RAM allocation.',
    evidence: overrides.evidence ?? {
      items: [
        {
          key: 'system.memory',
          source: 'os',
          type: 'memory',
          availability: 'AVAILABLE',
          value: { freeMb: 256, totalMb: 16384 },
        },
      ],
    },
    ...overrides,
  };
}

describe('Reporting Engine (docs/CLI-SPEC.md & docs/SCORING.md)', () => {
  const sampleFindings: Finding[] = [
    createSampleFinding({
      ruleId: 'SYS-001',
      status: 'FAIL',
      severity: 'HIGH',
      title: 'High Memory Pressure',
    }),
    createSampleFinding({
      ruleId: 'DSK-001',
      status: 'WARN',
      severity: 'MEDIUM',
      title: 'Low Disk Space',
    }),
    createSampleFinding({
      ruleId: 'ENV-001',
      status: 'PASS',
      severity: 'INFO',
      title: 'Node.js LTS Installed',
    }),
  ];

  const sampleDetectionResult: DetectionResult = {
    findings: sampleFindings,
    executedRules: ['SYS-001', 'DSK-001', 'ENV-001'],
    skippedRules: ['NET-001'],
    unavailableRules: ['DOCKER-001'],
    errors: [],
  };

  const sampleScore = calculateScore(sampleFindings);

  const sampleModel: ReportModel = createReportModel(sampleDetectionResult, {
    command: 'doctor',
    targetPath: '/workspace/project',
    scope: 'system + project',
    score: sampleScore,
  });

  describe('createReportModel Helper', () => {
    it('aggregates diagnostic coverage counts accurately', () => {
      expect(sampleModel.coverage).toEqual({
        totalRules: 5,
        executed: 3,
        passed: 1,
        failed: 1,
        warned: 1,
        skipped: 1,
        unavailable: 1,
        errored: 0,
      });
    });

    it('resolves overall status with FAIL precedence', () => {
      expect(sampleModel.status).toBe('FAIL');
    });

    it('resolves overall status to WARN when no FAIL is present', () => {
      const warnOnlyResult: DetectionResult = {
        findings: [
          createSampleFinding({ status: 'WARN', severity: 'LOW' }),
          createSampleFinding({ status: 'PASS', severity: 'INFO' }),
        ],
        executedRules: ['R1', 'R2'],
        skippedRules: [],
        unavailableRules: [],
        errors: [],
      };
      const model = createReportModel(warnOnlyResult, {
        command: 'yowtf',
        targetPath: '/test',
        scope: 'system',
      });
      expect(model.status).toBe('WARN');
    });

    it('resolves overall status to PASS when only PASS findings exist', () => {
      const passOnlyResult: DetectionResult = {
        findings: [createSampleFinding({ status: 'PASS', severity: 'INFO' })],
        executedRules: ['R1'],
        skippedRules: [],
        unavailableRules: [],
        errors: [],
      };
      const model = createReportModel(passOnlyResult, {
        command: 'yowtf',
        targetPath: '/test',
        scope: 'system',
      });
      expect(model.status).toBe('PASS');
    });
  });

  describe('JsonReporter (Machine-Readable JSON Output)', () => {
    const reporter = new JsonReporter();

    it('produces valid, parseable JSON conforming to docs/CLI-SPEC.md Section 46', () => {
      const output = reporter.render(sampleModel);
      const parsed = JSON.parse(output);

      expect(parsed).toHaveProperty('metadata');
      expect(parsed.metadata).toMatchObject({
        tool: 'yowtf',
        version: '0.1.0',
        command: 'doctor',
        targetPath: '/workspace/project',
        scope: 'system + project',
      });

      expect(parsed.status).toBe('FAIL');

      expect(parsed).toHaveProperty('score');
      expect(parsed.score).toMatchObject({
        value: 81,
        band: 'GOOD',
      });

      expect(parsed).toHaveProperty('coverage');
      expect(parsed.coverage).toMatchObject({
        totalRules: 5,
        executed: 3,
        passed: 1,
        failed: 1,
        warned: 1,
      });

      expect(Array.isArray(parsed.findings)).toBe(true);
      expect(parsed.findings).toHaveLength(3);
      expect(parsed.findings[0]).toMatchObject({
        ruleId: 'SYS-001',
        status: 'FAIL',
        severity: 'HIGH',
      });
    });

    it('contains strictly zero ANSI color escape codes', () => {
      const output = reporter.render(sampleModel);
      // eslint-disable-next-line no-control-regex
      expect(output).not.toMatch(/\u001b\[/);
    });

    it('preserves all required JSON fields in quiet mode', () => {
      const output = reporter.render(sampleModel, { quiet: true });
      const parsed = JSON.parse(output);
      expect(parsed.coverage.totalRules).toBe(5);
      expect(parsed.findings).toHaveLength(3);
    });
  });

  describe('TerminalReporter (Human-Readable Output)', () => {
    const reporter = new TerminalReporter();

    it('renders standard diagnostic report with score banner and table', () => {
      const output = reporter.render(sampleModel, { color: false });
      expect(output).toContain('YOWTF Diagnostic Report');
      expect(output).toContain('Health Score: 81/100 (GOOD)');
      expect(output).toContain('FAIL');
      expect(output).toContain('WARN');
      expect(output).toContain('High Memory Pressure');
      expect(output).toContain('Coverage: Executed: 3/5');
    });

    it('renders dedicated score box for score command', () => {
      const output = reporter.render(sampleModel, {
        command: 'score',
        color: false,
      });
      expect(output).toContain('Workstation Health Score: 81/100');
      expect(output).toContain('Status: GOOD');
      expect(output).toContain('Total Deductions: 19 pts');
    });

    it('renders deep explanation breakdown for explain command', () => {
      const output = reporter.render(sampleModel, {
        command: 'explain',
        color: false,
      });
      expect(output).toContain('YOWTF Diagnostic Explanations');
      expect(output).toContain('Why it matters:');
      expect(output).toContain('Impact:');
      expect(output).toContain('Recommended action:');
      expect(output).toContain('Close unused applications');
    });

    it('suppresses ANSI escape sequences when color is false', () => {
      const output = reporter.render(sampleModel, { color: false });
      // eslint-disable-next-line no-control-regex
      expect(output).not.toMatch(/\u001b\[/);
    });

    it('filters out passing checks and banners in quiet mode', () => {
      const output = reporter.render(sampleModel, { quiet: true, color: false });
      // In quiet mode, PASS finding is omitted from the table
      expect(output).not.toContain('Node.js LTS Installed');
      // But FAIL finding is shown
      expect(output).toContain('High Memory Pressure');
    });

    it('includes rule IDs in table when verbose mode is enabled', () => {
      const output = reporter.render(sampleModel, { verbose: true, color: false });
      expect(output).toContain('Rule ID');
      expect(output).toContain('SYS-001');
      expect(output).toContain('DSK-001');
    });
  });
});
