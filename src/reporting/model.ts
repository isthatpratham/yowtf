import type { DiagnosticCategory } from '../domain/category.js';
import type { DetectionResult } from '../domain/detection-result.js';
import type { FindingStatus } from '../domain/status.js';
import type { ScoreResult } from '../scoring/index.js';
import type { DiagnosticCoverage, ReportMetadata, ReportModel } from './types.js';

export interface CreateReportModelOptions {
  readonly command: string;
  readonly targetPath: string;
  readonly scope: string;
  readonly category?: DiagnosticCategory;
  readonly score?: ScoreResult;
  readonly tool?: string;
  readonly version?: string;
}

/**
 * Assembles a canonical ReportModel from detection results, coverage, and metadata.
 * Adheres to docs/CLI-SPEC.md Section 46 and docs/SCORING.md Section 38.
 */
export function createReportModel(
  detectionResult: DetectionResult,
  options: CreateReportModelOptions,
): ReportModel {
  const { findings, executedRules, skippedRules, unavailableRules, errors } = detectionResult;

  const passed = findings.filter((f) => f.status === 'PASS').length;
  const failed = findings.filter((f) => f.status === 'FAIL').length;
  const warned = findings.filter((f) => f.status === 'WARN').length;
  const findingUnavailable = findings.filter((f) => f.status === 'UNAVAILABLE').length;
  const unavailable = Math.max(unavailableRules.length, findingUnavailable);
  const findingErrored = findings.filter((f) => f.status === 'ERROR').length;
  const errored = Math.max(errors.length, findingErrored);
  const skipped = skippedRules.length;
  const executed = executedRules.length;
  const totalRules = executed + skipped + unavailableRules.length;

  const coverage: DiagnosticCoverage = {
    totalRules,
    executed,
    passed,
    failed,
    warned,
    skipped,
    unavailable,
    errored,
  };

  let status: FindingStatus = 'PASS';
  if (failed > 0) {
    status = 'FAIL';
  } else if (warned > 0) {
    status = 'WARN';
  } else if (errored > 0) {
    status = 'ERROR';
  } else if (passed > 0) {
    status = 'PASS';
  } else if (unavailable > 0) {
    status = 'UNAVAILABLE';
  }

  const metadata: ReportMetadata = {
    tool: options.tool ?? 'yowtf',
    version: options.version ?? '0.1.0',
    command: options.command,
    targetPath: options.targetPath,
    scope: options.scope,
    category: options.category,
  };

  return {
    metadata,
    status,
    score: options.score,
    findings,
    coverage,
  };
}
