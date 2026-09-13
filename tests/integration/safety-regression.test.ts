import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { runCli } from '../../src/cli/cli.js';

interface FileSnapshot {
  readonly filename: string;
  readonly mtimeMs: number;
  readonly size: number;
}

async function takeDirectorySnapshot(dir: string): Promise<Map<string, FileSnapshot>> {
  const map = new Map<string, FileSnapshot>();
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile()) {
      const stats = await fs.stat(fullPath);
      map.set(entry.name, {
        filename: entry.name,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      });
    }
  }

  return map;
}

describe('Safety, Privacy & Read-Only Regressions (docs/ARCHITECTURE.md Section 6 & docs/PRD.md)', () => {
  let stdoutSpy: MockInstance<typeof process.stdout.write>;
  let stderrSpy: MockInstance<typeof process.stderr.write>;
  let tempDirsToCleanup: string[] = [];

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    tempDirsToCleanup = [];
  });

  afterEach(async () => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();

    for (const dir of tempDirsToCleanup) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Read-Only Guarantee', () => {
    it('executing full scan does not create, modify, or delete any files in the target directory', async () => {
      const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-readonly-test-'));
      tempDirsToCleanup.push(testDir);

      // Populate mock project files
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'readonly-app', version: '1.0.0' }),
      );
      await fs.writeFile(
        path.join(testDir, 'tsconfig.json'),
        JSON.stringify({ compilerOptions: {} }),
      );
      await fs.writeFile(path.join(testDir, 'README.md'), '# Readonly App');

      const beforeSnapshot = await takeDirectorySnapshot(testDir);

      // Execute full scan and doctor scan
      const exitCode1 = await runCli(['node', 'yowtf', '--path', testDir]);
      expect(exitCode1).toBe(0);

      const exitCode2 = await runCli(['node', 'yowtf', 'clean', '--preview', '--path', testDir]);
      expect(exitCode2).toBe(0);

      const afterSnapshot = await takeDirectorySnapshot(testDir);

      expect(afterSnapshot.size).toBe(beforeSnapshot.size);
      for (const [name, beforeInfo] of beforeSnapshot.entries()) {
        const afterInfo = afterSnapshot.get(name);
        expect(afterInfo).toBeDefined();
        expect(afterInfo?.size).toBe(beforeInfo.size);
        expect(afterInfo?.mtimeMs).toBe(beforeInfo.mtimeMs);
      }
    });
  });

  describe('Privacy & Secret Non-Disclosure', () => {
    it('ensures secret values in environment files are never leaked into findings or reports', async () => {
      const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-secret-test-'));
      tempDirsToCleanup.push(testDir);

      const sensitiveValues = [
        'supersecret_token_xyz123',
        'sk_live_998877665544332211',
        'postgres://user:password123@localhost:5432/db',
        'ghp_verysecretpersonalaccesstoken',
      ];

      const envContent = [
        `API_SECRET=${sensitiveValues[0]}`,
        `STRIPE_KEY=${sensitiveValues[1]}`,
        `DATABASE_URL=${sensitiveValues[2]}`,
        `GITHUB_AUTH_TOKEN=${sensitiveValues[3]}`,
      ].join('\n');

      await fs.writeFile(path.join(testDir, '.env'), envContent);
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'secret-app' }),
      );

      // Execute scan with verbose output in JSON mode
      const exitCode = await runCli([
        'node',
        'yowtf',
        'env',
        '--path',
        testDir,
        '--json',
        '--verbose',
      ]);
      expect(exitCode).toBe(0);

      const rawOutput = stdoutSpy.mock.calls.map((c) => c[0]).join('');

      for (const secret of sensitiveValues) {
        expect(rawOutput).not.toContain(secret);
      }
    });
  });

  describe('No Telemetry / No Network Egress', () => {
    it('does not invoke global fetch or make external network requests', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const exitCode = await runCli(['node', 'yowtf', '--json']);
      expect(exitCode).toBe(0);

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });
});
