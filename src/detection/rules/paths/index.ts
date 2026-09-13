import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

/**
 * PATH-001: Expected Executable Missing
 * Reference: docs/RULE-CATALOGUE.md Section 21
 */
export const path001ExecutableMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'path.executable.missing',
    name: 'Expected Executable Missing',
    category: 'path',
    description: 'Identify an explicitly required executable that cannot be resolved.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Only when a project/tool explicitly requires the executable.'],
    requiredEvidence: ['path.executable.requirement'],
    explanation: 'An explicitly required executable could not be resolved on PATH.',
    remediationHint:
      'Install the missing executable or add its directory to the PATH environment variable.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'path.executable.requirement');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      executableName?: string;
      isResolved?: boolean;
      resolvedPath?: string;
    }>(evidence, 'path.executable.requirement');

    if (!item || item.availability !== 'AVAILABLE' || !item.value?.executableName) {
      return {
        ruleId: 'path.executable.missing',
        status: 'SKIPPED',
      };
    }

    if (item.value.isResolved === false || !item.value.resolvedPath) {
      return {
        ruleId: 'path.executable.missing',
        status: 'FAIL',
        finding: buildFinding(path001ExecutableMissing.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: `Required executable '${item.value.executableName}' could not be resolved on PATH.`,
          evidenceItems: [item],
          details: { executable: item.value.executableName },
        }),
      };
    }

    return {
      ruleId: 'path.executable.missing',
      status: 'PASS',
      finding: buildFinding(path001ExecutableMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Required executable '${item.value.executableName}' was successfully resolved.`,
        evidenceItems: [item],
        details: { executable: item.value.executableName, path: item.value.resolvedPath },
      }),
    };
  },
};

/**
 * PATH-002: Multiple Executable Resolutions
 * Reference: docs/RULE-CATALOGUE.md Section 21
 */
export const path002ExecutableMultiple: SyncDiagnosticRule = {
  metadata: {
    id: 'path.executable.multiple',
    name: 'Multiple Executable Resolutions',
    category: 'path',
    description:
      'Identify multiple installations of the same executable available through PATH resolution.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: ['Applicable when inspecting PATH executable resolutions.'],
    requiredEvidence: ['path.executable.resolutions'],
    explanation:
      'Multiple installations of an executable exist on PATH, which may cause unintended resolution.',
    remediationHint: 'Inspect PATH order to confirm intended executable takes precedence.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'path.executable.resolutions');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      executableName?: string;
      locations?: readonly string[];
    }>(evidence, 'path.executable.resolutions');

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'path.executable.multiple',
        status: 'SKIPPED',
      };
    }

    const locs = item.value.locations ?? [];
    if (locs.length > 1) {
      return {
        ruleId: 'path.executable.multiple',
        status: 'WARN',
        finding: buildFinding(path002ExecutableMultiple.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Multiple resolutions found for executable '${item.value.executableName ?? 'tool'}': ${locs.join(', ')}.`,
          evidenceItems: [item],
          details: { count: locs.length, locations: locs },
        }),
      };
    }

    return {
      ruleId: 'path.executable.multiple',
      status: 'PASS',
      finding: buildFinding(path002ExecutableMultiple.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Single resolution for executable '${item.value.executableName ?? 'tool'}'.`,
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * PATH-003: Invalid PATH Entry
 * Reference: docs/RULE-CATALOGUE.md Section 21
 */
export const path003EntryInvalid: SyncDiagnosticRule = {
  metadata: {
    id: 'path.entry.invalid',
    name: 'Invalid PATH Entry',
    category: 'path',
    description: 'Identify PATH entries that are syntactically or structurally invalid.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: ['Applicable when PATH validation evidence is available.'],
    requiredEvidence: ['path.validation'],
    explanation: 'PATH contains non-existent or structurally invalid directory entries.',
    remediationHint: 'Remove invalid or deleted directories from your PATH environment variable.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'path.validation');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      invalidEntries?: readonly string[];
      hasInvalidEntries?: boolean;
    }>(evidence, 'path.validation');

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'path.entry.invalid',
        status: 'UNAVAILABLE',
        finding: buildFinding(path003EntryInvalid.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'PATH validation evidence is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const invalid = item.value.invalidEntries ?? [];
    if (invalid.length > 0 || item.value.hasInvalidEntries) {
      return {
        ruleId: 'path.entry.invalid',
        status: 'WARN',
        finding: buildFinding(path003EntryInvalid.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Detected invalid or non-existent PATH entries: ${invalid.join(', ')}.`,
          evidenceItems: [item],
          details: { invalidCount: invalid.length, invalidEntries: invalid },
        }),
      };
    }

    return {
      ruleId: 'path.entry.invalid',
      status: 'PASS',
      finding: buildFinding(path003EntryInvalid.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'All PATH entries are valid existing directories.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * PATH-004: PATH Order Shadowing
 * Reference: docs/RULE-CATALOGUE.md Section 21
 */
export const path004OrderShadowing: SyncDiagnosticRule = {
  metadata: {
    id: 'path.order.shadowing',
    name: 'PATH Order Shadowing',
    category: 'path',
    description:
      'Identify PATH ordering where an unintended executable precedes the project expected executable.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Only when an explicit expected executable/tool version is known.'],
    requiredEvidence: ['path.order.shadowing'],
    explanation: 'An unexpected earlier executable is shadowing the project expected executable.',
    remediationHint: 'Reorder PATH entries so the project intended executable appears first.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'path.order.shadowing');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      expectedPath?: string;
      resolvedPath?: string;
      isShadowed?: boolean;
      toolName?: string;
    }>(evidence, 'path.order.shadowing');

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'path.order.shadowing',
        status: 'SKIPPED',
      };
    }

    if (item.value.isShadowed) {
      return {
        ruleId: 'path.order.shadowing',
        status: 'WARN',
        finding: buildFinding(path004OrderShadowing.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Executable '${item.value.toolName ?? 'tool'}' resolves to '${item.value.resolvedPath}', shadowing expected '${item.value.expectedPath}'.`,
          evidenceItems: [item],
          details: {
            resolved: item.value.resolvedPath ?? '',
            expected: item.value.expectedPath ?? '',
          },
        }),
      };
    }

    return {
      ruleId: 'path.order.shadowing',
      status: 'PASS',
      finding: buildFinding(path004OrderShadowing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `PATH order correctly resolves the expected executable '${item.value.toolName ?? 'tool'}'.`,
        evidenceItems: [item],
      }),
    };
  },
};

export const pathRules: readonly DiagnosticRule[] = Object.freeze([
  path001ExecutableMissing,
  path002ExecutableMultiple,
  path003EntryInvalid,
  path004OrderShadowing,
]);
