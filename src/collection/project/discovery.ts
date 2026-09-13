import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {
  DiscoveredProject,
  ProjectConfigInfo,
  ProjectGitInfo,
  ProjectLockfileInfo,
  ProjectManifestInfo,
  ProjectManifestMetadata,
  SupportedProjectType,
} from './types.js';

interface MarkerRule {
  readonly filename: string;
  readonly ecosystem: SupportedProjectType;
  readonly isManifest?: boolean;
}

const PROJECT_MARKERS: readonly MarkerRule[] = [
  // Node.js
  { filename: 'package.json', ecosystem: 'node', isManifest: true },
  { filename: 'pnpm-lock.yaml', ecosystem: 'node' },
  { filename: 'package-lock.json', ecosystem: 'node' },
  { filename: 'yarn.lock', ecosystem: 'node' },
  { filename: 'bun.lockb', ecosystem: 'node' },
  { filename: 'bun.lock', ecosystem: 'node' },

  // Python
  { filename: 'pyproject.toml', ecosystem: 'python', isManifest: true },
  { filename: 'requirements.txt', ecosystem: 'python', isManifest: true },
  { filename: 'Pipfile', ecosystem: 'python', isManifest: true },
  { filename: 'setup.py', ecosystem: 'python', isManifest: true },

  // Rust
  { filename: 'Cargo.toml', ecosystem: 'rust', isManifest: true },

  // Go
  { filename: 'go.mod', ecosystem: 'go', isManifest: true },

  // Java
  { filename: 'pom.xml', ecosystem: 'java', isManifest: true },
  { filename: 'build.gradle', ecosystem: 'java', isManifest: true },
  { filename: 'build.gradle.kts', ecosystem: 'java', isManifest: true },

  // PHP
  { filename: 'composer.json', ecosystem: 'php', isManifest: true },

  // Ruby
  { filename: 'Gemfile', ecosystem: 'ruby', isManifest: true },

  // Version control
  { filename: '.git', ecosystem: 'unknown' },
];

const KNOWN_LOCKFILES: Readonly<Record<string, string>> = {
  'pnpm-lock.yaml': 'pnpm',
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'bun.lockb': 'bun',
  'bun.lock': 'bun',
  'Cargo.lock': 'cargo',
  'go.sum': 'go',
  'composer.lock': 'composer',
  'Gemfile.lock': 'bundler',
  'poetry.lock': 'poetry',
  'Pipfile.lock': 'pipenv',
};

const KNOWN_RUNTIME_POLICIES: readonly string[] = [
  '.nvmrc',
  '.node-version',
  '.python-version',
  '.ruby-version',
  '.tool-versions',
];

const KNOWN_ENV_CONFIGS: readonly string[] = [
  '.env',
  '.env.example',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
];

const KNOWN_TOOLING_CONFIGS: readonly string[] = [
  'tsconfig.json',
  'eslint.config.js',
  'eslint.config.mjs',
  '.eslintrc.json',
  '.eslintrc.js',
  'vite.config.ts',
  'vite.config.js',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
];

const KNOWN_GENERAL_CONFIGS: readonly string[] = [
  'Dockerfile',
  'docker-compose.yml',
  'compose.yaml',
];

export class ProjectDiscovery {
  /**
   * Discovers project root and inspects structured project facts.
   * Strictly read-only and safe.
   */
  public async discover(startDir: string): Promise<DiscoveredProject> {
    const normalizedStart = path.normalize(path.resolve(startDir));
    const rootPath = await this.findProjectRoot(normalizedStart);

    if (!rootPath) {
      return {
        isProject: false,
        rootPath: normalizedStart,
        types: [],
        primaryType: 'unknown',
        manifests: [],
        lockfiles: [],
        configFiles: [],
        git: { isRepository: false },
      };
    }

    const entries = await this.safeReadDir(rootPath);
    const entrySet = new Set(entries);

    // 1. Identify manifests
    const manifests = await this.discoverManifests(rootPath, entrySet);

    // 2. Identify lockfiles
    const lockfiles = this.discoverLockfiles(rootPath, entrySet);

    // 3. Identify configs (presence only, no secret reading)
    const configFiles = this.discoverConfigs(rootPath, entrySet);

    // 4. Identify Git metadata (local only, no mutations)
    const git = await this.discoverGit(rootPath, entrySet);

    // 5. Determine project types
    const types = this.determineTypes(manifests, entrySet);
    const primaryType = types[0] ?? 'unknown';

    // 6. Resolve package manager identity
    const packageManager = this.resolvePackageManager(lockfiles, manifests);

    return {
      isProject: true,
      rootPath,
      types: Object.freeze(types),
      primaryType,
      manifests: Object.freeze(manifests),
      lockfiles: Object.freeze(lockfiles),
      configFiles: Object.freeze(configFiles),
      ...(packageManager ? { packageManager } : {}),
      git,
    };
  }

