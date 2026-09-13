/**
 * Rule Identifier contract and validation.
 * Adheres to docs/RULE-CATALOGUE.md Section 4 and docs/DETECTION-ENGINE.md Section 11.
 *
 * Rule IDs are lowercase, dot-separated identifiers in the canonical format:
 * <category>.<subject>.<condition>
 */

const RULE_ID_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+){2,}$/;

export interface ParsedRuleId {
  readonly category: string;
  readonly subject: string;
  readonly condition: string;
}

/**
 * Validates whether a string matches the canonical Rule ID format.
 */
export function isValidRuleId(id: string): boolean {
  return typeof id === 'string' && RULE_ID_REGEX.test(id);
}

/**
 * Parses a Rule ID into its component parts (category, subject, condition).
 * Returns null if the Rule ID is invalid.
 */
export function parseRuleId(id: string): ParsedRuleId | null {
  if (!isValidRuleId(id)) {
    return null;
  }

  const parts = id.split('.');
  const category = parts[0];
  const condition = parts[parts.length - 1];
  const subject = parts.slice(1, -1).join('.');

  if (!category || !subject || !condition) {
    return null;
  }

  return {
    category,
    subject,
    condition,
  };
}
