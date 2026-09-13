import process from 'node:process';
import { LinuxPlatformAdapter } from './linux.js';
import { MacOSPlatformAdapter } from './macos.js';
import type { PlatformAdapter, PlatformType, SupportedPlatform } from './types.js';
import { UnsupportedPlatformAdapter } from './unsupported.js';
import { WindowsPlatformAdapter } from './windows.js';

export const SUPPORTED_PLATFORMS: readonly SupportedPlatform[] = [
  'windows',
  'macos',
  'linux',
] as const;

/**
 * Normalizes an operating system platform identifier into a PlatformType.
 * Defaults to current process.platform if none is supplied.
 */
export function detectPlatform(osPlatform: string = process.platform): PlatformType {
  switch (osPlatform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      return 'unsupported';
  }
}

/**
 * Checks whether an operating system platform identifier is supported.
 */
export function isSupportedPlatform(osPlatform: string = process.platform): boolean {
  return detectPlatform(osPlatform) !== 'unsupported';
}

/**
 * Factory that returns the appropriate PlatformAdapter for the given platform.
 * Defaults to process.platform.
 */
export function resolvePlatformAdapter(osPlatform: string = process.platform): PlatformAdapter {
  const platformType = detectPlatform(osPlatform);

  switch (platformType) {
    case 'windows':
      return new WindowsPlatformAdapter();
    case 'macos':
      return new MacOSPlatformAdapter();
    case 'linux':
      return new LinuxPlatformAdapter();
    case 'unsupported':
      return new UnsupportedPlatformAdapter();
  }
}
