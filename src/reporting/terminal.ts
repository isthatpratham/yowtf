import boxen from 'boxen';
import { Chalk, type ChalkInstance } from 'chalk';
import Table from 'cli-table3';
import type { FindingSeverity } from '../domain/severity.js';
import type { FindingStatus } from '../domain/status.js';
import type { ScoreBand } from '../scoring/index.js';
import type { ReportModel, ReportOptions, Reporter } from './types.js';

/**
 * Terminal presentation reporter.
 * Adheres to docs/CLI-SPEC.md Section 14, 18, 30, 32, 33, 64-68 and docs/COMMANDS.md.
 * - Supports color/no-color via Chalk level toggle
 * - Clean, professional layout with Boxen for health scores
 * - Structured tables via cli-table3 for findings where helpful
 * - Supports --quiet mode (minimal summary & key failures)
 * - Supports --verbose mode (exposing rule IDs, coverage, evidence keys)
 * - Command-specific presentation:
 *   - score: focused score view
 *   - explain: deep explanation view (problem -> evidence -> impact -> next action)
 *   - doctor: prioritized problem view
 *   - default / category commands: full / scoped diagnostics
 */
export class TerminalReporter implements Reporter {
  public readonly format = 'terminal' as const;

  public render(model: ReportModel, options: ReportOptions = {}): string {
    const isColor = options.color !== false;
    const c = new Chalk({ level: isColor ? 2 : 0 });
    const isQuiet = Boolean(options.quiet);
    const isVerbose = Boolean(options.verbose);
    const cmd = options.command ?? model.metadata.command;

    if (cmd === 'score') {
      return this.renderScoreOnly(model, c, isQuiet);
    }

    if (cmd === 'explain') {
      return this.renderExplainView(model, c, isQuiet, isVerbose);
    }

    return this.renderStandardView(model, c, isQuiet, isVerbose);
  }

  private renderScoreOnly(model: ReportModel, c: ChalkInstance, isQuiet: boolean): string {
    if (!model.score) {
      return c.dim('No score available for this evaluation.');
    }

    const { score, band, totalPenalty, totalFindings } = model.score;
    const bandColored = this.colorScoreBand(band, c);

    if (isQuiet) {
      return `${score}/100 (${band})`;
    }

    const content = [
      c.bold(`Workstation Health Score: ${this.colorScore(score, c)}/100`),
      `Status: ${bandColored}`,
      `Total Deductions: ${c.yellow(String(totalPenalty))} pts across ${totalFindings} finding(s)`,
      c.dim(`Evaluated scope: ${model.metadata.scope}`),
    ].join('\n');

    return boxen(content, {
      padding: 1,
      margin: 0,
      borderStyle: 'round',
      borderColor: this.getBorderColorForBand(band),
    });
  }

