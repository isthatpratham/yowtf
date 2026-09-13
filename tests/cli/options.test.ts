import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { createProgram, runCli } from '../../src/cli/cli.js';

describe('CLI Global Options', () => {
  let stdoutSpy: MockInstance<typeof process.stdout.write>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('registers all required global options on the root program', () => {
    const program = createProgram();
    const optionFlags = program.options.map((opt) => opt.long);

    expect(optionFlags).toContain('--verbose');
    expect(optionFlags).toContain('--no-color');
    expect(optionFlags).toContain('--json');
    expect(optionFlags).toContain('--quiet');
    expect(optionFlags).toContain('--path');
    expect(optionFlags).toContain('--version');
    expect(program.helpInformation()).toContain('--help');
  });

  it('registers global options on subcommands', () => {
    const program = createProgram();
    const doctorCmd = program.commands.find((cmd) => cmd.name() === 'doctor');

    expect(doctorCmd).toBeDefined();
    const optionFlags = doctorCmd?.options.map((opt) => opt.long);

    expect(optionFlags).toContain('--verbose');
    expect(optionFlags).toContain('--no-color');
    expect(optionFlags).toContain('--json');
    expect(optionFlags).toContain('--quiet');
    expect(optionFlags).toContain('--path');
  });

  it('supports --help and -h with exit code 0', async () => {
    const exitCodeHelpLong = await runCli(['node', 'yowtf', '--help']);
    expect(exitCodeHelpLong).toBe(0);

    const exitCodeHelpShort = await runCli(['node', 'yowtf', '-h']);
    expect(exitCodeHelpShort).toBe(0);
  });

  it('supports --version and -V with exit code 0', async () => {
    const exitCodeVerLong = await runCli(['node', 'yowtf', '--version']);
    expect(exitCodeVerLong).toBe(0);

    const exitCodeVerShort = await runCli(['node', 'yowtf', '-V']);
    expect(exitCodeVerShort).toBe(0);
  });

  it('handles combined options (--json --quiet)', async () => {
    const exitCode = await runCli(['node', 'yowtf', '--json', '--quiet']);
    expect(exitCode).toBe(0);

    // In JSON mode, stdout receives valid JSON even with --quiet
    expect(stdoutSpy).toHaveBeenCalled();
    const lastCall = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1]?.[0] as string;
    const parsed = JSON.parse(lastCall);
    expect(parsed).toHaveProperty('command', 'yowtf');
    expect(parsed).toHaveProperty('status', 'ready');
  });

  it('handles combined options (--verbose --no-color)', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'system', '--verbose', '--no-color']);
    expect(exitCode).toBe(0);
  });
});
