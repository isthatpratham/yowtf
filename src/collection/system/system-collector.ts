import type { EvidenceItem, EvidenceSet } from '../../domain/evidence.js';
import type { Collector, CollectorContext } from '../types.js';

/**
 * SystemCollector collects normalized system facts matching authoritative V1
 * diagnostic rules (SYS-001 through SYS-005 in docs/RULE-CATALOGUE.md).
 *
 * It is strictly read-only and produces structured evidence without making evaluative decisions.
 */
export class SystemCollector implements Collector<EvidenceSet> {
  public readonly name = 'system';
  public readonly category = 'system' as const;

  public async collect(context: CollectorContext): Promise<EvidenceSet> {
    const adapter = context.platformAdapter;
    const items: EvidenceItem[] = [];

    // 1. Platform support evidence (SYS-005)
    try {
      const platformInfo = adapter.getPlatformInfo();
      items.push({
        key: 'system.platform.supported',
        source: 'platform',
        type: 'platform',
        availability: 'AVAILABLE',
        value: {
          platform: platformInfo.platform,
          isSupported: platformInfo.isSupported,
          os: platformInfo.os,
          release: platformInfo.release,
        },
      });

      // 2. Architecture evidence (SYS-004)
      items.push({
        key: 'system.architecture',
        source: 'os.arch',
        type: 'architecture',
        availability: 'AVAILABLE',
        value: {
          arch: platformInfo.arch,
        },
      });
    } catch {
      items.push({
        key: 'system.platform.supported',
        source: 'platform',
        type: 'platform',
        availability: 'FAILED',
      });
      items.push({
        key: 'system.architecture',
        source: 'os.arch',
        type: 'architecture',
        availability: 'FAILED',
      });
    }

    // 3. Uptime evidence (SYS-003)
    try {
      const uptimeInfo = adapter.getUptimeInfo();
      items.push({
        key: 'system.uptime',
        source: 'os.uptime',
        type: 'duration',
        unit: 'seconds',
        availability: 'AVAILABLE',
        value: uptimeInfo.uptimeSeconds,
      });
    } catch {
      items.push({
        key: 'system.uptime',
        source: 'os.uptime',
        type: 'duration',
        unit: 'seconds',
        availability: 'FAILED',
      });
    }

    // 4. CPU metrics evidence (SYS-002)
    try {
      const cpuInfo = await adapter.getCpuInfo();
      const isAvailable = cpuInfo.utilizationPercent !== undefined;
      items.push({
        key: 'system.cpu',
        source: 'os.cpus',
        type: 'cpu',
        unit: 'percent',
        availability: isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
        value: cpuInfo,
      });
    } catch {
      items.push({
        key: 'system.cpu',
        source: 'os.cpus',
        type: 'cpu',
        unit: 'percent',
        availability: 'FAILED',
      });
    }

    // 5. Memory metrics evidence (SYS-001)
    try {
      const memoryInfo = await adapter.getMemoryInfo();
      items.push({
        key: 'system.memory',
        source: 'os.memory',
        type: 'memory',
        unit: 'bytes',
        availability: 'AVAILABLE',
        value: memoryInfo,
      });
    } catch {
      items.push({
        key: 'system.memory',
        source: 'os.memory',
        type: 'memory',
        unit: 'bytes',
        availability: 'FAILED',
      });
    }

    return {
      category: 'system',
      items: Object.freeze(items),
    };
  }
}
