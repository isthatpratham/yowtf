import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

function isRecognizedProject(
  _context: DetectionContext,
  evidence: readonly EvidenceItem[],
): boolean {
  const root = findEvidence<{ isProject?: boolean }>(evidence, 'project.root');
  return root?.value?.isProject === true;
}

/**
 * PROJ-001: Project Manifest Missing
 * Reference: docs/RULE-CATALOGUE.md Section 23
 */
export const proj001ManifestMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'project.manifest.missing',
    name: 'Project Manifest Missing',
    category: 'project',
    description:
      'Identify a project-like directory that lacks the manifest expected for its detected project type.',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    applicability: ['Only when project type can be determined with sufficient confidence.'],
    requiredEvidence: ['project.type', 'project.manifest'],
    explanation:
      'The project appears to belong to an ecosystem but lacks an expected manifest file.',
    remediationHint: 'Create the appropriate manifest file for your project.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const typeItem = findEvidence<{ primaryType?: string }>(evidence, 'project.type');
    return Boolean(
      typeItem && typeItem.value?.primaryType && typeItem.value.primaryType !== 'unknown',
    );
  },

  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const manifestItem = findEvidence<{ count?: number; manifests?: readonly unknown[] }>(
      evidence,
      'project.manifest',
    );
    const typeItem = findEvidence<{ primaryType?: string }>(evidence, 'project.type');

    if (
      !manifestItem ||
      manifestItem.availability !== 'AVAILABLE' ||
      (manifestItem.value?.count ?? 0) === 0
    ) {
      return {
        ruleId: 'project.manifest.missing',
        status: 'WARN',
        finding: buildFinding(proj001ManifestMissing.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Project appears to be '${typeItem?.value?.primaryType ?? 'typed'}' but lacks expected manifest file.`,
          evidenceItems: manifestItem ? [manifestItem] : [],
        }),
      };
    }

    return {
      ruleId: 'project.manifest.missing',
      status: 'PASS',
      finding: buildFinding(proj001ManifestMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Expected project manifest file is present.',
        evidenceItems: [manifestItem],
      }),
    };
  },
};

/**
 * PROJ-002: Project Lockfile Missing
 * Reference: docs/RULE-CATALOGUE.md Section 23
 */
export const proj002LockfileMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'project.lockfile.missing',
    name: 'Project Lockfile Missing',
    category: 'project',
    description: 'Identify a dependency-managed project without an expected lockfile.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Only for project ecosystems where a lockfile is expected.'],
    requiredEvidence: ['project.lockfile'],
    explanation:
      'A missing lockfile can allow dependency resolution to differ between environments.',
    remediationHint:
      'Use the project dependency workflow to generate and commit the appropriate lockfile.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return isRecognizedProject(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const lockItem = findEvidence<{ lockfiles?: readonly unknown[] }>(evidence, 'project.lockfile');

    if (
      !lockItem ||
      lockItem.availability !== 'AVAILABLE' ||
      (lockItem.value?.lockfiles?.length ?? 0) === 0
    ) {
      return {
        ruleId: 'project.lockfile.missing',
        status: 'FAIL',
        finding: buildFinding(proj002LockfileMissing.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: 'Project uses dependency management but no lockfile was found.',
          evidenceItems: lockItem ? [lockItem] : [],
        }),
      };
    }

    return {
      ruleId: 'project.lockfile.missing',
      status: 'PASS',
      finding: buildFinding(proj002LockfileMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Project lockfile is present.',
        evidenceItems: [lockItem],
      }),
    };
  },
};

/**
 * PROJ-003: Project Runtime Policy Missing
 * Reference: docs/RULE-CATALOGUE.md Section 23
 */
export const proj003RuntimePolicyMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'project.runtime.policy.missing',
    name: 'Project Runtime Policy Missing',
    category: 'project',
    description: 'Identify a recognized project without an explicit runtime version policy.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Recognized runtime-managed projects.'],
    requiredEvidence: ['project.runtime.policy'],
    explanation: 'No explicit runtime version policy was found in project configuration.',
    remediationHint:
      'Specify an explicit runtime policy (.nvmrc, .node-version, pyproject.toml, etc.).',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return isRecognizedProject(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const policyItem = findEvidence<{ policyFiles?: readonly string[]; engines?: unknown }>(
      evidence,
      'project.runtime.policy',
    );
    const hasPolicy =
      (policyItem?.value?.policyFiles?.length ?? 0) > 0 || Boolean(policyItem?.value?.engines);

    if (!hasPolicy) {
      return {
        ruleId: 'project.runtime.policy.missing',
        status: 'WARN',
        finding: buildFinding(proj003RuntimePolicyMissing.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: 'Project has no explicit runtime version policy defined.',
          evidenceItems: policyItem ? [policyItem] : [],
        }),
      };
    }

    return {
      ruleId: 'project.runtime.policy.missing',
      status: 'PASS',
      finding: buildFinding(proj003RuntimePolicyMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Project specifies an explicit runtime version policy.',
        evidenceItems: policyItem ? [policyItem] : [],
      }),
    };
  },
};

/**
 * PROJ-004: Ambiguous Project Root
 * Reference: docs/RULE-CATALOGUE.md Section 23
 */
export const proj004RootAmbiguous: SyncDiagnosticRule = {
  metadata: {
    id: 'project.root.ambiguous',
    name: 'Ambiguous Project Root',
    category: 'project',
    description:
      'Identify situations where multiple plausible project roots are detected and the target cannot be resolved confidently.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: ['Applicable when analyzing directory structure for project roots.'],
    requiredEvidence: ['project.root'],
    explanation: 'Multiple ambiguous project roots were detected.',
    remediationHint: 'Run YOWTF with an explicit --path option.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const root = findEvidence(evidence, 'project.root');
    return Boolean(root && root.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const root = findEvidence<{ isAmbiguous?: boolean; ambiguousRoots?: readonly string[] }>(
      evidence,
      'project.root',
    );

    if (!root || root.availability !== 'AVAILABLE' || !root.value) {
      return {
        ruleId: 'project.root.ambiguous',
        status: 'SKIPPED',
      };
    }

    if (root.value.isAmbiguous) {
      return {
        ruleId: 'project.root.ambiguous',
        status: 'WARN',
        finding: buildFinding(proj004RootAmbiguous.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Multiple ambiguous project roots detected: ${root.value.ambiguousRoots?.join(', ') ?? 'multiple'}.`,
          evidenceItems: [root],
        }),
      };
    }

    return {
      ruleId: 'project.root.ambiguous',
      status: 'PASS',
      finding: buildFinding(proj004RootAmbiguous.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Project root resolved unambiguously.',
        evidenceItems: [root],
      }),
    };
  },
};

export const projectRules: readonly DiagnosticRule[] = Object.freeze([
  proj001ManifestMissing,
  proj002LockfileMissing,
  proj003RuntimePolicyMissing,
  proj004RootAmbiguous,
]);
