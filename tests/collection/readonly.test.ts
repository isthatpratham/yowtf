import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { SystemCollector } from '../../src/collection/system/system-collector.js';
import { resolvePlatformAdapter } from '../../src/platform/detector.js';

describe('Collection - Read-Only Invariants', () => {
  it('does not create, mutate, or delete files in target directory during collection', async () => {
    // Create an isolated temporary directory to serve as test target
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-readonly-test-'));

    try {
      // Place a sample file in the directory
      const testFile = path.join(tmpDir, 'sample.txt');
      await fs.writeFile(testFile, 'initial content', 'utf8');

      const filesBefore = await fs.readdir(tmpDir);
      const statBefore = await fs.stat(testFile);

      const collector = new SystemCollector();
      const adapter = resolvePlatformAdapter();

      await collector.collect({
        cwd: tmpDir,
        platformAdapter: adapter,
      });

      const filesAfter = await fs.readdir(tmpDir);
      const statAfter = await fs.stat(testFile);

      // Verify no new files were created
      expect(filesAfter).toEqual(filesBefore);

      // Verify file content/mtime was not mutated
      expect(statAfter.mtimeMs).toBe(statBefore.mtimeMs);
      expect(statAfter.size).toBe(statBefore.size);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
