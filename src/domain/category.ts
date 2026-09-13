/**
 * Authoritative diagnostic categories.
 * Adheres to docs/RULE-CATALOGUE.md Section 12 and docs/DETECTION-ENGINE.md Section 12.
 */

export const DIAGNOSTIC_CATEGORIES = [
  'system',
  'disk',
  'process',
  'port',
  'network',
  'environment',
  'runtime',
  'tool',
  'path',
  'version',
  'project',
  'dependency',
  'git',
  'config',
  'cache',
] as const;

export type DiagnosticCategory = (typeof DIAGNOSTIC_CATEGORIES)[number];

// Canonical aliases for compatibility
export const CANONICAL_DIAGNOSTIC_CATEGORIES = DIAGNOSTIC_CATEGORIES;
export type CanonicalDiagnosticCategory = DiagnosticCategory;

const CATEGORY_SET: ReadonlySet<string> = new Set(DIAGNOSTIC_CATEGORIES);

/**
 * Type guard for DiagnosticCategory.
 * Strictly verifies against the 15 authoritative diagnostic categories.
 */
export function isDiagnosticCategory(value: unknown): value is DiagnosticCategory {
  return typeof value === 'string' && CATEGORY_SET.has(value);
}
