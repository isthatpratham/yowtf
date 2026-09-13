import { describe, expect, it } from 'vitest';
import {
  sys001MemoryPressure,
  sys002CpuPressure,
  sys003UptimeShort,
  sys004ArchitectureMismatch,
  sys005PlatformSupported,
} from '../../../src/detection/rules/system/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('System Rules (SYS-001 through SYS-005)', () => {
  describe('SYS-001: system.memory.pressure', () => {
    it('evaluates exact threshold boundaries correctly', () => {
      const makeEv = (pct: number): EvidenceItem[] => [
        {
          key: 'system.memory',
          source: 'test',
          availability: 'AVAILABLE',
          value: { utilizationPercent: pct },
        },
      ];

      // Below 80% -> PASS
      expect(sys001MemoryPressure.evaluate({}, makeEv(79.9)).status).toBe('PASS');
      // Exactly 80% -> WARN
      expect(sys001MemoryPressure.evaluate({}, makeEv(80.0)).status).toBe('WARN');
      // 89.9% -> WARN
      expect(sys001MemoryPressure.evaluate({}, makeEv(89.9)).status).toBe('WARN');
      // Exactly 90% -> FAIL
      expect(sys001MemoryPressure.evaluate({}, makeEv(90.0)).status).toBe('FAIL');
      // 95% -> FAIL
      expect(sys001MemoryPressure.evaluate({}, makeEv(95.0)).status).toBe('FAIL');
    });

    it('returns UNAVAILABLE when memory evidence is missing or failed', () => {
      const failedEv: EvidenceItem[] = [
        { key: 'system.memory', source: 'test', availability: 'FAILED' },
      ];
      expect(sys001MemoryPressure.evaluate({}, failedEv).status).toBe('UNAVAILABLE');
      expect(sys001MemoryPressure.evaluate({}, []).status).toBe('UNAVAILABLE');
    });
  });

  describe('SYS-002: system.cpu.pressure', () => {
    it('evaluates CPU utilization boundaries correctly', () => {
      const makeEv = (pct: number): EvidenceItem[] => [
        {
          key: 'system.cpu',
          source: 'test',
          availability: 'AVAILABLE',
          value: { utilizationPercent: pct },
        },
      ];

      // < 85% -> PASS
      expect(sys002CpuPressure.evaluate({}, makeEv(84.9)).status).toBe('PASS');
      // Exactly 85% -> WARN
      expect(sys002CpuPressure.evaluate({}, makeEv(85.0)).status).toBe('WARN');
      // 94.9% -> WARN
      expect(sys002CpuPressure.evaluate({}, makeEv(94.9)).status).toBe('WARN');
      // Exactly 95% -> FAIL
      expect(sys002CpuPressure.evaluate({}, makeEv(95.0)).status).toBe('FAIL');
    });

    it('returns UNAVAILABLE when CPU evidence is unavailable', () => {
      const unavailEv: EvidenceItem[] = [
        { key: 'system.cpu', source: 'test', availability: 'UNAVAILABLE' },
      ];
      expect(sys002CpuPressure.evaluate({}, unavailEv).status).toBe('UNAVAILABLE');
    });
  });

  describe('SYS-003: system.uptime.short', () => {
    it('evaluates 1-hour uptime threshold', () => {
      const makeEv = (sec: number): EvidenceItem[] => [
        { key: 'system.uptime', source: 'test', availability: 'AVAILABLE', value: sec },
      ];

      // 59 minutes (3540s) -> WARN
      expect(sys003UptimeShort.evaluate({}, makeEv(3540)).status).toBe('WARN');
      // 60 minutes (3600s) -> PASS
      expect(sys003UptimeShort.evaluate({}, makeEv(3600)).status).toBe('PASS');
      // 2 hours -> PASS
      expect(sys003UptimeShort.evaluate({}, makeEv(7200)).status).toBe('PASS');
    });
  });

  describe('SYS-004: system.architecture.mismatch', () => {
    it('skips when no architecture requirement exists', () => {
      expect(sys004ArchitectureMismatch.isApplicable({}, [])).toBe(false);
      expect(sys004ArchitectureMismatch.evaluate({}, []).status).toBe('SKIPPED');
    });

    it('passes when architecture matches and fails when it mismatches', () => {
      const ev: EvidenceItem[] = [
        {
          key: 'system.architecture',
          source: 'test',
          availability: 'AVAILABLE',
          value: { arch: 'x64' },
        },
      ];

      expect(sys004ArchitectureMismatch.isApplicable({ targetArchitecture: 'x64' }, ev)).toBe(true);
      expect(sys004ArchitectureMismatch.evaluate({ targetArchitecture: 'x64' }, ev).status).toBe(
        'PASS',
      );
      expect(sys004ArchitectureMismatch.evaluate({ targetArchitecture: 'arm64' }, ev).status).toBe(
        'FAIL',
      );
    });
  });

  describe('SYS-005: system.platform.supported', () => {
    it('returns PASS for supported operating systems and UNAVAILABLE for unsupported', () => {
      const winEv: EvidenceItem[] = [
        {
          key: 'system.platform.supported',
          source: 'test',
          availability: 'AVAILABLE',
          value: { platform: 'win32', isSupported: true },
        },
      ];
      expect(sys005PlatformSupported.evaluate({}, winEv).status).toBe('PASS');

      const unsupportedEv: EvidenceItem[] = [
        {
          key: 'system.platform.supported',
          source: 'test',
          availability: 'AVAILABLE',
          value: { platform: 'freebsd', isSupported: false },
        },
      ];
      expect(sys005PlatformSupported.evaluate({}, unsupportedEv).status).toBe('UNAVAILABLE');
    });
  });
});
