import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

/**
 * SYS-001: High Memory Pressure
 * Reference: docs/RULE-CATALOGUE.md Section 13
 */
export const sys001MemoryPressure: SyncDiagnosticRule = {
  metadata: {
    id: 'system.memory.pressure',
    name: 'High Memory Pressure',
    category: 'system',
    description:
      'Identify unusually high current memory utilization that may affect developer workload stability.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Applicable when memory metrics can be collected.'],
    requiredEvidence: ['system.memory'],
    explanation:
      'Sustained high memory utilization can cause slowdowns, swapping, or application instability.',
    remediationHint: 'Inspect memory-heavy applications and current developer workloads.',
  },
  isApplicable(_context: DetectionContext, _evidence: readonly EvidenceItem[]): boolean {
    return true;
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ utilizationPercent?: number }>(evidence, 'system.memory');
    if (
      !item ||
      item.availability !== 'AVAILABLE' ||
      !item.value ||
      item.value.utilizationPercent === undefined
    ) {
      return {
        ruleId: 'system.memory.pressure',
        status: 'UNAVAILABLE',
        finding: buildFinding(sys001MemoryPressure.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Memory metrics could not be collected from the operating system.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const util = item.value.utilizationPercent;
    if (util >= 90) {
      return {
        ruleId: 'system.memory.pressure',
        status: 'FAIL',
        finding: buildFinding(sys001MemoryPressure.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: `System memory utilization is critical at ${util.toFixed(1)}% (threshold >= 90%).`,
          evidenceItems: [item],
          details: { utilizationPercent: util },
        }),
      };
    }

    if (util >= 80) {
      return {
        ruleId: 'system.memory.pressure',
        status: 'WARN',
        finding: buildFinding(sys001MemoryPressure.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `System memory utilization is elevated at ${util.toFixed(1)}% (threshold >= 80%).`,
          evidenceItems: [item],
          details: { utilizationPercent: util },
        }),
      };
    }

    return {
      ruleId: 'system.memory.pressure',
      status: 'PASS',
      finding: buildFinding(sys001MemoryPressure.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `System memory utilization is healthy at ${util.toFixed(1)}%.`,
        evidenceItems: [item],
        details: { utilizationPercent: util },
      }),
    };
  },
};

/**
 * SYS-002: High CPU Pressure
 * Reference: docs/RULE-CATALOGUE.md Section 13
 */
export const sys002CpuPressure: SyncDiagnosticRule = {
  metadata: {
    id: 'system.cpu.pressure',
    name: 'High CPU Pressure',
    category: 'system',
    description:
      'Identify sustained/high current CPU utilization that may affect developer workflows.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Applicable when CPU utilization can be collected.'],
    requiredEvidence: ['system.cpu'],
    explanation:
      'High CPU utilization may indicate a compute-heavy workload competing with development tools.',
    remediationHint: 'Inspect resource-heavy processes.',
  },
  isApplicable(_context: DetectionContext, _evidence: readonly EvidenceItem[]): boolean {
    return true;
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ utilizationPercent?: number }>(evidence, 'system.cpu');
    if (
      !item ||
      item.availability !== 'AVAILABLE' ||
      !item.value ||
      item.value.utilizationPercent === undefined
    ) {
      return {
        ruleId: 'system.cpu.pressure',
        status: 'UNAVAILABLE',
        finding: buildFinding(sys002CpuPressure.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'CPU utilization metrics could not be collected.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const util = item.value.utilizationPercent;
    if (util >= 95) {
      return {
        ruleId: 'system.cpu.pressure',
        status: 'FAIL',
        finding: buildFinding(sys002CpuPressure.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: `System CPU utilization is critically high at ${util.toFixed(1)}% (threshold >= 95%).`,
          evidenceItems: [item],
          details: { utilizationPercent: util },
        }),
      };
    }

    if (util >= 85) {
      return {
        ruleId: 'system.cpu.pressure',
        status: 'WARN',
        finding: buildFinding(sys002CpuPressure.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `System CPU utilization is elevated at ${util.toFixed(1)}% (threshold >= 85%).`,
          evidenceItems: [item],
          details: { utilizationPercent: util },
        }),
      };
    }

    return {
      ruleId: 'system.cpu.pressure',
      status: 'PASS',
      finding: buildFinding(sys002CpuPressure.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `System CPU utilization is normal at ${util.toFixed(1)}%.`,
        evidenceItems: [item],
        details: { utilizationPercent: util },
      }),
    };
  },
};

/**
 * SYS-003: Recently Restarted System
 * Reference: docs/RULE-CATALOGUE.md Section 13
 */