  /**
   * Walks upward from startDir to locate the first ancestor directory containing project markers.
   * Prevents escaping into unrelated directories such as user home or system temp root.
   */
  private async findProjectRoot(startDir: string): Promise<string | null> {
    const homeDir = path.normalize(os.homedir());
    const tmpDir = path.normalize(os.tmpdir());
    let current = startDir;
    let depth = 0;
    const maxDepth = 6;

    while (depth <= maxDepth) {
      // Do not traverse out of temp or home directory into parents
      if (depth > 0 && (current === tmpDir || current === homeDir)) {
        break;
      }

      const entries = await this.safeReadDir(current);
      const entrySet = new Set(entries);

      // Check if current directory has a project manifest
      const hasManifest = PROJECT_MARKERS.some(
        (marker) => marker.isManifest && entrySet.has(marker.filename),
      );
      if (hasManifest) {
        return current;
      }

      // Check if current directory has .git (and is not home or volume root)
      if (entrySet.has('.git') && current !== homeDir && current !== path.parse(current).root) {
        return current;
      }

      // Check if current directory has standalone lockfile
      const hasLockfile = Object.keys(KNOWN_LOCKFILES).some((lf) => entrySet.has(lf));
      if (hasLockfile) {
        return current;
      }

      const parent = path.dirname(current);
      if (parent === current) {
        break; // Reached filesystem root
      }
      current = parent;
      depth++;
    }

    return null;
  }

  private async safeReadDir(dir: string): Promise<string[]> {
    try {
      return await fs.readdir(dir);
    } catch {
      return [];
    }
  }

  private async discoverManifests(
    rootPath: string,
    entrySet: Set<string>,
  ): Promise<ProjectManifestInfo[]> {
    const manifests: ProjectManifestInfo[] = [];

    for (const marker of PROJECT_MARKERS) {
      if (marker.isManifest && entrySet.has(marker.filename)) {
        const filePath = path.join(rootPath, marker.filename);
        let metadata: ProjectManifestMetadata | undefined;

        if (marker.filename === 'package.json') {
          metadata = await this.safelyParsePackageJson(filePath);
        }

        manifests.push({
          name: marker.filename,
          path: filePath,
          ecosystem: marker.ecosystem,
          ...(metadata ? { metadata } : {}),
        });
      }
    }

    // Sort deterministically by name
    return manifests.sort((a, b) => a.name.localeCompare(b.name));
  }

