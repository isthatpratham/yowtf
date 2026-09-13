import type { DiagnosticResult } from '../domain/index.js';
import type { HealthScore } from '../scoring/index.js';

/**
 * Reporting Layer foundational interfaces.
 * Formats and renders diagnostic results to terminal or JSON output.
 * Reference: docs/ARCHITECTURE.md Section 5.8.
 */

export interface ReportPayload {
  readonly result: DiagnosticResult;
  readonly score?: HealthScore;
}

export interface Reporter {
  readonly format: 'terminal' | 'json';
  render(payload: ReportPayload): Promise<void> | void;
}
