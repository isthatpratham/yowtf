import type { DiagnosticCategory } from '../domain/category.js';
import type { EvidenceSet } from '../domain/evidence.js';
import type { PlatformAdapter } from '../platform/types.js';

/**
 * Execution context provided to all collectors during a diagnostic scan.
 * Reference: docs/ARCHITECTURE.md Section 5.4.
 */
export interface CollectorContext {
  readonly cwd: string;
  readonly platformAdapter: PlatformAdapter;
  readonly env?: NodeJS.ProcessEnv;
}

/**
 * Standard contract for diagnostic collectors.
 * Collectors gather raw machine and environment facts without making evaluative decisions.
 */
export interface Collector<T = EvidenceSet> {
  readonly name: string;
  readonly category: DiagnosticCategory;
  collect(context: CollectorContext): Promise<T>;
}
