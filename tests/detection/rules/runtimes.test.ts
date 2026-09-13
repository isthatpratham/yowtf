import { describe, expect, it } from 'vitest';
import {
  run001NodeUnavailable,
  run002NodeUnpinned,
  run003PythonUnavailable,
  run004PythonUnpinned,
  run005JavaUnavailable,
  run006VersionMismatch,
} from '../../../src/detection/rules/runtimes/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Runtime Rules (RUN-001 through RUN-006)', () => {
  describe('RUN-001: runtime.node.unavailable', () => {
    it('skips on non-node project and evaluates on node project', () => {
      expect(run001NodeUnavailable.isApplicable({}, [])).toBe(false);

      const nodeEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'node', types: ['node'] },
        },
        {
          key: 'runtime.node',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isAvailable: true, version: 'v20.11.0' },
        },
      ];
      expect(run001NodeUnavailable.isApplicable({}, nodeEv)).toBe(true);
      expect(run001NodeUnavailable.evaluate({}, nodeEv).status).toBe('PASS');

      const nodeMissingEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'node', types: ['node'] },
        },
        { key: 'runtime.node', source: 'test', availability: 'UNAVAILABLE' },
      ];
      expect(run001NodeUnavailable.evaluate({}, nodeMissingEv).status).toBe('UNAVAILABLE');
    });
  });

  describe('RUN-002: runtime.node.unpinned', () => {
    it('passes when runtime policy exists and fails when unpinned', () => {
      const pinnedEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'node' },
        },
        {
          key: 'project.runtime.policy',
          source: 'test',
          availability: 'AVAILABLE',
          value: { policyFiles: ['.nvmrc'] },
        },
      ];
      expect(run002NodeUnpinned.evaluate({}, pinnedEv).status).toBe('PASS');

      const unpinnedEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'node' },
        },
        {
          key: 'project.runtime.policy',
          source: 'test',
          availability: 'UNAVAILABLE',
          value: { policyFiles: [] },
        },
      ];
      expect(run002NodeUnpinned.evaluate({}, unpinnedEv).status).toBe('FAIL');
    });
  });

  describe('RUN-003: runtime.python.unavailable', () => {
    it('evaluates Python availability on Python projects', () => {
      const pyEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'python' },
        },
        {
          key: 'runtime.python',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isAvailable: true, version: '3.11.2' },
        },
      ];
      expect(run003PythonUnavailable.isApplicable({}, pyEv)).toBe(true);
      expect(run003PythonUnavailable.evaluate({}, pyEv).status).toBe('PASS');

      const pyMissingEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'python' },
        },
        { key: 'runtime.python', source: 'test', availability: 'UNAVAILABLE' },
      ];
      expect(run003PythonUnavailable.evaluate({}, pyMissingEv).status).toBe('UNAVAILABLE');
    });
  });

  describe('RUN-004: runtime.python.unpinned', () => {
    it('fails when python version is unpinned and passes when pinned', () => {
      const pinnedEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'python' },
        },
        {
          key: 'project.runtime.policy',
          source: 'test',
          availability: 'AVAILABLE',
          value: { policyFiles: ['.python-version'] },
        },
      ];
      expect(run004PythonUnpinned.evaluate({}, pinnedEv).status).toBe('PASS');

      const unpinnedEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'python' },
        },
        { key: 'project.runtime.policy', source: 'test', availability: 'UNAVAILABLE' },
      ];
      expect(run004PythonUnpinned.evaluate({}, unpinnedEv).status).toBe('FAIL');
    });
  });

  describe('RUN-005: runtime.java.unavailable', () => {
    it('evaluates Java availability on Java projects', () => {
      const javaEv: EvidenceItem[] = [
        {
          key: 'project.type',
          source: 'test',
          availability: 'AVAILABLE',
          value: { primaryType: 'java' },
        },
        {
          key: 'runtime.java',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isAvailable: true, version: '21.0.1' },
        },
      ];
      expect(run005JavaUnavailable.isApplicable({}, javaEv)).toBe(true);
      expect(run005JavaUnavailable.evaluate({}, javaEv).status).toBe('PASS');
    });
  });

  describe('RUN-006: runtime.version.mismatch', () => {
    it('passes when runtime satisfies version requirement and fails when mismatched', () => {
      const matchEv: EvidenceItem[] = [
        {
          key: 'runtime.version.requirement',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            runtimeName: 'node',
            resolvedVersion: '20.10.0',
            requiredVersion: '>=20.0.0',
            isSatisfied: true,
          },
        },
      ];
      expect(run006VersionMismatch.isApplicable({}, matchEv)).toBe(true);
      expect(run006VersionMismatch.evaluate({}, matchEv).status).toBe('PASS');

      const mismatchEv: EvidenceItem[] = [
        {
          key: 'runtime.version.requirement',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            runtimeName: 'node',
            resolvedVersion: '16.20.0',
            requiredVersion: '>=20.0.0',
            isSatisfied: false,
          },
        },
      ];
      expect(run006VersionMismatch.evaluate({}, mismatchEv).status).toBe('FAIL');
    });
  });
});
