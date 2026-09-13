/**
 * CLI Error types and exit codes.
 * Adheres to docs/CLI-SPEC.md Section 48 & Section 55.
 */

export const EXIT_SUCCESS = 0;
export const EXIT_APPLICATION_ERROR = 1;
export const EXIT_USAGE_ERROR = 2;

export class CliError extends Error {
  public readonly exitCode: number;

  constructor(message: string, exitCode = EXIT_APPLICATION_ERROR) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CliUsageError extends CliError {
  constructor(message: string) {
    super(message, EXIT_USAGE_ERROR);
    this.name = 'CliUsageError';
  }
}

/**
 * Formats an error into a clean, human-readable message without exposing raw stack traces or secrets.
 */
export function formatCliError(error: unknown): string {
  if (error instanceof CliError) {
    return `error: ${error.message}`;
  }

  if (error instanceof Error) {
    return `error: ${error.message}`;
  }

  return `error: ${String(error)}`;
}
