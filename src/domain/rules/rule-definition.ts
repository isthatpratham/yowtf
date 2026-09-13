import type { DiagnosticCategory } from '../category.js';
import type { FindingConfidence } from '../confidence.js';
import type { Finding } from '../findings/finding.js';
import type { FindingSeverity } from '../severity.js';
import type { FindingStatus } from '../status.js';

/**
 * Declarative rule metadata describing a diagnostic rule specification.
 * Adheres to docs/RULE-CATALOGUE.md Section 5.
 */
export interface RuleMetadata {
  readonly id: string;
  readonly name: string;
  readonly category: DiagnosticCategory;
  readonly description: string;
  readonly severity: FindingSeverity;
  readonly confidence: FindingConfidence;
  readonly applicability?: readonly string[];
  readonly requiredEvidence?: readonly string[];
  readonly explanation?: string;
  readonly remediationHint?: string;
}

/**
 * Represents the raw evaluated outcome of a diagnostic rule before finding construction.
 * Adheres to docs/DETECTION-ENGINE.md Section 16-17.
 */
export interface RuleEvaluation {
  readonly ruleId: string;
  readonly status: FindingStatus;
  readonly finding?: Finding;
}
