import { execFile } from 'node:child_process';
import type { SafeCommandOptions, SafeCommandResult } from './types.js';

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_BUFFER_BYTES = 1024 * 1024; // 1MB

export class CommandExecutionError extends Error {
  public readonly exitCode: number | null;
  public readonly stdout: string;
  public readonly stderr: string;
  public readonly killed: boolean;

  constructor(
    message: string,
    options: {
      exitCode: number | null;
      stdout: string;
      stderr: string;
      killed: boolean;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = 'CommandExecutionError';
    this.exitCode = options.exitCode;
    this.stdout = options.stdout;
    this.stderr = options.stderr;
    this.killed = options.killed;
  }
}

/**
 * Executes a command safely without shell expansion.
 * Strictly non-interactive and read-only.
 */
export async function executeSafeCommand(
  file: string,
  args: readonly string[] = [],
  options: SafeCommandOptions = {},
): Promise<SafeCommandResult> {
  const timeoutMs =
    options.timeoutMs !== undefined && options.timeoutMs > 0
      ? options.timeoutMs
      : DEFAULT_TIMEOUT_MS;
  const start = Date.now();

  return new Promise((resolve, reject) => {
    execFile(
      file,
      [...args],
      {
        timeout: timeoutMs,
        maxBuffer: MAX_BUFFER_BYTES,
        cwd: options.cwd,
        env: options.env,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        const durationMs = Date.now() - start;
        const outStr = String(stdout ?? '');
        const errStr = String(stderr ?? '');

        if (error) {
          // Process exited with non-zero or was killed / timed out
          const exitCode = typeof error.code === 'number' ? error.code : 1;
          const killed = error.killed ?? false;

          // If command simply returned a non-zero exit code, return as result
          if (typeof error.code === 'number' && !error.killed) {
            resolve({
              stdout: outStr,
              stderr: errStr,
              exitCode,
              killed: false,
              durationMs,
            });
            return;
          }

          reject(
            new CommandExecutionError(error.message, {
              exitCode: typeof error.code === 'number' ? error.code : null,
              stdout: outStr,
              stderr: errStr,
              killed,
              cause: error,
            }),
          );
          return;
        }

        resolve({
          stdout: outStr,
          stderr: errStr,
          exitCode: 0,
          killed: false,
          durationMs,
        });
      },
    );
  });
}
