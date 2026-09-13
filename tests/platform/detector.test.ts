import { describe, it, expect } from 'vitest';
import {
  detectPlatform,
  isSupportedPlatform,
  resolvePlatformAdapter,
  SUPPORTED_PLATFORMS,
} from '../../src/platform/detector.js';
import { LinuxPlatformAdapter } from '../../src/platform/linux.js';
import { MacOSPlatformAdapter } from '../../src/platform/macos.js';
import { UnsupportedPlatformAdapter } from '../../src/platform/unsupported.js';
import { WindowsPlatformAdapter } from '../../src/platform/windows.js';

describe('Platform - Detector & Resolver', () => {
  it('defines the 3 supported platforms', () => {
    expect(SUPPORTED_PLATFORMS).toEqual(['windows', 'macos', 'linux']);
  });

  it('detects win32 as windows', () => {
    expect(detectPlatform('win32')).toBe('windows');
    expect(isSupportedPlatform('win32')).toBe(true);
  });

  it('detects darwin as macos', () => {
    expect(detectPlatform('darwin')).toBe('macos');
    expect(isSupportedPlatform('darwin')).toBe(true);
  });

  it('detects linux as linux', () => {
    expect(detectPlatform('linux')).toBe('linux');
    expect(isSupportedPlatform('linux')).toBe(true);
  });

  it('detects unknown/unsupported platforms as unsupported', () => {
    expect(detectPlatform('aix')).toBe('unsupported');
    expect(detectPlatform('freebsd')).toBe('unsupported');
    expect(detectPlatform('sunos')).toBe('unsupported');
    expect(detectPlatform('unknown-os')).toBe('unsupported');

    expect(isSupportedPlatform('aix')).toBe(false);
    expect(isSupportedPlatform('freebsd')).toBe(false);
  });

  it('resolves the correct platform adapter based on platform string', () => {
    const winAdapter = resolvePlatformAdapter('win32');
    expect(winAdapter).toBeInstanceOf(WindowsPlatformAdapter);
    expect(winAdapter.platformType).toBe('windows');
    expect(winAdapter.isSupported).toBe(true);

    const macAdapter = resolvePlatformAdapter('darwin');
    expect(macAdapter).toBeInstanceOf(MacOSPlatformAdapter);
    expect(macAdapter.platformType).toBe('macos');
    expect(macAdapter.isSupported).toBe(true);

    const linuxAdapter = resolvePlatformAdapter('linux');
    expect(linuxAdapter).toBeInstanceOf(LinuxPlatformAdapter);
    expect(linuxAdapter.platformType).toBe('linux');
    expect(linuxAdapter.isSupported).toBe(true);

    const unsupportedAdapter = resolvePlatformAdapter('freebsd');
    expect(unsupportedAdapter).toBeInstanceOf(UnsupportedPlatformAdapter);
    expect(unsupportedAdapter.platformType).toBe('unsupported');
    expect(unsupportedAdapter.isSupported).toBe(false);
  });
});
