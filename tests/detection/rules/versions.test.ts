import { describe, expect, it } from 'vitest';
import {
  ver001RuntimeConflict,
  ver002ToolConflict,
  ver003ProjectRuntimeUnsatisfied,
  ver004ToolOutdated,
} from '../../../src/detection/rules/versions/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Version Rules (VER-001 through VER-004)', () => {
  describe('VER-001: version.runtime.conflict', () => {
    it('warns when conflicting runtime versions are found', () => {
      const cleanEv: EvidenceItem[] = [
        {
          key: 'version.runtime.conflict',
          source: 'test',
          availability: 'AVAILABLE',
          value: { runtimeName: 'node', hasConflict: false, versionsFound: ['20.10.0'] },
        },
      ];
      expect(ver001RuntimeConflict.evaluate({}, cleanEv).status).toBe('PASS');

      const conflictEv: EvidenceItem[] = [
        {
          key: 'version.runtime.conflict',
          source: 'test',
          availability: 'AVAILABLE',
          value: { runtimeName: 'node', hasConflict: true, versionsFound: ['18.19.0', '20.10.0'] },
        },
      ];
      expect(ver001RuntimeConflict.evaluate({}, conflictEv).status).toBe('WARN');
    });
  });

  describe('VER-002: version.tool.conflict', () => {
    it('warns when conflicting tool versions are detected', () => {
      const conflictEv: EvidenceItem[] = [
        {
          key: 'version.tool.conflict',
          source: 'test',
          availability: 'AVAILABLE',
          value: { toolName: 'git', hasConflict: true, versionsFound: ['2.39.0', '2.44.0'] },
        },
      ];
      expect(ver002ToolConflict.evaluate({}, conflictEv).status).toBe('WARN');
    });
  });

  describe('VER-003: version.project.runtime.unsatisfied', () => {
    it('fails when active runtime does not satisfy project version requirement', () => {
      const unsatisfiedEv: EvidenceItem[] = [
        {
          key: 'version.project.runtime',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            runtimeName: 'python',
            resolvedVersion: '3.8.0',
            requiredRange: '>=3.10.0',
            isSatisfied: false,
          },
        },
      ];
      expect(ver003ProjectRuntimeUnsatisfied.evaluate({}, unsatisfiedEv).status).toBe('FAIL');

      const satisfiedEv: EvidenceItem[] = [
        {
          key: 'version.project.runtime',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            runtimeName: 'python',
            resolvedVersion: '3.11.0',
            requiredRange: '>=3.10.0',
            isSatisfied: true,
          },
        },
      ];
      expect(ver003ProjectRuntimeUnsatisfied.evaluate({}, satisfiedEv).status).toBe('PASS');
    });
  });

  describe('VER-004: version.tool.outdated', () => {
    it('fails when tool is below project minimum version requirement', () => {
      const outdatedEv: EvidenceItem[] = [
        {
          key: 'version.tool.requirement',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            toolName: 'git',
            installedVersion: '2.20.0',
            minimumVersion: '2.35.0',
            isOutdated: true,
          },
        },
      ];
      expect(ver004ToolOutdated.evaluate({}, outdatedEv).status).toBe('FAIL');

      const currentEv: EvidenceItem[] = [
        {
          key: 'version.tool.requirement',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            toolName: 'git',
            installedVersion: '2.40.0',
            minimumVersion: '2.35.0',
            isOutdated: false,
          },
        },
      ];
      expect(ver004ToolOutdated.evaluate({}, currentEv).status).toBe('PASS');
    });
  });
});
