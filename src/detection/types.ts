import type { EvidenceItem } from '../domain/evidence.js';
import type { PlatformType } from '../platform/types.js';
import type { RuleEvaluation, RuleMetadata } from '../domain/rules/rule-definition.js';

/**
 * Scan and execution context provided to detection rules and the detection engine.
 * Adheres to docs/DETECTION-ENGINE.md Section 36 and 78.
 */
export interface DetectionContext {
  readonly platform?: PlatformType | NodeJS.Platform;
  readonly projectRoot?: string;
  readonly commandScope?: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly targetArchitecture?: string;
  readonly targetNodeVersion?: string;
  readonly targetPythonVersion?: string;
}

/**
 * Standard contract for a diagnostic rule.
 * Rules evaluate already-collected evidence to produce deterministic findings.
 * Rules are strictly read-only and never perform collection, scoring, or remediation.
 * Reference: docs/DETECTION-ENGINE.md Section 6, 10, 16.
 */
export interface DiagnosticRule {
  readonly metadata: RuleMetadata;
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean;
  evaluate(
    context: DetectionContext,
    evidence: readonly EvidenceItem[],
  ): Promise<RuleEvaluation> | RuleEvaluation;
}

export interface SyncDiagnosticRule extends DiagnosticRule {
  evaluate(context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation;
}

/**
 * Registry interface for managing and selecting diagnostic rules deterministically.
 * Reference: docs/DETECTION-ENGINE.md Section 39-40.
 */
export interface RuleRegistryInterface {
  register(rule: DiagnosticRule): void;
  get(ruleId: string): DiagnosticRule | undefined;
  list(): readonly DiagnosticRule[];
  select(context?: DetectionContext): readonly DiagnosticRule[];
}
