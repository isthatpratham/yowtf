/**
 * Rule Identifier contract and validation.
 * Adheres to docs/RULE-CATALOGUE.md Section 4 and docs/DETECTION-ENGINE.md Section 11.
 *
 * Rule IDs are lowercase, dot-separated identifiers in the canonical format:
 * <category>.<subject>.<condition>
 */

const RULE_ID_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export interface ParsedRuleId {
  readonly category: string;
  readonly segments: readonly string[];
  readonly subject?: string;
  readonly condition?: string;
}

/**
 * Validates whether a string matches the canonical Rule ID format.
 * Lowercase, dot-separated identifier with at least two segments.
 */
export function isValidRuleId(id: string): boolean {
  return typeof id === 'string' && RULE_ID_REGEX.test(id);
}

/**
 * Parses a Rule ID into its component parts.
 * Returns null if the Rule ID is invalid.
 */
export function parseRuleId(id: string): ParsedRuleId | null {
  if (!isValidRuleId(id)) {
    return null;
  }

  const parts = id.split('.');
  const category = parts[0];
  if (!category) {
    return null;
  }
  const segments = Object.freeze(parts.slice(1));

  return {
    category,
    segments,
    ...(parts.length > 2 ? { subject: parts.slice(1, -1).join('.') } : {}),
    ...(parts.length > 1 ? { condition: parts[parts.length - 1] } : {}),
  };
}
