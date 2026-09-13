import { describe, expect, it } from 'vitest';
import {
  git001RepositoryMissing,
  git002WorkingTreeDirty,
  git003UntrackedFiles,
  git004BranchDivergence,
} from '../../../src/detection/rules/git/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Git Rules (GIT-001 through GIT-004)', () => {
  const rootEv: EvidenceItem = {
    key: 'project.root',
    source: 'test',
    availability: 'AVAILABLE',
    value: { isProject: true },
  };

  describe('GIT-001: git.repository.missing', () => {
    it('warns when project is not inside a Git repository', () => {
      const noGitEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'project.git',
          source: 'test',
          availability: 'UNAVAILABLE',
          value: { isRepository: false },
        },
      ];
      expect(git001RepositoryMissing.evaluate({}, noGitEv).status).toBe('WARN');

      const hasGitEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'project.git',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isRepository: true },
        },
      ];
      expect(git001RepositoryMissing.evaluate({}, hasGitEv).status).toBe('PASS');
    });
  });

  describe('GIT-002: git.working-tree.dirty', () => {
    it('warns when working tree has uncommitted modifications', () => {
      const gitEv: EvidenceItem = {
        key: 'project.git',
        source: 'test',
        availability: 'AVAILABLE',
        value: { isRepository: true },
      };

      const dirtyEv: EvidenceItem[] = [
        gitEv,
        {
          key: 'git.status',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isClean: false, modifiedFilesCount: 3 },
        },
      ];
      expect(git002WorkingTreeDirty.evaluate({}, dirtyEv).status).toBe('WARN');

      const cleanEv: EvidenceItem[] = [
        gitEv,
        {
          key: 'git.status',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isClean: true, modifiedFilesCount: 0 },
        },
      ];
      expect(git002WorkingTreeDirty.evaluate({}, cleanEv).status).toBe('PASS');
    });
  });

  describe('GIT-003: git.untracked.files', () => {
    it('warns when untracked files are present', () => {
      const gitEv: EvidenceItem = {
        key: 'project.git',
        source: 'test',
        availability: 'AVAILABLE',
        value: { isRepository: true },
      };

      const untrackedEv: EvidenceItem[] = [
        gitEv,
        {
          key: 'git.status',
          source: 'test',
          availability: 'AVAILABLE',
          value: { untrackedFilesCount: 2 },
        },
      ];
      expect(git003UntrackedFiles.evaluate({}, untrackedEv).status).toBe('WARN');

      const noUntrackedEv: EvidenceItem[] = [
        gitEv,
        {
          key: 'git.status',
          source: 'test',
          availability: 'AVAILABLE',
          value: { untrackedFilesCount: 0 },
        },
      ];
      expect(git003UntrackedFiles.evaluate({}, noUntrackedEv).status).toBe('PASS');
    });
  });

  describe('GIT-004: git.branch.divergence', () => {
    it('warns when branch is diverged from tracked upstream', () => {
      const gitEv: EvidenceItem = {
        key: 'project.git',
        source: 'test',
        availability: 'AVAILABLE',
        value: { isRepository: true },
      };

      const divergedEv: EvidenceItem[] = [
        gitEv,
        {
          key: 'git.divergence',
          source: 'test',
          availability: 'AVAILABLE',
          value: { hasUpstream: true, aheadCount: 2, behindCount: 1, isDiverged: true },
        },
      ];
      expect(git004BranchDivergence.evaluate({}, divergedEv).status).toBe('WARN');

      const alignedEv: EvidenceItem[] = [
        gitEv,
        {
          key: 'git.divergence',
          source: 'test',
          availability: 'AVAILABLE',
          value: { hasUpstream: true, aheadCount: 0, behindCount: 0, isDiverged: false },
        },
      ];
      expect(git004BranchDivergence.evaluate({}, alignedEv).status).toBe('PASS');
    });
  });
});
