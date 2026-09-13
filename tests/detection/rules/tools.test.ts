import { describe, expect, it } from 'vitest';
import {
  tool001GitUnavailable,
  tool002PackageManagerMismatch,
  tool003PackageManagerMissing,
  tool004DockerUnavailable,
  tool005ExecutableShadowing,
} from '../../../src/detection/rules/tools/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Tool Rules (TOOL-001 through TOOL-005)', () => {
  describe('TOOL-001: tool.git.unavailable', () => {
    it('evaluates Git availability in Git repositories', () => {
      const gitEv: EvidenceItem[] = [
        {
          key: 'project.git',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isRepository: true },
        },
        {
          key: 'tool.git',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isAvailable: true, version: '2.43.0' },
        },
      ];
      expect(tool001GitUnavailable.isApplicable({}, gitEv)).toBe(true);
      expect(tool001GitUnavailable.evaluate({}, gitEv).status).toBe('PASS');

      const missingGitEv: EvidenceItem[] = [
        {
          key: 'project.git',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isRepository: true },
        },
        { key: 'tool.git', source: 'test', availability: 'UNAVAILABLE' },
      ];
      expect(tool001GitUnavailable.evaluate({}, missingGitEv).status).toBe('UNAVAILABLE');
    });
  });

  describe('TOOL-002: tool.package-manager.mismatch', () => {
    it('warns when active and declared package managers disagree', () => {
      const lockEv: EvidenceItem = {
        key: 'project.lockfile',
        source: 'test',
        availability: 'AVAILABLE',
        value: { packageManager: 'pnpm' },
      };

      const matchEv: EvidenceItem[] = [
        lockEv,
        {
          key: 'tool.package-manager',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            activePackageManager: 'pnpm',
            declaredPackageManager: 'pnpm',
            isMismatch: false,
          },
        },
      ];
      expect(tool002PackageManagerMismatch.evaluate({}, matchEv).status).toBe('PASS');

      const mismatchEv: EvidenceItem[] = [
        lockEv,
        {
          key: 'tool.package-manager',
          source: 'test',
          availability: 'AVAILABLE',
          value: { activePackageManager: 'npm', declaredPackageManager: 'pnpm', isMismatch: true },
        },
      ];
      expect(tool002PackageManagerMismatch.evaluate({}, mismatchEv).status).toBe('WARN');
    });
  });

  describe('TOOL-003: tool.package-manager.missing', () => {
    it('fails when project package manager cannot be resolved on PATH', () => {
      const availEv: EvidenceItem[] = [
        {
          key: 'tool.package-manager.availability',
          source: 'test',
          availability: 'AVAILABLE',
          value: { expectedPackageManager: 'pnpm', isAvailable: true },
        },
      ];
      expect(tool003PackageManagerMissing.isApplicable({}, availEv)).toBe(true);
      expect(tool003PackageManagerMissing.evaluate({}, availEv).status).toBe('PASS');

      const missingEv: EvidenceItem[] = [
        {
          key: 'tool.package-manager.availability',
          source: 'test',
          availability: 'AVAILABLE',
          value: { expectedPackageManager: 'pnpm', isAvailable: false },
        },
      ];
      expect(tool003PackageManagerMissing.evaluate({}, missingEv).status).toBe('FAIL');
    });
  });

  describe('TOOL-004: tool.docker.unavailable', () => {
    it('evaluates Docker availability on containerized projects', () => {
      const dockerProjEv: EvidenceItem[] = [
        {
          key: 'project.config',
          source: 'test',
          availability: 'AVAILABLE',
          value: { configFiles: [{ name: 'Dockerfile' }] },
        },
        {
          key: 'tool.docker',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isAvailable: true, version: '24.0.7' },
        },
      ];
      expect(tool004DockerUnavailable.isApplicable({}, dockerProjEv)).toBe(true);
      expect(tool004DockerUnavailable.evaluate({}, dockerProjEv).status).toBe('PASS');
    });
  });

  describe('TOOL-005: tool.executable.shadowing', () => {
    it('warns when tool has multiple competing installations causing shadowing', () => {
      const shadowedEv: EvidenceItem[] = [
        {
          key: 'tool.shadowing',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            toolName: 'node',
            hasShadowing: true,
            locations: ['/opt/homebrew/bin/node', '/usr/local/bin/node'],
          },
        },
      ];
      expect(tool005ExecutableShadowing.evaluate({}, shadowedEv).status).toBe('WARN');
    });
  });
});
