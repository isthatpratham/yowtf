import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

function isNodeProject(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
  if (context.targetNodeVersion) return true;
  const projectType = findEvidence<{ primaryType?: string; types?: readonly string[] }>(
    evidence,
    'project.type',
  );
  if (projectType?.value) {
    if (projectType.value.primaryType === 'node') return true;
    if (projectType.value.types?.includes('node')) return true;
  }
  const manifest = findEvidence<{ manifests?: readonly { name: string }[] }>(
    evidence,
    'project.manifest',
  );
  return manifest?.value?.manifests?.some((m) => m.name === 'package.json') ?? false;
}

function isPythonProject(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
  if (context.targetPythonVersion) return true;
  const projectType = findEvidence<{ primaryType?: string; types?: readonly string[] }>(
    evidence,
    'project.type',
  );
  if (projectType?.value) {
    if (projectType.value.primaryType === 'python') return true;
    if (projectType.value.types?.includes('python')) return true;
  }
  const manifest = findEvidence<{ manifests?: readonly { name: string }[] }>(
    evidence,
    'project.manifest',
  );
  return (
    manifest?.value?.manifests?.some((m) =>
      ['requirements.txt', 'pyproject.toml', 'Pipfile', 'setup.py'].includes(m.name),
    ) ?? false
  );
}

function isJavaProject(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
  const projectType = findEvidence<{ primaryType?: string; types?: readonly string[] }>(
    evidence,
    'project.type',
  );
  if (projectType?.value) {
    if (projectType.value.primaryType === 'java') return true;
    if (projectType.value.types?.includes('java')) return true;
  }
  const manifest = findEvidence<{ manifests?: readonly { name: string }[] }>(
    evidence,
    'project.manifest',
  );
  return (
    manifest?.value?.manifests?.some((m) =>
      ['pom.xml', 'build.gradle', 'build.gradle.kts'].includes(m.name),
    ) ?? false
  );
}

/**
 * RUN-001: Node.js Runtime Unavailable
 * Reference: docs/RULE-CATALOGUE.md Section 19
 */
