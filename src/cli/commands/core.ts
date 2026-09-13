import type { Command } from 'commander';
import { dispatchCommand, type DispatchOptions } from '../dispatch.js';
import { registerGlobalOptions } from '../options.js';

/**
 * Registers Core diagnostics commands:
 * - root action (default health scan)
 * - doctor
 * - score
 * - explain
 * Reference: docs/COMMANDS.md Section 5 & Section 70.
 */
export function registerCoreCommands(program: Command): void {
  // Root default action: yowtf
  program.action(async (_options: unknown, cmd: Command) => {
    const opts = cmd.optsWithGlobals<DispatchOptions>();
    await dispatchCommand('yowtf', opts);
  });

  // yowtf doctor
  const doctorCmd = program
    .command('doctor')
    .description('Run diagnostic-oriented health scan')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('doctor', opts);
    });
  registerGlobalOptions(doctorCmd);

  // yowtf score
  const scoreCmd = program
    .command('score')
    .description('Calculate and display workstation health score')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('score', opts);
    });
  registerGlobalOptions(scoreCmd);

  // yowtf explain
  const explainCmd = program
    .command('explain')
    .description('Explain detected diagnostic findings in detail')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('explain', opts);
    });
  registerGlobalOptions(explainCmd);
}
