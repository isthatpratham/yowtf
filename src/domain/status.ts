/**
 * Authoritative diagnostic finding statuses.
 * Adheres to docs/DETECTION-ENGINE.md Section 17-23 and docs/SCORING.md Section 9.
 */

export const FINDING_STATUSES = [
  'PASS',
  'FAIL',
  'WARN',
  'SKIPPED',
  'UNAVAILABLE',
  'ERROR',
] as const;

export type FindingStatus = (typeof FINDING_STATUSES)[number];

/**
 * Type guard for FindingStatus.
 */
export function isFindingStatus(value: unknown): value is FindingStatus {
  return typeof value === 'string' && (FINDING_STATUSES as readonly string[]).includes(value);
}
