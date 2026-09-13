import type { Command } from 'commander';
import { dispatchCommand, type DispatchOptions } from '../dispatch.js';
import { registerGlobalOptions } from '../options.js';

interface CleanCommandOptions extends DispatchOptions {
  readonly preview?: boolean;
}

/**
 * Registers Storage diagnostics commands:
 * - caches
 * - clean (with --preview)
 * Reference: docs/COMMANDS.md Section 5 & Section 70.
 */
export function registerStorageCommands(program: Command): void {
  // yowtf caches
  const cachesCmd = program
    .command('caches')
    .description('Inspect developer caches and temporary storage')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('caches', opts);
    });
  registerGlobalOptions(cachesCmd);

  // yowtf clean
  const cleanCmd = program
    .command('clean')
    .description('Identify cleanup candidates for caches and temporary files')
    .option('--preview', 'preview cleanup candidates without modifying anything')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<CleanCommandOptions>();
      await dispatchCommand('clean', opts, {
        preview: Boolean(opts.preview),
      });
    });
  registerGlobalOptions(cleanCmd);
}
