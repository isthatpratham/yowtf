import type { Finding } from './findings/finding.js';

/**
 * Diagnostic detection result providing coverage transparency.
 * Adheres to docs/DETECTION-ENGINE.md Section 86.
 *
 * Preserves findings, executed rules, skipped rules, unavailable rules, and errors.
 */
export interface DetectionResult {
  readonly findings: readonly Finding[];
  readonly executedRules: readonly string[];
  readonly skippedRules: readonly string[];
  readonly unavailableRules: readonly string[];
  readonly errors: readonly string[];
}
