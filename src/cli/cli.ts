import { Command, CommanderError } from 'commander';
import { registerAllCommands } from './commands/index.js';
import {
  CliError,
  EXIT_APPLICATION_ERROR,
  EXIT_SUCCESS,
  EXIT_USAGE_ERROR,
  formatCliError,
} from './errors.js';
import { registerGlobalOptions } from './options.js';

export const APP_NAME = 'yowtf';
export const APP_FULL_NAME = 'Your Operating Workstation Trouble Finder';
export const APP_TAGLINE = 'Yo, WTF is happening?';
export const APP_VERSION = '0.1.1';

/**
 * Creates and configures the complete Commander program for YOWTF.
 * Registers global options and all 20 public V1 commands.
 * Adheres to docs/CLI-SPEC.md and docs/COMMANDS.md.
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name(APP_NAME)
    .description(`${APP_FULL_NAME} — ${APP_TAGLINE}`)
    .version(APP_VERSION, '-V, --version', 'output the version number')
    .helpOption('-h, --help', 'display help for command')
    .exitOverride();

  // Register global options on the root program
  registerGlobalOptions(program);

  // Register all 20 public commands
  registerAllCommands(program);

  return program;
}

/**
 * Executes the Commander program with the provided arguments.
 * Returns process exit code:
 * - 0: Success (or help/version output)
 * - 1: Application/diagnostic failure
 * - 2: CLI usage error (unknown command, unknown option, invalid path, etc.)
 */
export async function runCli(argv: string[] = process.argv): Promise<number> {
  const program = createProgram();

  try {
    await program.parseAsync(argv);
    return EXIT_SUCCESS;
  } catch (error: unknown) {
    if (error instanceof CommanderError) {
      // Commander sets exitCode = 0 for --help and --version (helpDisplayed, version)
      if (error.exitCode === 0) {
        return EXIT_SUCCESS;
      }
      // Any other Commander parsing/usage error maps to exit code 2
      return EXIT_USAGE_ERROR;
    }

    if (error instanceof CliError) {
      process.stderr.write(`${formatCliError(error)}\n`);
      return error.exitCode;
    }

    process.stderr.write(`${formatCliError(error)}\n`);
    return EXIT_APPLICATION_ERROR;
  }
}
