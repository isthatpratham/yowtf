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
    expect(output).toContain("Command 'yowtf' dispatched");
  });

  it('dispatches subcommands (e.g. doctor) with exit code 0', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'doctor']);
    expect(exitCode).toBe(0);
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain("Command 'doctor' dispatched");
  });

  it('dispatches clean command with --preview option', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'clean', '--preview', '--json']);
    expect(exitCode).toBe(0);
    expect(stdoutSpy).toHaveBeenCalled();
    const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
    const parsed = JSON.parse(lastCall);
    expect(parsed).toHaveProperty('command', 'clean');
    expect(parsed).toHaveProperty('status', 'ready');
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
    expect(parsed).toMatchObject({
      command: 'system',
      status: 'ready',
    });
    expect(typeof parsed.targetPath).toBe('string');
  });

  it('suppresses human-readable success messages in --quiet mode', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'ports', '--quiet']);
    expect(exitCode).toBe(0);
    expect(stdoutSpy).not.toHaveBeenCalled();
  });
});
