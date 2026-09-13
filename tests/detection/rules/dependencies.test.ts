import { describe, expect, it } from 'vitest';
import {
  dep001LockfileMissing,
  dep002LockfileMismatch,
  dep003PackageManagerMismatch,
  dep004DirectoryInconsistent,
} from '../../../src/detection/rules/dependencies/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Dependency Rules (DEP-001 through DEP-004)', () => {
  const rootEv: EvidenceItem = {
    key: 'project.root',
    source: 'test',
    availability: 'AVAILABLE',
    value: { isProject: true },
  };

  describe('DEP-001: dependency.lockfile.missing', () => {
    it('fails when lockfile is missing', () => {
      expect(dep001LockfileMissing.evaluate({}, [rootEv]).status).toBe('FAIL');

      const withLock: EvidenceItem[] = [
        rootEv,
        {
          key: 'project.lockfile',
          source: 'test',
          availability: 'AVAILABLE',
          value: { lockfiles: [{ name: 'package-lock.json' }] },
        },
      ];
      expect(dep001LockfileMissing.evaluate({}, withLock).status).toBe('PASS');
    });
  });

  describe('DEP-002: dependency.lockfile.mismatch', () => {
    it('fails when lockfile and manifest are out of sync', () => {
      const outOfSyncEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'dependency.lockfile.comparison',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isSynchronized: false, mismatchDetails: 'lodash version differs' },
        },
      ];
      expect(dep002LockfileMismatch.evaluate({}, outOfSyncEv).status).toBe('FAIL');

      const syncedEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'dependency.lockfile.comparison',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isSynchronized: true },
        },
      ];
      expect(dep002LockfileMismatch.evaluate({}, syncedEv).status).toBe('PASS');
    });
  });

  describe('DEP-003: dependency.package-manager.mismatch', () => {
    it('warns when declared and lockfile package managers differ', () => {
      const mismatchEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'project.manifest',
          source: 'test',
          availability: 'AVAILABLE',
          value: { manifests: [{ metadata: { packageManager: 'yarn' } }] },
        },
        {
          key: 'project.lockfile',
          source: 'test',
          availability: 'AVAILABLE',
          value: { packageManager: 'npm' },
        },
      ];
      expect(dep003PackageManagerMismatch.evaluate({}, mismatchEv).status).toBe('WARN');

      const matchEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'project.manifest',
          source: 'test',
          availability: 'AVAILABLE',
          value: { manifests: [{ metadata: { packageManager: 'pnpm' } }] },
        },
        {
          key: 'project.lockfile',
          source: 'test',
          availability: 'AVAILABLE',
          value: { packageManager: 'pnpm' },
        },
      ];
      expect(dep003PackageManagerMismatch.evaluate({}, matchEv).status).toBe('PASS');
    });
  });

  describe('DEP-004: dependency.directory.inconsistent', () => {
    it('warns when installed dependency directory is inconsistent with lockfile', () => {
      const inconsistentEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'dependency.directory.status',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isConsistent: false, inconsistencyReason: 'Missing 5 installed packages' },
        },
      ];
      expect(dep004DirectoryInconsistent.evaluate({}, inconsistentEv).status).toBe('WARN');

      const consistentEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'dependency.directory.status',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isConsistent: true },
        },
      ];
      expect(dep004DirectoryInconsistent.evaluate({}, consistentEv).status).toBe('PASS');
    });
  });
});
