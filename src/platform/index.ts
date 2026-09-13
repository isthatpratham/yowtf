/**
 * Platform Layer foundational interfaces.
 * Provides isolated adapters for operating-system-specific mechanisms.
 * Reference: docs/ARCHITECTURE.md Section 5.5.
 */

export interface PlatformInfo {
  readonly os: NodeJS.Platform;
  readonly arch: string;
  readonly release: string;
  readonly hostname: string;
}

export interface PlatformAdapter {
  getPlatformInfo(): PlatformInfo;
}
