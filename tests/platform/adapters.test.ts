import { describe, it, expect } from 'vitest';
import { LinuxPlatformAdapter } from '../../src/platform/linux.js';
import { MacOSPlatformAdapter } from '../../src/platform/macos.js';
import { UnsupportedPlatformAdapter } from '../../src/platform/unsupported.js';
import { WindowsPlatformAdapter } from '../../src/platform/windows.js';

const mockSystemProvider = {
  platform: () => 'win32' as NodeJS.Platform,
  arch: () => 'x64',
  release: () => '10.0.22631',
  hostname: () => 'test-workstation',
  totalmem: () => 16 * 1024 * 1024 * 1024, // 16GB
  freemem: () => 4 * 1024 * 1024 * 1024, // 4GB free (75% used)
  uptime: () => 3600 * 5, // 5 hours
  cpus: () => [
    {
      model: 'Mock CPU @ 3.0GHz',
      speed: 3000,
      times: { user: 800, nice: 0, sys: 200, idle: 1000, irq: 0 },
    },
    {
      model: 'Mock CPU @ 3.0GHz',
      speed: 3000,
      times: { user: 800, nice: 0, sys: 200, idle: 1000, irq: 0 },
    },
  ],
};

describe('Platform - Adapters', () => {
  describe('WindowsPlatformAdapter', () => {
    it('normalizes platform, memory, cpu, and uptime information', async () => {
      const adapter = new WindowsPlatformAdapter(mockSystemProvider);

      expect(adapter.platformType).toBe('windows');
      expect(adapter.isSupported).toBe(true);

      const info = adapter.getPlatformInfo();
      expect(info).toEqual({
        platform: 'windows',
        isSupported: true,
        os: 'win32',
        arch: 'x64',
        release: '10.0.22631',
        hostname: 'test-workstation',
      });

      const mem = await adapter.getMemoryInfo();
      expect(mem.totalBytes).toBe(16 * 1024 * 1024 * 1024);
      expect(mem.freeBytes).toBe(4 * 1024 * 1024 * 1024);
      expect(mem.usedBytes).toBe(12 * 1024 * 1024 * 1024);
      expect(mem.utilizationPercent).toBe(75);

      const cpu = await adapter.getCpuInfo();
      expect(cpu.model).toBe('Mock CPU @ 3.0GHz');
      expect(cpu.cores).toBe(2);
      expect(cpu.speedMHz).toBe(3000);
      expect(cpu.utilizationPercent).toBe(50);

      const uptime = adapter.getUptimeInfo();
      expect(uptime.uptimeSeconds).toBe(18000);
    });
  });

  describe('MacOSPlatformAdapter', () => {
    it('normalizes platform, memory, cpu, and uptime information', async () => {
      const adapter = new MacOSPlatformAdapter({
        ...mockSystemProvider,
        arch: () => 'arm64',
        release: () => '23.4.0',
      });

      expect(adapter.platformType).toBe('macos');
      expect(adapter.isSupported).toBe(true);

      const info = adapter.getPlatformInfo();
      expect(info.platform).toBe('macos');
      expect(info.os).toBe('darwin');
      expect(info.arch).toBe('arm64');

      const mem = await adapter.getMemoryInfo();
      expect(mem.utilizationPercent).toBe(75);
    });
  });

  describe('LinuxPlatformAdapter', () => {
    it('normalizes platform, memory, cpu, and uptime information', async () => {
      const adapter = new LinuxPlatformAdapter({
        ...mockSystemProvider,
        arch: () => 'x64',
        release: () => '6.5.0-generic',
      });

      expect(adapter.platformType).toBe('linux');
      expect(adapter.isSupported).toBe(true);

      const info = adapter.getPlatformInfo();
      expect(info.platform).toBe('linux');
      expect(info.os).toBe('linux');
      expect(info.arch).toBe('x64');

      const cpu = await adapter.getCpuInfo();
      expect(cpu.cores).toBe(2);
    });
  });

  describe('UnsupportedPlatformAdapter', () => {
    it('explicitly reports unsupported state', async () => {
      const adapter = new UnsupportedPlatformAdapter({
        ...mockSystemProvider,
        platform: () => 'freebsd' as NodeJS.Platform,
      });

      expect(adapter.platformType).toBe('unsupported');
      expect(adapter.isSupported).toBe(false);

      const info = adapter.getPlatformInfo();
      expect(info.platform).toBe('unsupported');
      expect(info.isSupported).toBe(false);
      expect(info.os).toBe('freebsd');

      const cpu = await adapter.getCpuInfo();
      expect(cpu.utilizationPercent).toBeUndefined();

      const available = await adapter.isCommandAvailable('git');
      expect(available).toBe(false);
    });
  });
});
