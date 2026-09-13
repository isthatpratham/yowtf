import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package Metadata & Packaging Readiness', () => {
  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  it('has valid npm package identity and metadata', () => {
    expect(packageJson.name).toBe('yowtf');
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(packageJson.description).toBe('Your Operating Workstation Trouble Finder');
    expect(packageJson.license).toBe('MIT');
    expect(packageJson.type).toBe('module');
  });

  it('configures the public yowtf bin executable', () => {
    expect(packageJson.bin).toBeDefined();
    expect(packageJson.bin.yowtf).toBe('./dist/cli.js');
  });

  it('exposes standard module entrypoints and types', () => {
    expect(packageJson.main).toBe('./dist/index.js');
    expect(packageJson.types).toBe('./dist/index.d.ts');
  });

  it('enforces Node.js >=20 engine constraint', () => {
    expect(packageJson.engines).toBeDefined();
    expect(packageJson.engines.node).toBe('>=20.0.0');
  });

  it('includes repository, homepage, and bug tracker metadata', () => {
    expect(packageJson.repository).toBeDefined();
    expect(packageJson.repository.url).toContain('github.com/isthatpratham/yowtf');
    expect(packageJson.homepage).toContain('github.com/isthatpratham/yowtf');
    expect(packageJson.bugs?.url).toContain('github.com/isthatpratham/yowtf/issues');
  });

  it('limits package files to dist and essential documentation', () => {
    expect(Array.isArray(packageJson.files)).toBe(true);
    expect(packageJson.files).toContain('dist');
  });

  it('strictly adheres to approved runtime dependencies', () => {
    const approvedDependencies = new Set(['boxen', 'chalk', 'cli-table3', 'commander', 'ora']);

    const runtimeDependencies = Object.keys(packageJson.dependencies || {});
    expect(runtimeDependencies.length).toBe(approvedDependencies.size);
    for (const dep of runtimeDependencies) {
      expect(approvedDependencies.has(dep)).toBe(true);
    }
  });

  it('defines mandatory quality gate scripts', () => {
    const scripts = packageJson.scripts || {};
    expect(scripts.build).toBeDefined();
    expect(scripts.test).toBeDefined();
    expect(scripts.typecheck).toBeDefined();
    expect(scripts.lint).toBeDefined();
    expect(scripts['format:check']).toBeDefined();
  });

  it('ensures cli source entrypoint contains node shebang', () => {
    const cliSourcePath = path.resolve(__dirname, '../../src/cli/index.ts');
    const content = fs.readFileSync(cliSourcePath, 'utf8');
    expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
  });
});
