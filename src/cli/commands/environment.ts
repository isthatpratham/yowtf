import type { Command } from 'commander';
import { dispatchCommand, type DispatchOptions } from '../dispatch.js';
import { registerGlobalOptions } from '../options.js';

/**
 * Registers Development Environment diagnostics commands:
 * - env
 * - runtimes
 * - tools
 * - paths
 * - versions
 * Reference: docs/COMMANDS.md Section 5 & Section 70.
 */
export function registerEnvironmentCommands(program: Command): void {
  // yowtf env
  const envCmd = program
    .command('env')
    .description('Inspect development environment variables and configuration')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('env', opts);
    });
  registerGlobalOptions(envCmd);

  // yowtf runtimes
  const runtimesCmd = program
    .command('runtimes')
    .description('Inspect installed development runtimes')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('runtimes', opts);
    });
  registerGlobalOptions(runtimesCmd);

  // yowtf tools
  const toolsCmd = program
    .command('tools')
    .description('Inspect installed developer tools and package managers')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('tools', opts);
    });
  registerGlobalOptions(toolsCmd);

  // yowtf paths
  const pathsCmd = program
    .command('paths')
    .description('Inspect executable and PATH resolution')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('paths', opts);
    });
  registerGlobalOptions(pathsCmd);

  // yowtf versions
  const versionsCmd = program
    .command('versions')
    .description('Inspect version consistency among tools and runtimes')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('versions', opts);
    });
  registerGlobalOptions(versionsCmd);
}
