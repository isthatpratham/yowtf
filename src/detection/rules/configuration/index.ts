import type { SyncDiagnosticRule, DiagnosticRule, DetectionContext } from '../../types.js';
import type { EvidenceItem } from '../../../domain/evidence.js';
import type { RuleEvaluation } from '../../../domain/rules/rule-definition.js';
import { buildFinding, findEvidence } from '../utils.js';

/**
 * CFG-001: Expected Environment Configuration Missing
 * Reference: docs/RULE-CATALOGUE.md Section 26
 */
export const cfg001EnvFileMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'config.environment.file.missing',
    name: 'Expected Environment Configuration Missing',
    category: 'config',
    description:
      'Identify a project that explicitly documents or structurally requires an environment configuration file that is absent.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    applicability: ['Only when the project explicitly indicates that the file is expected.'],
    requiredEvidence: ['config.environment.file'],
    explanation: 'An expected environment configuration file (e.g. .env) is missing.',
    remediationHint:
      'Copy .env.example or create the expected .env file with necessary configurations.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence<{ isExpected?: boolean }>(evidence, 'config.environment.file');
    return Boolean(item && item.value?.isExpected);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      isExpected?: boolean;
      isPresent?: boolean;
      expectedFileName?: string;
    }>(evidence, 'config.environment.file');

    if (!item || !item.value?.isExpected) {
      return {
        ruleId: 'config.environment.file.missing',
        status: 'SKIPPED',
      };
    }

    if (item.value.isPresent === false) {
      return {
        ruleId: 'config.environment.file.missing',
        status: 'WARN',
        finding: buildFinding(cfg001EnvFileMissing.metadata, {
          status: 'WARN',
          severity: 'MEDIUM',
          summary: `Expected environment configuration file '${item.value.expectedFileName ?? '.env'}' is missing.`,
          evidenceItems: [item],
          details: { expectedFile: item.value.expectedFileName ?? '.env' },
        }),
      };
    }

    return {
      ruleId: 'config.environment.file.missing',
      status: 'PASS',
      finding: buildFinding(cfg001EnvFileMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: `Expected environment configuration file '${item.value.expectedFileName ?? '.env'}' is present.`,
        evidenceItems: [item],
      }),
    };
  },
};

/**
 * CFG-002: Required Configuration Metadata Missing
 * Reference: docs/RULE-CATALOGUE.md Section 26
 */
export const cfg002RequiredValueMissing: SyncDiagnosticRule = {
  metadata: {
    id: 'config.required.value.missing',
    name: 'Required Configuration Metadata Missing',
    category: 'config',
    description:
      'Identify an explicitly required configuration key whose presence can be safely checked without exposing its value.',
    severity: 'HIGH',
    confidence: 'HIGH',
    applicability: ['Only when the project explicitly defines the required key.'],
    requiredEvidence: ['config.required.keys'],
    explanation: 'An explicitly required configuration key or environment variable is missing.',
    remediationHint:
      'Define the missing required configuration key in your environment or configuration file.',
  },
  isApplicable(_context: DetectionContext, evidence: readonly EvidenceItem[]): boolean {
    const item = findEvidence<{ requiredKeys?: readonly string[] }>(
      evidence,
      'config.required.keys',
    );
    return Boolean(item && (item.value?.requiredKeys?.length ?? 0) > 0);
  },
  evaluate(_context: DetectionContext, evidence: readonly EvidenceItem[]): RuleEvaluation {
    const item = findEvidence<{
      requiredKeys?: readonly string[];
      missingKeys?: readonly string[];
    }>(evidence, 'config.required.keys');

    if (!item || !item.value?.requiredKeys || item.value.requiredKeys.length === 0) {
      return {
        ruleId: 'config.required.value.missing',
        status: 'SKIPPED',
      };
    }

    const missing = item.value.missingKeys ?? [];
    if (missing.length > 0) {
      return {
        ruleId: 'config.required.value.missing',
        status: 'FAIL',
        finding: buildFinding(cfg002RequiredValueMissing.metadata, {
          status: 'FAIL',
          severity: 'HIGH',
          summary: `Required configuration key(s) missing: ${missing.join(', ')}.`,
          evidenceItems: [item],
          details: { missingCount: missing.length, missingKeys: missing },
        }),
      };
    }

    return {
      ruleId: 'config.required.value.missing',
      status: 'PASS',
      finding: buildFinding(cfg002RequiredValueMissing.metadata, {
        status: 'PASS',
        severity: 'INFO',
        summary: 'All explicitly required configuration keys are present.',
        evidenceItems: [item],
      }),
    };
  },
};

export const configRules: readonly DiagnosticRule[] = Object.freeze([
  cfg001EnvFileMissing,
  cfg002RequiredValueMissing,
]);
