import { describe, expect, it } from 'vitest';
import {
  proj001ManifestMissing,
  proj002LockfileMissing,
  proj003RuntimePolicyMissing,
  proj004RootAmbiguous,
} from '../../../src/detection/rules/project/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Project Rules (PROJ-001 through PROJ-004)', () => {
  describe('PROJ-001: project.manifest.missing', () => {
    it('warns when project type is known but manifest file is missing', () => {
      const missingEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'node' },
        },
        {
          key: 'project.manifest',
          source: 'test',
          availability: 'UNAVAILABLE',
          value: { count: 0, manifests: [] },
        },
      ];
      expect(proj001ManifestMissing.isApplicable({}, missingEv)).toBe(true);
      expect(proj001ManifestMissing.evaluate({}, missingEv).status).toBe('WARN');

      const presentEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'node' },
        },
        {
          key: 'project.manifest',
          source: 'test',
          availability: 'AVAILABLE',
          value: { count: 1, manifests: [{ name: 'package.json' }] },
        },
      ];
      expect(proj001ManifestMissing.evaluate({}, presentEv).status).toBe('PASS');
    });
  });

  describe('PROJ-002: project.lockfile.missing', () => {
    it('fails when project lacks expected lockfile', () => {
      const rootEv: EvidenceItem = {
        key: 'project.root',
        source: 'test',
        availability: 'AVAILABLE',
        value: { isProject: true },
      };

      const noLockEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'project.lockfile',
          source: 'test',
          availability: 'UNAVAILABLE',
          value: { lockfiles: [] },
        },
      ];
      expect(proj002LockfileMissing.evaluate({}, noLockEv).status).toBe('FAIL');

      const hasLockEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'project.lockfile',
          source: 'test',
          availability: 'AVAILABLE',
          value: { lockfiles: [{ name: 'pnpm-lock.yaml' }] },
        },
      ];
      expect(proj002LockfileMissing.evaluate({}, hasLockEv).status).toBe('PASS');
    });
  });

  describe('PROJ-003: project.runtime.policy.missing', () => {
    it('warns when recognized project lacks explicit runtime policy', () => {
      const rootEv: EvidenceItem = {
        key: 'project.root',
        source: 'test',
        availability: 'AVAILABLE',
        value: { isProject: true },
      };

      const noPolicyEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'project.runtime.policy',
          source: 'test',
          availability: 'UNAVAILABLE',
          value: { policyFiles: [] },
        },
      ];
      expect(proj003RuntimePolicyMissing.evaluate({}, noPolicyEv).status).toBe('WARN');

      const hasPolicyEv: EvidenceItem[] = [
        rootEv,
        {
          key: 'project.runtime.policy',
          source: 'test',
          availability: 'AVAILABLE',
          value: { policyFiles: ['.nvmrc'] },
        },
      ];
      expect(proj003RuntimePolicyMissing.evaluate({}, hasPolicyEv).status).toBe('PASS');
    });
  });

  describe('PROJ-004: project.root.ambiguous', () => {
    it('warns when ambiguous project roots are detected', () => {
      const ambigEv: EvidenceItem[] = [
        {
          key: 'project.root',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isAmbiguous: true, ambiguousRoots: ['/app/packages/a', '/app/packages/b'] },
        },
      ];
      expect(proj004RootAmbiguous.evaluate({}, ambigEv).status).toBe('WARN');

      const clearEv: EvidenceItem[] = [
        {
          key: 'project.root',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isAmbiguous: false },
        },
      ];
      expect(proj004RootAmbiguous.evaluate({}, clearEv).status).toBe('PASS');
    });
  });
});
