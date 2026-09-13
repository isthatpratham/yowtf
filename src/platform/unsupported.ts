import os from 'node:os';
import type { CpuInfo, MemoryInfo, PlatformAdapter, PlatformInfo, UptimeInfo } from './types.js';

export interface UnsupportedSystemProvider {
  platform(): NodeJS.Platform;
  arch(): string;
  release(): string;
  hostname(): string;
  totalmem(): number;
  freemem(): number;
  cpus(): os.CpuInfo[];
  uptime(): number;
}

export class UnsupportedPlatformAdapter implements PlatformAdapter {
  public readonly platformType = 'unsupported' as const;
  public readonly isSupported = false;

  constructor(private readonly provider: UnsupportedSystemProvider = os) {}

  public getPlatformInfo(): PlatformInfo {
    return {
      platform: 'unsupported',
      isSupported: false,
      os: this.provider.platform(),
      arch: this.provider.arch(),
      release: this.provider.release(),
      hostname: this.provider.hostname(),
    };
  }

  public getMemoryInfo(): MemoryInfo {
    const totalBytes = this.provider.totalmem();
    const freeBytes = this.provider.freemem();
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const utilizationPercent =
      totalBytes > 0 ? Number(((usedBytes / totalBytes) * 100).toFixed(1)) : 0;

    return {
      totalBytes,
      freeBytes,
      usedBytes,
      utilizationPercent,
    };
  }

  public getCpuInfo(): CpuInfo {
    const cpus = this.provider.cpus();
    const cores = cpus.length;
    const model = cpus[0]?.model ?? 'Unknown CPU';
    const speedMHz = cpus[0]?.speed;

    return {
      model,
      cores,
      speedMHz,
      utilizationPercent: undefined,
    };
  }

  public getUptimeInfo(): UptimeInfo {
    return {
      uptimeSeconds: Math.floor(this.provider.uptime()),
    };
  }

  public async isCommandAvailable(_command: string): Promise<boolean> {
    return false;
  }
}
