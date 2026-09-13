import { describe, expect, it } from 'vitest';
import {
  path001ExecutableMissing,
  path002ExecutableMultiple,
  path003EntryInvalid,
  path004OrderShadowing,
} from '../../../src/detection/rules/paths/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Path Rules (PATH-001 through PATH-004)', () => {
  describe('PATH-001: path.executable.missing', () => {
    it('fails when an explicitly required executable cannot be resolved on PATH', () => {
      const resolvedEv: EvidenceItem[] = [
        {
          key: 'path.executable.requirement',
          source: 'test',
          availability: 'AVAILABLE',
          value: { executableName: 'make', isResolved: true, resolvedPath: '/usr/bin/make' },
        },
      ];
      expect(path001ExecutableMissing.isApplicable({}, resolvedEv)).toBe(true);
      expect(path001ExecutableMissing.evaluate({}, resolvedEv).status).toBe('PASS');

      const missingEv: EvidenceItem[] = [
        {
          key: 'path.executable.requirement',
          source: 'test',
          availability: 'AVAILABLE',
          value: { executableName: 'make', isResolved: false },
        },
      ];
      expect(path001ExecutableMissing.evaluate({}, missingEv).status).toBe('FAIL');
    });
  });

  describe('PATH-002: path.executable.multiple', () => {
    it('warns when multiple executable locations are resolved', () => {
      const singleEv: EvidenceItem[] = [
        {
          key: 'path.executable.resolutions',
          source: 'test',
          availability: 'AVAILABLE',
          value: { executableName: 'python', locations: ['/usr/bin/python'] },
        },
      ];
      expect(path002ExecutableMultiple.evaluate({}, singleEv).status).toBe('PASS');

      const multiEv: EvidenceItem[] = [
        {
          key: 'path.executable.resolutions',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            executableName: 'python',
            locations: ['/opt/homebrew/bin/python', '/usr/bin/python'],
          },
        },
      ];
      expect(path002ExecutableMultiple.evaluate({}, multiEv).status).toBe('WARN');
    });
  });

  describe('PATH-003: path.entry.invalid', () => {
    it('warns when PATH contains invalid or non-existent directories', () => {
      const validEv: EvidenceItem[] = [
        {
          key: 'path.validation',
          source: 'test',
          availability: 'AVAILABLE',
          value: { invalidEntries: [], hasInvalidEntries: false },
        },
      ];
      expect(path003EntryInvalid.evaluate({}, validEv).status).toBe('PASS');

      const invalidEv: EvidenceItem[] = [
        {
          key: 'path.validation',
          source: 'test',
          availability: 'AVAILABLE',
          value: { invalidEntries: ['/nonexistent/dir/path'], hasInvalidEntries: true },
        },
      ];
      expect(path003EntryInvalid.evaluate({}, invalidEv).status).toBe('WARN');
    });
  });

  describe('PATH-004: path.order.shadowing', () => {
    it('warns when PATH order causes shadowing of expected executable', () => {
      const shadowedEv: EvidenceItem[] = [
        {
          key: 'path.order.shadowing',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            toolName: 'node',
            expectedPath: '/usr/local/bin/node',
            resolvedPath: '/usr/bin/node',
            isShadowed: true,
          },
        },
      ];
      expect(path004OrderShadowing.isApplicable({}, shadowedEv)).toBe(true);
      expect(path004OrderShadowing.evaluate({}, shadowedEv).status).toBe('WARN');
    });
  });
});
