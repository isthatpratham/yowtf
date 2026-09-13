import type { ReportModel, ReportOptions, Reporter } from './types.js';

/**
 * Pure machine-readable JSON reporter.
 * Adheres strictly to docs/CLI-SPEC.md Section 12, 15, 46, & 47:
 * - Emits valid, formatted JSON
 * - Zero ANSI color codes
 * - Zero spinner noise
 * - Zero decorative boxes or tables
 * - Deterministic, stable field ordering
 * - Quiet mode does not alter or suppress required JSON fields
 */
export class JsonReporter implements Reporter {
  public readonly format = 'json' as const;

  public render(model: ReportModel, _options: ReportOptions = {}): string {
    const payload = {
      metadata: {
        tool: model.metadata.tool,
        version: model.metadata.version,
        command: model.metadata.command,
        targetPath: model.metadata.targetPath,
        scope: model.metadata.scope,
        ...(model.metadata.category ? { category: model.metadata.category } : {}),
      },
      status: model.status,
      score: model.score
        ? {
            value: model.score.score,
            rawScore: model.score.rawScore,
            band: model.score.band,
            totalPenalty: model.score.totalPenalty,
            findingsCount: model.score.totalFindings,
            penalties: model.score.penalties.map((p) => ({
              ruleId: p.ruleId,
              severity: p.severity,
              status: p.status,
              penalty: p.penalty,
            })),
          }
        : undefined,
      coverage: {
        totalRules: model.coverage.totalRules,
        executed: model.coverage.executed,
        passed: model.coverage.passed,
        failed: model.coverage.failed,
        warned: model.coverage.warned,
        skipped: model.coverage.skipped,
        unavailable: model.coverage.unavailable,
        errored: model.coverage.errored,
      },
      findings: model.findings.map((f) => ({
        ruleId: f.ruleId,
        category: f.category,
        status: f.status,
        severity: f.severity,
        confidence: f.confidence,
        title: f.title,
        summary: f.summary,
        ...(f.explanation ? { explanation: f.explanation } : {}),
        ...(f.impact ? { impact: f.impact } : {}),
        ...(f.remediationHint ? { remediationHint: f.remediationHint } : {}),
        ...(f.evidence
          ? {
              evidence: {
                items: f.evidence.items.map((it) => ({
                  key: it.key,
                  source: it.source,
                  availability: it.availability,
                  ...(it.value !== undefined ? { value: it.value } : {}),
                })),
                ...(f.evidence.details ? { details: f.evidence.details } : {}),
              },
            }
          : {}),
      })),
    };

    return JSON.stringify(payload, null, 2);
  }
}
