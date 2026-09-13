import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

export interface ProcessItem {
  readonly pid: number;
  readonly name: string;
  readonly cpuPercent?: number;
  readonly memoryPercent?: number;
  readonly state?: string; // 'Z' or 'defunct'
}

/**
 * PROC-001: Resource-Heavy Process
 * Reference: docs/RULE-CATALOGUE.md Section 15
 */
export const proc001ResourceHog: SyncDiagnosticRule = {
  metadata: {
    id: 'process.resource.hog',
    name: 'Resource-Heavy Process',
    category: 'process',
    description: 'Identify a process consuming unusually high CPU resources.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable when process CPU metrics are available.'],
    requiredEvidence: ['process.list'],
    explanation: 'A resource-heavy process may starve developer tools of CPU time.',
    remediationHint: 'Inspect whether the process is expected for the current workload.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'process.list');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ processes?: readonly ProcessItem[] }>(evidence, 'process.list');
    if (!item || item.availability !== 'AVAILABLE' || !item.value?.processes) {
      return {
        ruleId: 'process.resource.hog',
        status: 'UNAVAILABLE',
        finding: buildFinding(proc001ResourceHog.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Process CPU utilization metrics are unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const procs = item.value.processes;
    let maxProc: ProcessItem | undefined;
    for (const p of procs) {
      if (p.cpuPercent !== undefined) {
        if (!maxProc || p.cpuPercent > (maxProc.cpuPercent ?? 0)) {
          maxProc = p;
        }
      }
    }

    const maxCpu = maxProc?.cpuPercent ?? 0;
    if (maxCpu >= 95) {
      return {
        ruleId: 'process.resource.hog',
        status: 'FAIL',
        finding: buildFinding(proc001ResourceHog.metadata, {
          status: 'FAIL',
          severity: 'MEDIUM',
          summary: `Process '${maxProc?.name ?? 'unknown'}' (PID ${maxProc?.pid ?? 'unknown'}) is consuming ${maxCpu.toFixed(1)}% CPU (threshold >= 95%).`,
          evidenceItems: [item],
          details: { pid: maxProc?.pid ?? 0, name: maxProc?.name ?? '', cpuPercent: maxCpu },
        }),
      };
    }

    if (maxCpu >= 80) {
      return {
        ruleId: 'process.resource.hog',
        status: 'WARN',
        finding: buildFinding(proc001ResourceHog.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Process '${maxProc?.name ?? 'unknown'}' (PID ${maxProc?.pid ?? 'unknown'}) is consuming ${maxCpu.toFixed(1)}% CPU (threshold >= 80%).`,
          evidenceItems: [item],
          details: { pid: maxProc?.pid ?? 0, name: maxProc?.name ?? '', cpuPercent: maxCpu },
        }),
      };
    }

    return {
      ruleId: 'process.resource.hog',
      status: 'PASS',
      finding: buildFinding(proc001ResourceHog.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No process is consuming excessive CPU resources.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * PROC-002: Memory-Heavy Process
 * Reference: docs/RULE-CATALOGUE.md Section 15
 */
export const proc002MemoryHog: SyncDiagnosticRule = {
  metadata: {
    id: 'process.memory.hog',
    name: 'Memory-Heavy Process',
    category: 'process',
    description: 'Identify a process consuming unusually high memory.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable when process memory metrics are available.'],
    requiredEvidence: ['process.list'],
    explanation: 'The identified process is consuming substantial system memory.',
    remediationHint:
      'Inspect whether the process is expected and whether its workload can be reduced.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'process.list');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ processes?: readonly ProcessItem[] }>(evidence, 'process.list');
    if (!item || item.availability !== 'AVAILABLE' || !item.value?.processes) {
      return {
        ruleId: 'process.memory.hog',
        status: 'UNAVAILABLE',
        finding: buildFinding(proc002MemoryHog.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Process memory metrics are unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const procs = item.value.processes;
    let maxProc: ProcessItem | undefined;
    for (const p of procs) {
      if (p.memoryPercent !== undefined) {
        if (!maxProc || p.memoryPercent > (maxProc.memoryPercent ?? 0)) {
          maxProc = p;
        }
      }
    }

    const maxMem = maxProc?.memoryPercent ?? 0;
    if (maxMem >= 20) {
      return {
        ruleId: 'process.memory.hog',
        status: 'FAIL',
        finding: buildFinding(proc002MemoryHog.metadata, {
          status: 'FAIL',
          severity: 'MEDIUM',
          summary: `Process '${maxProc?.name ?? 'unknown'}' (PID ${maxProc?.pid ?? 'unknown'}) is consuming ${maxMem.toFixed(1)}% of system memory (threshold >= 20%).`,
          evidenceItems: [item],
          details: { pid: maxProc?.pid ?? 0, name: maxProc?.name ?? '', memoryPercent: maxMem },
        }),
      };
    }

    if (maxMem >= 10) {
      return {
        ruleId: 'process.memory.hog',
        status: 'WARN',
        finding: buildFinding(proc002MemoryHog.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Process '${maxProc?.name ?? 'unknown'}' (PID ${maxProc?.pid ?? 'unknown'}) is consuming ${maxMem.toFixed(1)}% of system memory (threshold >= 10%).`,
          evidenceItems: [item],
          details: { pid: maxProc?.pid ?? 0, name: maxProc?.name ?? '', memoryPercent: maxMem },
        }),
      };
    }

    return {
      ruleId: 'process.memory.hog',
      status: 'PASS',
      finding: buildFinding(proc002MemoryHog.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No process is consuming excessive system memory.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * PROC-003: Zombie/Defunct Development Process
 * Reference: docs/RULE-CATALOGUE.md Section 15
 */
export const proc003Zombie: SyncDiagnosticRule = {
  metadata: {
    id: 'process.development.zombie',
    name: 'Zombie/Defunct Development Process',
    category: 'process',
    description: 'Identify defunct/zombie processes associated with development workflows.',
    severity: 'LOW',
    confidence: 'HIGH',
    applicability: [
      'Linux where reliable process state is available. Non-Linux platforms return SKIPPED.',
    ],
    requiredEvidence: ['process.list'],
    explanation: 'A defunct process remains in the process table.',
    remediationHint: 'Inspect the parent process and the development tool that created it.',
  },
  isApplicable(context: DetectionContext, _evidence: readonly EvidenceItem[]): boolean {
    return context.platform === 'linux';
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ processes?: readonly ProcessItem[] }>(evidence, 'process.list');
    if (!item || item.availability !== 'AVAILABLE' || !item.value?.processes) {
      return {
        ruleId: 'process.development.zombie',
        status: 'UNAVAILABLE',
        finding: buildFinding(proc003Zombie.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Process state information is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const zombies = item.value.processes.filter(
      (p) => p.state === 'Z' || p.state === 'defunct' || p.name.includes('<defunct>'),
    );

    if (zombies.length > 0) {
      return {
        ruleId: 'process.development.zombie',
        status: 'WARN',
        finding: buildFinding(proc003Zombie.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Detected ${zombies.length} defunct/zombie process(es) in the system process table.`,
          evidenceItems: [item],
          details: { zombieCount: zombies.length, pids: zombies.map((z) => String(z.pid)) },
        }),
      };
    }

    return {
      ruleId: 'process.development.zombie',
      status: 'PASS',
      finding: buildFinding(proc003Zombie.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No defunct or zombie development processes detected.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * PROC-004: Duplicate Development Process
 * Reference: docs/RULE-CATALOGUE.md Section 15
 */
export const proc004Duplicate: SyncDiagnosticRule = {
  metadata: {
    id: 'process.development.duplicate',
    name: 'Duplicate Development Process',
    category: 'process',
    description:
      'Identify unusually duplicated development processes that may indicate accidental duplicate servers/watchers.',
    severity: 'LOW',
    confidence: 'MEDIUM',
    applicability: ['Only for explicitly recognized development process patterns.'],
    requiredEvidence: ['process.list'],
    explanation: 'Multiple instances of a development process were detected.',
    remediationHint: 'Inspect whether the duplicate instances are intentional.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'process.list');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      processes?: readonly ProcessItem[];
      duplicateDevProcesses?: readonly string[];
    }>(evidence, 'process.list');
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'process.development.duplicate',
        status: 'UNAVAILABLE',
        finding: buildFinding(proc004Duplicate.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Process list evidence is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    // Check for explicit duplicate dev processes or duplicate dev process names
    const duplicates = item.value.duplicateDevProcesses ?? [];
    if (duplicates.length > 0) {
      return {
        ruleId: 'process.development.duplicate',
        status: 'WARN',
        finding: buildFinding(proc004Duplicate.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Detected duplicate development processes: ${duplicates.join(', ')}.`,
          evidenceItems: [item],
          details: { duplicates },
        }),
      };
    }

    return {
      ruleId: 'process.development.duplicate',
      status: 'PASS',
      finding: buildFinding(proc004Duplicate.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No duplicate development processes detected.',
        evidenceItems: [item],
      }),
    };
  },
};

export const processRules: readonly DiagnosticRule[] = Object.freeze([
  proc001ResourceHog,
  proc002MemoryHog,
  proc003Zombie,
  proc004Duplicate,
]);
