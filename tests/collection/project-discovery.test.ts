import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectDiscovery } from '../../src/collection/project/discovery.js';

describe('Collection - ProjectDiscovery', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-discovery-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('identifies a Node.js project with package.json and lockfile', async () => {
    const pkgJsonPath = path.join(tmpDir, 'package.json');
    await fs.writeFile(
      pkgJsonPath,
      JSON.stringify({
        name: 'sample-project',
        packageManager: 'pnpm@9.1.0',
        engines: { node: '>=20.0.0' },
        scripts: { build: 'tsup', test: 'vitest' },
        dependencies: { lodash: '^4.17.21' },
        devDependencies: { vitest: '^1.0.0' },
      }),
      'utf8',
    );
    await fs.writeFile(path.join(tmpDir, 'pnpm-lock.yaml'), 'lockfile-content', 'utf8');

    const discovery = new ProjectDiscovery();
    const project = await discovery.discover(tmpDir);

    expect(project.isProject).toBe(true);
    expect(project.rootPath).toBe(path.normalize(tmpDir));
    expect(project.primaryType).toBe('node');
    expect(project.types).toEqual(['node']);
    expect(project.packageManager).toBe('pnpm');

    // Manifests
    expect(project.manifests).toHaveLength(1);
    const manifest = project.manifests[0];
    expect(manifest?.name).toBe('package.json');
    expect(manifest?.ecosystem).toBe('node');
    expect(manifest?.metadata?.packageName).toBe('sample-project');
    expect(manifest?.metadata?.engines).toEqual({ node: '>=20.0.0' });
    expect(manifest?.metadata?.scripts).toEqual(['build', 'test']);
    expect(manifest?.metadata?.declaredDependencyCount).toBe(2);

    // Lockfiles
    expect(project.lockfiles).toHaveLength(1);
    expect(project.lockfiles[0]?.name).toBe('pnpm-lock.yaml');
    expect(project.lockfiles[0]?.packageManager).toBe('pnpm');
  });

  it('performs upward root search from a nested subdirectory', async () => {
    // Project root at tmpDir
    await fs.writeFile(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'parent-project' }),
      'utf8',
    );

    // Create nested subdirectories
    const subDir = path.join(tmpDir, 'packages', 'web', 'src');
    await fs.mkdir(subDir, { recursive: true });

    const discovery = new ProjectDiscovery();
    const project = await discovery.discover(subDir);

    expect(project.isProject).toBe(true);
    expect(project.rootPath).toBe(path.normalize(tmpDir));
    expect(project.primaryType).toBe('node');
  });

  it('identifies non-project directory honestly without fabricating markers', async () => {
    // Empty directory
    const discovery = new ProjectDiscovery();
    const project = await discovery.discover(tmpDir);

    expect(project.isProject).toBe(false);
    expect(project.rootPath).toBe(path.normalize(tmpDir));
    expect(project.primaryType).toBe('unknown');
    expect(project.types).toHaveLength(0);
    expect(project.manifests).toHaveLength(0);
    expect(project.lockfiles).toHaveLength(0);
    expect(project.configFiles).toHaveLength(0);
    expect(project.git.isRepository).toBe(false);
  });

  it('identifies Python project from pyproject.toml', async () => {
    await fs.writeFile(path.join(tmpDir, 'pyproject.toml'), '[tool.poetry]\nname="py-app"', 'utf8');

    const discovery = new ProjectDiscovery();
    const project = await discovery.discover(tmpDir);

    expect(project.isProject).toBe(true);
    expect(project.primaryType).toBe('python');
    expect(project.types).toEqual(['python']);
    expect(project.manifests).toHaveLength(1);
    expect(project.manifests[0]?.name).toBe('pyproject.toml');
  });

  it('identifies Rust project from Cargo.toml and Cargo.lock', async () => {
    await fs.writeFile(path.join(tmpDir, 'Cargo.toml'), '[package]\nname="rust-app"', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'Cargo.lock'), '# lock', 'utf8');

    const discovery = new ProjectDiscovery();
    const project = await discovery.discover(tmpDir);

    expect(project.isProject).toBe(true);
    expect(project.primaryType).toBe('rust');
    expect(project.packageManager).toBe('cargo');
  });

  it('preserves all detected ecosystems in multi-ecosystem projects', async () => {
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{}', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'Cargo.toml'), '', 'utf8');

    const discovery = new ProjectDiscovery();
    const project = await discovery.discover(tmpDir);

    expect(project.isProject).toBe(true);
    expect(project.types).toEqual(['node', 'rust']);
  });

  it('discovers Git repository and active branch', async () => {
    const gitDir = path.join(tmpDir, '.git');
    await fs.mkdir(gitDir, { recursive: true });
    await fs.writeFile(path.join(gitDir, 'HEAD'), 'ref: refs/heads/feature/branch-x\n', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{}', 'utf8');

    const discovery = new ProjectDiscovery();
    const project = await discovery.discover(tmpDir);

    expect(project.git.isRepository).toBe(true);
    expect(project.git.branch).toBe('feature/branch-x');
  });

  it('handles malformed package.json safely without throwing', async () => {
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{ invalid json ...', 'utf8');

    const discovery = new ProjectDiscovery();
    const project = await discovery.discover(tmpDir);

    expect(project.isProject).toBe(true);
    expect(project.manifests).toHaveLength(1);
    expect(project.manifests[0]?.name).toBe('package.json');
    expect(project.manifests[0]?.metadata).toBeUndefined();
  });
});
