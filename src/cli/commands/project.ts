import type { Command } from 'commander';
import { dispatchCommand, type DispatchOptions } from '../dispatch.js';
import { registerGlobalOptions } from '../options.js';

/**
 * Registers Project diagnostics commands:
 * - project
 * - deps
 * - git
 * - config
 * Reference: docs/COMMANDS.md Section 5 & Section 70.
 */
export function registerProjectCommands(program: Command): void {
  // yowtf project
  const projectCmd = program
    .command('project')
    .description('Inspect current project configuration and environment')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('project', opts);
    });
  registerGlobalOptions(projectCmd);

  // yowtf deps
  const depsCmd = program
    .command('deps')
    .description('Inspect project dependencies and lockfile consistency')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('deps', opts);
    });
  registerGlobalOptions(depsCmd);

  // yowtf git
  const gitCmd = program
    .command('git')
    .description('Inspect Git repository state and health')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('git', opts);
    });
  registerGlobalOptions(gitCmd);

  // yowtf config
  const configCmd = program
    .command('config')
    .description('Inspect project and developer tool configuration files')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('config', opts);
    });
  registerGlobalOptions(configCmd);
}
