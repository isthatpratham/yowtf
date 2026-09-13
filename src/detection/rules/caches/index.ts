import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

const ONE_GB = 1024 * 1024 * 1024;

/**
 * CACHE-001: Large Developer Cache
 * Reference: docs/RULE-CATALOGUE.md Section 27
 */
export const cache001StorageLarge: SyncDiagnosticRule = {
  metadata: {
    id: 'cache.storage.large',
    name: 'Large Developer Cache',
    category: 'cache',
    description: 'Identify a known developer cache whose size is unusually large.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Only for safely recognized cache locations.'],
    requiredEvidence: ['cache.developer.storage'],
    explanation: 'The cache consumes significant local storage.',
    remediationHint: 'Review the cache as a cleanup candidate.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'cache.developer.storage');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ cacheName?: string; sizeBytes?: number; sizeGB?: number }>(
      evidence,
      'cache.developer.storage',
    );

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'cache.storage.large',
        status: 'UNAVAILABLE',
        finding: buildFinding(cache001StorageLarge.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Developer cache storage size is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const bytes = item.value.sizeBytes ?? (item.value.sizeGB ? item.value.sizeGB * ONE_GB : 0);
    const gb = bytes / ONE_GB;

    if (gb >= 50) {
      return {
        ruleId: 'cache.storage.large',
        status: 'FAIL',
        finding: buildFinding(cache001StorageLarge.metadata, {
          status: 'FAIL',
          severity: 'MEDIUM',
          summary: `Developer cache '${item.value.cacheName ?? 'cache'}' is very large at ${gb.toFixed(1)} GB (threshold >= 50 GB).`,
          evidenceItems: [item],
          details: { cache: item.value.cacheName ?? '', sizeGB: gb },
        }),
      };
    }

    if (gb >= 10) {
      return {
        ruleId: 'cache.storage.large',
        status: 'WARN',
        finding: buildFinding(cache001StorageLarge.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Developer cache '${item.value.cacheName ?? 'cache'}' is elevated at ${gb.toFixed(1)} GB (threshold >= 10 GB).`,
          evidenceItems: [item],
          details: { cache: item.value.cacheName ?? '', sizeGB: gb },
        }),
      };
    }

    return {
      ruleId: 'cache.storage.large',
      status: 'PASS',
      finding: buildFinding(cache001StorageLarge.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Developer cache size is normal (${gb.toFixed(1)} GB).`,
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * CACHE-002: Large Build Artifact
 * Reference: docs/RULE-CATALOGUE.md Section 27
 */
export const cache002BuildArtifactLarge: SyncDiagnosticRule = {
  metadata: {
    id: 'cache.build.artifact.large',
    name: 'Large Build Artifact',
    category: 'cache',
    description: 'Identify unusually large recognized build-output directories.',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    applicability: ['Only for recognized project/build-output locations.'],
    requiredEvidence: ['cache.build.artifacts'],
    explanation: 'Build output is consuming substantial local storage.',
    remediationHint: 'Review whether the build output can be cleaned or regenerated.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'cache.build.artifacts');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ directoryName?: string; sizeBytes?: number; sizeGB?: number }>(
      evidence,
      'cache.build.artifacts',
    );

    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'cache.build.artifact.large',
        status: 'UNAVAILABLE',
        finding: buildFinding(cache002BuildArtifactLarge.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Build artifact size evidence is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const bytes = item.value.sizeBytes ?? (item.value.sizeGB ? item.value.sizeGB * ONE_GB : 0);
    const gb = bytes / ONE_GB;

    if (gb >= 20) {
      return {
        ruleId: 'cache.build.artifact.large',
        status: 'FAIL',
        finding: buildFinding(cache002BuildArtifactLarge.metadata, {
          status: 'FAIL',
          severity: 'MEDIUM',
          summary: `Build artifact directory '${item.value.directoryName ?? 'build'}' is very large at ${gb.toFixed(1)} GB (threshold >= 20 GB).`,
          evidenceItems: [item],
          details: { directory: item.value.directoryName ?? '', sizeGB: gb },
        }),
      };
    }

    if (gb >= 5) {
      return {
        ruleId: 'cache.build.artifact.large',
        status: 'WARN',
        finding: buildFinding(cache002BuildArtifactLarge.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Build artifact directory '${item.value.directoryName ?? 'build'}' is elevated at ${gb.toFixed(1)} GB (threshold >= 5 GB).`,
          evidenceItems: [item],
          details: { directory: item.value.directoryName ?? '', sizeGB: gb },
        }),
      };
    }

    return {
      ruleId: 'cache.build.artifact.large',
      status: 'PASS',
      finding: buildFinding(cache002BuildArtifactLarge.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Build artifact directory size is within normal limits (${gb.toFixed(1)} GB).`,
        evidenceItems: [item],
      }),
    };
  },
};

export const cacheRules: readonly DiagnosticRule[] = Object.freeze([
  cache001StorageLarge,
  cache002BuildArtifactLarge,
]);
