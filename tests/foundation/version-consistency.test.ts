import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getAppVersion, _resetVersionCache } from '../../src/version.js';
import { APP_VERSION, createProgram, runCli } from '../../src/cli/cli.js';
import { createReportModel } from '../../src/reporting/model.js';
import { ScanOrchestratorService } from '../../src/application/services/scan-orchestrator.service.js';
import type { DetectionResult } from '../../src/domain/detection-result.js';

describe('Authoritative Version Consistency (docs/ARCHITECTURE.md & CLI Consistency)', () => {
  const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url));
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    version: string;
    name: string;
  };
  const expectedVersion = packageJson.version;

  it('ensures package.json version is a valid semantic version', () => {
    expect(expectedVersion).toMatch(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
  });

  it('ensures getAppVersion() returns the exact package.json version', () => {
    _resetVersionCache();
    expect(getAppVersion()).toBe(expectedVersion);
  });

  it('ensures APP_VERSION constant matches the authoritative package.json version', () => {
    expect(APP_VERSION).toBe(expectedVersion);
  });

  it('ensures Commander program version matches the authoritative package.json version', () => {
    const program = createProgram();
    expect(program.version()).toBe(expectedVersion);
  });

  it('ensures createReportModel() defaults to the authoritative version without fallback to stale versions', () => {
    const mockResult: DetectionResult = {
      findings: [],
      executedRules: [],
      skippedRules: [],
      unavailableRules: [],
      errors: [],
    };

    const report = createReportModel(mockResult, {
      command: 'doctor',
      targetPath: process.cwd(),
      scope: 'workstation',
    });

    expect(report.metadata.version).toBe(expectedVersion);
    expect(report.metadata.version).not.toBe('0.1.0');
  });

  it('ensures createReportModel() honors explicit version option when provided', () => {
    const mockResult: DetectionResult = {
      findings: [],
      executedRules: [],
      skippedRules: [],
      unavailableRules: [],
      errors: [],
    };

    const report = createReportModel(mockResult, {
      command: 'doctor',
      targetPath: process.cwd(),
      scope: 'workstation',
      version: '9.9.9-test',
    });

    expect(report.metadata.version).toBe('9.9.9-test');
  });

  it('ensures ScanOrchestratorService produces report metadata with the authoritative version', async () => {
    const orchestrator = new ScanOrchestratorService();
    const report = await orchestrator.executeScan({
      command: 'doctor',
      targetPath: process.cwd(),
    });

    expect(report.metadata.version).toBe(expectedVersion);
    expect(report.metadata.version).not.toBe('0.1.0');
  });

  it('ensures yowtf --json outputs metadata.version matching package.json', async () => {
    let output = '';
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output += String(chunk);
      return true;
    });

    try {
      const code = await runCli(['node', 'yowtf', '--json']);
      expect(code).toBe(0);
      const parsed = JSON.parse(output);
      expect(parsed.metadata.version).toBe(expectedVersion);
      expect(parsed.metadata.version).not.toBe('0.1.0');
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it('ensures yowtf doctor --json outputs metadata.version matching package.json', async () => {
    let output = '';
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output += String(chunk);
      return true;
    });

    try {
      const code = await runCli(['node', 'yowtf', 'doctor', '--json']);
      expect(code).toBe(0);
      const parsed = JSON.parse(output);
      expect(parsed.metadata.version).toBe(expectedVersion);
      expect(parsed.metadata.version).not.toBe('0.1.0');
    } finally {
      stdoutSpy.mockRestore();
    }
  });
});
