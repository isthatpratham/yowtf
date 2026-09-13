import type { DetectionResult } from '../../domain/detection-result.js';
import type { EvidenceItem, EvidenceSet } from '../../domain/evidence.js';
import { DetectionEngine } from '../../detection/engine.js';
import { createDefaultRuleRegistry } from '../../detection/registry.js';
import type { DetectionContext, RuleRegistryInterface } from '../../detection/types.js';

export interface DetectionServiceOptions {
  readonly registry?: RuleRegistryInterface;
}

/**
 * Application service coordinating diagnostic rule evaluation.
 * Boundary between application orchestration and the detection engine.
 * Reference: docs/ARCHITECTURE.md Section 5.2 and 5.6.
 */
export class DetectionService {
  private readonly engine: DetectionEngine;

  constructor(options: DetectionServiceOptions = {}) {
    const registry = options.registry ?? createDefaultRuleRegistry();
    this.engine = new DetectionEngine(registry);
  }

  /**
   * Executes detection rules against normalized evidence and returns deterministic findings.
   */
  public async runDetection(
    evidence: readonly EvidenceItem[] | readonly EvidenceSet[],
    context?: DetectionContext,
  ): Promise<DetectionResult> {
    return this.engine.execute(evidence, context);
  }
}
