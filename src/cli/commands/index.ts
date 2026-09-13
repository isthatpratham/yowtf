import type { Command } from 'commander';
import { registerCoreCommands } from './core.js';
import { registerWorkstationCommands } from './workstation.js';
import { registerEnvironmentCommands } from './environment.js';
import { registerProjectCommands } from './project.js';
import { registerStorageCommands } from './storage.js';

/**
 * Registers all 20 public V1 commands on the Commander program.
 * Reference: docs/COMMANDS.md Section 2 & Section 70.
 */
export function registerAllCommands(program: Command): void {
  registerCoreCommands(program);
  registerWorkstationCommands(program);
  registerEnvironmentCommands(program);
  registerProjectCommands(program);
  registerStorageCommands(program);
}
