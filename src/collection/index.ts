/**
 * Collection Layer foundational interfaces.
 * Collectors gather raw machine and environment facts without making evaluative decisions.
 * Reference: docs/ARCHITECTURE.md Section 5.4.
 */

export interface CollectorContext {
  readonly cwd: string;
  readonly platform: NodeJS.Platform;
  readonly env: NodeJS.ProcessEnv;
}

export interface Collector<T = unknown> {
  readonly name: string;
  readonly category: string;
  collect(context: CollectorContext): Promise<T>;
}
