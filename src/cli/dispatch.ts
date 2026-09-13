import { executeCommand, type CommandContext } from '../application/index.js';
import type { GlobalOptions } from './options.js';
import { resolveAndValidatePath } from './path.js';

export interface DispatchOptions extends GlobalOptions {
  readonly preview?: boolean;
}

/**
 * Dispatches a parsed CLI command to the application layer.
 * Normalizes global options and path, delegates to the application use case,
 * and formats the resulting response according to presentation options.
 */
export async function dispatchCommand(
  commandName: string,
  options: DispatchOptions,
  commandSpecificOptions: Record<string, unknown> = {},
): Promise<number> {
  const targetPath = resolveAndValidatePath(options.path);

  const context: CommandContext = {
    command: commandName,
    targetPath,
    options: {
      verbose: Boolean(options.verbose),
      json: Boolean(options.json),
      quiet: Boolean(options.quiet),
      color: options.color !== false,
      ...commandSpecificOptions,
    },
  };

  const result = await executeCommand(context);

  if (options.json) {
    const jsonOutput = JSON.stringify(
      {
        command: result.command,
        targetPath: result.targetPath,
        status: result.status,
        message: result.message,
      },
      null,
      2,
    );
    process.stdout.write(`${jsonOutput}\n`);
    return result.exitCode;
  }

  if (!options.quiet && result.message) {
    process.stdout.write(`${result.message}\n`);
  }

  return result.exitCode;
}
