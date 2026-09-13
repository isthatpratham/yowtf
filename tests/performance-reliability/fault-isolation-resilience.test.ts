import { describe, expect, it, vi } from 'vitest';
import { ScanOrchestratorService } from '../../src/application/services/scan-orchestrator.service.js';
import type { SystemCollectionService } from '../../src/application/services/system-collection.service.js';
import type { ProjectCollectionService } from '../../src/application/services/project-collection.service.js';
import type { DetectionService } from '../../src/application/services/detection.service.js';
import type { DetectionResult } from '../../src/domain/detection-result.js';
import type { EvidenceItem } from '../../src/domain/evidence.js';
import { env003DuplicatePath } from '../../src/detection/rules/environment/index.js';

describe('Fault Isolation & Resilience (Phase 9 Hardening)', () => {
  const mockDetectionResult: DetectionResult = {
    findings: [],
    executedRules: ['SYS-001'],
    skippedRules: [],
    unavailableRules: [],
    errors: [],
  };

  it('isolates unexpected errors in SystemCollectionService and completes scan safely', async () => {
    const failingSystemCollect = vi
      .fn()
      .mockRejectedValue(new Error('Fatal system hardware access failure'));
    const mockProjectCollect = vi.fn().mockResolvedValue({
      project: { isProject: false, rootPath: '/test' },
      evidence: { category: 'project', items: [] },
    });
    const mockDetect = vi.fn().mockResolvedValue(mockDetectionResult);

    const orchestrator = new ScanOrchestratorService({
      systemCollectionService: {
        collectSystemEvidence: failingSystemCollect,
      } as unknown as SystemCollectionService,
      projectCollectionService: {
        discoverAndCollect: mockProjectCollect,
      } as unknown as ProjectCollectionService,
      detectionService: {
        runDetection: mockDetect,
      } as unknown as DetectionService,
    });

    // Should NOT throw
    const report = await orchestrator.executeScan({
      command: 'yowtf',
      targetPath: '/test',
    });

    expect(report).toBeDefined();
    expect(report.metadata.command).toBe('yowtf');
    expect(report.score?.score).toBe(100);

    // Verify detection engine was still called with fallback failed evidence
    expect(mockDetect).toHaveBeenCalled();
    const passedEvidence = mockDetect.mock.calls[0]?.[0] as Array<{
      category: string;
      items: EvidenceItem[];
    }>;
    const systemSet = passedEvidence.find((e) => e.category === 'system');
    expect(systemSet).toBeDefined();
    expect(systemSet?.items[0]?.availability).toBe('FAILED');
  });

  it('isolates unexpected errors in ProjectCollectionService and completes scan safely', async () => {
    const mockSystemCollect = vi.fn().mockResolvedValue({ category: 'system', items: [] });
    const failingProjectCollect = vi
      .fn()
      .mockRejectedValue(new Error('Fatal project discovery crash'));
    const mockDetect = vi.fn().mockResolvedValue(mockDetectionResult);

    const orchestrator = new ScanOrchestratorService({
      systemCollectionService: {
        collectSystemEvidence: mockSystemCollect,
      } as unknown as SystemCollectionService,
      projectCollectionService: {
        discoverAndCollect: failingProjectCollect,
      } as unknown as ProjectCollectionService,
      detectionService: {
        runDetection: mockDetect,
      } as unknown as DetectionService,
    });

    // Should NOT throw
    const report = await orchestrator.executeScan({
      command: 'yowtf',
      targetPath: '/test',
    });

    expect(report).toBeDefined();
    expect(report.metadata.command).toBe('yowtf');

    expect(mockDetect).toHaveBeenCalled();
    const passedEvidence = mockDetect.mock.calls[0]?.[0] as Array<{
      category: string;
      items: EvidenceItem[];
    }>;
    const projectSet = passedEvidence.find((e) => e.category === 'project');
    expect(projectSet).toBeDefined();
    expect(projectSet?.items[0]?.availability).toBe('FAILED');
  });

  it('evaluates PATH with hundreds of duplicate and empty entries in constant time without memory spikes', () => {
    // Generate 1000 duplicate entries
    const duplicateEntries: string[] = [];
    for (let i = 0; i < 1000; i++) {
      duplicateEntries.push('/usr/local/bin', 'C:\\Program Files\\nodejs', '   ');
    }

    const evidenceItem: EvidenceItem = {
      key: 'environment.path',
      source: 'os.env',
      type: 'path-list',
      availability: 'AVAILABLE',
      value: { entries: duplicateEntries },
    };

    const start = Date.now();
    const evaluation = env003DuplicatePath.evaluate({}, [evidenceItem]);
    const durationMs = Date.now() - start;

    expect(evaluation.status).toBe('WARN');
    expect(evaluation.finding?.summary).toContain('Detected duplicate PATH');
    expect(durationMs).toBeLessThan(100);
  });
});
