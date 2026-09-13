import os from 'node:os';
import { executeSafeCommand } from './command.js';
import type { CpuInfo, MemoryInfo, PlatformAdapter, PlatformInfo, UptimeInfo } from './types.js';

export interface LinuxSystemProvider {
  arch(): string;
  release(): string;
  hostname(): string;
  totalmem(): number;
  freemem(): number;
  cpus(): os.CpuInfo[];
  uptime(): number;
}

export class LinuxPlatformAdapter implements PlatformAdapter {
  public readonly platformType = 'linux' as const;
  public readonly isSupported = true;

  constructor(private readonly provider: LinuxSystemProvider = os) {}

  public getPlatformInfo(): PlatformInfo {
    return {
      platform: 'linux',
      isSupported: true,
      os: 'linux',
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

    let totalBusy = 0;
    let totalTime = 0;

    for (const cpu of cpus) {
      const times = cpu.times;
      const coreTotal = times.user + times.nice + times.sys + times.idle + times.irq;
      const coreBusy = coreTotal - times.idle;
      totalBusy += coreBusy;
      totalTime += coreTotal;
    }

    const utilizationPercent =
      totalTime > 0 ? Number(((totalBusy / totalTime) * 100).toFixed(1)) : 0;

    return {
      model,
      cores,
      speedMHz,
      utilizationPercent,
    };
  }

  public getUptimeInfo(): UptimeInfo {
    return {
      uptimeSeconds: Math.floor(this.provider.uptime()),
    };
  }

  public async isCommandAvailable(command: string): Promise<boolean> {
    try {
      const result = await executeSafeCommand('which', [command], { timeoutMs: 3000 });
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }
}
