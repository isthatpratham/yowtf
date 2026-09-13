import type { Command } from 'commander';
import { dispatchCommand, type DispatchOptions } from '../dispatch.js';
import { registerGlobalOptions } from '../options.js';

/**
 * Registers Workstation diagnostics commands:
 * - system
 * - disk
 * - processes
 * - ports
 * - network
 * Reference: docs/COMMANDS.md Section 5 & Section 70.
 */
export function registerWorkstationCommands(program: Command): void {
  // yowtf system
  const systemCmd = program
    .command('system')
    .description('Inspect workstation-level system information')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('system', opts);
    });
  registerGlobalOptions(systemCmd);

  // yowtf disk
  const diskCmd = program
    .command('disk')
    .description('Inspect storage health and disk space')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('disk', opts);
    });
  registerGlobalOptions(diskCmd);

  // yowtf processes
  const processesCmd = program
    .command('processes')
    .description('Inspect running development-related processes')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('processes', opts);
    });
  registerGlobalOptions(processesCmd);

  // yowtf ports
  const portsCmd = program
    .command('ports')
    .description('Inspect development ports and listening services')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('ports', opts);
    });
  registerGlobalOptions(portsCmd);

  // yowtf network
  const networkCmd = program
    .command('network')
    .description('Inspect local network configuration and connectivity')
    .action(async (_options: unknown, cmd: Command) => {
      const opts = cmd.optsWithGlobals<DispatchOptions>();
      await dispatchCommand('network', opts);
    });
  registerGlobalOptions(networkCmd);
}
