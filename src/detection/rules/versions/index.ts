import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

/**
 * VER-001: Runtime Version Conflict
 * Reference: docs/RULE-CATALOGUE.md Section 22
 */
export const ver001RuntimeConflict: SyncDiagnosticRule = {
  metadata: {
    id: 'version.runtime.conflict',
    name: 'Runtime Version Conflict',
    category: 'version',
    description: 'Identify conflicting versions of the same runtime available on the workstation.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable when multiple runtime versions are detected.'],
    requiredEvidence: ['version.runtime.conflict'],
    explanation: 'Conflicting versions of the same runtime were detected on PATH.',
    remediationHint: 'Standardize on a single runtime version or configure a version manager.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'version.runtime.conflict');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      runtimeName?: string;
      hasConflict?: boolean;
      versionsFound?: readonly string[];
    }>(evidence, 'version.runtime.conflict');

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'version.runtime.conflict',
        status: 'SKIPPED',
      };
    }

    if (item.value.hasConflict && (item.value.versionsFound?.length ?? 0) > 1) {
      return {
        ruleId: 'version.runtime.conflict',
        status: 'WARN',
        finding: buildFinding(ver001RuntimeConflict.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Conflicting versions found for runtime '${item.value.runtimeName ?? 'runtime'}': ${item.value.versionsFound?.join(', ')}.`,
          evidenceItems: [item],
          details: {
            runtime: item.value.runtimeName ?? '',
            versions: item.value.versionsFound ?? [],
          },
        }),
      };
    }

    return {
      ruleId: 'version.runtime.conflict',
      status: 'PASS',
      finding: buildFinding(ver001RuntimeConflict.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `No conflicting versions detected for runtime '${item.value.runtimeName ?? 'runtime'}'.`,
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * VER-002: Developer Tool Version Conflict
 * Reference: docs/RULE-CATALOGUE.md Section 22
 */
export const ver002ToolConflict: SyncDiagnosticRule = {
  metadata: {
    id: 'version.tool.conflict',
    name: 'Developer Tool Version Conflict',
    category: 'version',
    description:
      'Identify multiple versions of a developer tool that may be selected differently depending on PATH.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable when multiple versions of a developer tool are detected.'],
    requiredEvidence: ['version.tool.conflict'],
    explanation: 'Multiple versions of a developer tool are present on PATH.',
    remediationHint: 'Remove conflicting installations or fix PATH priority.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'version.tool.conflict');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      toolName?: string;
      hasConflict?: boolean;
      versionsFound?: readonly string[];
    }>(evidence, 'version.tool.conflict');

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'version.tool.conflict',
        status: 'SKIPPED',
      };
    }

    if (item.value.hasConflict && (item.value.versionsFound?.length ?? 0) > 1) {
      return {
        ruleId: 'version.tool.conflict',
        status: 'WARN',
        finding: buildFinding(ver002ToolConflict.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Conflicting versions found for tool '${item.value.toolName ?? 'tool'}': ${item.value.versionsFound?.join(', ')}.`,
          evidenceItems: [item],
          details: { tool: item.value.toolName ?? '', versions: item.value.versionsFound ?? [] },
        }),
      };
    }

    return {
      ruleId: 'version.tool.conflict',
      status: 'PASS',
      finding: buildFinding(ver002ToolConflict.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `No conflicting versions detected for tool '${item.value.toolName ?? 'tool'}'.`,
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * VER-003: Project Runtime Requirement Unsatisfied
 * Reference: docs/RULE-CATALOGUE.md Section 22
 */
export const ver003ProjectRuntimeUnsatisfied: SyncDiagnosticRule = {
  metadata: {
    id: 'version.project.runtime.unsatisfied',
    name: 'Project Runtime Requirement Unsatisfied',
    category: 'version',
    description:
      'Identify when a resolved runtime version does not satisfy an explicit project requirement.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Only when an explicit project runtime requirement is defined.'],
    requiredEvidence: ['version.project.runtime'],
    explanation:
      'The current runtime version fails to satisfy the version requirement specified by the project.',
    remediationHint: 'Install or switch to a runtime version matching the project specification.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'version.project.runtime');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      runtimeName?: string;
      resolvedVersion?: string;
      requiredRange?: string;
      isSatisfied?: boolean;
    }>(evidence, 'version.project.runtime');

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'version.project.runtime.unsatisfied',
        status: 'SKIPPED',
      };
    }

    if (item.value.isSatisfied === false) {
      return {
        ruleId: 'version.project.runtime.unsatisfied',
        status: 'FAIL',
        finding: buildFinding(ver003ProjectRuntimeUnsatisfied.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: `Active ${item.value.runtimeName ?? 'runtime'} version '${item.value.resolvedVersion ?? 'unknown'}' does not satisfy project requirement '${item.value.requiredRange ?? 'unknown'}'.`,
          evidenceItems: [item],
          details: {
            runtime: item.value.runtimeName ?? '',
            resolved: item.value.resolvedVersion ?? '',
            required: item.value.requiredRange ?? '',
          },
        }),
      };
    }

    return {
      ruleId: 'version.project.runtime.unsatisfied',
      status: 'PASS',
      finding: buildFinding(ver003ProjectRuntimeUnsatisfied.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Active ${item.value.runtimeName ?? 'runtime'} version '${item.value.resolvedVersion ?? ''}' satisfies project requirement.`,
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * VER-004: Developer Tool Version Below Project Requirement
 * Reference: docs/RULE-CATALOGUE.md Section 22
 */
export const ver004ToolOutdated: SyncDiagnosticRule = {
  metadata: {
    id: 'version.tool.outdated',
    name: 'Developer Tool Version Below Project Requirement',
    category: 'version',
    description: 'Identify a developer tool version that is below an explicit project requirement.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Only when a minimum version is explicitly defined.'],
    requiredEvidence: ['version.tool.requirement'],
    explanation: 'The installed tool version is older than the required minimum version.',
    remediationHint: 'Upgrade the tool to satisfy the minimum version requirement.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'version.tool.requirement');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      toolName?: string;
      installedVersion?: string;
      minimumVersion?: string;
      isOutdated?: boolean;
    }>(evidence, 'version.tool.requirement');

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'version.tool.outdated',
        status: 'SKIPPED',
      };
    }

    if (item.value.isOutdated) {
      return {
        ruleId: 'version.tool.outdated',
        status: 'FAIL',
        finding: buildFinding(ver004ToolOutdated.metadata, {
          status: 'FAIL',
          severity: 'MEDIUM',
          summary: `Tool '${item.value.toolName ?? 'tool'}' version '${item.value.installedVersion}' is below required minimum '${item.value.minimumVersion}'.`,
          evidenceItems: [item],
          details: {
            tool: item.value.toolName ?? '',
            installed: item.value.installedVersion ?? '',
            minimum: item.value.minimumVersion ?? '',
          },
        }),
      };
    }

    return {
      ruleId: 'version.tool.outdated',
      status: 'PASS',
      finding: buildFinding(ver004ToolOutdated.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Tool '${item.value.toolName ?? 'tool'}' satisfies the minimum version requirement.`,
        evidenceItems: [item],
      }),
    };
  },
};

export const versionRules: readonly DiagnosticRule[] = Object.freeze([
  ver001RuntimeConflict,
  ver002ToolConflict,
  ver003ProjectRuntimeUnsatisfied,
  ver004ToolOutdated,
]);
