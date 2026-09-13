import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

function hasGitContext(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
  const gitItem = findEvidence<{ isRepository?: boolean }>(evidence, 'project.git');
  return gitItem?.value?.isRepository === true;
}

function hasDockerContext(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
  const configItem = findEvidence<{ configFiles?: readonly { name: string }[] }>(
    evidence,
    'project.config',
  );
  return (
    configItem?.value?.configFiles?.some((f) =>
      ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yaml'].includes(f.name),
    ) ?? false
  );
}

/**
 * TOOL-001: Git Unavailable
 * Reference: docs/RULE-CATALOGUE.md Section 20
 */
export const tool001GitUnavailable: SyncDiagnosticRule = {
  metadata: {
    id: 'tool.git.unavailable',
    name: 'Git Unavailable',
    category: 'tool',
    description: 'Represent inability to resolve Git when a Git scope requires it.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['Git-related project/scopes.'],
    requiredEvidence: ['tool.git'],
    explanation: 'Git executable is not available on PATH for this repository.',
    remediationHint: 'Install Git and add git to your PATH environment variable.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return hasGitContext(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ isAvailable?: boolean; version?: string }>(evidence, 'tool.git');
    const available = item?.availability === 'AVAILABLE' && item.value?.isAvailable !== false;

    if (!available) {
      return {
        ruleId: 'tool.git.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(tool001GitUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Git command-line tool is not available on PATH for this Git project.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    return {
      ruleId: 'tool.git.unavailable',
      status: 'PASS',
      finding: buildFinding(tool001GitUnavailable.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Git is available (${item.value?.version ?? 'installed'}).`,
        evidenceItems: [item],
        details: { version: item.value?.version ?? '' },
      }),
    };
  },
};

/**
 * TOOL-002: Package Manager Mismatch
 * Reference: docs/RULE-CATALOGUE.md Section 20
 */
export const tool002PackageManagerMismatch: SyncDiagnosticRule = {
  metadata: {
    id: 'tool.package-manager.mismatch',
    name: 'Package Manager Mismatch',
    category: 'tool',
    description:
      'Identify when project metadata indicates one package manager while another appears to be the active/resolved package manager.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable to supported package-manager projects.'],
    requiredEvidence: ['project.lockfile', 'tool.package-manager'],
    explanation: 'Different package managers can resolve dependencies differently.',
    remediationHint: 'Use the package manager specified by the project.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const lockfileItem = findEvidence(evidence, 'project.lockfile');
    return Boolean(lockfileItem && lockfileItem.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const toolPm = findEvidence<{
      activePackageManager?: string;
      declaredPackageManager?: string;
      isMismatch?: boolean;
    }>(evidence, 'tool.package-manager');
    const lockfileItem = findEvidence<{ packageManager?: string }>(evidence, 'project.lockfile');

    if (!toolPm || toolPm.availability !== 'AVAILABLE') {
      return {
        ruleId: 'tool.package-manager.mismatch',
        status: 'UNAVAILABLE',
        finding: buildFinding(tool002PackageManagerMismatch.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Active package manager information is unavailable for comparison.',
          evidenceItems: toolPm ? [toolPm] : [],
        }),
      };
    }

    const declared = toolPm.value?.declaredPackageManager ?? lockfileItem?.value?.packageManager;
    const active = toolPm.value?.activePackageManager;
    const isMismatch =
      toolPm.value?.isMismatch ?? (Boolean(declared) && Boolean(active) && declared !== active);

    if (isMismatch) {
      return {
        ruleId: 'tool.package-manager.mismatch',
        status: 'WARN',
        finding: buildFinding(tool002PackageManagerMismatch.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Active package manager '${active}' does not match project expected package manager '${declared}'.`,
          evidenceItems: [toolPm],
          details: { active: active ?? '', expected: declared ?? '' },
        }),
      };
    }

    return {
      ruleId: 'tool.package-manager.mismatch',
      status: 'PASS',
      finding: buildFinding(tool002PackageManagerMismatch.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Package manager '${active ?? declared ?? 'detected'}' matches project configuration.`,
        evidenceItems: [toolPm],
      }),
    };
  },
};

/**
 * TOOL-003: Required Package Manager Missing
 * Reference: docs/RULE-CATALOGUE.md Section 20
 */
export const tool003PackageManagerMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'tool.package-manager.missing',
    name: 'Required Package Manager Missing',
    category: 'tool',
    description:
      'Identify when a project explicitly requires a package manager that cannot be resolved.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Only when the project explicitly identifies a package manager.'],
    requiredEvidence: ['tool.package-manager.availability'],
    explanation:
      'The project identifies a package manager that is not available on the current PATH.',
    remediationHint: "Install/use the project's documented package manager manually.",
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence<{ expectedPackageManager?: string }>(
      evidence,
      'tool.package-manager.availability',
    );
    return Boolean(item && item.value?.expectedPackageManager);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      expectedPackageManager?: string;
      isAvailable?: boolean;
    }>(evidence, 'tool.package-manager.availability');

    if (!item || !item.value?.expectedPackageManager) {
      return {
        ruleId: 'tool.package-manager.missing',
        status: 'SKIPPED',
      };
    }

    if (item.value.isAvailable === false) {
      return {
        ruleId: 'tool.package-manager.missing',
        status: 'FAIL',
        finding: buildFinding(tool003PackageManagerMissing.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: `Required package manager '${item.value.expectedPackageManager}' is not available on PATH.`,
          evidenceItems: [item],
          details: { packageManager: item.value.expectedPackageManager },
        }),
      };
    }

    return {
      ruleId: 'tool.package-manager.missing',
      status: 'PASS',
      finding: buildFinding(tool003PackageManagerMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Required package manager '${item.value.expectedPackageManager}' is available on PATH.`,
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * TOOL-004: Docker Unavailable
 * Reference: docs/RULE-CATALOGUE.md Section 20
 */
export const tool004DockerUnavailable: SyncDiagnosticRule = {
  metadata: {
    id: 'tool.docker.unavailable',
    name: 'Docker Unavailable',
    category: 'tool',
    description:
      'Represent Docker availability when Docker is explicitly relevant to the detected project.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['Docker-related projects only.'],
    requiredEvidence: ['tool.docker'],
    explanation: 'Docker executable could not be resolved on PATH for this containerized project.',
    remediationHint: 'Install Docker or ensure docker is available in PATH.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return hasDockerContext(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ isAvailable?: boolean; version?: string }>(evidence, 'tool.docker');
    const available = item?.availability === 'AVAILABLE' && item.value?.isAvailable !== false;

    if (!available) {
      return {
        ruleId: 'tool.docker.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(tool004DockerUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Docker is not available on PATH for this containerized project.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    return {
      ruleId: 'tool.docker.unavailable',
      status: 'PASS',
      finding: buildFinding(tool004DockerUnavailable.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Docker is available (${item.value?.version ?? 'installed'}).`,
        evidenceItems: [item],
        details: { version: item.value?.version ?? '' },
      }),
    };
  },
};

/**
 * TOOL-005: Executable Shadowing
 * Reference: docs/RULE-CATALOGUE.md Section 20
 */
export const tool005ExecutableShadowing: SyncDiagnosticRule = {
  metadata: {
    id: 'tool.executable.shadowing',
    name: 'Executable Shadowing',
    category: 'tool',
    description:
      'Identify multiple executable locations for the same developer tool where PATH ordering can determine which version is used.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable when tool executable resolution is inspected.'],
    requiredEvidence: ['tool.shadowing'],
    explanation: 'Multiple installations can make tool resolution unpredictable.',
    remediationHint: 'Inspect PATH ordering and remove unintended duplicate installations.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'tool.shadowing');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      toolName?: string;
      hasShadowing?: boolean;
      locations?: readonly string[];
    }>(evidence, 'tool.shadowing');

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'tool.executable.shadowing',
        status: 'SKIPPED',
      };
    }

    if (item.value.hasShadowing && (item.value.locations?.length ?? 0) > 1) {
      return {
        ruleId: 'tool.executable.shadowing',
        status: 'WARN',
        finding: buildFinding(tool005ExecutableShadowing.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Executable shadowing detected for tool '${item.value.toolName ?? 'unknown'}': found at multiple PATH locations (${item.value.locations?.join(', ')}).`,
          evidenceItems: [item],
          details: { tool: item.value.toolName ?? '', count: item.value.locations?.length ?? 0 },
        }),
      };
    }

    return {
      ruleId: 'tool.executable.shadowing',
      status: 'PASS',
      finding: buildFinding(tool005ExecutableShadowing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `No executable shadowing detected for '${item.value.toolName ?? 'tools'}'.`,
        evidenceItems: [item],
      }),
    };
  },
};

export const toolRules: readonly DiagnosticRule[] = Object.freeze([
  tool001GitUnavailable,
  tool002PackageManagerMismatch,
  tool003PackageManagerMissing,
  tool004DockerUnavailable,
  tool005ExecutableShadowing,
]);
