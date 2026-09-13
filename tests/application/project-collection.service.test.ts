import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectCollectionService } from '../../src/application/services/project-collection.service.js';
import { CliUsageError } from '../../src/cli/errors.js';

describe('Application - ProjectCollectionService', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-proj-service-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('orchestrates project discovery and evidence collection for a target path', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'service-test-app' }),
      'utf8',
    );
    await fs.writeFile(path.join(tmpDir, 'pnpm-lock.yaml'), '', 'utf8');

    const service = new ProjectCollectionService();
    const result = await service.discoverAndCollect({ targetPath: tmpDir });

    expect(result.project.isProject).toBe(true);
    expect(result.project.primaryType).toBe('node');
    expect(result.evidence.category).toBe('project');
    expect(result.evidence.items.length).toBe(7);

    const rootItem = result.evidence.items.find((i) => i.key === 'project.root');
    expect(rootItem?.availability).toBe('AVAILABLE');
  });

  it('rejects non-existent target path with CliUsageError without silently falling back to cwd', async () => {
    const service = new ProjectCollectionService();
    const invalidPath = path.join(tmpDir, 'does-not-exist');

    await expect(service.discoverAndCollect({ targetPath: invalidPath })).rejects.toThrow(
      CliUsageError,
    );
  });
});
