import type { EvidenceItem, EvidenceSet } from '../../domain/evidence.js';
import type { Collector, CollectorContext } from '../types.js';
import { ProjectDiscovery } from './discovery.js';
import type { DiscoveredProject } from './types.js';

/**
 * ProjectCollector gathers structured facts about the target project,
 * fulfilling evidence requirements for PROJ-001 through PROJ-004,
 * DEP-001 through DEP-003, GIT-001, and CFG-001.
 *
 * It is strictly read-only and does not calculate scores or create findings.
 */
export class ProjectCollector implements Collector<EvidenceSet> {
  public readonly name = 'project';
  public readonly category = 'project' as const;

  constructor(private readonly discovery: ProjectDiscovery = new ProjectDiscovery()) {}

  public async collect(context: CollectorContext): Promise<EvidenceSet> {
    let project: DiscoveredProject;

    try {
      project = await this.discovery.discover(context.cwd);
    } catch {
      return {
        category: 'project',
        items: [
          {
            key: 'project.root',
            source: 'discovery',
            type: 'path',
            availability: 'FAILED',
          },
          {
            key: 'project.type',
            source: 'discovery',
            type: 'project-type',
            availability: 'FAILED',
          },
        ],
      };
    }

    return this.buildEvidenceSet(project);
  }

  public buildEvidenceSet(project: DiscoveredProject): EvidenceSet {
    const items: EvidenceItem[] = [];

    // 1. project.root
    items.push({
      key: 'project.root',
      source: 'discovery',
      type: 'path',
      availability: project.isProject ? 'AVAILABLE' : 'NOT_APPLICABLE',
      value: {
        rootPath: project.rootPath,
        isProject: project.isProject,
      },
    });

    // 2. project.type
    items.push({
      key: 'project.type',
      source: 'discovery',
      type: 'project-type',
      availability: project.isProject ? 'AVAILABLE' : 'NOT_APPLICABLE',
      value: {
        primaryType: project.primaryType,
        types: project.types,
      },
    });

    // 3. project.manifest
    items.push({
      key: 'project.manifest',
      source: 'fs',
      type: 'manifest',
      availability: project.manifests.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
      value: {
        manifests: project.manifests.map((m) => ({
          name: m.name,
          ecosystem: m.ecosystem,
          ...(m.metadata?.packageName ? { packageName: m.metadata.packageName } : {}),
          ...(m.metadata?.packageManager ? { packageManager: m.metadata.packageManager } : {}),
          ...(m.metadata?.declaredDependencyCount !== undefined
            ? { declaredDependencyCount: m.metadata.declaredDependencyCount }
            : {}),
        })),
        count: project.manifests.length,
      },
    });

    // 4. project.lockfile
    items.push({
      key: 'project.lockfile',
      source: 'fs',
      type: 'lockfile',
      availability: project.lockfiles.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
      value: {
        lockfiles: project.lockfiles.map((l) => ({
          name: l.name,
          packageManager: l.packageManager,
        })),
        packageManager: project.packageManager,
      },
    });

    // 5. project.runtime.policy
    const runtimePolicies = project.configFiles.filter((c) => c.category === 'runtime-policy');
    const pkgJson = project.manifests.find((m) => m.name === 'package.json');
    const engines = pkgJson?.metadata?.engines;
    const hasPolicy = runtimePolicies.length > 0 || engines !== undefined;

    items.push({
      key: 'project.runtime.policy',
      source: 'fs',
      type: 'policy',
      availability: hasPolicy ? 'AVAILABLE' : 'UNAVAILABLE',
      value: {
        policyFiles: runtimePolicies.map((p) => p.name),
        ...(engines ? { engines } : {}),
      },
    });

    // 6. project.git
    items.push({
      key: 'project.git',
      source: 'fs',
      type: 'vcs',
      availability: project.git.isRepository ? 'AVAILABLE' : 'UNAVAILABLE',
      value: {
        isRepository: project.git.isRepository,
        ...(project.git.branch ? { branch: project.git.branch } : {}),
      },
    });

    // 7. project.config
    items.push({
      key: 'project.config',
      source: 'fs',
      type: 'config',
      availability: project.configFiles.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
      value: {
        configFiles: project.configFiles.map((c) => ({
          name: c.name,
          category: c.category,
        })),
        count: project.configFiles.length,
      },
    });

    return {
      category: 'project',
      items: Object.freeze(items),
    };
  }
}