export const sys003UptimeShort: SyncDiagnosticRule = {
  metadata: {
    id: 'system.uptime.short',
    name: 'Recently Restarted System',
    category: 'system',
    description: 'Identify systems that have been running for a very short period.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: ['Applicable when uptime is available.'],
    requiredEvidence: ['system.uptime'],
    explanation:
      'A recently restarted workstation may have background services and development tools that have not fully returned to their normal operating state.',
    remediationHint:
      'Allow normal services and development tools to initialize before interpreting transient issues.',
  },
  isApplicable(_context: DetectionContext, _evidence: readonly EvidenceItem[]): boolean {
    return true;
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<number>(evidence, 'system.uptime');
    if (!item || item.availability !== 'AVAILABLE' || item.value === undefined) {
      return {
        ruleId: 'system.uptime.short',
        status: 'UNAVAILABLE',
        finding: buildFinding(sys003UptimeShort.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'System uptime information is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const uptimeSeconds = Number(item.value);
    const oneHour = 3600;
    if (uptimeSeconds < oneHour) {
      const minutes = Math.floor(uptimeSeconds / 60);
      return {
        ruleId: 'system.uptime.short',
        status: 'WARN',
        finding: buildFinding(sys003UptimeShort.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `System was restarted recently (uptime: ${minutes}m, threshold < 60m).`,
          evidenceItems: [item],
          details: { uptimeSeconds },
        }),
      };
    }

    return {
      ruleId: 'system.uptime.short',
      status: 'PASS',
      finding: buildFinding(sys003UptimeShort.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `System uptime is sufficient (${Math.floor(uptimeSeconds / 3600)}h).`,
        evidenceItems: [item],
        details: { uptimeSeconds },
      }),
    };
  },
};

/**
 * SYS-004: Architecture Mismatch
 * Reference: docs/RULE-CATALOGUE.md Section 13
 */
export const sys004ArchitectureMismatch: SyncDiagnosticRule = {
  metadata: {
    id: 'system.architecture.mismatch',
    name: 'Architecture Mismatch',
    category: 'system',
    description:
      'Identify a relevant mismatch between detected operating-system architecture and an explicitly required project/runtime architecture.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Only when an explicit architecture requirement exists.'],
    requiredEvidence: ['system.architecture'],
    explanation:
      'Architecture mismatch can prevent native modules and executables from running correctly.',
    remediationHint:
      "Inspect the project's architecture requirements and installed runtime/tool architecture.",
  },
  isApplicable(context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const req =
      context.targetArchitecture ??
      findEvidence<{ targetArch?: string }>(evidence, 'project.architecture')?.value?.targetArch;
    return Boolean(req);
  },
  evaluate(context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const expectedArch =
      context.targetArchitecture ??
      findEvidence<{ targetArch?: string }>(evidence, 'project.architecture')?.value?.targetArch;
    if (!expectedArch) {
      return {
        ruleId: 'system.architecture.mismatch',
        status: 'SKIPPED',
      };
    }

    const item = findEvidence<{ arch?: string }>(evidence, 'system.architecture');
    if (!item || item.availability !== 'AVAILABLE' || !item.value?.arch) {
      return {
        ruleId: 'system.architecture.mismatch',
        status: 'UNAVAILABLE',
        finding: buildFinding(sys004ArchitectureMismatch.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'System architecture information is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const actualArch = item.value.arch;
    if (actualArch !== expectedArch) {
      return {
        ruleId: 'system.architecture.mismatch',
        status: 'FAIL',
        finding: buildFinding(sys004ArchitectureMismatch.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: `System architecture '${actualArch}' does not match required architecture '${expectedArch}'.`,
          evidenceItems: [item],
          details: { actualArch, expectedArch },
        }),
      };
    }

    return {
      ruleId: 'system.architecture.mismatch',
      status: 'PASS',
      finding: buildFinding(sys004ArchitectureMismatch.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `System architecture '${actualArch}' matches required architecture '${expectedArch}'.`,
        evidenceItems: [item],
        details: { actualArch, expectedArch },
      }),
    };
  },
};

/**
 * SYS-005: Supported Operating System
 * Reference: docs/RULE-CATALOGUE.md Section 13
 */
export const sys005PlatformSupported: SyncDiagnosticRule = {
  metadata: {
    id: 'system.platform.supported',
    name: 'Supported Operating System',
    category: 'system',
    description: 'Determine whether YOWTF is running on a supported operating system.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['All runtime platforms; evaluates against YOWTF supported platform list.'],
    requiredEvidence: ['system.platform.supported'],
    explanation:
      'Identify whether the current operating system has official V1 diagnostic support.',
    remediationHint: 'Run YOWTF on a supported platform for full diagnostics.',
  },
  isApplicable(_context: DetectionContext, _evidence: readonly EvidenceItem[]): boolean {
    return true;
  },
  evaluate(context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ platform?: string; isSupported?: boolean }>(
      evidence,
      'system.platform.supported',
    );
    const plat = item?.value?.platform ?? context.platform;
    const isSupported =
      item?.value?.isSupported ?? (plat === 'win32' || plat === 'darwin' || plat === 'linux');

    if (isSupported) {
      return {
        ruleId: 'system.platform.supported',
        status: 'PASS',
        finding: buildFinding(sys005PlatformSupported.metadata, {
          status: 'PASS',
          severity: 'INFO',
          summary: `Operating system '${plat ?? 'unknown'}' is supported.`,
          evidenceItems: item ? [item] : [],
          details: { platform: plat ?? 'unknown' },
        }),
      };
    }

    return {
      ruleId: 'system.platform.supported',
      status: 'UNAVAILABLE',
      finding: buildFinding(sys005PlatformSupported.metadata, {
        status: 'UNAVAILABLE',
        severity: 'INFO',
        summary: `Operating system '${plat ?? 'unknown'}' is not officially supported in V1.`,
        evidenceItems: item ? [item] : [],
        details: { platform: plat ?? 'unknown' },
      }),
    };
  },
};

export const systemRules: readonly DiagnosticRule[] = Object.freeze([
  sys001MemoryPressure,
  sys002CpuPressure,
  sys003UptimeShort,
  sys004ArchitectureMismatch,
  sys005PlatformSupported,
]);
