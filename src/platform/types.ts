/**
 * Platform abstraction types and interfaces.
 * Adheres to docs/ARCHITECTURE.md Section 5.5 and docs/TECH-STACK.md Section 40.
 */

export type SupportedPlatform = 'windows' | 'macos' | 'linux';

export type PlatformType = SupportedPlatform | 'unsupported';

export interface PlatformInfo {
  readonly platform: PlatformType;
  readonly isSupported: boolean;
  readonly os: NodeJS.Platform;
  readonly arch: string;
  readonly release: string;
  readonly hostname: string;
}

export interface MemoryInfo {
  readonly totalBytes: number;
  readonly freeBytes: number;
  readonly usedBytes: number;
  readonly utilizationPercent: number;
}

export interface CpuCoreInfo {
  readonly model: string;
  readonly speedMHz: number;
}

export interface CpuInfo {
  readonly model: string;
  readonly cores: number;
  readonly speedMHz?: number;
  readonly utilizationPercent?: number;
}

export interface UptimeInfo {
  readonly uptimeSeconds: number;
}

export interface SafeCommandOptions {
  readonly timeoutMs?: number;
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
}

export interface SafeCommandResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly killed: boolean;
  readonly durationMs: number;
}

/**
 * Standard contract for operating-system-specific fact adapters.
 * Implementations gather facts without calculating scores, creating findings,
 * or mutating user state.
 */
export interface PlatformAdapter {
  readonly platformType: PlatformType;
  readonly isSupported: boolean;

  getPlatformInfo(): PlatformInfo;
  getMemoryInfo(): Promise<MemoryInfo> | MemoryInfo;
  getCpuInfo(): Promise<CpuInfo> | CpuInfo;
  getUptimeInfo(): UptimeInfo;
  isCommandAvailable(command: string): Promise<boolean>;
}
