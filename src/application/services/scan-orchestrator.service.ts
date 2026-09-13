import process from 'node:process';
import type { DetectionResult } from '../../domain/detection-result.js';
import type { EvidenceSet } from '../../domain/evidence.js';
import { isDiagnosticCategory, type DiagnosticCategory } from '../../domain/category.js';
import { resolvePlatformAdapter } from '../../platform/detector.js';
import type { PlatformAdapter } from '../../platform/types.js';
import { calculateScore, type ScoreResult } from '../../scoring/index.js';
import { createReportModel } from '../../reporting/model.js';
import type { ReportModel } from '../../reporting/types.js';
import type { DetectionContext } from '../../detection/types.js';
import { DetectionService } from './detection.service.js';
import { ProjectCollectionService } from './project-collection.service.js';
import { SystemCollectionService } from './system-collection.service.js';
import { getAppVersion } from '../../version.js';

export interface ScanOrchestratorOptions {
  readonly systemCollectionService?: SystemCollectionService;
  readonly projectCollectionService?: ProjectCollectionService;
  readonly detectionService?: DetectionService;
}

export interface RunScanOptions {
  readonly command: string;
  readonly targetPath: string;
  readonly verbose?: boolean;
  readonly json?: boolean;
  readonly quiet?: boolean;
  readonly color?: boolean;
  readonly preview?: boolean;
  readonly platformAdapter?: PlatformAdapter;
}

/**
 * Application service orchestrating the full diagnostic pipeline:
 * Discovery -> Evidence Collection -> Rule Detection -> Health Scoring -> Report Assembly.
 * Adheres to docs/ARCHITECTURE.md Section 5.2 and docs/CLI-SPEC.md Section 46.
 */
export class ScanOrchestratorService {
  private readonly systemCollectionService: SystemCollectionService;
  private readonly projectCollectionService: ProjectCollectionService;
  private readonly detectionService: DetectionService;

  constructor(options: ScanOrchestratorOptions = {}) {
    this.systemCollectionService = options.systemCollectionService ?? new SystemCollectionService();
    this.projectCollectionService =
      options.projectCollectionService ?? new ProjectCollectionService();
    this.detectionService = options.detectionService ?? new DetectionService();
  }

  /**
   * Executes an end-to-end diagnostic scan for the specified command and options.
   */
  public async executeScan(options: RunScanOptions): Promise<ReportModel> {
    const { command, targetPath } = options;
    const platformAdapter = options.platformAdapter ?? resolvePlatformAdapter();

    // 1. Determine scan scope
    const scope = this.resolveScope(command);

    // 2. Collect evidence based on scope
    const evidenceSets: EvidenceSet[] = [];
    let projectRoot: string | undefined;

    const needsSystem = scope.includes('system');
    const needsProject = scope.includes('project');

    if (needsSystem && needsProject) {
      const [sysResult, projResult] = await Promise.allSettled([
        this.systemCollectionService.collectSystemEvidence({
          cwd: targetPath,
          platformAdapter,
        }),
        this.projectCollectionService.discoverAndCollect({
          targetPath,
          cwd: targetPath,
          platformAdapter,
        }),
      ]);

      if (sysResult.status === 'fulfilled') {
        evidenceSets.push(sysResult.value);
      } else {
        evidenceSets.push({
          category: 'system',
          items: [
            {
              key: 'system.platform.supported',
              source: 'platform',
              type: 'platform',
              availability: 'FAILED',
            },
          ],
        });
      }

      if (projResult.status === 'fulfilled') {
        evidenceSets.push(projResult.value.evidence);
        projectRoot = projResult.value.project.rootPath;
      } else {
        evidenceSets.push({
          category: 'project',
          items: [
            {
              key: 'project.root',
              source: 'discovery',
              type: 'path',
              availability: 'FAILED',
            },
          ],
        });
      }
    } else if (needsSystem) {
      try {
        const sysEvidence = await this.systemCollectionService.collectSystemEvidence({
          cwd: targetPath,
          platformAdapter,
        });
        evidenceSets.push(sysEvidence);
      } catch {
        evidenceSets.push({
          category: 'system',
          items: [
            {
              key: 'system.platform.supported',
              source: 'platform',
              type: 'platform',
              availability: 'FAILED',
            },
          ],
        });
      }
    } else if (needsProject) {
      try {
        const projResult = await this.projectCollectionService.discoverAndCollect({
          targetPath,
          cwd: targetPath,
          platformAdapter,
        });
        evidenceSets.push(projResult.evidence);
        projectRoot = projResult.project.rootPath;
      } catch {
        evidenceSets.push({
          category: 'project',
          items: [
            {
              key: 'project.root',
              source: 'discovery',
              type: 'path',
              availability: 'FAILED',
            },
          ],
        });
      }
    }

    // 3. Prepare detection context
    const detectionContext: DetectionContext = {
      platform: platformAdapter.platformType,
      projectRoot: projectRoot ?? targetPath,
      commandScope: command,
      env: process.env,
      targetNodeVersion: process.version,
    };

    // 4. Run detection engine
    const detectionResult: DetectionResult = await this.detectionService.runDetection(
      evidenceSets,
      detectionContext,
    );

    // 5. Calculate health score
    const scoreResult: ScoreResult = calculateScore(detectionResult.findings);

    // 6. Map category if command directly corresponds to one
    let category: DiagnosticCategory | undefined;
    if (isDiagnosticCategory(command)) {
      category = command;
    } else if (command === 'deps') {
      category = 'dependency';
    } else if (command === 'env') {
      category = 'environment';
    } else if (command === 'ports') {
      category = 'port';
    } else if (command === 'runtimes') {
      category = 'runtime';
    } else if (command === 'tools') {
      category = 'tool';
    } else if (command === 'paths') {
      category = 'path';
    } else if (command === 'versions') {
      category = 'version';
    } else if (command === 'caches' || command === 'clean') {
      category = 'cache';
    } else if (command === 'processes') {
      category = 'process';
    }

    // 7. Assemble canonical report model
    return createReportModel(detectionResult, {
      command,
      targetPath,
      scope,
      category,
      score: scoreResult,
      tool: 'yowtf',
      version: getAppVersion(),
    });
  }

  private resolveScope(command: string): string {
    switch (command) {
      case 'system':
      case 'disk':
      case 'processes':
      case 'ports':
      case 'network':
        return 'system';
      case 'project':
      case 'deps':
      case 'git':
      case 'config':
        return 'project';
      case 'env':
      case 'runtimes':
      case 'tools':
      case 'paths':
      case 'versions':
      case 'caches':
      case 'clean':
      case 'doctor':
      case 'score':
      case 'explain':
      case 'yowtf':
      default:
        return 'system + project';
    }
  }
}
