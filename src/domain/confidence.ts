/**
 * Authoritative diagnostic confidence levels.
 * Adheres to docs/DETECTION-ENGINE.md Section 31-32.
 *
 * Confidence communicates certainty; it does NOT directly modify scoring penalties.
 */

export const FINDING_CONFIDENCES = ['HIGH', 'MEDIUM', 'LOW'] as const;

export type FindingConfidence = (typeof FINDING_CONFIDENCES)[number];

/**
 * Type guard for FindingConfidence.
 */
export function isFindingConfidence(value: unknown): value is FindingConfidence {
  return typeof value === 'string' && (FINDING_CONFIDENCES as readonly string[]).includes(value);
}
