import { EXIT_SUCCESS } from '../cli/errors.js';

/**
 * Application Layer foundational interfaces and use cases.
 * Orchestrates the scan lifecycle: discovery -> collection -> detection -> scoring -> reporting.
 * Reference: docs/ARCHITECTURE.md Section 5.2.
 */

export interface ScanOptions {
  readonly cwd?: string;
  readonly verbose?: boolean;
  readonly json?: boolean;
  readonly quiet?: boolean;
  readonly color?: boolean;
}

export interface ApplicationContext {
  readonly cwd: string;
}

export interface CommandContext {
  readonly command: string;
  readonly targetPath: string;
  readonly options: {
    readonly verbose?: boolean;
    readonly json?: boolean;
    readonly quiet?: boolean;
    readonly color?: boolean;
    readonly preview?: boolean;
  };
}

export interface CommandResult {
  readonly command: string;
  readonly targetPath: string;
  readonly status: 'ready' | 'executed' | 'error';
  readonly message?: string;
  readonly exitCode: number;
}

/**
 * Application entry point for command execution.
 * In Phase 2, this establishes the delegation boundary from the CLI handlers
 * without fabricating diagnostic results, findings, or scores.
 */
export async function executeCommand(context: CommandContext): Promise<CommandResult> {
  // Honest Phase 2 response: Command infrastructure is wired, diagnostic engine will run in later phases.
  return {
    command: context.command,
    targetPath: context.targetPath,
    status: 'ready',
    message: `Command '${context.command}' dispatched for target: '${context.targetPath}'. Diagnostic engine will be executed in subsequent phases.`,
    exitCode: EXIT_SUCCESS,
  };
}

export * from './services/system-collection.service.js';
export * from './services/project-collection.service.js';
export * from './services/detection.service.js';
