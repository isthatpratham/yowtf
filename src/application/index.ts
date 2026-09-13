import { EXIT_SUCCESS } from '../cli/errors.js';
import type { PlatformAdapter } from '../platform/types.js';
import type { ReportModel } from '../reporting/types.js';
import { ScanOrchestratorService } from './services/scan-orchestrator.service.js';

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
    readonly platformAdapter?: PlatformAdapter;
  };
}

export interface CommandResult {
  readonly command: string;
  readonly targetPath: string;
  readonly status: 'ready' | 'executed' | 'error';
  readonly message?: string;
  readonly exitCode: number;
  readonly reportModel?: ReportModel;
}

/**
 * Application entry point for command execution.
 * Orchestrates the full diagnostic pipeline:
 * Discovery -> Evidence Collection -> Detection -> Scoring -> Reporting.
 */
export async function executeCommand(
  context: CommandContext,
  orchestrator: ScanOrchestratorService = new ScanOrchestratorService(),
): Promise<CommandResult> {
  const reportModel = await orchestrator.executeScan({
    command: context.command,
    targetPath: context.targetPath,
    verbose: context.options.verbose,
    json: context.options.json,
    quiet: context.options.quiet,
    color: context.options.color,
    preview: context.options.preview,
    platformAdapter: context.options.platformAdapter,
  });

  return {
    command: context.command,
    targetPath: context.targetPath,
    status: 'executed',
    exitCode: EXIT_SUCCESS,
    reportModel,
  };
}

export * from './services/system-collection.service.js';
export * from './services/project-collection.service.js';
export * from './services/detection.service.js';
export * from './services/scan-orchestrator.service.js';
