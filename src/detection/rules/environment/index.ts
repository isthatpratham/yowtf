import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

/**
 * ENV-001: Empty PATH Entry
 * Reference: docs/RULE-CATALOGUE.md Section 18
 */
export const env001EmptyPathEntry: SyncDiagnosticRule = {
  metadata: {
    id: 'environment.path.empty-entry',
    name: 'Empty PATH Entry',
    category: 'environment',
    description:
      'Identify empty PATH entries that can create platform-specific command-resolution behavior.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: ['Applicable when PATH entries are available.'],
    requiredEvidence: ['environment.path'],
    explanation: 'Empty PATH entries can create ambiguous or unintended executable resolution.',
    remediationHint: 'Inspect PATH construction and remove unintended empty entries.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'environment.path');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ entries?: readonly string[]; hasEmptyEntry?: boolean }>(
      evidence,
      'environment.path',
    );
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'environment.path.empty-entry',
        status: 'UNAVAILABLE',
        finding: buildFinding(env001EmptyPathEntry.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'PATH entries are unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const hasEmpty =
      item.value.hasEmptyEntry ?? item.value.entries?.some((e) => e.trim().length === 0) ?? false;
    if (hasEmpty) {
      return {
        ruleId: 'environment.path.empty-entry',
        status: 'WARN',
        finding: buildFinding(env001EmptyPathEntry.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: 'Detected empty entry in system PATH environment variable.',
          evidenceItems: [item],
        }),
      };
    }

    return {
      ruleId: 'environment.path.empty-entry',
      status: 'PASS',
      finding: buildFinding(env001EmptyPathEntry.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No empty PATH entries detected.',
        evidenceItems: [item],
      }),
    };
  },
};

const SECRET_PATTERNS = [
  /SECRET/i,
  /PASSWORD/i,
  /TOKEN/i,
  /PRIVATE_KEY/i,
  /API_KEY/i,
  /AUTH_KEY/i,
  /ACCESS_KEY/i,
];

/**
 * ENV-002: Potential Secret in Environment Metadata
 * Reference: docs/RULE-CATALOGUE.md Section 18
 */
