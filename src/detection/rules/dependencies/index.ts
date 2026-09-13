import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

function hasProjectEvidence(
  _context: DetectionContext,
  evidence: readonly EvidenceItem[],
): boolean {
  const root = findEvidence<{ isProject?: boolean }>(evidence, 'project.root');
  return root?.value?.isProject === true;
}

/**
 * DEP-001: Dependency Lockfile Missing
 * Reference: docs/RULE-CATALOGUE.md Section 24
 */
export const dep001LockfileMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'dependency.lockfile.missing',
    name: 'Dependency Lockfile Missing',
    category: 'dependency',
    description: 'Identify a dependency-managed project without its expected lockfile.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Applicable to projects with declared dependencies.'],
    requiredEvidence: ['project.lockfile'],
    explanation: 'A dependency lockfile is missing for this project.',
    remediationHint: 'Run your package manager to generate and commit the lockfile.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return hasProjectEvidence(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const lockItem = findEvidence<{ lockfiles?: readonly unknown[] }>(evidence, 'project.lockfile');

    if (
      !lockItem ||
      lockItem.availability !== 'AVAILABLE' ||
      (lockItem.value?.lockfiles?.length ?? 0) === 0
    ) {
      return {
        ruleId: 'dependency.lockfile.missing',
        status: 'FAIL',
        finding: buildFinding(dep001LockfileMissing.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: 'No dependency lockfile found for this project.',
          evidenceItems: lockItem ? [lockItem] : [],
        }),
      };
    }

    return {
      ruleId: 'dependency.lockfile.missing',
      status: 'PASS',
      finding: buildFinding(dep001LockfileMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Dependency lockfile is present.',
        evidenceItems: [lockItem],
      }),
    };
  },
};

/**
 * DEP-002: Dependency Lockfile Mismatch
 * Reference: docs/RULE-CATALOGUE.md Section 24
 */
