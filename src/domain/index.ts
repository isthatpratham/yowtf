/**
 * Core Domain Layer exports for YOWTF.
 * Adheres to docs/ARCHITECTURE.md Section 5.3, docs/DETECTION-ENGINE.md, and docs/RULE-CATALOGUE.md.
 */

export * from './status.js';
export * from './severity.js';
export * from './confidence.js';
export * from './category.js';
export * from './rule-id.js';
export * from './evidence.js';
export * from './findings/index.js';
export * from './rules/index.js';

import type { Finding } from './findings/finding.js';
import type { FindingSeverity } from './severity.js';
import type { FindingStatus } from './status.js';

// Backward-compatible type aliases
export type DiagnosticStatus = FindingStatus;
export type DiagnosticSeverity = FindingSeverity;

/**
 * Diagnostic scan result representing evaluated findings.
 * Adheres to docs/DETECTION-ENGINE.md and docs/CLI-SPEC.md Section 46.
 */
export interface DiagnosticResult {
  readonly findings: readonly Finding[];
  readonly status: FindingStatus;
  readonly summary?: string;
  readonly timestamp?: string;
  readonly durationMs?: number;
}
