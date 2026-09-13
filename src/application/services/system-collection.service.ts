import process from 'node:process';
import { SystemCollector } from '../../collection/system/system-collector.js';
import type { EvidenceSet } from '../../domain/evidence.js';
import { resolvePlatformAdapter } from '../../platform/detector.js';
import type { PlatformAdapter } from '../../platform/types.js';

export interface SystemCollectionOptions {
  readonly cwd?: string;
  readonly platformAdapter?: PlatformAdapter;
}

/**
 * Application service coordinating platform resolution and system facts collection.
 * Serves as the boundary between application use cases/scans and the collection layer.
 * Reference: docs/ARCHITECTURE.md Section 5.2.
 */
export class SystemCollectionService {
  private readonly collector: SystemCollector;

  constructor(collector?: SystemCollector) {
    this.collector = collector ?? new SystemCollector();
  }

  /**
   * Executes system facts collection and returns normalized structured evidence.
   */
  public async collectSystemEvidence(options: SystemCollectionOptions = {}): Promise<EvidenceSet> {
    const cwd = options.cwd ?? process.cwd();
    const platformAdapter = options.platformAdapter ?? resolvePlatformAdapter();

    return this.collector.collect({
      cwd,
      platformAdapter,
    });
  }
}
