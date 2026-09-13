import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

/**
 * DISK-001: Low Disk Space
 * Reference: docs/RULE-CATALOGUE.md Section 14
 */
export const disk001SpaceLow: SyncDiagnosticRule = {
  metadata: {
    id: 'disk.space.low',
    name: 'Low Disk Space',
    category: 'disk',
    description: 'Identify low available disk space.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Applicable when disk space metrics are available.'],
    requiredEvidence: ['disk.space'],
    explanation:
      'Low free space can affect builds, package managers, caches, logs, and operating-system behavior.',
    remediationHint: 'Inspect large files, build artifacts, and developer caches.',
  },
  isApplicable(_context: DetectionContext, _evidence: readonly EvidenceItem[]): boolean {
    return true;
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      freePercent?: number;
      availableBytes?: number;
      totalBytes?: number;
    }>(evidence, 'disk.space');
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'disk.space.low',
        status: 'UNAVAILABLE',
        finding: buildFinding(disk001SpaceLow.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Disk space information could not be retrieved.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    let freePct = item.value.freePercent;
    if (
      freePct === undefined &&
      item.value.availableBytes !== undefined &&
      item.value.totalBytes !== undefined &&
      item.value.totalBytes > 0
    ) {
      freePct = (item.value.availableBytes / item.value.totalBytes) * 100;
    }

    if (freePct === undefined) {
      return {
        ruleId: 'disk.space.low',
        status: 'UNAVAILABLE',
        finding: buildFinding(disk001SpaceLow.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Free disk space percentage could not be determined.',
          evidenceItems: [item],
        }),
      };
    }

    if (freePct < 10) {
      return {
        ruleId: 'disk.space.low',
        status: 'FAIL',
        finding: buildFinding(disk001SpaceLow.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: `Critically low disk space: ${freePct.toFixed(1)}% free (threshold < 10%).`,
          evidenceItems: [item],
          details: { freePercent: freePct },
        }),
      };
    }

    if (freePct < 15) {
      return {
        ruleId: 'disk.space.low',
        status: 'WARN',
        finding: buildFinding(disk001SpaceLow.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Low disk space warning: ${freePct.toFixed(1)}% free (threshold 10%–14.9%).`,
          evidenceItems: [item],
          details: { freePercent: freePct },
        }),
      };
    }

    return {
      ruleId: 'disk.space.low',
      status: 'PASS',
      finding: buildFinding(disk001SpaceLow.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Sufficient free disk space available: ${freePct.toFixed(1)}% free.`,
        evidenceItems: [item],
        details: { freePercent: freePct },
      }),
    };
  },
};

/**
 * DISK-002: Developer Storage Pressure
 * Reference: docs/RULE-CATALOGUE.md Section 14
 */
export const disk002DeveloperStoragePressure: SyncDiagnosticRule = {
  metadata: {
    id: 'disk.developer-storage.pressure',
    name: 'Developer Storage Pressure',
    category: 'disk',
    description: 'Identify excessive storage consumption by known developer-related directories.',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    applicability: ['Only when supported developer locations can be identified safely.'],
    requiredEvidence: ['disk.developer-storage'],
    explanation: 'Developer artifacts are consuming substantial local storage.',
    remediationHint: 'Review cleanup candidates before deleting anything.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'disk.developer-storage');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ totalBytes?: number; sizeGB?: number }>(
      evidence,
      'disk.developer-storage',
    );
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'disk.developer-storage.pressure',
        status: 'UNAVAILABLE',
        finding: buildFinding(disk002DeveloperStoragePressure.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Developer storage size evidence is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const ONE_GB = 1024 * 1024 * 1024;
    const bytes = item.value.totalBytes ?? (item.value.sizeGB ? item.value.sizeGB * ONE_GB : 0);
    const gb = bytes / ONE_GB;

    if (gb >= 50) {
      return {
        ruleId: 'disk.developer-storage.pressure',
        status: 'FAIL',
        finding: buildFinding(disk002DeveloperStoragePressure.metadata, {
          status: 'FAIL',
          severity: 'MEDIUM',
          summary: `Developer storage pressure is severe at ${gb.toFixed(1)} GB (threshold >= 50 GB).`,
          evidenceItems: [item],
          details: { sizeGB: gb },
        }),
      };
    }

    if (gb >= 20) {
      return {
        ruleId: 'disk.developer-storage.pressure',
        status: 'WARN',
        finding: buildFinding(disk002DeveloperStoragePressure.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Developer storage is elevated at ${gb.toFixed(1)} GB (threshold >= 20 GB).`,
          evidenceItems: [item],
          details: { sizeGB: gb },
        }),
      };
    }

    return {
      ruleId: 'disk.developer-storage.pressure',
      status: 'PASS',
      finding: buildFinding(disk002DeveloperStoragePressure.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Developer storage is within normal limits (${gb.toFixed(1)} GB).`,
        evidenceItems: [item],
        details: { sizeGB: gb },
      }),
    };
  },
};

