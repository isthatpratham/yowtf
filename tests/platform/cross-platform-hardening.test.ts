import type os from 'node:os';
import { describe, expect, it, vi } from 'vitest';
import * as commandModule from '../../src/platform/command.js';
import {
  detectPlatform,
  isSupportedPlatform,
  resolvePlatformAdapter,
  SUPPORTED_PLATFORMS,
} from '../../src/platform/detector.js';
import { LinuxPlatformAdapter, type LinuxSystemProvider } from '../../src/platform/linux.js';
import { MacOSPlatformAdapter, type DarwinSystemProvider } from '../../src/platform/macos.js';
import {
  UnsupportedPlatformAdapter,
  type UnsupportedSystemProvider,
} from '../../src/platform/unsupported.js';
import { WindowsPlatformAdapter, type WindowsSystemProvider } from '../../src/platform/windows.js';

function createMockCpu(idle: number, busy: number): os.CpuInfo {
  return {
    model: 'Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz',
    speed: 2600,
    times: {
      user: busy / 2,
      nice: 0,
      sys: busy / 2,
      idle,
      irq: 0,
    },
  };
}

describe('Cross-Platform Hardening & Adapter Simulation (docs/ARCHITECTURE.md Section 5.5)', () => {
  describe('Platform Detection & Resolution', () => {
    it('defines authoritative supported platforms list', () => {
      expect(SUPPORTED_PLATFORMS).toEqual(['windows', 'macos', 'linux']);
    });

    it('detects and resolves Windows platform correctly', () => {
      expect(detectPlatform('win32')).toBe('windows');
      expect(isSupportedPlatform('win32')).toBe(true);
      const adapter = resolvePlatformAdapter('win32');
      expect(adapter).toBeInstanceOf(WindowsPlatformAdapter);
      expect(adapter.platformType).toBe('windows');
      expect(adapter.isSupported).toBe(true);
    });

    it('detects and resolves macOS platform correctly', () => {
      expect(detectPlatform('darwin')).toBe('macos');
      expect(isSupportedPlatform('darwin')).toBe(true);
      const adapter = resolvePlatformAdapter('darwin');
      expect(adapter).toBeInstanceOf(MacOSPlatformAdapter);
      expect(adapter.platformType).toBe('macos');
      expect(adapter.isSupported).toBe(true);
    });

    it('detects and resolves Linux platform correctly', () => {
      expect(detectPlatform('linux')).toBe('linux');
      expect(isSupportedPlatform('linux')).toBe(true);
      const adapter = resolvePlatformAdapter('linux');
      expect(adapter).toBeInstanceOf(LinuxPlatformAdapter);
      expect(adapter.platformType).toBe('linux');
      expect(adapter.isSupported).toBe(true);
    });

    it('identifies unsupported platforms without silent fallback or fabrication', () => {
      const unsupportedList = ['freebsd', 'openbsd', 'sunos', 'aix', 'unknown'];
      for (const osName of unsupportedList) {
        expect(detectPlatform(osName)).toBe('unsupported');
        expect(isSupportedPlatform(osName)).toBe(false);
        const adapter = resolvePlatformAdapter(osName);
        expect(adapter).toBeInstanceOf(UnsupportedPlatformAdapter);
        expect(adapter.platformType).toBe('unsupported');
        expect(adapter.isSupported).toBe(false);
      }
    });
  });

  describe('Windows Platform Hardening', () => {
    const mockProvider: WindowsSystemProvider = {
      arch: () => 'x64',
      release: () => '10.0.19045',
      hostname: () => 'WIN-DEVBOX',
      totalmem: () => 16 * 1024 * 1024 * 1024,
      freemem: () => 4 * 1024 * 1024 * 1024,
      cpus: () => [createMockCpu(200, 800), createMockCpu(200, 800)],
      uptime: () => 3600.75,
    };

    it('reports platform info with win32 os identifier', () => {
      const adapter = new WindowsPlatformAdapter(mockProvider);
      const info = adapter.getPlatformInfo();
      expect(info.platform).toBe('windows');
      expect(info.isSupported).toBe(true);
      expect(info.os).toBe('win32');
      expect(info.arch).toBe('x64');
      expect(info.release).toBe('10.0.19045');
      expect(info.hostname).toBe('WIN-DEVBOX');
    });

    it('calculates memory utilization accurately', () => {
      const adapter = new WindowsPlatformAdapter(mockProvider);
      const mem = adapter.getMemoryInfo();
      expect(mem.totalBytes).toBe(16 * 1024 * 1024 * 1024);
      expect(mem.freeBytes).toBe(4 * 1024 * 1024 * 1024);
      expect(mem.usedBytes).toBe(12 * 1024 * 1024 * 1024);
      expect(mem.utilizationPercent).toBe(75);
    });

    it('handles zero total memory safely without NaN division', () => {
      const zeroMemProvider: WindowsSystemProvider = {
        ...mockProvider,
        totalmem: () => 0,
        freemem: () => 0,
      };
      const adapter = new WindowsPlatformAdapter(zeroMemProvider);
      const mem = adapter.getMemoryInfo();
      expect(mem.utilizationPercent).toBe(0);
      expect(mem.usedBytes).toBe(0);
    });

    it('handles empty CPU list safely without crashing', () => {
      const emptyCpuProvider: WindowsSystemProvider = {
        ...mockProvider,
        cpus: () => [],
      };
      const adapter = new WindowsPlatformAdapter(emptyCpuProvider);
      const cpu = adapter.getCpuInfo();
      expect(cpu.cores).toBe(0);
      expect(cpu.model).toBe('Unknown CPU');
      expect(cpu.utilizationPercent).toBe(0);
    });

    it('calculates CPU utilization across multi-core systems', () => {
      const adapter = new WindowsPlatformAdapter(mockProvider);
      const cpu = adapter.getCpuInfo();
      expect(cpu.cores).toBe(2);
      expect(cpu.utilizationPercent).toBe(80);
    });

    it('returns integer uptime in seconds', () => {
      const adapter = new WindowsPlatformAdapter(mockProvider);
      const uptime = adapter.getUptimeInfo();
      expect(uptime.uptimeSeconds).toBe(3600);
    });

    it('uses "where" command on Windows for command availability', async () => {
      const safeCommandSpy = vi
        .spyOn(commandModule, 'executeSafeCommand')
        .mockResolvedValueOnce({
          stdout: 'C:\\Windows\\git.exe\n',
          stderr: '',
          exitCode: 0,
          killed: false,
          durationMs: 5,
        })
        .mockResolvedValueOnce({
          stdout: '',
          stderr: 'not found',
          exitCode: 1,
          killed: false,
          durationMs: 5,
        });

      const adapter = new WindowsPlatformAdapter(mockProvider);
      expect(await adapter.isCommandAvailable('git')).toBe(true);
      expect(safeCommandSpy).toHaveBeenLastCalledWith('where', ['git'], { timeoutMs: 3000 });

      expect(await adapter.isCommandAvailable('nonexistent_tool')).toBe(false);
      safeCommandSpy.mockRestore();
    });

    it('handles command execution errors gracefully', async () => {
      const safeCommandSpy = vi
        .spyOn(commandModule, 'executeSafeCommand')
        .mockRejectedValueOnce(new Error('Permission denied'));

      const adapter = new WindowsPlatformAdapter(mockProvider);
      expect(await adapter.isCommandAvailable('locked_tool')).toBe(false);
      safeCommandSpy.mockRestore();
    });
  });

  describe('macOS Platform Hardening', () => {
    const mockProvider: DarwinSystemProvider = {
      arch: () => 'arm64',
      release: () => '23.4.0',
      hostname: () => 'MacBook-Pro.local',
      totalmem: () => 32 * 1024 * 1024 * 1024,
      freemem: () => 8 * 1024 * 1024 * 1024,
      cpus: () => [createMockCpu(500, 500)],
      uptime: () => 7200,
    };

    it('reports platform info with darwin os identifier and arm64 arch', () => {
      const adapter = new MacOSPlatformAdapter(mockProvider);
      const info = adapter.getPlatformInfo();
      expect(info.platform).toBe('macos');
      expect(info.isSupported).toBe(true);
      expect(info.os).toBe('darwin');
      expect(info.arch).toBe('arm64');
    });

    it('uses "which" command on macOS for command availability', async () => {
      const safeCommandSpy = vi.spyOn(commandModule, 'executeSafeCommand').mockResolvedValueOnce({
        stdout: '/opt/homebrew/bin/node\n',
        stderr: '',
        exitCode: 0,
        killed: false,
        durationMs: 5,
      });

      const adapter = new MacOSPlatformAdapter(mockProvider);
      expect(await adapter.isCommandAvailable('node')).toBe(true);
      expect(safeCommandSpy).toHaveBeenCalledWith('which', ['node'], { timeoutMs: 3000 });
      safeCommandSpy.mockRestore();
    });
  });

  describe('Linux Platform Hardening', () => {
    const mockProvider: LinuxSystemProvider = {
      arch: () => 'x64',
      release: () => '6.5.0-35-generic',
      hostname: () => 'ubuntu-server',
      totalmem: () => 8 * 1024 * 1024 * 1024,
      freemem: () => 2 * 1024 * 1024 * 1024,
      cpus: () => [createMockCpu(100, 900)],
      uptime: () => 14400,
    };

    it('reports platform info with linux os identifier', () => {
      const adapter = new LinuxPlatformAdapter(mockProvider);
      const info = adapter.getPlatformInfo();
      expect(info.platform).toBe('linux');
      expect(info.isSupported).toBe(true);
      expect(info.os).toBe('linux');
      expect(info.arch).toBe('x64');
    });

    it('uses "which" command on Linux for command availability', async () => {
      const safeCommandSpy = vi.spyOn(commandModule, 'executeSafeCommand').mockResolvedValueOnce({
        stdout: '/usr/bin/python3\n',
        stderr: '',
        exitCode: 0,
        killed: false,
        durationMs: 5,
      });

      const adapter = new LinuxPlatformAdapter(mockProvider);
      expect(await adapter.isCommandAvailable('python3')).toBe(true);
      expect(safeCommandSpy).toHaveBeenCalledWith('which', ['python3'], { timeoutMs: 3000 });
      safeCommandSpy.mockRestore();
    });
  });

  describe('Unsupported Platform Safety & Isolation', () => {
    const mockProvider: UnsupportedSystemProvider = {
      platform: () => 'freebsd',
      arch: () => 'x64',
      release: () => '14.0-RELEASE',
      hostname: () => 'freebsd-box',
      totalmem: () => 4 * 1024 * 1024 * 1024,
      freemem: () => 1 * 1024 * 1024 * 1024,
      cpus: () => [createMockCpu(500, 500)],
      uptime: () => 500,
    };

    it('clearly marks platform as unsupported without pretending otherwise', () => {
      const adapter = new UnsupportedPlatformAdapter(mockProvider);
      const info = adapter.getPlatformInfo();
      expect(info.platform).toBe('unsupported');
      expect(info.isSupported).toBe(false);
      expect(info.os).toBe('freebsd');
    });

    it('does not fabricate CPU utilization percent', () => {
      const adapter = new UnsupportedPlatformAdapter(mockProvider);
      const cpu = adapter.getCpuInfo();
      expect(cpu.utilizationPercent).toBeUndefined();
    });

    it('always returns false for command availability on unsupported platforms', async () => {
      const adapter = new UnsupportedPlatformAdapter(mockProvider);
      expect(await adapter.isCommandAvailable('node')).toBe(false);
      expect(await adapter.isCommandAvailable('git')).toBe(false);
    });
  });
});
