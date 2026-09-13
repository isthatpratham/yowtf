import type { Command } from 'commander';

/**
 * Global CLI options interface.
 * Adheres to docs/CLI-SPEC.md Section 7.
 */
export interface GlobalOptions {
  readonly verbose?: boolean;
  readonly color?: boolean; // --no-color sets color: false in Commander
  readonly json?: boolean;
  readonly quiet?: boolean;
  readonly path?: string;
}

/**
 * Registers all authoritative global options on a Commander command.
 */
export function registerGlobalOptions(command: Command): void {
  command
    .option('--verbose', 'enable additional diagnostic output')
    .option('--no-color', 'disable terminal colors')
    .option('--json', 'emit machine-readable JSON')
    .option('--quiet', 'reduce human-readable output')
    .option('--path <dir>', 'analyze the specified directory');
}
