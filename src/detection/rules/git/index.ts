import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

function isGitRepository(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
  const item = findEvidence<{ isRepository?: boolean }>(evidence, 'project.git');
  return item?.value?.isRepository === true;
}

/**
 * GIT-001: Git Repository Missing
 * Reference: docs/RULE-CATALOGUE.md Section 25
 */
export const git001RepositoryMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'git.repository.missing',
    name: 'Git Repository Missing',
    category: 'git',
    description:
      'Identify a project that appears to be version-controlled but has no detectable Git repository metadata.',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    applicability: ['Only when project context indicates Git is expected.'],
    requiredEvidence: ['project.git', 'project.root'],
    explanation: 'The project is not initialized as a Git repository.',
    remediationHint: 'Run git init if this project should be version-controlled.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const root = findEvidence<{ isProject?: boolean }>(evidence, 'project.root');
    return root?.value?.isProject === true;
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const gitItem = findEvidence<{ isRepository?: boolean }>(evidence, 'project.git');

    if (!gitItem || gitItem.availability !== 'AVAILABLE' || !gitItem.value?.isRepository) {
      return {
        ruleId: 'git.repository.missing',
        status: 'WARN',
        finding: buildFinding(git001RepositoryMissing.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: 'Project directory is not tracked inside a Git repository.',
          evidenceItems: gitItem ? [gitItem] : [],
        }),
      };
    }

    return {
      ruleId: 'git.repository.missing',
      status: 'PASS',
      finding: buildFinding(git001RepositoryMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Git repository is initialized.',
        evidenceItems: [gitItem],
      }),
    };
  },
};

/**
 * GIT-002: Dirty Working Tree
 * Reference: docs/RULE-CATALOGUE.md Section 25
 */
export const git002WorkingTreeDirty: SyncDiagnosticRule = {
  metadata: {
    id: 'git.working-tree.dirty',
    name: 'Dirty Working Tree',
    category: 'git',
    description: 'Identify uncommitted working-tree changes.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: ['Git repositories.'],
    requiredEvidence: ['git.status'],
    explanation: 'Local modifications exist in the working tree.',
    remediationHint: 'Review working tree changes before testing or comparing behavior.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return isGitRepository(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const statusItem = findEvidence<{ isClean?: boolean; modifiedFilesCount?: number }>(
      evidence,
      'git.status',
    );

    if (!statusItem || statusItem.availability !== 'AVAILABLE') {
      return {
        ruleId: 'git.working-tree.dirty',
        status: 'UNAVAILABLE',
        finding: buildFinding(git002WorkingTreeDirty.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Git status evidence is unavailable.',
          evidenceItems: statusItem ? [statusItem] : [],
        }),
      };
    }

    if (statusItem.value?.isClean === false || (statusItem.value?.modifiedFilesCount ?? 0) > 0) {
      return {
        ruleId: 'git.working-tree.dirty',
        status: 'WARN',
        finding: buildFinding(git002WorkingTreeDirty.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Working tree has uncommitted modifications (${statusItem.value?.modifiedFilesCount ?? 'multiple'} modified files).`,
          evidenceItems: [statusItem],
          details: { modifiedCount: statusItem.value?.modifiedFilesCount ?? 0 },
        }),
      };
    }

    return {
      ruleId: 'git.working-tree.dirty',
      status: 'PASS',
      finding: buildFinding(git002WorkingTreeDirty.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Working tree is clean.',
        evidenceItems: [statusItem],
      }),
    };
  },
};

/**
 * GIT-003: Untracked Files Present
 * Reference: docs/RULE-CATALOGUE.md Section 25
 */
export const git003UntrackedFiles: SyncDiagnosticRule = {
  metadata: {
    id: 'git.untracked.files',
    name: 'Untracked Files Present',
    category: 'git',
    description: 'Identify untracked files in a project repository.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: ['Git repositories.'],
    requiredEvidence: ['git.status'],
    explanation:
      'Untracked files may contain local configuration, generated files, or state not shared in version control.',
    remediationHint: 'Review untracked files to either commit or add to .gitignore.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    return isGitRepository(context, evidence);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const statusItem = findEvidence<{
      untrackedFilesCount?: number;
      untrackedFiles?: readonly string[];
    }>(evidence, 'git.status');

    if (!statusItem || statusItem.availability !== 'AVAILABLE') {
      return {
        ruleId: 'git.untracked.files',
        status: 'UNAVAILABLE',
        finding: buildFinding(git003UntrackedFiles.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Git untracked files evidence is unavailable.',
          evidenceItems: statusItem ? [statusItem] : [],
        }),
      };
    }

    const count =
      statusItem.value?.untrackedFilesCount ?? statusItem.value?.untrackedFiles?.length ?? 0;
    if (count > 0) {
      return {
        ruleId: 'git.untracked.files',
        status: 'WARN',
        finding: buildFinding(git003UntrackedFiles.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Repository has ${count} untracked file(s).`,
          evidenceItems: [statusItem],
          details: { untrackedCount: count },
        }),
      };
    }

    return {
      ruleId: 'git.untracked.files',
      status: 'PASS',
      finding: buildFinding(git003UntrackedFiles.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No untracked files present in the repository.',
        evidenceItems: [statusItem],
      }),
    };
  },
};

/**
 * GIT-004: Branch Divergence
 * Reference: docs/RULE-CATALOGUE.md Section 25
 */
export const git004BranchDivergence: SyncDiagnosticRule = {
  metadata: {
    id: 'git.branch.divergence',
    name: 'Branch Divergence',
    category: 'git',
    description:
      'Identify a branch with local commits ahead/behind its tracked upstream where reliable local Git metadata is available.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: ['Only when an upstream relationship is available.'],
    requiredEvidence: ['git.divergence'],
    explanation: 'Branch has diverged from or is ahead/behind tracked upstream.',
    remediationHint: 'Synchronize branch with upstream via pull/push.',
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    if (!isGitRepository(context, evidence)) return false;
    const item = findEvidence(evidence, 'git.divergence');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      hasUpstream?: boolean;
      aheadCount?: number;
      behindCount?: number;
      isDiverged?: boolean;
    }>(evidence, 'git.divergence');

    if (!item || item.availability !== 'AVAILABLE' || item.value?.hasUpstream === false) {
      return {
        ruleId: 'git.branch.divergence',
        status: 'UNAVAILABLE',
        finding: buildFinding(git004BranchDivergence.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Upstream branch tracking metadata is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const ahead = item.value?.aheadCount ?? 0;
    const behind = item.value?.behindCount ?? 0;
    const diverged = item.value?.isDiverged ?? (ahead > 0 || behind > 0);

    if (diverged) {
      return {
        ruleId: 'git.branch.divergence',
        status: 'WARN',
        finding: buildFinding(git004BranchDivergence.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Branch is diverged from upstream (ahead: ${ahead}, behind: ${behind}).`,
          evidenceItems: [item],
          details: { ahead, behind },
        }),
      };
    }

    return {
      ruleId: 'git.branch.divergence',
      status: 'PASS',
      finding: buildFinding(git004BranchDivergence.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Current branch is up to date with tracked upstream.',
        evidenceItems: [item],
      }),
    };
  },
};

export const gitRules: readonly DiagnosticRule[] = Object.freeze([
  git001RepositoryMissing,
  git002WorkingTreeDirty,
  git003UntrackedFiles,
  git004BranchDivergence,
]);
