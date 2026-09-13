import { describe, it, expect } from 'vitest';
import { SystemCollector } from '../../src/collection/system/system-collector.js';
import type { PlatformAdapter } from '../../src/platform/types.js';

function createMockAdapter(overrides: Partial<PlatformAdapter> = {}): PlatformAdapter {
  return {
    platformType: 'windows',
    isSupported: true,
    getPlatformInfo: () => ({
      platform: 'windows',
      isSupported: true,
      os: 'win32',
      arch: 'x64',
      release: '10.0.22631',
      hostname: 'test-host',
    }),
    getMemoryInfo: () => ({
      totalBytes: 16000000000,
      freeBytes: 4000000000,
      usedBytes: 12000000000,
      utilizationPercent: 75.0,
    }),
    getCpuInfo: () => ({
      model: 'Intel Core i7',
      cores: 8,
      speedMHz: 2800,
      utilizationPercent: 45.2,
    }),
    getUptimeInfo: () => ({
      uptimeSeconds: 7200,
    }),
    isCommandAvailable: async () => true,
    ...overrides,
  };
}

describe('Collection - SystemCollector', () => {
  it('collects structured system evidence adhering to domain EvidenceSet contract', async () => {
    const collector = new SystemCollector();
    const adapter = createMockAdapter();

    const evidenceSet = await collector.collect({
      cwd: '/fake/test/dir',
      platformAdapter: adapter,
    });

    expect(evidenceSet.category).toBe('system');
    expect(evidenceSet.items).toHaveLength(5);

    // Verify system.platform.supported
    const platformItem = evidenceSet.items.find((i) => i.key === 'system.platform.supported');
    expect(platformItem).toBeDefined();
    expect(platformItem?.source).toBe('platform');
    expect(platformItem?.type).toBe('platform');
    expect(platformItem?.availability).toBe('AVAILABLE');
    expect(platformItem?.value).toEqual({
      platform: 'windows',
      isSupported: true,
      os: 'win32',
      release: '10.0.22631',
    });

    // Verify system.architecture
    const archItem = evidenceSet.items.find((i) => i.key === 'system.architecture');
    expect(archItem).toBeDefined();
    expect(archItem?.source).toBe('os.arch');
    expect(archItem?.type).toBe('architecture');
    expect(archItem?.availability).toBe('AVAILABLE');
    expect(archItem?.value).toEqual({ arch: 'x64' });

    // Verify system.uptime
    const uptimeItem = evidenceSet.items.find((i) => i.key === 'system.uptime');
    expect(uptimeItem).toBeDefined();
    expect(uptimeItem?.source).toBe('os.uptime');
    expect(uptimeItem?.type).toBe('duration');
    expect(uptimeItem?.unit).toBe('seconds');
    expect(uptimeItem?.availability).toBe('AVAILABLE');
    expect(uptimeItem?.value).toBe(7200);

    // Verify system.cpu
    const cpuItem = evidenceSet.items.find((i) => i.key === 'system.cpu');
    expect(cpuItem).toBeDefined();
    expect(cpuItem?.source).toBe('os.cpus');
    expect(cpuItem?.type).toBe('cpu');
    expect(cpuItem?.unit).toBe('percent');
    expect(cpuItem?.availability).toBe('AVAILABLE');
    expect(cpuItem?.value).toEqual({
      model: 'Intel Core i7',
      cores: 8,
      speedMHz: 2800,
      utilizationPercent: 45.2,
    });

    // Verify system.memory
    const memItem = evidenceSet.items.find((i) => i.key === 'system.memory');
    expect(memItem).toBeDefined();
    expect(memItem?.source).toBe('os.memory');
    expect(memItem?.type).toBe('memory');
    expect(memItem?.unit).toBe('bytes');
    expect(memItem?.availability).toBe('AVAILABLE');
    expect(memItem?.value).toEqual({
      totalBytes: 16000000000,
      freeBytes: 4000000000,
      usedBytes: 12000000000,
      utilizationPercent: 75.0,
    });
  });

  it('marks evidence as UNAVAILABLE when metric is unsupported on the platform', async () => {
    const collector = new SystemCollector();
    const adapter = createMockAdapter({
      getCpuInfo: () => ({
        model: 'Generic CPU',
        cores: 4,
        utilizationPercent: undefined,
      }),
    });

    const evidenceSet = await collector.collect({
      cwd: '/fake/test/dir',
      platformAdapter: adapter,
    });

    const cpuItem = evidenceSet.items.find((i) => i.key === 'system.cpu');
    expect(cpuItem?.availability).toBe('UNAVAILABLE');
  });

  it('fails safely and preserves other evidence when one adapter method throws', async () => {
    const collector = new SystemCollector();
    const adapter = createMockAdapter({
      getMemoryInfo: () => {
        throw new Error('Memory collection failed');
      },
    });

    const evidenceSet = await collector.collect({
      cwd: '/fake/test/dir',
      platformAdapter: adapter,
    });

    // Memory evidence should be marked FAILED
    const memItem = evidenceSet.items.find((i) => i.key === 'system.memory');
    expect(memItem).toBeDefined();
    expect(memItem?.availability).toBe('FAILED');
    expect(memItem?.value).toBeUndefined();

    // Remaining evidence items must remain available and uncorrupted
    const cpuItem = evidenceSet.items.find((i) => i.key === 'system.cpu');
    expect(cpuItem?.availability).toBe('AVAILABLE');

    const uptimeItem = evidenceSet.items.find((i) => i.key === 'system.uptime');
    expect(uptimeItem?.availability).toBe('AVAILABLE');
  });
});
