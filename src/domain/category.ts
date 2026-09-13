/**
 * Authoritative diagnostic categories.
 * Adheres to docs/RULE-CATALOGUE.md Section 12 and docs/DETECTION-ENGINE.md Section 12.
 */

export const CANONICAL_DIAGNOSTIC_CATEGORIES = [
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

export type CanonicalDiagnosticCategory = (typeof CANONICAL_DIAGNOSTIC_CATEGORIES)[number];

export type DiagnosticCategory =
  | CanonicalDiagnosticCategory
  | 'processes'
  | 'ports'
  | 'env'
  | 'runtimes'
  | 'tools'
  | 'paths'
  | 'versions'
  | 'dependencies'
  | 'configuration'
  | 'caches';

const CATEGORY_ALIAS_MAP: Readonly<Record<string, CanonicalDiagnosticCategory>> = {
  system: 'system',
  disk: 'disk',
  process: 'process',
  processes: 'process',
  port: 'port',
  ports: 'port',
  network: 'network',
  environment: 'environment',
  env: 'environment',
  runtime: 'runtime',
  runtimes: 'runtime',
  tool: 'tool',
  tools: 'tool',
  path: 'path',
  paths: 'path',
  version: 'version',
  versions: 'version',
  project: 'project',
  dependency: 'dependency',
  dependencies: 'dependency',
  git: 'git',
  config: 'config',
  configuration: 'config',
  cache: 'cache',
  caches: 'cache',
};

/**
 * Normalizes a category string to its canonical singular form.
 * Returns null if the category is not recognized.
 */
export function normalizeCategory(category: string): CanonicalDiagnosticCategory | null {
  const lower = category.trim().toLowerCase();
  return CATEGORY_ALIAS_MAP[lower] ?? null;
}

/**
 * Type guard for DiagnosticCategory.
 */
export function isDiagnosticCategory(value: unknown): value is DiagnosticCategory {
  if (typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase() in CATEGORY_ALIAS_MAP;
}
