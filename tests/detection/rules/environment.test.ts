import { describe, expect, it } from 'vitest';
import {
  env001EmptyPathEntry,
  env002SecretExposure,
  env003DuplicatePath,
  env004ShellPathMismatch,
} from '../../../src/detection/rules/environment/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Environment Rules (ENV-001 through ENV-004)', () => {
  describe('ENV-001: environment.path.empty-entry', () => {
    it('warns when empty PATH entry is present', () => {
      const cleanEv: EvidenceItem[] = [
        {
          key: 'environment.path',
          source: 'test',
          availability: 'AVAILABLE',
          value: { entries: ['/usr/bin', '/bin'] },
        },
      ];
      expect(env001EmptyPathEntry.evaluate({}, cleanEv).status).toBe('PASS');

      const emptyEv: EvidenceItem[] = [
        {
          key: 'environment.path',
          source: 'test',
          availability: 'AVAILABLE',
          value: { entries: ['/usr/bin', '', '/bin'] },
        },
      ];
      expect(env001EmptyPathEntry.evaluate({}, emptyEv).status).toBe('WARN');
    });
  });

  describe('ENV-002: environment.secret.exposure', () => {
    it('warns on secret-like variable names and never exposes secret values', () => {
      const cleanEv: EvidenceItem[] = [
        {
          key: 'environment.variables',
          source: 'test',
          availability: 'AVAILABLE',
          value: { variableNames: ['PATH', 'NODE_ENV'] },
        },
      ];
      expect(env002SecretExposure.evaluate({}, cleanEv).status).toBe('PASS');

      const secretEv: EvidenceItem[] = [
        {
          key: 'environment.variables',
          source: 'test',
          availability: 'AVAILABLE',
          value: { variableNames: ['PATH', 'AWS_SECRET_ACCESS_KEY', 'DATABASE_PASSWORD'] },
        },
      ];
      const res = env002SecretExposure.evaluate({}, secretEv);
      expect(res.status).toBe('WARN');
      expect(res.finding?.summary).toContain('AWS_SECRET_ACCESS_KEY');
      // Must not contain any actual values
      expect(res.finding?.summary).not.toContain('hunter2');
    });
  });

  describe('ENV-003: environment.path.duplicate', () => {
    it('warns when duplicate normalized PATH entries exist', () => {
      const cleanEv: EvidenceItem[] = [
        {
          key: 'environment.path',
          source: 'test',
          availability: 'AVAILABLE',
          value: { entries: ['/usr/bin', '/usr/local/bin'] },
        },
      ];
      expect(env003DuplicatePath.evaluate({}, cleanEv).status).toBe('PASS');

      const dupEv: EvidenceItem[] = [
        {
          key: 'environment.path',
          source: 'test',
          availability: 'AVAILABLE',
          value: { entries: ['/usr/bin', '/usr/local/bin', '/usr/bin'] },
        },
      ];
      expect(env003DuplicatePath.evaluate({}, dupEv).status).toBe('WARN');
    });
  });

  describe('ENV-004: environment.shell.path-mismatch', () => {
    it('evaluates shell path consistency', () => {
      const matchEv: EvidenceItem[] = [
        {
          key: 'environment.shell.path',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isConsistent: true },
        },
      ];
      expect(env004ShellPathMismatch.evaluate({}, matchEv).status).toBe('PASS');

      const mismatchEv: EvidenceItem[] = [
        {
          key: 'environment.shell.path',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isConsistent: false, mismatchDetails: 'Shell PATH diverges from system PATH' },
        },
      ];
      expect(env004ShellPathMismatch.evaluate({}, mismatchEv).status).toBe('WARN');
    });
  });
});
