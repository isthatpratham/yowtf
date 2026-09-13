import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectCollector } from '../../src/collection/project/project-collector.js';
import { resolvePlatformAdapter } from '../../src/platform/detector.js';

describe('Collection - Project Read-Only Invariants', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-proj-readonly-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('does not create, mutate, or delete project files during discovery and collection', async () => {
    const pkgPath = path.join(tmpDir, 'package.json');
    const lockPath = path.join(tmpDir, 'pnpm-lock.yaml');
    const configPath = path.join(tmpDir, 'tsconfig.json');

    await fs.writeFile(pkgPath, JSON.stringify({ name: 'read-only-test' }), 'utf8');
    await fs.writeFile(lockPath, '# lockfile', 'utf8');
    await fs.writeFile(configPath, '{}', 'utf8');

    const filesBefore = await fs.readdir(tmpDir);
    const statPkgBefore = await fs.stat(pkgPath);
    const statLockBefore = await fs.stat(lockPath);

    const collector = new ProjectCollector();
    const adapter = resolvePlatformAdapter();

    await collector.collect({
      cwd: tmpDir,
      platformAdapter: adapter,
    });

    const filesAfter = await fs.readdir(tmpDir);
    const statPkgAfter = await fs.stat(pkgPath);
    const statLockAfter = await fs.stat(lockPath);

    // No files added or removed
    expect(filesAfter).toEqual(filesBefore);

    // File metadata unchanged
    expect(statPkgAfter.mtimeMs).toBe(statPkgBefore.mtimeMs);
    expect(statPkgAfter.size).toBe(statPkgBefore.size);

    expect(statLockAfter.mtimeMs).toBe(statLockBefore.mtimeMs);
    expect(statLockAfter.size).toBe(statLockBefore.size);
  });
});
