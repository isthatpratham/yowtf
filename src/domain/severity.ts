/**
 * Authoritative diagnostic severity levels.
 * Adheres to docs/DETECTION-ENGINE.md Section 32 and docs/SCORING.md Section 7.
 *
 * Severity describes diagnostic impact; scoring calculations belong in the scoring layer.
 */

export const FINDING_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;

export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

/**
 * Type guard for FindingSeverity.
 */
export function isFindingSeverity(value: unknown): value is FindingSeverity {
  return typeof value === 'string' && (FINDING_SEVERITIES as readonly string[]).includes(value);
}
