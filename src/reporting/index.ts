/**
 * Reporting Layer foundational interfaces and implementations.
 * Formats and renders diagnostic results to terminal or JSON output.
 * Adheres to docs/ARCHITECTURE.md Section 5.8, docs/CLI-SPEC.md, and docs/SCORING.md.
 */

export * from './types.js';
export * from './json.js';
export * from './terminal.js';
export * from './model.js';

import type { DiagnosticResult } from '../domain/index.js';
import type { HealthScore } from '../scoring/index.js';

/**
 * Legacy ReportPayload interface preserved for compatibility.
 */
export interface ReportPayload {
  readonly result: DiagnosticResult;
  readonly score?: HealthScore;
}
