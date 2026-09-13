import { describe, expect, it } from 'vitest';
import {
  disk001SpaceLow,
  disk002DeveloperStoragePressure,
  disk003ProjectLocationUnavailable,
  disk004FilesystemReadonly,
} from '../../../src/detection/rules/disk/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Disk Rules (DISK-001 through DISK-004)', () => {
  describe('DISK-001: disk.space.low', () => {
    it('evaluates free percentage thresholds: >=15% PASS, 10-14.9% WARN, <10% FAIL', () => {
      const makeEv = (pct: number): EvidenceItem[] => [
        {
          key: 'disk.space',
          source: 'test',
          availability: 'AVAILABLE',
          value: { freePercent: pct },
        },
      ];

      expect(disk001SpaceLow.evaluate({}, makeEv(20)).status).toBe('PASS');
      expect(disk001SpaceLow.evaluate({}, makeEv(15.0)).status).toBe('PASS');
      expect(disk001SpaceLow.evaluate({}, makeEv(14.9)).status).toBe('WARN');
      expect(disk001SpaceLow.evaluate({}, makeEv(10.0)).status).toBe('WARN');
      expect(disk001SpaceLow.evaluate({}, makeEv(9.9)).status).toBe('FAIL');
      expect(disk001SpaceLow.evaluate({}, makeEv(2.0)).status).toBe('FAIL');
    });

    it('calculates free percentage from total and available bytes when freePercent is omitted', () => {
      const ev: EvidenceItem[] = [
        {
          key: 'disk.space',
          source: 'test',
          availability: 'AVAILABLE',
          value: { totalBytes: 1000, availableBytes: 80 },
        },
      ];
      expect(disk001SpaceLow.evaluate({}, ev).status).toBe('FAIL');
    });
  });

  describe('DISK-002: disk.developer-storage.pressure', () => {
    it('evaluates developer storage pressure: <20GB PASS, >=20GB WARN, >=50GB FAIL', () => {
      const ONE_GB = 1024 * 1024 * 1024;
      const makeEv = (gb: number): EvidenceItem[] => [
        {
          key: 'disk.developer-storage',
          source: 'test',
          availability: 'AVAILABLE',
          value: { totalBytes: gb * ONE_GB },
        },
      ];

      expect(disk002DeveloperStoragePressure.isApplicable({}, makeEv(10))).toBe(true);
      expect(disk002DeveloperStoragePressure.evaluate({}, makeEv(19.9)).status).toBe('PASS');
      expect(disk002DeveloperStoragePressure.evaluate({}, makeEv(20.0)).status).toBe('WARN');
      expect(disk002DeveloperStoragePressure.evaluate({}, makeEv(49.9)).status).toBe('WARN');
      expect(disk002DeveloperStoragePressure.evaluate({}, makeEv(50.0)).status).toBe('FAIL');
    });
  });

  describe('DISK-003: disk.project.location.unavailable', () => {
    it('reports PASS when project location is accessible and UNAVAILABLE when inaccessible', () => {
      const normalEv: EvidenceItem[] = [
        {
          key: 'project.root',
          source: 'test',
          availability: 'AVAILABLE',
          value: { rootPath: '/app', isProject: true },
        },
      ];
      expect(disk003ProjectLocationUnavailable.evaluate({}, normalEv).status).toBe('PASS');

      const failedEv: EvidenceItem[] = [
        { key: 'project.root', source: 'test', availability: 'FAILED' },
      ];
      expect(disk003ProjectLocationUnavailable.evaluate({}, failedEv).status).toBe('UNAVAILABLE');
    });
  });

  describe('DISK-004: disk.filesystem.readonly', () => {
    it('reports PASS for writable filesystem and WARN for read-only filesystem', () => {
      const writableEv: EvidenceItem[] = [
        {
          key: 'disk.filesystem',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isReadOnly: false, writable: true },
        },
      ];
      expect(disk004FilesystemReadonly.isApplicable({}, writableEv)).toBe(true);
      expect(disk004FilesystemReadonly.evaluate({}, writableEv).status).toBe('PASS');

      const roEv: EvidenceItem[] = [
        {
          key: 'disk.filesystem',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isReadOnly: true, writable: false },
        },
      ];
      expect(disk004FilesystemReadonly.evaluate({}, roEv).status).toBe('WARN');
    });
  });
});
