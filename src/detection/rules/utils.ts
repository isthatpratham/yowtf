import type { EvidenceItem, FindingEvidence } from '../../domain/evidence.js';
import type { Finding } from '../../domain/findings/finding.js';
import { createFinding } from '../../domain/findings/finding.js';
import type { FindingConfidence } from '../../domain/confidence.js';
import type { FindingSeverity } from '../../domain/severity.js';
import type { FindingStatus } from '../../domain/status.js';
import type { RuleMetadata } from '../../domain/rules/rule-definition.js';

export function findEvidence<T = unknown>(
  evidence: readonly EvidenceItem[],
  key: string,
): EvidenceItem<T> | undefined {
  return evidence.find((e) => e.key === key) as EvidenceItem<T> | undefined;
}

export function findEvidenceList<T = unknown>(
  evidence: readonly EvidenceItem[],
  key: string,
): readonly EvidenceItem<T>[] {
  return evidence.filter((e) => e.key === key) as readonly EvidenceItem<T>[];
}

export interface BuildFindingOptions {
  readonly status: FindingStatus;
  readonly severity?: FindingSeverity;
  readonly confidence?: FindingConfidence;
  readonly title?: string;
  readonly summary: string;
  readonly explanation?: string;
  readonly impact?: string;
  readonly remediationHint?: string;
  readonly evidenceItems?: readonly EvidenceItem[];
  readonly details?: Readonly<Record<string, string | number | boolean | readonly string[]>>;
}

export function buildFinding(metadata: RuleMetadata, options: BuildFindingOptions): Finding {
  let evidence: FindingEvidence | undefined;
  if (options.evidenceItems && options.evidenceItems.length > 0) {
    evidence = {
      items: options.evidenceItems,
      ...(options.details ? { details: options.details } : {}),
    };
  } else if (options.details) {
    evidence = {
      items: [],
      details: options.details,
    };
  }

  return createFinding({
    ruleId: metadata.id,
    category: metadata.category,
    status: options.status,
    severity: options.severity ?? metadata.severity,
    confidence: options.confidence ?? metadata.confidence,
    title: options.title ?? metadata.name,
    summary: options.summary,
    explanation: options.explanation ?? metadata.explanation,
    impact: options.impact,
    remediationHint: options.remediationHint ?? metadata.remediationHint,
    evidence,
  });
}