export const run001NodeUnavailable: SyncDiagnosticRule = {
  metadata: {
    id: 'runtime.node.unavailable',
    name: 'Node.js Runtime Unavailable',
    category: 'runtime',
    description:
      'Represent inability to determine the Node.js runtime where Node.js is required by the current diagnostic scope.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['Applicable to Node-related project scopes.'],
    requiredEvidence: ['runtime.node'],
    explanation: 'Node.js executable could not be resolved on PATH for this Node project.',
    remediationHint: 'Install Node.js or ensure the node executable is present on PATH.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return isNodeProject(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ isAvailable?: boolean; version?: string }>(
      evidence,
      'runtime.node',
    );
    const available =
      item?.availability === 'AVAILABLE' &&
      item.value?.isAvailable !== false &&
      Boolean(item.value?.version);

    if (!available) {
      return {
        ruleId: 'runtime.node.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(run001NodeUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Node.js runtime executable is not available on PATH for this Node project.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    return {
      ruleId: 'runtime.node.unavailable',
      status: 'PASS',
      finding: buildFinding(run001NodeUnavailable.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Node.js is available (${item?.value?.version ?? 'installed'}).`,
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * RUN-002: Node.js Runtime Unpinned
 * Reference: docs/RULE-CATALOGUE.md Section 19
 */
export const run002NodeUnpinned: SyncDiagnosticRule = {
  metadata: {
    id: 'runtime.node.unpinned',
    name: 'Node.js Version Not Pinned',
    category: 'runtime',
    description: 'Identify a Node.js project without an explicit runtime-version policy.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable to Node.js projects.'],
    requiredEvidence: ['project.runtime.policy'],
    explanation:
      'An unpinned runtime can cause different Node.js versions to be used across developer machines.',
    remediationHint:
      'Define an explicit Node.js version policy using .nvmrc, .node-version, or package.json engines.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return isNodeProject(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const policyItem = findEvidence<{
      policyFiles?: readonly string[];
      engines?: { node?: string };
    }>(evidence, 'project.runtime.policy');
    const nodePolicy =
      policyItem?.value?.policyFiles?.some((f) =>
        ['.nvmrc', '.node-version', '.tool-versions'].includes(f),
      ) || Boolean(policyItem?.value?.engines?.node);

    if (!nodePolicy) {
      return {
        ruleId: 'runtime.node.unpinned',
        status: 'FAIL',
        finding: buildFinding(run002NodeUnpinned.metadata, {
          status: 'FAIL',
          severity: 'MEDIUM',
          summary:
            'Node.js project has no pinned runtime version policy (.nvmrc, .node-version, or engines.node).',
          evidenceItems: policyItem ? [policyItem] : [],
        }),
      };
    }

    return {
      ruleId: 'runtime.node.unpinned',
      status: 'PASS',
      finding: buildFinding(run002NodeUnpinned.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Node.js runtime version is explicitly pinned in project configuration.',
        evidenceItems: policyItem ? [policyItem] : [],
      }),
    };
  },
};

/**
 * RUN-003: Python Runtime Unavailable
 * Reference: docs/RULE-CATALOGUE.md Section 19
 */
export const run003PythonUnavailable: SyncDiagnosticRule = {
  metadata: {
    id: 'runtime.python.unavailable',
    name: 'Python Runtime Unavailable',
    category: 'runtime',
    description:
      'Represent inability to determine Python runtime availability for an applicable Python scope.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['Python-related projects/scopes only.'],
    requiredEvidence: ['runtime.python'],
    explanation: 'Python executable could not be resolved on PATH.',
    remediationHint: 'Install Python or ensure python/python3 is in your PATH.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return isPythonProject(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ isAvailable?: boolean; version?: string }>(
      evidence,
      'runtime.python',
    );
    const available = item?.availability === 'AVAILABLE' && item.value?.isAvailable !== false;

    if (!available) {
      return {
        ruleId: 'runtime.python.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(run003PythonUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Python runtime is not available on PATH for this Python project.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    return {
      ruleId: 'runtime.python.unavailable',
      status: 'PASS',
      finding: buildFinding(run003PythonUnavailable.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Python runtime is available (${item.value?.version ?? 'installed'}).`,
        evidenceItems: [item],
        details: { version: item.value?.version ?? '' },
      }),
    };
  },
};

/**
 * RUN-004: Python Version Not Pinned
 * Reference: docs/RULE-CATALOGUE.md Section 19
 */
export const run004PythonUnpinned: SyncDiagnosticRule = {
  metadata: {
    id: 'runtime.python.unpinned',
    name: 'Python Version Not Pinned',
    category: 'runtime',
    description: 'Identify a Python project without an explicit Python runtime policy.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Python projects only.'],
    requiredEvidence: ['project.runtime.policy'],
    explanation:
      'Different Python versions can change dependency behavior and runtime compatibility.',
    remediationHint:
      "Define the project's Python version policy via .python-version or pyproject.toml.",
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return isPythonProject(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const policyItem = findEvidence<{ policyFiles?: readonly string[]; pythonVersion?: string }>(
      evidence,
      'project.runtime.policy',
    );
    const pythonPolicy =
      policyItem?.value?.policyFiles?.some((f) =>
        ['.python-version', '.tool-versions', 'runtime.txt'].includes(f),
      ) || Boolean(policyItem?.value?.pythonVersion);

    if (!pythonPolicy) {
      return {
        ruleId: 'runtime.python.unpinned',
        status: 'FAIL',
        finding: buildFinding(run004PythonUnpinned.metadata, {
          status: 'FAIL',
          severity: 'MEDIUM',
          summary:
            'Python project has no pinned version policy (.python-version, runtime.txt, or pyproject.toml).',
          evidenceItems: policyItem ? [policyItem] : [],
        }),
      };
    }

    return {
      ruleId: 'runtime.python.unpinned',
      status: 'PASS',
      finding: buildFinding(run004PythonUnpinned.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Python runtime version is explicitly pinned in project configuration.',
        evidenceItems: policyItem ? [policyItem] : [],
      }),
    };
  },
};

