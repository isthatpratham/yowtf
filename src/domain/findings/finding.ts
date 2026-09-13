import type { DiagnosticCategory } from '../category.js';
import { isDiagnosticCategory } from '../category.js';
import type { FindingConfidence } from '../confidence.js';
import { isFindingConfidence } from '../confidence.js';
import type { FindingEvidence } from '../evidence.js';
import { isValidRuleId } from '../rule-id.js';
import type { FindingSeverity } from '../severity.js';
import { isFindingSeverity } from '../severity.js';
import type { FindingStatus } from '../status.js';
import { isFindingStatus } from '../status.js';

/**
 * Authoritative diagnostic finding model.
 * Adheres to docs/DETECTION-ENGINE.md Section 24.
 */
export interface Finding {
  readonly ruleId: string;
  readonly category: DiagnosticCategory;
  readonly status: FindingStatus;
  readonly severity: FindingSeverity;
  readonly confidence: FindingConfidence;
  readonly title: string;
  readonly summary: string;
  readonly explanation?: string;
  readonly impact?: string;
  readonly remediationHint?: string;
  readonly evidence?: FindingEvidence;
}

export interface CreateFindingParams {
  readonly ruleId: string;
  readonly category: DiagnosticCategory;
  readonly status: FindingStatus;
  readonly severity: FindingSeverity;
  readonly confidence: FindingConfidence;
  readonly title: string;
  readonly summary: string;
  readonly explanation?: string;
  readonly impact?: string;
  readonly remediationHint?: string;
  readonly evidence?: FindingEvidence;
}

function deepFreezeEvidence(evidence?: FindingEvidence): FindingEvidence | undefined {
  if (!evidence) {
    return undefined;
  }

  const frozenItems = evidence.items.map((item) => {
    const frozenItem = {
      ...item,
      ...(item.metadata ? { metadata: Object.freeze({ ...item.metadata }) } : {}),
    };
    return Object.freeze(frozenItem);
  });

  const frozenEvidence: FindingEvidence = {
    items: Object.freeze(frozenItems),
    ...(evidence.details ? { details: Object.freeze({ ...evidence.details }) } : {}),
  };

  return Object.freeze(frozenEvidence);
}

/**
 * Creates and validates an immutable Finding object.
 * Rejects structurally invalid parameters and enforces deep immutability.
 */
export function createFinding(params: CreateFindingParams): Finding {
  if (!isValidRuleId(params.ruleId)) {
    throw new Error(
      `Invalid ruleId: '${params.ruleId}'. Must follow lowercase dot-separated format`,
    );
  }

  if (!isDiagnosticCategory(params.category)) {
    throw new Error(`Invalid diagnostic category: '${String(params.category)}'`);
  }

  if (!isFindingStatus(params.status)) {
    throw new Error(`Invalid finding status: '${String(params.status)}'`);
  }

  if (!isFindingSeverity(params.severity)) {
    throw new Error(`Invalid finding severity: '${String(params.severity)}'`);
  }

  if (!isFindingConfidence(params.confidence)) {
    throw new Error(`Invalid finding confidence: '${String(params.confidence)}'`);
  }

  if (typeof params.title !== 'string' || params.title.trim().length === 0) {
    throw new Error('Finding title must be a non-empty string');
  }

  if (typeof params.summary !== 'string' || params.summary.trim().length === 0) {
    throw new Error('Finding summary must be a non-empty string');
  }

  const finding: Finding = {
    ruleId: params.ruleId,
    category: params.category,
    status: params.status,
    severity: params.severity,
    confidence: params.confidence,
    title: params.title.trim(),
    summary: params.summary.trim(),
    ...(params.explanation ? { explanation: params.explanation.trim() } : {}),
    ...(params.impact ? { impact: params.impact.trim() } : {}),
    ...(params.remediationHint ? { remediationHint: params.remediationHint.trim() } : {}),
    ...(params.evidence ? { evidence: deepFreezeEvidence(params.evidence) } : {}),
  };

  return Object.freeze(finding);
}
