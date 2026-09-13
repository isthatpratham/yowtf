import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { runCli } from '../../src/cli/cli.js';
import { getAppVersion } from '../../src/version.js';

describe('Full Pipeline Integration (docs/ARCHITECTURE.md Section 5.1 & docs/CLI-SPEC.md)', () => {
  let stdoutSpy: MockInstance<typeof process.stdout.write>;
  let stderrSpy: MockInstance<typeof process.stderr.write>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  describe('Core Diagnostic Commands', () => {
    it('executes root scan "yowtf" end-to-end with terminal output and exit code 0', async () => {
      const exitCode = await runCli(['node', 'yowtf']);
      expect(exitCode).toBe(0);
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('YOWTF Diagnostic Report');
      expect(output).toContain('Health Score:');
    });

    it('executes "yowtf --json" emitting strictly valid JSON conforming to CLI-SPEC Section 46', async () => {
      const exitCode = await runCli(['node', 'yowtf', '--json']);
      expect(exitCode).toBe(0);
      expect(stdoutSpy).toHaveBeenCalled();

      const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;

      // Zero ANSI escape codes
      // eslint-disable-next-line no-control-regex
      expect(lastCall).not.toMatch(/\u001b\[/);

      const parsed = JSON.parse(lastCall);
      expect(parsed).toHaveProperty('metadata');
      expect(parsed.metadata).toMatchObject({
        tool: 'yowtf',
        version: getAppVersion(),
        command: 'yowtf',
        scope: 'system + project',
      });
      expect(parsed).toHaveProperty('status');
      expect(parsed).toHaveProperty('score');
      expect(parsed.score).toHaveProperty('value');
      expect(parsed.score).toHaveProperty('band');
      expect(parsed).toHaveProperty('coverage');
      expect(parsed).toHaveProperty('findings');
      expect(Array.isArray(parsed.findings)).toBe(true);
    });

    it('executes "yowtf doctor" with exit code 0', async () => {
      const exitCode = await runCli(['node', 'yowtf', 'doctor']);
      expect(exitCode).toBe(0);
      const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('YOWTF Diagnostic Report');
    });

    it('executes "yowtf score" displaying dedicated score box', async () => {
      const exitCode = await runCli(['node', 'yowtf', 'score']);
      expect(exitCode).toBe(0);
      const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('Workstation Health Score:');
      expect(output).toContain('Status:');
    });

    it('executes "yowtf explain" displaying detailed problem breakdown', async () => {
      const exitCode = await runCli(['node', 'yowtf', 'explain']);
      expect(exitCode).toBe(0);
      const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
      expect(output).toContain('YOWTF Diagnostic Explanations');
    });
  });

  describe('Category-Scoped Commands Execution', () => {
    const scopedCommands = [
      'system',
      'disk',
      'processes',
      'ports',
      'network',
      'env',
      'runtimes',
      'tools',
      'paths',
      'versions',
      'project',
      'deps',
      'git',
      'config',
      'caches',
    ] as const;

    for (const cmd of scopedCommands) {
      it(`executes "${cmd} --json" scoped diagnostic scan successfully`, async () => {
        const exitCode = await runCli(['node', 'yowtf', cmd, '--json']);
        expect(exitCode).toBe(0);
        const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
        const parsed = JSON.parse(lastCall);
        expect(parsed.metadata.command).toBe(cmd);
        expect(parsed).toHaveProperty('status');
        expect(parsed).toHaveProperty('coverage');
      });
    }

    it('executes "clean --preview --json" identifying cleanup candidates in read-only mode', async () => {
      const exitCode = await runCli(['node', 'yowtf', 'clean', '--preview', '--json']);
      expect(exitCode).toBe(0);
      const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
      const parsed = JSON.parse(lastCall);
      expect(parsed.metadata.command).toBe('clean');
      expect(parsed.metadata.category).toBe('cache');
    });
  });

  describe('Global Options & Presentation Combinations', () => {
    it('handles "--json --quiet" combination preserving full JSON structure', async () => {
      const exitCode = await runCli(['node', 'yowtf', '--json', '--quiet']);
      expect(exitCode).toBe(0);
      const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
      const parsed = JSON.parse(lastCall);
      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('score');
      expect(parsed).toHaveProperty('coverage');
    });

    it('handles "--verbose --no-color" combination without ANSI codes', async () => {
      const exitCode = await runCli(['node', 'yowtf', '--verbose', '--no-color']);
      expect(exitCode).toBe(0);
      const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
      // eslint-disable-next-line no-control-regex
      expect(output).not.toMatch(/\u001b\[/);
      expect(output).toContain('Coverage:');
    });
  });

  describe('Pipeline Determinism', () => {
    it('produces identical scores and coverage on consecutive runs with identical input', async () => {
      const exitCode1 = await runCli(['node', 'yowtf', '--json']);
      expect(exitCode1).toBe(0);
      const call1 = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
      const parsed1 = JSON.parse(call1);

      stdoutSpy.mockClear();

      const exitCode2 = await runCli(['node', 'yowtf', '--json']);
      expect(exitCode2).toBe(0);
      const call2 = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
      const parsed2 = JSON.parse(call2);

      expect(parsed1.score.value).toBe(parsed2.score.value);
      expect(parsed1.score.band).toBe(parsed2.score.band);
      expect(parsed1.status).toBe(parsed2.status);
      expect(parsed1.coverage).toEqual(parsed2.coverage);
      expect(parsed1.findings.length).toBe(parsed2.findings.length);
    });
  });
});
