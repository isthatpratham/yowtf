import { Command } from 'commander';

export const APP_NAME = 'yowtf';
export const APP_FULL_NAME = 'Your Operating Workstation Trouble Finder';
export const APP_TAGLINE = 'Yo, WTF is happening?';
export const APP_VERSION = '0.1.0';

/**
 * Creates the base Commander program for YOWTF.
 * In Phase 1, only identity, version, and help foundation are configured.
 * Diagnostic commands belong to later phases.
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name(APP_NAME)
    .description(`${APP_FULL_NAME} — ${APP_TAGLINE}`)
    .version(APP_VERSION, '-V, --version', 'output the version number');

  return program;
}

/**
 * Executes the Commander program with the provided arguments.
 */
export function runCli(argv: string[] = process.argv): void {
  const program = createProgram();
  program.parse(argv);
}