  private async safelyParsePackageJson(
    filePath: string,
  ): Promise<ProjectManifestMetadata | undefined> {
    try {
      const stats = await fs.stat(filePath);
      // Guard against oversized pathological files (max 5MB)
      if (stats.size > 5 * 1024 * 1024) {
        return undefined;
      }

      const content = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content) as Record<string, unknown>;

      const packageName = typeof parsed.name === 'string' ? parsed.name : undefined;
      const packageManager =
        typeof parsed.packageManager === 'string' ? parsed.packageManager.split('@')[0] : undefined;

      const engines =
        typeof parsed.engines === 'object' && parsed.engines !== null
          ? Object.freeze(parsed.engines as Record<string, string>)
          : undefined;

      const scripts =
        typeof parsed.scripts === 'object' && parsed.scripts !== null
          ? Object.freeze(Object.keys(parsed.scripts).sort())
          : undefined;

      const deps =
        typeof parsed.dependencies === 'object' && parsed.dependencies !== null
          ? Object.keys(parsed.dependencies).length
          : 0;
      const devDeps =
        typeof parsed.devDependencies === 'object' && parsed.devDependencies !== null
          ? Object.keys(parsed.devDependencies).length
          : 0;
      const declaredDependencyCount = deps + devDeps;

      return {
        packageName,
        packageManager,
        engines,
        scripts,
        declaredDependencyCount,
      };
    } catch {
      return undefined;
    }
  }

  private discoverLockfiles(rootPath: string, entrySet: Set<string>): ProjectLockfileInfo[] {
    const lockfiles: ProjectLockfileInfo[] = [];

    for (const [filename, pm] of Object.entries(KNOWN_LOCKFILES)) {
      if (entrySet.has(filename)) {
        lockfiles.push({
          name: filename,
          path: path.join(rootPath, filename),
          packageManager: pm,
        });
      }
    }

    return lockfiles.sort((a, b) => a.name.localeCompare(b.name));
  }

  private discoverConfigs(rootPath: string, entrySet: Set<string>): ProjectConfigInfo[] {
    const configs: ProjectConfigInfo[] = [];

    for (const file of KNOWN_RUNTIME_POLICIES) {
      if (entrySet.has(file)) {
        configs.push({
          name: file,
          path: path.join(rootPath, file),
          category: 'runtime-policy',
        });
      }
    }

    for (const file of KNOWN_ENV_CONFIGS) {
      if (entrySet.has(file)) {
        configs.push({
          name: file,
          path: path.join(rootPath, file),
          category: 'environment',
        });
      }
    }

    for (const file of KNOWN_TOOLING_CONFIGS) {
      if (entrySet.has(file)) {
        configs.push({
          name: file,
          path: path.join(rootPath, file),
          category: 'tooling',
        });
      }
    }

    for (const file of KNOWN_GENERAL_CONFIGS) {
      if (entrySet.has(file)) {
        configs.push({
          name: file,
          path: path.join(rootPath, file),
          category: 'general',
        });
      }
    }

    return configs.sort((a, b) => a.name.localeCompare(b.name));
  }

  private async discoverGit(rootPath: string, entrySet: Set<string>): Promise<ProjectGitInfo> {
    if (!entrySet.has('.git')) {
      return { isRepository: false };
    }

    const gitEntryPath = path.join(rootPath, '.git');
    let effectiveGitDir = gitEntryPath;
    let branch: string | undefined;

    try {
      const stat = await fs.stat(gitEntryPath);
      if (stat.isFile()) {
        // Git worktree support: .git is a text file containing "gitdir: <path>"
        const gitFileContent = await fs.readFile(gitEntryPath, 'utf8');
        const match = gitFileContent.match(/^gitdir:\s*(.+)$/m);
        if (match && match[1]) {
          effectiveGitDir = path.resolve(rootPath, match[1].trim());
        }
      }

      const headContent = await fs.readFile(path.join(effectiveGitDir, 'HEAD'), 'utf8');
      const trimmed = headContent.trim();
      if (trimmed.startsWith('ref: refs/heads/')) {
        branch = trimmed.replace('ref: refs/heads/', '');
      } else {
        branch = trimmed.substring(0, 7); // Detached head commit hash
      }
    } catch {
      // Unreadable git HEAD is not a fatal error
    }

    return {
      isRepository: true,
      gitDir: effectiveGitDir,
      branch,
    };
  }

  private determineTypes(
    manifests: readonly ProjectManifestInfo[],
    entrySet: Set<string>,
  ): SupportedProjectType[] {
    const typeSet = new Set<SupportedProjectType>();

    for (const manifest of manifests) {
      if (manifest.ecosystem !== 'unknown') {
        typeSet.add(manifest.ecosystem);
      }
    }

    // Secondary check for lockfiles or ecosystem markers
    if (
      entrySet.has('package-lock.json') ||
      entrySet.has('pnpm-lock.yaml') ||
      entrySet.has('yarn.lock') ||
      entrySet.has('bun.lockb')
    ) {
      typeSet.add('node');
    }
    if (entrySet.has('Cargo.lock')) {
      typeSet.add('rust');
    }
    if (entrySet.has('go.sum')) {
      typeSet.add('go');
    }

    const types = Array.from(typeSet).sort();
    return types.length > 0 ? types : ['unknown'];
  }

  private resolvePackageManager(
    lockfiles: readonly ProjectLockfileInfo[],
    manifests: readonly ProjectManifestInfo[],
  ): string | undefined {
    // 1. Lockfiles take precedence for local truth
    if (lockfiles.length > 0) {
      return lockfiles[0]?.packageManager;
    }

    // 2. package.json packageManager declaration
    const pkgJson = manifests.find((m) => m.name === 'package.json');
    if (pkgJson?.metadata?.packageManager) {
      return pkgJson.metadata.packageManager;
    }

    return undefined;
  }
}
