import { describe, expect, it } from 'vitest';
import { allV1Rules } from '../../src/detection/rules/all.js';
import { createDefaultRuleRegistry } from '../../src/detection/registry.js';
import { isValidRuleId } from '../../src/domain/rule-id.js';
import { isDiagnosticCategory } from '../../src/domain/category.js';
import { isFindingSeverity } from '../../src/domain/severity.js';
import { isFindingConfidence } from '../../src/domain/confidence.js';

describe('V1 Rule Catalogue Audit', () => {
  const EXPECTED_RULE_IDS = [
    // 1. System (5)
    'system.memory.pressure',
    'system.cpu.pressure',
    'system.uptime.short',
    'system.architecture.mismatch',
    'system.platform.supported',
    // 2. Disk (4)
    'disk.space.low',
    'disk.developer-storage.pressure',
    'disk.project.location.unavailable',
    'disk.filesystem.readonly',
    // 3. Processes (4)
    'process.resource.hog',
    'process.memory.hog',
    'process.development.zombie',
    'process.development.duplicate',
    // 4. Ports (4)
    'port.development.conflict',
    'port.duplicate.listener',
    'port.unexpected.exposure',
    'port.process.unavailable',
    // 5. Network (4)
    'network.interface.unavailable',
    'network.dns.configuration.missing',
    'network.proxy.configuration.suspicious',
    'network.route.configuration.unavailable',
    // 6. Environment (4)
    'environment.path.empty-entry',
    'environment.secret.exposure',
    'environment.path.duplicate',
    'environment.shell.path-mismatch',
    // 7. Runtimes (6)
    'runtime.node.unavailable',
    'runtime.node.unpinned',
    'runtime.python.unavailable',
    'runtime.python.unpinned',
    'runtime.java.unavailable',
    'runtime.version.mismatch',
    // 8. Tools (5)
    'tool.git.unavailable',
    'tool.package-manager.mismatch',
    'tool.package-manager.missing',
    'tool.docker.unavailable',
    'tool.executable.shadowing',
    // 9. Paths (4)
    'path.executable.missing',
    'path.executable.multiple',
    'path.entry.invalid',
    'path.order.shadowing',
    // 10. Versions (4)
    'version.runtime.conflict',
    'version.tool.conflict',
    'version.project.runtime.unsatisfied',
    'version.tool.outdated',
    // 11. Project (4)
    'project.manifest.missing',
    'project.lockfile.missing',
    'project.runtime.policy.missing',
    'project.root.ambiguous',
    // 12. Dependencies (4)
    'dependency.lockfile.missing',
    'dependency.lockfile.mismatch',
    'dependency.package-manager.mismatch',
    'dependency.directory.inconsistent',
    // 13. Git (4)
    'git.repository.missing',
    'git.working-tree.dirty',
    'git.untracked.files',
    'git.branch.divergence',
    // 14. Configuration (2)
    'config.environment.file.missing',
    'config.required.value.missing',
    // 15. Caches (2)
    'cache.storage.large',
    'cache.build.artifact.large',
  ];

  it('contains exactly 60 authoritative V1 rules in the allV1Rules array', () => {
    expect(allV1Rules).toHaveLength(60);
  });

  it('matches the exact catalogue order and rule IDs', () => {
    const actualIds = allV1Rules.map((r) => r.metadata.id);
    expect(actualIds).toEqual(EXPECTED_RULE_IDS);
  });

  it('verifies category breakdown matches RULE-CATALOGUE.md Section 12 & 28', () => {
    const counts: Record<string, number> = {};
    for (const rule of allV1Rules) {
      counts[rule.metadata.category] = (counts[rule.metadata.category] ?? 0) + 1;
    }

    expect(counts['system']).toBe(5);
    expect(counts['disk']).toBe(4);
    expect(counts['process']).toBe(4);
    expect(counts['port']).toBe(4);
    expect(counts['network']).toBe(4);
    expect(counts['environment']).toBe(4);
    expect(counts['runtime']).toBe(6);
    expect(counts['tool']).toBe(5);
    expect(counts['path']).toBe(4);
    expect(counts['version']).toBe(4);
    expect(counts['project']).toBe(4);
    expect(counts['dependency']).toBe(4);
    expect(counts['git']).toBe(4);
    expect(counts['config']).toBe(2);
    expect(counts['cache']).toBe(2);
  });

  it('verifies metadata validity for all 60 rules', () => {
    for (const rule of allV1Rules) {
      const meta = rule.metadata;
      expect(isValidRuleId(meta.id)).toBe(true);
      expect(isDiagnosticCategory(meta.category)).toBe(true);
      expect(isFindingSeverity(meta.severity)).toBe(true);
      expect(isFindingConfidence(meta.confidence)).toBe(true);
      expect(meta.name.trim().length).toBeGreaterThan(0);
      expect(meta.description.trim().length).toBeGreaterThan(0);
    }
  });

  it('createDefaultRuleRegistry loads all 60 rules uniquely', () => {
    const registry = createDefaultRuleRegistry();
    expect(registry.list()).toHaveLength(60);
    for (const id of EXPECTED_RULE_IDS) {
      expect(registry.get(id)).toBeDefined();
    }
  });
});
