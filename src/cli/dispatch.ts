import { executeCommand, type CommandContext } from '../application/index.js';
import { JsonReporter, TerminalReporter } from '../reporting/index.js';
import { playBootAnimation } from './animation.js';
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

  // Trigger presentation-layer boot animation if eligible (TTY, non-json, non-quiet)
  await playBootAnimation({
    json: Boolean(options.json),
    quiet: Boolean(options.quiet),
    color: options.color !== false,
  });

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

  if (result.reportModel) {
    if (options.json) {
      const reporter = new JsonReporter();
      const output = reporter.render(result.reportModel, {
        json: true,
        quiet: Boolean(options.quiet),
        verbose: Boolean(options.verbose),
        command: commandName,
      });
      process.stdout.write(`${output}\n`);
      return result.exitCode;
    }

    const reporter = new TerminalReporter();
    const output = reporter.render(result.reportModel, {
      color: options.color !== false,
      quiet: Boolean(options.quiet),
      verbose: Boolean(options.verbose),
      command: commandName,
    });
    if (output) {
      process.stdout.write(`${output}\n`);
    }
    return result.exitCode;
  }

  return result.exitCode;
}
