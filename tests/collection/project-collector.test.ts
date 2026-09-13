import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectCollector } from '../../src/collection/project/project-collector.js';
import { resolvePlatformAdapter } from '../../src/platform/detector.js';

describe('Collection - ProjectCollector', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-collector-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('collects complete structured project evidence for a standard project', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        packageManager: 'pnpm@9.0.0',
        engines: { node: '>=20' },
      }),
      'utf8',
    );
    await fs.writeFile(path.join(tmpDir, 'pnpm-lock.yaml'), 'lock', 'utf8');
    await fs.writeFile(path.join(tmpDir, '.nvmrc'), '20.11.1', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'tsconfig.json'), '{}', 'utf8');

    const gitDir = path.join(tmpDir, '.git');
    await fs.mkdir(gitDir, { recursive: true });
    await fs.writeFile(path.join(gitDir, 'HEAD'), 'ref: refs/heads/main\n', 'utf8');

    const collector = new ProjectCollector();
    const adapter = resolvePlatformAdapter();

    const evidenceSet = await collector.collect({
      cwd: tmpDir,
      platformAdapter: adapter,
    });

    expect(evidenceSet.category).toBe('project');
    expect(evidenceSet.items).toHaveLength(7);

    // 1. project.root
    const rootItem = evidenceSet.items.find((i) => i.key === 'project.root');
    expect(rootItem).toBeDefined();
    expect(rootItem?.source).toBe('discovery');
    expect(rootItem?.type).toBe('path');
    expect(rootItem?.availability).toBe('AVAILABLE');
    expect(rootItem?.value).toEqual({
      rootPath: path.normalize(tmpDir),
      isProject: true,
    });

    // 2. project.type
    const typeItem = evidenceSet.items.find((i) => i.key === 'project.type');
    expect(typeItem).toBeDefined();
    expect(typeItem?.availability).toBe('AVAILABLE');
    expect(typeItem?.value).toEqual({
      primaryType: 'node',
      types: ['node'],
    });

    // 3. project.manifest
    const manifestItem = evidenceSet.items.find((i) => i.key === 'project.manifest');
    expect(manifestItem).toBeDefined();
    expect(manifestItem?.availability).toBe('AVAILABLE');
    expect(manifestItem?.value).toMatchObject({
      count: 1,
      manifests: [
        {
          name: 'package.json',
          ecosystem: 'node',
          packageName: 'test-app',
          packageManager: 'pnpm',
        },
      ],
    });

    // 4. project.lockfile
    const lockfileItem = evidenceSet.items.find((i) => i.key === 'project.lockfile');
    expect(lockfileItem).toBeDefined();
    expect(lockfileItem?.availability).toBe('AVAILABLE');
    expect(lockfileItem?.value).toEqual({
      lockfiles: [{ name: 'pnpm-lock.yaml', packageManager: 'pnpm' }],
      packageManager: 'pnpm',
    });

    // 5. project.runtime.policy
    const policyItem = evidenceSet.items.find((i) => i.key === 'project.runtime.policy');
    expect(policyItem).toBeDefined();
    expect(policyItem?.availability).toBe('AVAILABLE');
    expect(policyItem?.value).toEqual({
      policyFiles: ['.nvmrc'],
      engines: { node: '>=20' },
    });

    // 6. project.git
    const gitItem = evidenceSet.items.find((i) => i.key === 'project.git');
    expect(gitItem).toBeDefined();
    expect(gitItem?.availability).toBe('AVAILABLE');
    expect(gitItem?.value).toEqual({
      isRepository: true,
      branch: 'main',
    });

    // 7. project.config
    const configItem = evidenceSet.items.find((i) => i.key === 'project.config');
    expect(configItem).toBeDefined();
    expect(configItem?.availability).toBe('AVAILABLE');
  });

  it('marks evidence as UNAVAILABLE or NOT_APPLICABLE for empty non-project directory', async () => {
    const collector = new ProjectCollector();
    const adapter = resolvePlatformAdapter();

    const evidenceSet = await collector.collect({
      cwd: tmpDir,
      platformAdapter: adapter,
    });

    expect(evidenceSet.category).toBe('project');

    const rootItem = evidenceSet.items.find((i) => i.key === 'project.root');
    expect(rootItem?.availability).toBe('NOT_APPLICABLE');

    const typeItem = evidenceSet.items.find((i) => i.key === 'project.type');
    expect(typeItem?.availability).toBe('NOT_APPLICABLE');

    const manifestItem = evidenceSet.items.find((i) => i.key === 'project.manifest');
    expect(manifestItem?.availability).toBe('UNAVAILABLE');

    const lockfileItem = evidenceSet.items.find((i) => i.key === 'project.lockfile');
    expect(lockfileItem?.availability).toBe('UNAVAILABLE');

    const gitItem = evidenceSet.items.find((i) => i.key === 'project.git');
    expect(gitItem?.availability).toBe('UNAVAILABLE');
  });
});
