import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { runCli } from '../../src/cli/cli.js';
import { EXIT_USAGE_ERROR } from '../../src/cli/errors.js';
import { DetectionEngine } from '../../src/detection/engine.js';
import { DefaultRuleRegistry } from '../../src/detection/registry.js';
import type { DiagnosticRule } from '../../src/detection/types.js';

describe('Failure Paths & Fault Isolation (docs/CLI-SPEC.md Section 73 & docs/DETECTION-ENGINE.md)', () => {
  let stdoutSpy: MockInstance<typeof process.stdout.write>;
  let stderrSpy: MockInstance<typeof process.stderr.write>;
  let tempDirsToCleanup: string[] = [];

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    tempDirsToCleanup = [];
  });

  afterEach(async () => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();

    for (const dir of tempDirsToCleanup) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup failures
      }
    }
  });

  describe('CLI Usage & Path Validation Errors', () => {
    it('exits with code 2 on non-existent path argument', async () => {
      const nonExistentPath = path.join(os.tmpdir(), `yowtf-missing-${Date.now()}`);
      const exitCode = await runCli(['node', 'yowtf', '--path', nonExistentPath]);
      expect(exitCode).toBe(EXIT_USAGE_ERROR);
      expect(stderrSpy).toHaveBeenCalled();
      const errOutput = stderrSpy.mock.calls.map((c) => c[0]).join('');
      expect(errOutput).toContain('Target directory does not exist');
    });

    it('exits with code 2 when a file is provided where a directory is expected', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-file-test-'));
      tempDirsToCleanup.push(tempDir);
      const filePath = path.join(tempDir, 'regular-file.txt');
      await fs.writeFile(filePath, 'hello');

      const exitCode = await runCli(['node', 'yowtf', '--path', filePath]);
      expect(exitCode).toBe(EXIT_USAGE_ERROR);
      expect(stderrSpy).toHaveBeenCalled();
      const errOutput = stderrSpy.mock.calls.map((c) => c[0]).join('');
      expect(errOutput).toContain('Target path is not a directory');
    });

    it('exits with code 2 on unknown command', async () => {
      const exitCode = await runCli(['node', 'yowtf', 'nonexistent-action']);
      expect(exitCode).toBe(EXIT_USAGE_ERROR);
    });

    it('exits with code 2 on unknown options', async () => {
      const exitCode = await runCli(['node', 'yowtf', '--nonexistent-flag']);
      expect(exitCode).toBe(EXIT_USAGE_ERROR);
    });
  });

  describe('Unusual & Edge Case Workstation Environments', () => {
    it('scans an empty non-project directory gracefully without crashing', async () => {
      const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-empty-'));
      tempDirsToCleanup.push(emptyDir);

      const exitCode = await runCli(['node', 'yowtf', '--path', emptyDir, '--json']);
      expect(exitCode).toBe(0);
      const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
      const parsed = JSON.parse(lastCall);
      expect(parsed.metadata.targetPath).toBe(path.normalize(path.resolve(emptyDir)));
      expect(parsed).toHaveProperty('status');
      expect(parsed).toHaveProperty('score');
    });

    it('safely handles a malformed package.json manifest without throwing', async () => {
      const malformedDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-malformed-'));
      tempDirsToCleanup.push(malformedDir);
      await fs.writeFile(path.join(malformedDir, 'package.json'), '{ "name": "bad", broken json');

      const exitCode = await runCli(['node', 'yowtf', '--path', malformedDir, '--json']);
      expect(exitCode).toBe(0);
      const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
      const parsed = JSON.parse(lastCall);
      expect(parsed).toHaveProperty('status');
      expect(parsed.coverage.executed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Detection Engine Fault Isolation', () => {
    it('isolates rule runtime exceptions and records an ERROR finding without terminating evaluation', async () => {
      const throwingRule: DiagnosticRule = {
        metadata: {
          id: 'test.throwing.rule',
          name: 'Throwing Rule',
          category: 'system',
          severity: 'HIGH',
          confidence: 'HIGH',
          description: 'A rule that intentionally throws an error',
          explanation: 'Tests fault isolation',
          remediationHint: 'Fix rule',
        },
        isApplicable: () => true,
        evaluate: () => {
          throw new Error('Unexpected fatal error inside rule evaluate');
        },
      };

      const registry = new DefaultRuleRegistry([throwingRule]);
      const engine = new DetectionEngine(registry);

      const result = await engine.execute([]);
      expect(result.errors).toContain('test.throwing.rule');
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]?.status).toBe('ERROR');
      expect(result.findings[0]?.ruleId).toBe('test.throwing.rule');
      expect(result.findings[0]?.summary).toContain('Unexpected fatal error inside rule evaluate');
    });
  });
});