export const env002SecretExposure: SyncDiagnosticRule = {
  metadata: {
    id: 'environment.secret.exposure',
    name: 'Potential Secret in Environment Metadata',
    category: 'environment',
    description:
      'Identify environment variable names that strongly suggest credentials or secrets are present.',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    applicability: ['Applicable when environment variable names are available.'],
    requiredEvidence: ['environment.variables'],
    explanation: 'A secret-like environment variable exists and may deserve review.',
    remediationHint: 'Review whether sensitive values are appropriately scoped and managed.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'environment.variables');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      variableNames?: readonly string[];
      suspiciousNames?: readonly string[];
    }>(evidence, 'environment.variables');
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'environment.secret.exposure',
        status: 'UNAVAILABLE',
        finding: buildFinding(env002SecretExposure.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Environment variable metadata is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    let suspicious = item.value.suspiciousNames;
    if (!suspicious && item.value.variableNames) {
      suspicious = item.value.variableNames.filter((name) =>
        SECRET_PATTERNS.some((p) => p.test(name)),
      );
    }

    if (suspicious && suspicious.length > 0) {
      const safeEvidenceItem: EvidenceItem = {
        key: 'environment.variables',
        source: item.source,
        availability: item.availability,
        value: { variableNames: suspicious },
      };
      return {
        ruleId: 'environment.secret.exposure',
        status: 'WARN',
        finding: buildFinding(env002SecretExposure.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Detected secret-like environment variable name(s): ${suspicious.join(', ')}.`,
          evidenceItems: [safeEvidenceItem],
          details: { count: suspicious.length, variableNames: suspicious },
        }),
      };
    }

    return {
      ruleId: 'environment.secret.exposure',
      status: 'PASS',
      finding: buildFinding(env002SecretExposure.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No suspicious unmanaged secret-like environment variable names detected.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * ENV-003: Duplicate PATH Entry
 * Reference: docs/RULE-CATALOGUE.md Section 18
 */
export const env003DuplicatePath: SyncDiagnosticRule = {
  metadata: {
    id: 'environment.path.duplicate',
    name: 'Duplicate PATH Entry',
    category: 'environment',
    description: 'Identify duplicate normalized PATH entries.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: ['Applicable when PATH entries are available.'],
    requiredEvidence: ['environment.path'],
    explanation:
      'Duplicate PATH entries can make environment configuration harder to reason about.',
    remediationHint: 'Review duplicate PATH entries.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'environment.path');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ entries?: readonly string[]; duplicates?: readonly string[] }>(
      evidence,
      'environment.path',
    );
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'environment.path.duplicate',
        status: 'UNAVAILABLE',
        finding: buildFinding(env003DuplicatePath.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'PATH entries are unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    let duplicates = item.value.duplicates;
    if (!duplicates && item.value.entries) {
      const seen = new Set<string>();
      const dups = new Set<string>();
      for (const entry of item.value.entries) {
        const normalized = entry.trim().toLowerCase();
        if (normalized.length > 0) {
          if (seen.has(normalized)) {
            dups.add(entry.trim());
          } else {
            seen.add(normalized);
          }
        }
      }
      duplicates = Array.from(dups);
    }

    if (duplicates && duplicates.length > 0) {
      return {
        ruleId: 'environment.path.duplicate',
        status: 'WARN',
        finding: buildFinding(env003DuplicatePath.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Detected duplicate PATH entry/entries: ${duplicates.join(', ')}.`,
          evidenceItems: [item],
          details: { duplicateCount: duplicates.length, duplicates },
        }),
      };
    }

    return {
      ruleId: 'environment.path.duplicate',
      status: 'PASS',
      finding: buildFinding(env003DuplicatePath.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No duplicate PATH entries detected.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * ENV-004: Shell Environment PATH Mismatch
 * Reference: docs/RULE-CATALOGUE.md Section 18
 */
export const env004ShellPathMismatch: SyncDiagnosticRule = {
  metadata: {
    id: 'environment.shell.path-mismatch',
    name: 'Shell Environment PATH Mismatch',
    category: 'environment',
    description:
      'Identify a detectable mismatch between the shell environment PATH and the expected user/system PATH configuration.',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    applicability: ['Only where the platform exposes a reliable comparison.'],
    requiredEvidence: ['environment.shell.path'],
    explanation: 'The current shell may resolve tools differently from the expected environment.',
    remediationHint: 'Inspect shell initialization and PATH configuration.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'environment.shell.path');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      isConsistent?: boolean;
      comparisonUnavailable?: boolean;
      mismatchDetails?: string;
    }>(evidence, 'environment.shell.path');
    if (
      !item ||
      item.availability !== 'AVAILABLE' ||
      !item.value ||
      item.value.comparisonUnavailable
    ) {
      return {
        ruleId: 'environment.shell.path-mismatch',
        status: 'UNAVAILABLE',
        finding: buildFinding(env004ShellPathMismatch.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Shell PATH comparison metadata is unavailable on this platform.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    if (item.value.isConsistent === false) {
      return {
        ruleId: 'environment.shell.path-mismatch',
        status: 'WARN',
        finding: buildFinding(env004ShellPathMismatch.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary:
            item.value.mismatchDetails ??
            'Current shell PATH diverges significantly from persistent system/user PATH.',
          evidenceItems: [item],
        }),
      };
    }

    return {
      ruleId: 'environment.shell.path-mismatch',
      status: 'PASS',
      finding: buildFinding(env004ShellPathMismatch.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Shell environment PATH is consistent with persistent system configuration.',
        evidenceItems: [item],
      }),
    };
  },
};

export const environmentRules: readonly DiagnosticRule[] = Object.freeze([
  env001EmptyPathEntry,
  env002SecretExposure,
  env003DuplicatePath,
  env004ShellPathMismatch,
]);
