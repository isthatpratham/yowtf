import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

/**
 * NET-001: Network Interface Information Unavailable
 * Reference: docs/RULE-CATALOGUE.md Section 17
 */
export const net001InterfaceUnavailable: SyncDiagnosticRule = {
  metadata: {
    id: 'network.interface.unavailable',
    name: 'Network Interface Information Unavailable',
    category: 'network',
    description: 'Represent inability to collect local network interface information.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['Applicable when inspecting local network interfaces.'],
    requiredEvidence: ['network.interfaces'],
    explanation: 'Network interface information could not be retrieved from the operating system.',
    remediationHint: 'Inspect operating system network adapter permissions.',
  },
  isApplicable(_context: DetectionContext, _evidence: readonly EvidenceItem[]): boolean {
    return true;
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence(evidence, 'network.interfaces');
    if (!item || item.availability !== 'AVAILABLE') {
      return {
        ruleId: 'network.interface.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(net001InterfaceUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Local network interface metadata is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    return {
      ruleId: 'network.interface.unavailable',
      status: 'PASS',
      finding: buildFinding(net001InterfaceUnavailable.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Network interface metadata is available.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * NET-002: DNS Configuration Missing
 * Reference: docs/RULE-CATALOGUE.md Section 17
 */
export const net002DnsMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'network.dns.configuration.missing',
    name: 'DNS Configuration Missing',
    category: 'network',
    description:
      'Identify a local network configuration with no usable DNS server information where the platform exposes such configuration.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Applicable when network configuration is inspected.'],
    requiredEvidence: ['network.dns'],
    explanation: 'DNS configuration may prevent developer tools from resolving hostnames.',
    remediationHint: 'Inspect active network adapter DNS configuration.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence(evidence, 'network.dns');
    return Boolean(item && item.availability === 'AVAILABLE');
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{ servers?: readonly string[]; hasUsableDns?: boolean }>(
      evidence,
      'network.dns',
    );
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'network.dns.configuration.missing',
        status: 'UNAVAILABLE',
        finding: buildFinding(net002DnsMissing.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'DNS configuration evidence is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    const hasDns =
      item.value.hasUsableDns !== false && item.value.servers && item.value.servers.length > 0;
    if (!hasDns) {
      return {
        ruleId: 'network.dns.configuration.missing',
        status: 'WARN',
        finding: buildFinding(net002DnsMissing.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: 'No usable DNS servers configured on active network adapters.',
          evidenceItems: [item],
        }),
      };
    }

    return {
      ruleId: 'network.dns.configuration.missing',
      status: 'PASS',
      finding: buildFinding(net002DnsMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Usable DNS servers are configured.',
        evidenceItems: [item],
        details: { serverCount: item.value.servers?.length ?? 0 },
      }),
    };
  },
};

/**
 * NET-003: Suspicious Proxy Configuration
 * Reference: docs/RULE-CATALOGUE.md Section 17
 */
export const net003ProxySuspicious: SyncDiagnosticRule = {
  metadata: {
    id: 'network.proxy.configuration.suspicious',
    name: 'Suspicious Proxy Configuration',
    category: 'network',
    description: 'Identify proxy configuration that appears incomplete or malformed.',
    severity: 'LOW',
    confidence: 'MEDIUM',
    applicability: ['Only when proxy configuration is explicitly present.'],
    requiredEvidence: ['network.proxy'],
    explanation: 'Proxy configuration appears incomplete or malformed.',
    remediationHint: 'Review system or environment proxy configuration settings.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence<{ isPresent?: boolean }>(evidence, 'network.proxy');
    return Boolean(item && item.availability === 'AVAILABLE' && item.value?.isPresent);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      isPresent?: boolean;
      isMalformed?: boolean;
      proxyVarName?: string;
    }>(evidence, 'network.proxy');
    if (!item || item.availability !== 'AVAILABLE' || !item.value) {
      return {
        ruleId: 'network.proxy.configuration.suspicious',
        status: 'SKIPPED',
      };
    }

    if (item.value.isMalformed) {
      return {
        ruleId: 'network.proxy.configuration.suspicious',
        status: 'WARN',
        finding: buildFinding(net003ProxySuspicious.metadata, {
          status: 'WARN',
          severity: 'LOW',
          summary: `Malformed or incomplete proxy configuration in variable '${item.value.proxyVarName ?? 'HTTP_PROXY'}'.`,
          evidenceItems: [item],
          details: { variable: item.value.proxyVarName ?? 'HTTP_PROXY' },
        }),
      };
    }

    return {
      ruleId: 'network.proxy.configuration.suspicious',
      status: 'PASS',
      finding: buildFinding(net003ProxySuspicious.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Proxy configuration format is valid.',
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * NET-004: Local Route Information Unavailable
 * Reference: docs/RULE-CATALOGUE.md Section 17
 */
export const net004RouteUnavailable: SyncDiagnosticRule = {
  metadata: {
    id: 'network.route.configuration.unavailable',
    name: 'Local Route Information Unavailable',
    category: 'network',
    description:
      'Represent inability to obtain local route information required by applicable network diagnostics.',
    severity: 'INFO',
    confidence: 'HIGH',
    applicability: ['Applicable when routing table diagnostics are required.'],
    requiredEvidence: ['network.routes'],
    explanation: 'Local route information could not be obtained.',
    remediationHint: 'Inspect operating system network route table permissions.',
  },
  isApplicable(_context: DetectionContext, _evidence: readonly EvidenceItem[]): boolean {
    return true;
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence(evidence, 'network.routes');
    if (!item || item.availability !== 'AVAILABLE') {
      return {
        ruleId: 'network.route.configuration.unavailable',
        status: 'UNAVAILABLE',
        finding: buildFinding(net004RouteUnavailable.metadata, {
          status: 'UNAVAILABLE',
          severity: 'INFO',
          summary: 'Local network routing table metadata is unavailable.',
          evidenceItems: item ? [item] : [],
        }),
      };
    }

    return {
      ruleId: 'network.route.configuration.unavailable',
      status: 'PASS',
      finding: buildFinding(net004RouteUnavailable.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'Local routing table information is available.',
        evidenceItems: [item],
      }),
    };
  },
};

export const networkRules: readonly DiagnosticRule[] = Object.freeze([
  net001InterfaceUnavailable,
  net002DnsMissing,
  net003ProxySuspicious,
  net004RouteUnavailable,
]);