  private renderExplainView(
    model: ReportModel,
    c: ChalkInstance,
    isQuiet: boolean,
    isVerbose: boolean,
  ): string {
    const lines: string[] = [];

    lines.push(c.bold(`YOWTF Diagnostic Explanations — Scope: ${model.metadata.scope}`));
    lines.push(c.dim(`Target: ${model.metadata.targetPath}`));
    lines.push('');

    const problemFindings = model.findings.filter(
      (f) => f.status === 'FAIL' || f.status === 'WARN',
    );

    if (problemFindings.length === 0) {
      lines.push(c.green('✓ No warning or failure conditions requiring explanation.'));
      return lines.join('\n');
    }

    for (let i = 0; i < problemFindings.length; i++) {
      const f = problemFindings[i]!;
      const num = c.dim(`[${i + 1}/${problemFindings.length}]`);
      const statusBadge = this.formatStatusBadge(f.status, c);
      const severityTag = this.formatSeverity(f.severity, c);

      lines.push(`${num} ${statusBadge} ${c.bold(f.title)} ${severityTag}`);
      if (isVerbose) {
        lines.push(
          c.dim(`    Rule ID: ${f.ruleId} (Category: ${f.category}, Confidence: ${f.confidence})`),
        );
      }
      lines.push(`    ${c.bold('Summary:')} ${f.summary}`);

      if (f.explanation) {
        lines.push(`    ${c.bold('Why it matters:')} ${f.explanation}`);
      }

      if (f.impact) {
        lines.push(`    ${c.bold('Impact:')} ${f.impact}`);
      }

      if (f.remediationHint) {
        lines.push(`    ${c.bold('Recommended action:')} ${c.cyan(f.remediationHint)}`);
      }

      if (f.evidence?.items && f.evidence.items.length > 0 && !isQuiet) {
        const evSummary = f.evidence.items
          .map((item) => `${item.key} (${item.availability})`)
          .join(', ');
        lines.push(`    ${c.dim('Evidence:')} ${c.dim(evSummary)}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  private renderStandardView(
    model: ReportModel,
    c: ChalkInstance,
    isQuiet: boolean,
    isVerbose: boolean,
  ): string {
    const lines: string[] = [];

    // Header & Score Banner (if score present and not quiet)
    if (!isQuiet && model.score) {
      const scoreLine = `Health Score: ${this.colorScore(model.score.score, c)}/100 (${this.colorScoreBand(model.score.band, c)})`;
      const scopeLine = c.dim(
        `Scope: ${model.metadata.scope} | Target: ${model.metadata.targetPath}`,
      );
      const summaryBox = boxen(`${c.bold('YOWTF Diagnostic Report')}\n${scoreLine}\n${scopeLine}`, {
        padding: 0,
        margin: 0,
        borderStyle: 'single',
        borderColor: this.getBorderColorForBand(model.score.band),
      });
      lines.push(summaryBox);
      lines.push('');
    } else if (isQuiet && model.score) {
      lines.push(`Score: ${model.score.score}/100 (${model.score.band})`);
    }

    // Filter findings for quiet mode (only FAIL / WARN)
    const displayFindings = isQuiet
      ? model.findings.filter((f) => f.status === 'FAIL' || f.status === 'WARN')
      : model.findings;

    if (displayFindings.length > 0) {
      const table = new Table({
        head: isVerbose
          ? [c.bold('Status'), c.bold('Severity'), c.bold('Rule ID'), c.bold('Summary')]
          : [c.bold('Status'), c.bold('Severity'), c.bold('Finding')],
        style: { head: [], border: [] },
        colWidths: isVerbose ? [10, 10, 32, 50] : [10, 10, 70],
        wordWrap: true,
      });

      for (const f of displayFindings) {
        const statusBadge = this.formatStatusBadge(f.status, c);
        const severityBadge = this.formatSeverity(f.severity, c);

        if (isVerbose) {
          table.push([statusBadge, severityBadge, f.ruleId, f.summary]);
        } else {
          table.push([
            statusBadge,
            severityBadge,
            f.title ? `${f.title}: ${f.summary}` : f.summary,
          ]);
        }
      }

      lines.push(table.toString());
      lines.push('');
    } else if (!isQuiet) {
      lines.push(c.green('✓ No diagnostic findings recorded.'));
      lines.push('');
    }

    // Coverage & Statistics (when not in quiet mode)
    if (!isQuiet) {
      const cov = model.coverage;
      const covParts: string[] = [
        `Executed: ${c.bold(String(cov.executed))}/${cov.totalRules}`,
        `Passed: ${c.green(String(cov.passed))}`,
        `Warned: ${c.yellow(String(cov.warned))}`,
        `Failed: ${c.red(String(cov.failed))}`,
        `Skipped: ${c.dim(String(cov.skipped))}`,
        `Unavailable: ${c.dim(String(cov.unavailable))}`,
      ];

      if (cov.errored > 0) {
        covParts.push(`Errors: ${c.redBright(String(cov.errored))}`);
      }

      lines.push(c.dim(`Coverage: ${covParts.join(' | ')}`));
    }

    return lines.join('\n');
  }

  private formatStatusBadge(status: FindingStatus, c: ChalkInstance): string {
    switch (status) {
      case 'PASS':
        return c.green('PASS');
      case 'FAIL':
        return c.red.bold('FAIL');
      case 'WARN':
        return c.yellow.bold('WARN');
      case 'UNAVAILABLE':
        return c.dim('UNAVAIL');
      case 'SKIPPED':
        return c.dim('SKIP');
      case 'ERROR':
        return c.redBright.bold('ERROR');
      default:
        return String(status);
    }
  }

  private formatSeverity(severity: FindingSeverity, c: ChalkInstance): string {
    switch (severity) {
      case 'CRITICAL':
        return c.red.bold('CRITICAL');
      case 'HIGH':
        return c.red('HIGH');
      case 'MEDIUM':
        return c.yellow('MEDIUM');
      case 'LOW':
        return c.blue('LOW');
      case 'INFO':
        return c.dim('INFO');
      default:
        return String(severity);
    }
  }

  private colorScore(score: number, c: ChalkInstance): string {
    if (score >= 90) return c.green.bold(String(score));
    if (score >= 75) return c.cyan.bold(String(score));
    if (score >= 60) return c.yellow.bold(String(score));
    return c.red.bold(String(score));
  }

  private colorScoreBand(band: ScoreBand, c: ChalkInstance): string {
    switch (band) {
      case 'EXCELLENT':
        return c.green.bold('EXCELLENT');
      case 'GOOD':
        return c.cyan.bold('GOOD');
      case 'FAIR':
        return c.yellow.bold('FAIR');
      case 'POOR':
        return c.red('POOR');
      case 'CRITICAL':
        return c.red.bold('CRITICAL');
    }
  }

  private getBorderColorForBand(band: ScoreBand): string {
    switch (band) {
      case 'EXCELLENT':
        return 'green';
      case 'GOOD':
        return 'cyan';
      case 'FAIR':
        return 'yellow';
      case 'POOR':
      case 'CRITICAL':
        return 'red';
    }
  }
}
