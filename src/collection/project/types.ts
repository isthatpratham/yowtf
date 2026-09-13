/**
 * Project discovery and collection types.
 * Adheres to docs/ARCHITECTURE.md Section 18 and docs/RULE-CATALOGUE.md Section 23, 24, 25, 26.
 */

export type SupportedProjectType =
  'node' | 'python' | 'rust' | 'go' | 'java' | 'php' | 'ruby' | 'unknown';

export interface ProjectManifestMetadata {
  readonly packageName?: string;
  readonly packageManager?: string;
  readonly engines?: Readonly<Record<string, string>>;
  readonly scripts?: readonly string[];
  readonly declaredDependencyCount?: number;
}

export interface ProjectManifestInfo {
  readonly name: string;
  readonly path: string;
  readonly ecosystem: SupportedProjectType;
  readonly metadata?: ProjectManifestMetadata;
}

export interface ProjectLockfileInfo {
  readonly name: string;
  readonly path: string;
  readonly packageManager: string;
}

export type ConfigCategory = 'runtime-policy' | 'environment' | 'tooling' | 'general';

export interface ProjectConfigInfo {
  readonly name: string;
  readonly path: string;
  readonly category: ConfigCategory;
}

export interface ProjectGitInfo {
  readonly isRepository: boolean;
  readonly gitDir?: string;
  readonly branch?: string;
}

/**
 * Structured project context established by project discovery.
 */
export interface DiscoveredProject {
  readonly isProject: boolean;
  readonly rootPath: string;
  readonly types: readonly SupportedProjectType[];
  readonly primaryType: SupportedProjectType;
  readonly manifests: readonly ProjectManifestInfo[];
  readonly lockfiles: readonly ProjectLockfileInfo[];
  readonly configFiles: readonly ProjectConfigInfo[];
  readonly packageManager?: string;
  readonly git: ProjectGitInfo;
}
