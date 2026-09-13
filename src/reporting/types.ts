import type { DiagnosticCategory } from '../domain/category.js';
import type { Finding } from '../domain/findings/finding.js';
import type { FindingStatus } from '../domain/status.js';
import type { ScoreResult } from '../scoring/index.js';

/**
 * Diagnostic coverage details.
 * Adheres to docs/SCORING.md Section 38 and docs/CLI-SPEC.md Section 46.
 */
export interface DiagnosticCoverage {
  readonly totalRules: number;
  readonly executed: number;
  readonly passed: number;
  readonly failed: number;
  readonly warned: number;
  readonly skipped: number;
  readonly unavailable: number;
  readonly errored: number;
}

/**
 * Report metadata identifying tool, version, command, target path, and scope.
 */
export interface ReportMetadata {
  readonly tool: string;
  readonly version: string;
  readonly command: string;
  readonly targetPath: string;
  readonly scope: string;
  readonly category?: DiagnosticCategory;
}

/**
 * Structured diagnostic report model.
 * Canonical representation serving both Human and JSON reporters.
 * Adheres to docs/CLI-SPEC.md Section 46.
 */
export interface ReportModel {
  readonly metadata: ReportMetadata;
  readonly status: FindingStatus;
  readonly score?: ScoreResult;
  readonly findings: readonly Finding[];
  readonly coverage: DiagnosticCoverage;
}

/**
 * Presentation options passed to reporters.
 */
export interface ReportOptions {
  readonly json?: boolean;
  readonly quiet?: boolean;
  readonly verbose?: boolean;
  readonly color?: boolean;
  readonly command?: string;
}

/**
 * Reporter interface for formatting ReportModel into terminal or JSON output.
 */
export interface Reporter {
  readonly format: 'terminal' | 'json';
  render(model: ReportModel, options?: ReportOptions): string;
}
