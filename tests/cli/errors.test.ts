import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { runCli } from '../../src/cli/cli.js';
import { CliUsageError, formatCliError } from '../../src/cli/errors.js';

describe('CLI Errors & Exit Codes', () => {
  let stderrSpy: MockInstance<typeof process.stderr.write>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it('exits with code 2 on unknown command', async () => {
    const exitCode = await runCli(['node', 'yowtf', 'banana']);
    expect(exitCode).toBe(2);
  });

  it('exits with code 2 on unknown option', async () => {
    const exitCode = await runCli(['node', 'yowtf', '--fake-option']);
    expect(exitCode).toBe(2);
  });

  it('exits with code 2 on missing option argument (--path without argument)', async () => {
    const exitCode = await runCli(['node', 'yowtf', '--path']);
    expect(exitCode).toBe(2);
  });

  it('exits with code 2 when --path points to non-existent directory', async () => {
    const exitCode = await runCli(['node', 'yowtf', '--path', './definitely-does-not-exist-12345']);
    expect(exitCode).toBe(2);
    expect(stderrSpy).toHaveBeenCalled();
    const errorOutput = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(errorOutput).toContain('Target directory does not exist');
  });

  it('exits with code 2 when --path points to a file instead of a directory', async () => {
    const exitCode = await runCli(['node', 'yowtf', '--path', 'package.json']);
    expect(exitCode).toBe(2);
    expect(stderrSpy).toHaveBeenCalled();
    const errorOutput = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(errorOutput).toContain('Target path is not a directory');
  });

  it('formats CliError cleanly without stack traces', () => {
    const error = new CliUsageError('Invalid argument');
    const formatted = formatCliError(error);

    expect(formatted).toBe('error: Invalid argument');
    expect(formatted).not.toContain('at ');
  });

  it('formats generic Error cleanly without stack traces', () => {
    const error = new Error('Unexpected crash');
    const formatted = formatCliError(error);

    expect(formatted).toBe('error: Unexpected crash');
    expect(formatted).not.toContain('at ');
  });
});
