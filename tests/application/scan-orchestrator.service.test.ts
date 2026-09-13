import { describe, it, expect, vi } from 'vitest';
import { ScanOrchestratorService } from '../../src/application/services/scan-orchestrator.service.js';
import type { SystemCollectionService } from '../../src/application/services/system-collection.service.js';
import type { ProjectCollectionService } from '../../src/application/services/project-collection.service.js';
import type { DetectionService } from '../../src/application/services/detection.service.js';
import type { EvidenceSet } from '../../src/domain/evidence.js';
import type { DiscoveredProject } from '../../src/collection/project/types.js';
import type { DetectionResult } from '../../src/domain/detection-result.js';

describe('ScanOrchestratorService', () => {
  const mockSystemEvidence: EvidenceSet = {
    category: 'system',
    items: [
      {
        key: 'system.os',
        source: 'os',
        type: 'platform',
        availability: 'AVAILABLE',
        value: { platform: 'linux', release: '6.5.0' },
      },
    ],
  };

  const mockProject: DiscoveredProject = {
    isProject: true,
    rootPath: '/fake/project',
    types: ['node'],
    primaryType: 'node',
    manifests: [],
    lockfiles: [],
    configFiles: [],
    git: { isRepository: true },
  };

  const mockProjectEvidence: EvidenceSet = {
    category: 'project',
    items: [
      {
        key: 'project.root',
        source: 'discovery',
        type: 'path',
        availability: 'AVAILABLE',
        value: { rootPath: '/fake/project' },
      },
    ],
  };

  const mockDetectionResult: DetectionResult = {
    findings: [
      {
        ruleId: 'SYS-001',
        category: 'system',
        status: 'PASS',
        severity: 'CRITICAL',
        confidence: 'HIGH',
        title: 'System check passed',
        summary: 'System is healthy',
      },
    ],
    executedRules: ['SYS-001'],
    skippedRules: [],
    unavailableRules: [],
    errors: [],
  };

  it('orchestrates full scan for default yowtf command with system and project evidence', async () => {
    const mockSystemCollect = vi.fn().mockResolvedValue(mockSystemEvidence);
    const mockProjectCollect = vi.fn().mockResolvedValue({
      project: mockProject,
      evidence: mockProjectEvidence,
    });
    const mockDetect = vi.fn().mockResolvedValue(mockDetectionResult);

    const orchestrator = new ScanOrchestratorService({
      systemCollectionService: {
        collectSystemEvidence: mockSystemCollect,
      } as unknown as SystemCollectionService,
      projectCollectionService: {
        discoverAndCollect: mockProjectCollect,
      } as unknown as ProjectCollectionService,
      detectionService: {
        runDetection: mockDetect,
      } as unknown as DetectionService,
    });

    const report = await orchestrator.executeScan({
      command: 'yowtf',
      targetPath: '/fake/project',
    });

    expect(mockSystemCollect).toHaveBeenCalled();
    expect(mockProjectCollect).toHaveBeenCalled();
    expect(mockDetect).toHaveBeenCalled();

    expect(report.metadata.command).toBe('yowtf');
    expect(report.metadata.scope).toBe('system + project');
    expect(report.status).toBe('PASS');
    expect(report.score?.score).toBe(100);
    expect(report.findings).toHaveLength(1);
    expect(report.coverage.executed).toBe(1);
  });

  it('restricts collection to system-only for workstation commands', async () => {
    const mockSystemCollect = vi.fn().mockResolvedValue(mockSystemEvidence);
    const mockProjectCollect = vi.fn();
    const mockDetect = vi.fn().mockResolvedValue(mockDetectionResult);

    const orchestrator = new ScanOrchestratorService({
      systemCollectionService: {
        collectSystemEvidence: mockSystemCollect,
      } as unknown as SystemCollectionService,
      projectCollectionService: {
        discoverAndCollect: mockProjectCollect,
      } as unknown as ProjectCollectionService,
      detectionService: {
        runDetection: mockDetect,
      } as unknown as DetectionService,
    });

    const report = await orchestrator.executeScan({
      command: 'disk',
      targetPath: '/fake/project',
    });

    expect(mockSystemCollect).toHaveBeenCalled();
    expect(mockProjectCollect).not.toHaveBeenCalled();
    expect(report.metadata.scope).toBe('system');
    expect(report.metadata.category).toBe('disk');
  });

  it('restricts collection to project-only for project commands', async () => {
    const mockSystemCollect = vi.fn();
    const mockProjectCollect = vi.fn().mockResolvedValue({
      project: mockProject,
      evidence: mockProjectEvidence,
    });
    const mockDetect = vi.fn().mockResolvedValue(mockDetectionResult);

    const orchestrator = new ScanOrchestratorService({
      systemCollectionService: {
        collectSystemEvidence: mockSystemCollect,
      } as unknown as SystemCollectionService,
      projectCollectionService: {
        discoverAndCollect: mockProjectCollect,
      } as unknown as ProjectCollectionService,
      detectionService: {
        runDetection: mockDetect,
      } as unknown as DetectionService,
    });

    const report = await orchestrator.executeScan({
      command: 'deps',
      targetPath: '/fake/project',
    });

    expect(mockSystemCollect).not.toHaveBeenCalled();
    expect(mockProjectCollect).toHaveBeenCalled();
    expect(report.metadata.scope).toBe('project');
    expect(report.metadata.category).toBe('dependency');
  });
});
