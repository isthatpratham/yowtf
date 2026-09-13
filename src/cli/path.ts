import fs from 'node:fs';
import path from 'node:path';
import { CliUsageError } from './errors.js';

/**
 * Resolves and validates the target directory path.
 * If targetPath is not provided, defaults to normalized current working directory.
 * If targetPath is provided, validates that it exists, is a directory, and is accessible.
 * Throws CliUsageError (exit code 2) on failure.
 * Adheres to docs/CLI-SPEC.md Section 15, 16, & 56.
 */
export function resolveAndValidatePath(rawPath?: string, cwd: string = process.cwd()): string {
  if (!rawPath) {
    return path.normalize(path.resolve(cwd));
  }

  const resolvedPath = path.normalize(path.resolve(cwd, rawPath));

  if (!fs.existsSync(resolvedPath)) {
    throw new CliUsageError(
      `Target directory does not exist: '${rawPath}'. Please specify an existing directory.`,
    );
  }

  let stats: fs.Stats;
  try {
    stats = fs.statSync(resolvedPath);
  } catch (err) {
    throw new CliUsageError(
      `Target path cannot be inspected: '${rawPath}'. ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!stats.isDirectory()) {
    throw new CliUsageError(
      `Target path is not a directory: '${rawPath}'. YOWTF expects a valid directory path.`,
    );
  }

  try {
    fs.accessSync(resolvedPath, fs.constants.R_OK);
  } catch {
    throw new CliUsageError(
      `Target directory is not accessible/readable: '${rawPath}'. Please check file permissions.`,
    );
  }

  return resolvedPath;
}