/**
 * RUN-005: Java Runtime Unavailable
 * Reference: docs/RULE-CATALOGUE.md Section 19
 */
export const run005JavaUnavailable: SyncDiagnosticRule = {
  metadata: {
    id: 'runtime.java.unavailable',
    name: 'Java Runtime Unavailable',
    category: 'runtime',
    description: 'Represent unavailable Java runtime information for an applicable Java scope.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['Java-related projects/scopes only.'],
    requiredEvidence: ['runtime.java'],
    explanation: 'Java runtime is not available on PATH for this Java project.',
    remediationHint: 'Install Java JDK and configure JAVA_HOME.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return isJavaProject(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ isAvailable?: boolean; version?: string }>(
      evidence,
      'runtime.java',
    );
    const available = item?.availability === 'AVAILABLE' && item.value?.isAvailable !== false;

    if (!available) {
      return {
        ruleId: 'runtime.java.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(run005JavaUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Java runtime is not available on PATH for this Java project.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    return {
      ruleId: 'runtime.java.unavailable',
      status: 'PASS',
      finding: buildFinding(run005JavaUnavailable.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Java runtime is available (${item.value?.version ?? 'installed'}).`,
        evidenceItems: [item],
        details: { version: item.value?.version ?? '' },
      }),
    };
  },
};

/**
 * RUN-006: Runtime Version Mismatch
 * Reference: docs/RULE-CATALOGUE.md Section 19
 */
export const run006VersionMismatch: SyncDiagnosticRule = {
  metadata: {
    id: 'runtime.version.mismatch',
    name: 'Runtime Version Mismatch',
    category: 'runtime',
    description: 'Identify a runtime version that conflicts with an explicit project requirement.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Only when an explicit runtime requirement exists.'],
    requiredEvidence: ['runtime.version.requirement'],
    explanation:
      'The installed or active runtime version does not satisfy the project requirement.',
    remediationHint: "Use the project's documented runtime version.",
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'runtime.version.requirement');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      runtimeName?: string;
      resolvedVersion?: string;
      requiredVersion?: string;
      isSatisfied?: boolean;
    }>(evidence, 'runtime.version.requirement');

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'runtime.version.mismatch',
        status: 'SKIPPED',
      };
    }

    if (item.value.isSatisfied === false) {
      return {
        ruleId: 'runtime.version.mismatch',
        status: 'FAIL',
        finding: buildFinding(run006VersionMismatch.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: `${item.value.runtimeName ?? 'Runtime'} version '${item.value.resolvedVersion ?? 'unknown'}' does not satisfy project requirement '${item.value.requiredVersion ?? 'unknown'}'.`,
          evidenceItems: [item],
          details: {
            runtime: item.value.runtimeName ?? 'runtime',
            resolved: item.value.resolvedVersion ?? '',
            required: item.value.requiredVersion ?? '',
          },
        }),
      };
    }

    return {
      ruleId: 'runtime.version.mismatch',
      status: 'PASS',
      finding: buildFinding(run006VersionMismatch.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `${item.value.runtimeName ?? 'Runtime'} version satisfies project requirements.`,
        evidenceItems: [item],
      }),
    };
  },
};

export const runtimeRules: readonly DiagnosticRule[] = Object.freeze([
  run001NodeUnavailable,
  run002NodeUnpinned,
  run003PythonUnavailable,
  run004PythonUnpinned,
  run005JavaUnavailable,
  run006VersionMismatch,
]);
