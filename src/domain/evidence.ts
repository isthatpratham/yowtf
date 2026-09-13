import type { DiagnosticCategory } from './category.js';

/**
 * Authoritative evidence availability states.
 * Adheres to docs/DETECTION-ENGINE.md Section 7.
 */
export const EVIDENCE_AVAILABILITIES = [
  'AVAILABLE',
  'UNAVAILABLE',
  'FAILED',
  'NOT_APPLICABLE',
] as const;

export type EvidenceAvailability = (typeof EVIDENCE_AVAILABILITIES)[number];

export function isEvidenceAvailability(value: unknown): value is EvidenceAvailability {
  return (
    typeof value === 'string' && (EVIDENCE_AVAILABILITIES as readonly string[]).includes(value)
  );
}

/**
 * Primitive metadata value types safe for evidence representation without secret exposure.
 */
export type EvidenceMetadataValue = string | number | boolean;

/**
 * Represents a single normalized piece of collected diagnostic evidence.
 * Adheres to docs/DETECTION-ENGINE.md Section 8-9.
 */
export interface EvidenceItem<T = unknown> {
  readonly key: string;
  readonly source: string;
  readonly type?: string;
  readonly availability: EvidenceAvailability;
  readonly value?: T;
  readonly unit?: string;
  readonly metadata?: Readonly<Record<string, EvidenceMetadataValue>>;
}

/**
 * Structured evidence attached to a diagnostic finding explaining why the rule produced its result.
 * Adheres to docs/DETECTION-ENGINE.md Section 28.
 */
export interface FindingEvidence {
  readonly items: readonly EvidenceItem[];
  readonly details?: Readonly<Record<string, EvidenceMetadataValue | readonly string[]>>;
}

/**
 * Collection of evidence items grouped by category or collector scope.
 * Adheres to docs/DETECTION-ENGINE.md Section 5.
 */
export interface EvidenceSet {
  readonly category?: DiagnosticCategory;
  readonly items: readonly EvidenceItem[];
}