export const dep002LockfileMismatch: SyncDiagnosticRule = {
  metadata: {
    id: 'dependency.lockfile.mismatch',
    name: 'Dependency Lockfile Mismatch',
    category: 'dependency',
    description:
      'Identify an apparent mismatch between dependency manifest and lockfile metadata where reliable comparison is available.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Applicable when manifest and lockfile metadata can be compared.'],
    requiredEvidence: ['dependency.lockfile.comparison'],
    explanation: 'Dependency declarations and lockfile state do not appear synchronized.',
    remediationHint: 'Review dependency workflow and regenerate or update lockfile.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return hasProjectEvidence(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      isSynchronized?: boolean;
      comparisonUnavailable?: boolean;
      mismatchDetails?: string;
    }>(evidence, 'dependency.lockfile.comparison');

    if (!item || item.availability !== 'AVAILABLE' || item.value?.comparisonUnavailable) {
      return {
        ruleId: 'dependency.lockfile.mismatch',
        status: 'UNAVAILABLE',
        finding: buildFinding(dep002LockfileMismatch.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Lockfile and manifest comparison metadata is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    if (item.value?.isSynchronized === false) {
      return {
        ruleId: 'dependency.lockfile.mismatch',
        status: 'FAIL',
        finding: buildFinding(dep002LockfileMismatch.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary:
            item.value.mismatchDetails ??
            'Manifest and lockfile dependencies are out of synchronization.',
          evidenceItems: [item],
        }),
      };
    }

    return {
      ruleId: 'dependency.lockfile.mismatch',
      status: 'PASS',
      finding: buildFinding(dep002LockfileMismatch.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Manifest and lockfile dependencies are synchronized.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * DEP-003: Dependency Package Manager Mismatch
 * Reference: docs/RULE-CATALOGUE.md Section 24
 */
export const dep003PackageManagerMismatch: SyncDiagnosticRule = {
  metadata: {
    id: 'dependency.package-manager.mismatch',
    name: 'Dependency Package Manager Mismatch',
    category: 'dependency',
    description:
      'Identify project metadata that points to one package manager while dependency metadata indicates another.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable when project metadata and lockfiles are available.'],
    requiredEvidence: ['project.lockfile', 'project.manifest'],
    explanation: 'Declared package manager and lockfile package manager disagree.',
    remediationHint: 'Standardize on a single package manager for the project.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return hasProjectEvidence(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const lockItem = findEvidence<{
      lockfiles?: readonly { packageManager: string }[];
      packageManager?: string;
    }>(evidence, 'project.lockfile');
    const manifestItem = findEvidence<{
      manifests?: readonly { metadata?: { packageManager?: string } }[];
    }>(evidence, 'project.manifest');

    const declaredPm = manifestItem?.value?.manifests?.find((m) => m.metadata?.packageManager)
      ?.metadata?.packageManager;
    const lockPm =
      lockItem?.value?.packageManager ?? lockItem?.value?.lockfiles?.[0]?.packageManager;

    if (declaredPm && lockPm && declaredPm !== lockPm) {
      return {
        ruleId: 'dependency.package-manager.mismatch',
        status: 'WARN',
        finding: buildFinding(dep003PackageManagerMismatch.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Package manager conflict: project specifies '${declaredPm}', but lockfile indicates '${lockPm}'.`,
          evidenceItems: [lockItem, manifestItem].filter(Boolean) as EvidenceItem[],
          details: { declared: declaredPm, lockfile: lockPm },
        }),
      };
    }

    return {
      ruleId: 'dependency.package-manager.mismatch',
      status: 'PASS',
      finding: buildFinding(dep003PackageManagerMismatch.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Package manager configuration is consistent.',
        evidenceItems: [lockItem, manifestItem].filter(Boolean) as EvidenceItem[],
      }),
    };
  },
};

/**
 * DEP-004: Dependency Directory Inconsistency
 * Reference: docs/RULE-CATALOGUE.md Section 24
 */
export const dep004DirectoryInconsistent: SyncDiagnosticRule = {
  metadata: {
    id: 'dependency.directory.inconsistent',
    name: 'Dependency Directory Inconsistency',
    category: 'dependency',
    description:
      'Identify a dependency directory state that is inconsistent with the detected dependency metadata.',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    applicability: ['Only where the ecosystem provides reliable metadata for comparison.'],
    requiredEvidence: ['dependency.directory.status'],
    explanation: 'Local dependency state may not correspond to project dependency metadata.',
    remediationHint: "Review the project's documented dependency installation workflow.",
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return hasProjectEvidence(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      isConsistent?: boolean;
      comparisonUnavailable?: boolean;
      inconsistencyReason?: string;
    }>(evidence, 'dependency.directory.status');

    if (!item || item.availability !== 'AVAILABLE' || item.value?.comparisonUnavailable) {
      return {
        ruleId: 'dependency.directory.inconsistent',
        status: 'UNAVAILABLE',
        finding: buildFinding(dep004DirectoryInconsistent.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Dependency directory consistency comparison is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    if (item.value?.isConsistent === false) {
      return {
        ruleId: 'dependency.directory.inconsistent',
        status: 'WARN',
        finding: buildFinding(dep004DirectoryInconsistent.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary:
            item.value.inconsistencyReason ??
            'Installed dependencies appear out of sync or incomplete relative to lockfile.',
          evidenceItems: [item],
        }),
      };
    }

    return {
      ruleId: 'dependency.directory.inconsistent',
      status: 'PASS',
      finding: buildFinding(dep004DirectoryInconsistent.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Installed dependency directory is consistent with lockfile metadata.',
        evidenceItems: [item],
      }),
    };
  },
};

export const dependencyRules: readonly DiagnosticRule[] = Object.freeze([
  dep001LockfileMissing,
  dep002LockfileMismatch,
  dep003PackageManagerMismatch,
  dep004DirectoryInconsistent,
]);
