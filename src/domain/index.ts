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
export * from './detection-result.js';

import type { DetectionResult } from './detection-result.js';
import type { FindingStatus } from './status.js';

/**
 * Diagnostic scan result representing aggregated detection output for reporting.
 * Adheres to docs/DETECTION-ENGINE.md Section 86 and docs/ARCHITECTURE.md Section 5.3.
 */
export interface DiagnosticResult extends DetectionResult {
  readonly status: FindingStatus;
  readonly summary?: string;
}
