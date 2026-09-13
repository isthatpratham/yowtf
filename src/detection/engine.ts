import type { DetectionResult } from '../domain/detection-result.js';
import type { EvidenceItem, EvidenceSet } from '../domain/evidence.js';
import type { Finding } from '../domain/findings/finding.js';
import { createFinding } from '../domain/findings/finding.js';
import type { FindingSeverity } from '../domain/severity.js';
import type { DetectionContext, RuleRegistryInterface } from './types.js';

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
  INFO: 5,
};

function flattenEvidence(
  evidence: readonly EvidenceItem[] | readonly EvidenceSet[],
): readonly EvidenceItem[] {
  if (evidence.length === 0) {
    return [];
  }
  const first = evidence[0];
  if (first && 'items' in first && Array.isArray((first as EvidenceSet).items)) {
    const items: EvidenceItem[] = [];
    for (const set of evidence as readonly EvidenceSet[]) {
      items.push(...set.items);
    }
    return items;
  }
  return evidence as readonly EvidenceItem[];
}

/**
 * Authoritative Detection Engine for YOWTF.
 * Executes registered diagnostic rules deterministically against normalized evidence.
 * Provides fault isolation and structured coverage transparency.
 * Reference: docs/DETECTION-ENGINE.md Section 85-87.
 */
export class DetectionEngine {
  constructor(private readonly registry: RuleRegistryInterface) {}

  public async execute(
    evidenceInput: readonly EvidenceItem[] | readonly EvidenceSet[],
    context: DetectionContext = {},
  ): Promise<DetectionResult> {
    const evidence = flattenEvidence(evidenceInput);
    const rulesToRun = this.registry.select(context);

    const findings: Finding[] = [];
    const executedRules: string[] = [];
    const skippedRules: string[] = [];
    const unavailableRules: string[] = [];
    const errors: string[] = [];

    for (const rule of rulesToRun) {
      const ruleId = rule.metadata.id;

      let applicable = false;
      try {
        applicable = rule.isApplicable(context, evidence);
      } catch (err) {
        errors.push(ruleId);
        findings.push(
          createFinding({
            ruleId,
            category: rule.metadata.category,
            status: 'ERROR',
            severity: 'HIGH',
            confidence: 'HIGH',
            title: `${rule.metadata.name} (Applicability Error)`,
            summary: `Failed to determine rule applicability: ${err instanceof Error ? err.message : String(err)}`,
          }),
        );
        continue;
      }

      if (!applicable) {
        skippedRules.push(ruleId);
        continue;
      }

      try {
        const evaluation = await rule.evaluate(context, evidence);
        const status = evaluation.status;

        switch (status) {
          case 'PASS':
          case 'FAIL':
          case 'WARN':
            executedRules.push(ruleId);
            if (evaluation.finding) {
              findings.push(evaluation.finding);
            }
            break;
          case 'SKIPPED':
            skippedRules.push(ruleId);
            break;
          case 'UNAVAILABLE':
            unavailableRules.push(ruleId);
            if (evaluation.finding) {
              findings.push(evaluation.finding);
            }
            break;
          case 'ERROR':
            errors.push(ruleId);
            if (evaluation.finding) {
              findings.push(evaluation.finding);
            } else {
              findings.push(
                createFinding({
                  ruleId,
                  category: rule.metadata.category,
                  status: 'ERROR',
                  severity: 'HIGH',
                  confidence: 'HIGH',
                  title: `${rule.metadata.name} (Evaluation Error)`,
                  summary: 'Diagnostic rule reported an internal error during evaluation.',
                }),
              );
            }
            break;
        }
      } catch (err) {
        errors.push(ruleId);
        findings.push(
          createFinding({
            ruleId,
            category: rule.metadata.category,
            status: 'ERROR',
            severity: 'HIGH',
            confidence: 'HIGH',
            title: `${rule.metadata.name} (Execution Error)`,
            summary: `Diagnostic rule threw an unexpected exception: ${err instanceof Error ? err.message : String(err)}`,
          }),
        );
      }
    }

    // Deterministic sorting of findings:
    // 1. Severity: CRITICAL -> HIGH -> MEDIUM -> LOW -> INFO
    // 2. Category alphabetical
    // 3. Rule ID alphabetical
    findings.sort((a, b) => {
      const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sevDiff !== 0) return sevDiff;
      const catDiff = a.category.localeCompare(b.category);
      if (catDiff !== 0) return catDiff;
      return a.ruleId.localeCompare(b.ruleId);
    });

    return Object.freeze({
      findings: Object.freeze(findings),
      executedRules: Object.freeze(executedRules),
      skippedRules: Object.freeze(skippedRules),
      unavailableRules: Object.freeze(unavailableRules),
      errors: Object.freeze(errors),
    });
  }
}
