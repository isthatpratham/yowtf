import process from 'node:process';
import { resolveAndValidatePath } from '../../cli/path.js';
import { ProjectDiscovery } from '../../collection/project/discovery.js';
import { ProjectCollector } from '../../collection/project/project-collector.js';
import type { DiscoveredProject } from '../../collection/project/types.js';
import type { EvidenceSet } from '../../domain/evidence.js';
import { resolvePlatformAdapter } from '../../platform/detector.js';
import type { PlatformAdapter } from '../../platform/types.js';

export interface ProjectCollectionOptions {
  readonly targetPath?: string;
  readonly cwd?: string;
  readonly platformAdapter?: PlatformAdapter;
}

export interface ProjectCollectionResult {
  readonly project: DiscoveredProject;
  readonly evidence: EvidenceSet;
}

/**
 * Application service coordinating project path resolution, project discovery,
 * and structured project evidence collection.
 * Reference: docs/ARCHITECTURE.md Section 5.2 and Section 18.
 */
export class ProjectCollectionService {
  private readonly discovery: ProjectDiscovery;
  private readonly collector: ProjectCollector;

  constructor(discovery?: ProjectDiscovery, collector?: ProjectCollector) {
    this.discovery = discovery ?? new ProjectDiscovery();
    this.collector = collector ?? new ProjectCollector(this.discovery);
  }

  /**
   * Discovers and collects structured project facts for the target directory.
   */
  public async discoverAndCollect(
    options: ProjectCollectionOptions = {},
  ): Promise<ProjectCollectionResult> {
    const cwd = options.cwd ?? process.cwd();
    const resolvedPath = resolveAndValidatePath(options.targetPath, cwd);
    const platformAdapter = options.platformAdapter ?? resolvePlatformAdapter();

    const project = await this.discovery.discover(resolvedPath);
    const evidence = await this.collector.collect({
      cwd: project.rootPath,
      platformAdapter,
    });

    return {
      project,
      evidence,
    };
  }
}
