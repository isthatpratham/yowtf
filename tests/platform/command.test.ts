import process from 'node:process';
import { describe, it, expect } from 'vitest';
import { CommandExecutionError, executeSafeCommand } from '../../src/platform/command.js';

describe('Platform - Safe Command Execution', () => {
  it('executes a command with explicit arguments and captures output safely', async () => {
    const result = await executeSafeCommand(process.execPath, [
      '-e',
      'console.log("hello safe command")',
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello safe command');
    expect(result.killed).toBe(false);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('captures non-zero exit codes without unhandled exception', async () => {
    const result = await executeSafeCommand(process.execPath, ['-e', 'process.exit(42)']);
    expect(result.exitCode).toBe(42);
    expect(result.killed).toBe(false);
  });

  it('rejects with CommandExecutionError when executable does not exist', async () => {
    await expect(
      executeSafeCommand('non-existent-binary-yowtf-xyz', ['--version']),
    ).rejects.toThrow(CommandExecutionError);
  });

  it('enforces timeout and terminates long-running process', async () => {
    await expect(
      executeSafeCommand(process.execPath, ['-e', 'setTimeout(() => {}, 10000)'], {
        timeoutMs: 100,
      }),
    ).rejects.toThrow(CommandExecutionError);
  });
});
