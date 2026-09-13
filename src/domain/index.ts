/**
 * Core Domain types and foundational contracts for YOWTF.
 * Adheres to docs/ARCHITECTURE.md and docs/DETECTION-ENGINE.md.
 */

export type DiagnosticSeverity = 'critical' | 'warning' | 'info';

export type DiagnosticStatus = 'pass' | 'fail' | 'warn' | 'skip' | 'error';

export type DiagnosticCategory =
  | 'system'
  | 'disk'
  | 'process'
  | 'port'
  | 'network'
  | 'environment'
  | 'runtime'
  | 'tool'
  | 'path'
  | 'version'
  | 'project'
  | 'dependency'
  | 'git'
  | 'config'
  | 'cache';

export interface Finding {
  readonly ruleId: string;
  readonly category: DiagnosticCategory;
  readonly status: DiagnosticStatus;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly explanation?: string;
  readonly remediation?: string;
  readonly evidence?: Record<string, unknown>;
}

export interface DiagnosticResult {
  readonly findings: readonly Finding[];
  readonly timestamp: string;
  readonly durationMs: number;
}
