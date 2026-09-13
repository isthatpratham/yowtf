import type { Finding } from '../domain/index.js';

/**
 * Scoring Layer foundational interfaces.
 * Converts findings into deterministic 0-100 workstation health scores.
 * Reference: docs/ARCHITECTURE.md Section 5.7 and docs/SCORING.md.
 */

export interface HealthScore {
  readonly score: number;
  readonly totalFindings: number;
  readonly criticalCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
}

export interface ScoreCalculator {
  calculate(findings: readonly Finding[]): HealthScore;
}
