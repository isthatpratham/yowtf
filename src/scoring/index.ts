import type { Finding } from '../domain/index.js';
import type { FindingSeverity } from '../domain/severity.js';

/**
 * Authoritative score bands.
 * Adheres to docs/SCORING.md Section 28.
 */
export const SCORE_BANDS = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'] as const;
export type ScoreBand = (typeof SCORE_BANDS)[number];

/**
 * Base severity penalties.
 * Adheres to docs/SCORING.md Section 8 & 57.
 */
export const BASE_SEVERITY_PENALTIES: Readonly<Record<FindingSeverity, number>> = Object.freeze({
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
  INFO: 0,
});

export const SEVERITY_PENALTIES = BASE_SEVERITY_PENALTIES;
export const WARN_PENALTY_MULTIPLIER = 0.5;

/**
 * Detailed penalty assigned to an individual deduplicated finding.
 */
export interface FindingPenalty {
  readonly ruleId: string;
  readonly severity: FindingSeverity;
  readonly status: Finding['status'];
  readonly penalty: number;
}

/**
 * Complete health score result model.
 * Adheres to docs/SCORING.md Section 3, 28, 38, & 55.
 */
export interface ScoreResult {
  readonly score: number;
  readonly rawScore: number;
  readonly band: ScoreBand;
  readonly totalPenalty: number;
  readonly penalties: readonly FindingPenalty[];
  readonly totalFindings: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly infoCount: number;
  readonly failCount: number;
  readonly warnCount: number;
  readonly passCount: number;
}

// Backward compatibility alias for foundational interface
export type HealthScore = ScoreResult;

export interface ScoreCalculator {
  calculate(findings: readonly Finding[]): ScoreResult;
}

/**
 * Determines the score band from the final clamped and rounded score.
 * Adheres to docs/SCORING.md Section 28 & 29.
 *
 * 90-100: EXCELLENT
 * 75-89:  GOOD
 * 60-74:  FAIR
 * 40-59:  POOR
 * 0-39:   CRITICAL
 */
export function getScoreBand(score: number): ScoreBand {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'FAIR';
  if (score >= 40) return 'POOR';
  return 'CRITICAL';
}

function getPenaltyForFinding(finding: Finding): number {
  const base = BASE_SEVERITY_PENALTIES[finding.severity] ?? 0;
  if (finding.status === 'FAIL') return base;
  if (finding.status === 'WARN') return base * WARN_PENALTY_MULTIPLIER;
  return 0;
}

/**
 * Calculates deterministic health score from diagnostic findings.
 * Adheres strictly to docs/SCORING.md:
 * - Starting score = 100
 * - Deduplication by stable ruleId (retains highest penalty among duplicates)
 * - FAIL: base penalty (CRITICAL: 25, HIGH: 15, MEDIUM: 8, LOW: 3, INFO: 0)
 * - WARN: 50% of base penalty (CRITICAL: 12.5, HIGH: 7.5, MEDIUM: 4, LOW: 1.5, INFO: 0)
 * - PASS, SKIPPED, UNAVAILABLE, ERROR: 0 penalty
 * - No confidence multiplier
 * - Final score clamped to 0-100 and rounded to nearest integer
 */
export function calculateScore(findings: readonly Finding[]): ScoreResult {
  // Deduplicate by stable ruleId, keeping highest penalty (docs/SCORING.md Section 14)
  const uniqueFindingsMap = new Map<string, Finding>();
  for (const finding of findings) {
    const existing = uniqueFindingsMap.get(finding.ruleId);
    if (!existing) {
      uniqueFindingsMap.set(finding.ruleId, finding);
    } else {
      const existingPenalty = getPenaltyForFinding(existing);
      const currentPenalty = getPenaltyForFinding(finding);
      if (currentPenalty > existingPenalty) {
        uniqueFindingsMap.set(finding.ruleId, finding);
      }
    }
  }

  const uniqueFindings = Array.from(uniqueFindingsMap.values());
  const penalties: FindingPenalty[] = [];

  let totalPenalty = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;
  let failCount = 0;
  let warnCount = 0;
  let passCount = 0;

  for (const finding of uniqueFindings) {
    const base = BASE_SEVERITY_PENALTIES[finding.severity] ?? 0;
    let penalty = 0;

    if (finding.status === 'FAIL') {
      penalty = base;
      failCount += 1;
    } else if (finding.status === 'WARN') {
      penalty = base * WARN_PENALTY_MULTIPLIER;
      warnCount += 1;
    } else if (finding.status === 'PASS') {
      passCount += 1;
    }

    if (finding.severity === 'CRITICAL') criticalCount += 1;
    else if (finding.severity === 'HIGH') highCount += 1;
    else if (finding.severity === 'MEDIUM') mediumCount += 1;
    else if (finding.severity === 'LOW') lowCount += 1;
    else if (finding.severity === 'INFO') infoCount += 1;

    penalties.push({
      ruleId: finding.ruleId,
      severity: finding.severity,
      status: finding.status,
      penalty,
    });

    totalPenalty += penalty;
  }

  const rawScore = 100 - totalPenalty;
  const clampedScore = Math.max(0, Math.min(100, rawScore));
  const finalScore = Math.round(clampedScore);
  const band = getScoreBand(finalScore);

  return {
    score: finalScore,
    rawScore,
    band,
    totalPenalty,
    penalties: Object.freeze(penalties),
    totalFindings: uniqueFindings.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    infoCount,
    failCount,
    warnCount,
    passCount,
  };
}

/**
 * Default score calculator implementation.
 */
export class DefaultScoreCalculator implements ScoreCalculator {
  public calculate(findings: readonly Finding[]): ScoreResult {
    return calculateScore(findings);
  }
}
