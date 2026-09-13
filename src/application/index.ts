/**
 * Application Layer foundational interfaces.
 * Orchestrates the scan lifecycle: discovery -> collection -> detection -> scoring -> reporting.
 * Reference: docs/ARCHITECTURE.md Section 5.2.
 */

export interface ScanOptions {
  readonly cwd?: string;
  readonly verbose?: boolean;
  readonly json?: boolean;
}

export interface ApplicationContext {
  readonly cwd: string;
}
