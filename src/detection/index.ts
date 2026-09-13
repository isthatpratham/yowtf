import type { Finding } from '../domain/index.js';

/**
 * Detection Layer foundational interfaces.
 * Detectors evaluate structured evidence to produce deterministic findings.
 * Reference: docs/ARCHITECTURE.md Section 5.6 and docs/DETECTION-ENGINE.md.
 */

export interface DiagnosticRule<TEvidence = unknown> {
  readonly id: string;
  readonly category: string;
  readonly description: string;
  evaluate(evidence: TEvidence): Promise<Finding | null> | Finding | null;
}
