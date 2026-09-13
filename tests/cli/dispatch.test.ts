import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { runCli } from '../../src/cli/cli.js';

describe('Command Dispatch & Application Boundary', () => {
  let stdoutSpy: MockInstance<typeof process.stdout.write>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('dispatches the root default scan with exit code 0', async () => {
    const exitCode = await runCli(['node', 'yowtf']);
    expect(exitCode).toBe(0);
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('YOWTF Diagnostic Report');
  });

  it('dispatches subcommands (e.g. doctor) with exit code 0', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'doctor']);
    expect(exitCode).toBe(0);
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('YOWTF Diagnostic Report');
  });

  it('dispatches clean command with --preview option in JSON mode', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'clean', '--preview', '--json']);
    expect(exitCode).toBe(0);
    expect(stdoutSpy).toHaveBeenCalled();
    const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
    const parsed = JSON.parse(lastCall);
    expect(parsed.metadata).toHaveProperty('command', 'clean');
    expect(parsed).toHaveProperty('status');
    expect(parsed).toHaveProperty('coverage');
  });

  it('emits clean, machine-readable JSON in --json mode without ANSI escape codes', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'system', '--json']);
    expect(exitCode).toBe(0);

    expect(stdoutSpy).toHaveBeenCalled();
    const rawOutput = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;

    // No ANSI escape codes
    // eslint-disable-next-line no-control-regex
    expect(rawOutput).not.toMatch(/\u001b\[/);

    const parsed = JSON.parse(rawOutput);
    expect(parsed.metadata).toMatchObject({
      command: 'system',
      tool: 'yowtf',
    });
    expect(parsed).toHaveProperty('status');
    expect(parsed).toHaveProperty('coverage');
    expect(Array.isArray(parsed.findings)).toBe(true);
    expect(typeof parsed.metadata.targetPath).toBe('string');
  });

  it('handles score command with score banner', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'score']);
    expect(exitCode).toBe(0);
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('Workstation Health Score');
  });

  it('handles explain command with explanation view', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'explain']);
    expect(exitCode).toBe(0);
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('YOWTF Diagnostic Explanations');
  });

  it('handles --quiet mode in score command with concise output', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'score', '--quiet']);
    expect(exitCode).toBe(0);
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
    expect(output).toMatch(/\d+\/100/);
  });
});
