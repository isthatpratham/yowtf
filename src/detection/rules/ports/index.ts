import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

export interface PortListener {
  readonly port: number;
  readonly address: string;
  readonly pid?: number;
  readonly processName?: string;
  readonly hasConflict?: boolean;
  readonly isDuplicate?: boolean;
  readonly ownerKnown?: boolean;
}

/**
 * PORT-001: Development Port Conflict
 * Reference: docs/RULE-CATALOGUE.md Section 16
 */
export const port001DevConflict: SyncDiagnosticRule = {
  metadata: {
    id: 'port.development.conflict',
    name: 'Development Port Conflict',
    category: 'port',
    description: 'Identify a known development port already occupied by another process.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable when active port listeners are inspected.'],
    requiredEvidence: ['port.listeners'],
    explanation: 'Explain which process currently occupies the relevant development port.',
    remediationHint: 'Inspect the owning process and project configuration.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'port.listeners');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      listeners?: readonly PortListener[];
      conflicts?: readonly PortListener[];
    }>(evidence, 'port.listeners');
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'port.development.conflict',
        status: 'UNAVAILABLE',
        finding: buildFinding(port001DevConflict.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Port listener information is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const conflicts =
      item.value.conflicts ?? item.value.listeners?.filter((l) => l.hasConflict) ?? [];
    if (conflicts.length > 0) {
      const first = conflicts[0];
      return {
        ruleId: 'port.development.conflict',
        status: 'WARN',
        finding: buildFinding(port001DevConflict.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Development port conflict detected on port ${first?.port} (occupied by '${first?.processName ?? 'PID ' + first?.pid}').`,
          evidenceItems: [item],
          details: {
            port: first?.port ?? 0,
            process: first?.processName ?? String(first?.pid ?? ''),
          },
        }),
      };
    }

    return {
      ruleId: 'port.development.conflict',
      status: 'PASS',
      finding: buildFinding(port001DevConflict.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No development port conflicts detected.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * PORT-002: Duplicate Listener Detection
 * Reference: docs/RULE-CATALOGUE.md Section 16
 */
export const port002DuplicateListener: SyncDiagnosticRule = {
  metadata: {
    id: 'port.duplicate.listener',
    name: 'Duplicate Listener Detection',
    category: 'port',
    description:
      'Identify multiple relevant listeners competing for the same expected endpoint where the operating system permits distinguishable bindings.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable when active port listeners are inspected.'],
    requiredEvidence: ['port.listeners'],
    explanation: 'Conflicting listeners are competing for the same endpoint.',
    remediationHint: 'Inspect listener bindings and project configuration.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'port.listeners');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      listeners?: readonly PortListener[];
      duplicates?: readonly PortListener[];
    }>(evidence, 'port.listeners');
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'port.duplicate.listener',
        status: 'UNAVAILABLE',
        finding: buildFinding(port002DuplicateListener.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Port listener information is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const duplicates =
      item.value.duplicates ?? item.value.listeners?.filter((l) => l.isDuplicate) ?? [];
    if (duplicates.length > 0) {
      const first = duplicates[0];
      return {
        ruleId: 'port.duplicate.listener',
        status: 'WARN',
        finding: buildFinding(port002DuplicateListener.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Duplicate listeners detected for port ${first?.port} on address '${first?.address}'.`,
          evidenceItems: [item],
          details: { port: first?.port ?? 0, address: first?.address ?? '' },
        }),
      };
    }

    return {
      ruleId: 'port.duplicate.listener',
      status: 'PASS',
      finding: buildFinding(port002DuplicateListener.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'No duplicate port listeners detected.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * PORT-003: Unexpected Local Port Exposure
 * Reference: docs/RULE-CATALOGUE.md Section 16
 */
export const port003UnexpectedExposure: SyncDiagnosticRule = {
  metadata: {
    id: 'port.unexpected.exposure',
    name: 'Unexpected Local Port Exposure',
    category: 'port',
    description:
      'Identify development-related services listening on a broad local interface when the project appears to expect local-only access.',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    applicability: ['Only when project/tool context provides an explicit local-only expectation.'],
    requiredEvidence: ['port.exposure'],
    explanation: 'A development service is listening beyond the expected local-only scope.',
    remediationHint: "Inspect the server's bind/listen configuration.",
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'port.exposure');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      isBroadlyExposed?: boolean;
      listenAddress?: string;
      port?: number;
    }>(evidence, 'port.exposure');
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'port.unexpected.exposure',
        status: 'SKIPPED',
      };
    }

    if (item.value.isBroadlyExposed) {
      return {
        ruleId: 'port.unexpected.exposure',
        status: 'WARN',
        finding: buildFinding(port003UnexpectedExposure.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Development service on port ${item.value.port} is exposed on broad address '${item.value.listenAddress ?? '0.0.0.0'}' instead of loopback.`,
          evidenceItems: [item],
          details: {
            port: item.value.port ?? 0,
            listenAddress: item.value.listenAddress ?? '0.0.0.0',
          },
        }),
      };
    }

    return {
      ruleId: 'port.unexpected.exposure',
      status: 'PASS',
      finding: buildFinding(port003UnexpectedExposure.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Development services are bound to local loopback interface as expected.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * PORT-004: Port Owner Unavailable
 * Reference: docs/RULE-CATALOGUE.md Section 16
 */
export const port004ProcessUnavailable: SyncDiagnosticRule = {
  metadata: {
    id: 'port.process.unavailable',
    name: 'Port Owner Unavailable',
    category: 'port',
    description: 'Represent a listening port for which the owning process cannot be identified.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['Applicable when listening ports are inspected.'],
    requiredEvidence: ['port.listeners'],
    explanation: 'The port is observable but ownership information could not be retrieved.',
    remediationHint: 'Inspect the port using platform-specific tools with appropriate permissions.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'port.listeners');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      listeners?: readonly PortListener[];
      hasUnidentifiedOwner?: boolean;
    }>(evidence, 'port.listeners');
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'port.process.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(port004ProcessUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Port ownership evidence could not be collected.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const hasUnknown =
      item.value.hasUnidentifiedOwner || item.value.listeners?.some((l) => l.ownerKnown === false);
    if (hasUnknown) {
      return {
        ruleId: 'port.process.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(port004ProcessUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary:
            'One or more listening ports have unidentifiable process owners (insufficient privileges).',
          evidenceItems: [item],
        }),
      };
    }

    return {
      ruleId: 'port.process.unavailable',
      status: 'PASS',
      finding: buildFinding(port004ProcessUnavailable.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'All observable port listeners have identified process owners.',
        evidenceItems: [item],
      }),
    };
  },
};

export const portRules: readonly DiagnosticRule[] = Object.freeze([
  port001DevConflict,
  port002DuplicateListener,
  port003UnexpectedExposure,
  port004ProcessUnavailable,
]);
