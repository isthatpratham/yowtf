import { describe, expect, it } from 'vitest';
import {
  proc001ResourceHog,
  proc002MemoryHog,
  proc003Zombie,
  proc004Duplicate,
} from '../../../src/detection/rules/processes/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Process Rules (PROC-001 through PROC-004)', () => {
  describe('PROC-001: process.resource.hog', () => {
    it('evaluates per-process CPU thresholds: <80% PASS, 80-94.9% WARN, >=95% FAIL', () => {
      const makeEv = (cpu: number): EvidenceItem[] => [
        {
          key: 'process.list',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            processes: [{ pid: 1234, name: 'node', cpuPercent: cpu }],
          },
        },
      ];

      expect(proc001ResourceHog.evaluate({}, makeEv(79.9)).status).toBe('PASS');
      expect(proc001ResourceHog.evaluate({}, makeEv(80.0)).status).toBe('WARN');
      expect(proc001ResourceHog.evaluate({}, makeEv(94.9)).status).toBe('WARN');
      expect(proc001ResourceHog.evaluate({}, makeEv(95.0)).status).toBe('FAIL');
    });
  });

  describe('PROC-002: process.memory.hog', () => {
    it('evaluates per-process memory thresholds: <10% PASS, 10-19.9% WARN, >=20% FAIL', () => {
      const makeEv = (mem: number): EvidenceItem[] => [
        {
          key: 'process.list',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            processes: [{ pid: 1234, name: 'java', memoryPercent: mem }],
          },
        },
      ];

      expect(proc002MemoryHog.evaluate({}, makeEv(9.9)).status).toBe('PASS');
      expect(proc002MemoryHog.evaluate({}, makeEv(10.0)).status).toBe('WARN');
      expect(proc002MemoryHog.evaluate({}, makeEv(19.9)).status).toBe('WARN');
      expect(proc002MemoryHog.evaluate({}, makeEv(20.0)).status).toBe('FAIL');
    });
  });

  describe('PROC-003: process.development.zombie', () => {
    it('skips on non-Linux platforms and evaluates zombies on Linux', () => {
      expect(proc003Zombie.isApplicable({ platform: 'win32' }, [])).toBe(false);
      expect(proc003Zombie.isApplicable({ platform: 'darwin' }, [])).toBe(false);
      expect(proc003Zombie.isApplicable({ platform: 'linux' }, [])).toBe(true);

      const cleanLinuxEv: EvidenceItem[] = [
        {
          key: 'process.list',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            processes: [{ pid: 100, name: 'bash', state: 'S' }],
          },
        },
      ];
      expect(proc003Zombie.evaluate({ platform: 'linux' }, cleanLinuxEv).status).toBe('PASS');

      const zombieLinuxEv: EvidenceItem[] = [
        {
          key: 'process.list',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            processes: [{ pid: 101, name: 'node <defunct>', state: 'Z' }],
          },
        },
      ];
      expect(proc003Zombie.evaluate({ platform: 'linux' }, zombieLinuxEv).status).toBe('WARN');
    });
  });

  describe('PROC-004: process.development.duplicate', () => {
    it('warns when duplicate development processes are detected', () => {
      const normalEv: EvidenceItem[] = [
        {
          key: 'process.list',
          source: 'test',
          availability: 'AVAILABLE',
          value: { processes: [], duplicateDevProcesses: [] },
        },
      ];
      expect(proc004Duplicate.evaluate({}, normalEv).status).toBe('PASS');

      const dupEv: EvidenceItem[] = [
        {
          key: 'process.list',
          source: 'test',
          availability: 'AVAILABLE',
          value: { duplicateDevProcesses: ['webpack-dev-server (x3)'] },
        },
      ];
      expect(proc004Duplicate.evaluate({}, dupEv).status).toBe('WARN');
    });
  });
});
