import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProjectDiscovery } from '../../src/collection/project/discovery.js';
import { executeSafeCommand } from '../../src/platform/command.js';

describe('Resource Bounds & Pathological Inputs (Phase 9 Hardening)', () => {
  let tempDirsToCleanup: string[] = [];

  beforeEach(() => {
    tempDirsToCleanup = [];
  });

  afterEach(async () => {
    for (const dir of tempDirsToCleanup) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('rejects oversized package.json files (>5MB) gracefully to avoid OOM', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-large-pkg-'));
    tempDirsToCleanup.push(tempDir);

    const pkgPath = path.join(tempDir, 'package.json');
    // Create a 5.5MB file filled with spaces and valid JSON framing
    const targetSize = 5.5 * 1024 * 1024;
    const padding = ' '.repeat(targetSize - 40);
    const content = `{"name": "oversized-app", "pad": "${padding}"}`;
    await fs.writeFile(pkgPath, content, 'utf8');

    const discovery = new ProjectDiscovery();
    const result = await discovery.discover(tempDir);

    expect(result.isProject).toBe(true);
    const manifest = result.manifests.find((m) => m.name === 'package.json');
    expect(manifest).toBeDefined();
    // Oversized manifest metadata is undefined (safely rejected by resource bound)
    expect(manifest?.metadata).toBeUndefined();
  });

  it('correctly inspects Git worktrees where .git is a file referencing gitdir', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-worktree-'));
    tempDirsToCleanup.push(tempDir);

    // Create a mock main git directory
    const mockMainGitDir = path.join(tempDir, 'main-repo-git', 'worktrees', 'feature-wt');
    await fs.mkdir(mockMainGitDir, { recursive: true });
    await fs.writeFile(
      path.join(mockMainGitDir, 'HEAD'),
      'ref: refs/heads/feature/worktree-branch\n',
    );

    // Create the worktree checkout folder with a .git file
    const worktreeDir = path.join(tempDir, 'worktree-checkout');
    await fs.mkdir(worktreeDir, { recursive: true });
    await fs.writeFile(
      path.join(worktreeDir, 'package.json'),
      JSON.stringify({ name: 'wt-project' }),
    );
    await fs.writeFile(path.join(worktreeDir, '.git'), `gitdir: ${mockMainGitDir}\n`);

    const discovery = new ProjectDiscovery();
    const result = await discovery.discover(worktreeDir);

    expect(result.isProject).toBe(true);
    expect(result.git.isRepository).toBe(true);
    expect(result.git.branch).toBe('feature/worktree-branch');
    expect(result.git.gitDir).toBe(path.resolve(worktreeDir, mockMainGitDir));
  });

  it('bounds command execution with timeout preventing process hangs', async () => {
    const isWindows = process.platform === 'win32';
    // Use ping/timeout command to simulate a 10s wait, but bound with a 300ms timeout
    const cmd = isWindows ? 'ping' : 'sleep';
    const args = isWindows ? ['127.0.0.1', '-n', '10'] : ['10'];

    const start = Date.now();
    await expect(executeSafeCommand(cmd, args, { timeoutMs: 300 })).rejects.toThrow();

    const elapsed = Date.now() - start;
    // Should terminate around 300ms, well below 5000ms
    expect(elapsed).toBeLessThan(3000);
  });

  it('enforces strictly positive timeouts in executeSafeCommand', async () => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'cmd' : 'echo';
    const args = isWindows ? ['/c', 'echo bound'] : ['bound'];

    // If timeoutMs is 0 or negative, it defaults to DEFAULT_TIMEOUT_MS and executes safely
    const result = await executeSafeCommand(cmd, args, { timeoutMs: 0 });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('bound');
  });
});
