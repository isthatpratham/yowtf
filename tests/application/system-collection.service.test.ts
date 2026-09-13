import { describe, it, expect } from 'vitest';
import { SystemCollectionService } from '../../src/application/services/system-collection.service.js';
import type { PlatformAdapter } from '../../src/platform/types.js';

describe('Application - SystemCollectionService', () => {
  it('orchestrates system collection and returns normalized EvidenceSet', async () => {
    const service = new SystemCollectionService();
    const evidenceSet = await service.collectSystemEvidence();

    expect(evidenceSet.category).toBe('system');
    expect(evidenceSet.items.length).toBeGreaterThanOrEqual(4);

    const platformItem = evidenceSet.items.find((i) => i.key === 'system.platform.supported');
    expect(platformItem).toBeDefined();
    expect(platformItem?.availability).toBe('AVAILABLE');

    const memoryItem = evidenceSet.items.find((i) => i.key === 'system.memory');
    expect(memoryItem).toBeDefined();
    expect(memoryItem?.availability).toBe('AVAILABLE');
  });

  it('allows injecting a custom platform adapter for controlled application workflows', async () => {
    const customAdapter: PlatformAdapter = {
      platformType: 'linux',
      isSupported: true,
      getPlatformInfo: () => ({
        platform: 'linux',
        isSupported: true,
        os: 'linux',
        arch: 'arm64',
        release: '5.15.0',
        hostname: 'linux-runner',
      }),
      getMemoryInfo: () => ({
        totalBytes: 8000000000,
        freeBytes: 2000000000,
        usedBytes: 6000000000,
        utilizationPercent: 75,
      }),
      getCpuInfo: () => ({
        model: 'ARM Cortex-A72',
        cores: 4,
        utilizationPercent: 20,
      }),
      getUptimeInfo: () => ({
        uptimeSeconds: 3600,
      }),
      isCommandAvailable: async () => false,
    };

    const service = new SystemCollectionService();
    const evidenceSet = await service.collectSystemEvidence({
      platformAdapter: customAdapter,
    });

    expect(evidenceSet.category).toBe('system');
    const archItem = evidenceSet.items.find((i) => i.key === 'system.architecture');
    expect(archItem?.value).toEqual({ arch: 'arm64' });
  });
});