/**
 * DISK-003: Project Storage Location Unavailable
 * Reference: docs/RULE-CATALOGUE.md Section 14
 */
export const disk003ProjectLocationUnavailable: SyncDiagnosticRule = {
  metadata: {
    id: 'disk.project.location.unavailable',
    name: 'Project Storage Location Unavailable',
    category: 'disk',
    description:
      'Identify when the project target cannot be inspected because its storage location is unavailable.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['Applicable when evaluating target project path.'],
    requiredEvidence: ['project.root'],
    explanation: 'YOWTF could not inspect the target path.',
    remediationHint: 'Check path existence and permissions.',
  },
  isApplicable(_context: DetectionContext, _evidence: readonly EvidenceItem[]): boolean {
    return true;
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const rootItem = findEvidence<{ isProject?: boolean; rootPath?: string }>(
      evidence,
      'project.root',
    );
    const diskLoc = findEvidence<{ accessible?: boolean }>(evidence, 'disk.project.location');

    const isFailed =
      rootItem?.availability === 'FAILED' ||
      diskLoc?.availability === 'FAILED' ||
      diskLoc?.value?.accessible === false;
    if (isFailed) {
      return {
        ruleId: 'disk.project.location.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(disk003ProjectLocationUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Project target location is inaccessible or does not exist.',
          evidenceItems: rootItem ? [rootItem] : diskLoc ? [diskLoc] : [],
        }),
      };
    }

    return {
      ruleId: 'disk.project.location.unavailable',
      status: 'PASS',
      finding: buildFinding(disk003ProjectLocationUnavailable.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Project storage location is accessible.',
        evidenceItems: rootItem ? [rootItem] : [],
      }),
    };
  },
};

/**
 * DISK-004: Read-Only Project Filesystem
 * Reference: docs/RULE-CATALOGUE.md Section 14
 */
export const disk004FilesystemReadonly: SyncDiagnosticRule = {
  metadata: {
    id: 'disk.filesystem.readonly',
    name: 'Read-Only Project Filesystem',
    category: 'disk',
    description:
      'Identify when the project filesystem is read-only where this can affect normal development workflows.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Only when reliable read-only filesystem information is available.'],
    requiredEvidence: ['disk.filesystem'],
    explanation:
      'A read-only project location can prevent tools from creating builds, dependencies, generated files, or other expected development artifacts.',
    remediationHint: 'Inspect filesystem permissions and mount configuration.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'disk.filesystem');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ isReadOnly?: boolean; writable?: boolean }>(
      evidence,
      'disk.filesystem',
    );
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'disk.filesystem.readonly',
        status: 'SKIPPED',
      };
    }

    const isReadOnly = item.value.isReadOnly === true || item.value.writable === false;
    if (isReadOnly) {
      return {
        ruleId: 'disk.filesystem.readonly',
        status: 'WARN',
        finding: buildFinding(disk004FilesystemReadonly.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: 'The project filesystem is mounted as read-only.',
          evidenceItems: [item],
          details: { isReadOnly: true },
        }),
      };
    }

    return {
      ruleId: 'disk.filesystem.readonly',
      status: 'PASS',
      finding: buildFinding(disk004FilesystemReadonly.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'The project filesystem is writable.',
        evidenceItems: [item],
        details: { isReadOnly: false },
      }),
    };
  },
};

export const diskRules: readonly DiagnosticRule[] = Object.freeze([
  disk001SpaceLow,
  disk002DeveloperStoragePressure,
  disk003ProjectLocationUnavailable,
  disk004FilesystemReadonly,
]);
