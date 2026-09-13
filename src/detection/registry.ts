import type { DetectionContext, DiagnosticRule, RuleRegistryInterface } from './types.js';
import { allV1Rules } from './rules/all.js';

/**
 * Deterministic Rule Registry for YOWTF.
 * Rejects duplicate rule IDs and preserves stable catalog order.
 * Reference: docs/DETECTION-ENGINE.md Section 39-40.
 */
export class DefaultRuleRegistry implements RuleRegistryInterface {
  private readonly rulesById = new Map<string, DiagnosticRule>();
  private readonly rulesOrder: DiagnosticRule[] = [];

  constructor(initialRules: readonly DiagnosticRule[] = []) {
    for (const rule of initialRules) {
      this.register(rule);
    }
  }

  public register(rule: DiagnosticRule): void {
    const id = rule.metadata.id;
    if (this.rulesById.has(id)) {
      throw new Error(`Duplicate rule registration: rule ID '${id}' is already registered.`);
    }
    this.rulesById.set(id, rule);
    this.rulesOrder.push(rule);
  }

  public get(ruleId: string): DiagnosticRule | undefined {
    return this.rulesById.get(ruleId);
  }

  public list(): readonly DiagnosticRule[] {
    return Object.freeze([...this.rulesOrder]);
  }

  public select(context?: DetectionContext): readonly DiagnosticRule[] {
    if (
      !context ||
      !context.commandScope ||
      context.commandScope === 'all' ||
      context.commandScope === 'doctor'
    ) {
      return this.list();
    }

    const scope = context.commandScope.toLowerCase();
    return Object.freeze(
      this.rulesOrder.filter((rule) => {
        // Match category directly or special scope matching
        if (rule.metadata.category === scope) {
          return true;
        }
        // Aliases from COMMANDS.md: 'deps' -> 'dependency', 'env' -> 'environment', 'ports' -> 'port', 'runtimes' -> 'runtime', 'tools' -> 'tool', 'paths' -> 'path', 'versions' -> 'version', 'caches' -> 'cache', 'clean' -> 'cache' | 'disk'
        if (scope === 'deps' && rule.metadata.category === 'dependency') return true;
        if (scope === 'env' && rule.metadata.category === 'environment') return true;
        if (scope === 'ports' && rule.metadata.category === 'port') return true;
        if (scope === 'runtimes' && rule.metadata.category === 'runtime') return true;
        if (scope === 'tools' && rule.metadata.category === 'tool') return true;
        if (scope === 'paths' && rule.metadata.category === 'path') return true;
        if (
          scope === 'versions' &&
          (rule.metadata.category === 'version' || rule.metadata.category === 'runtime')
        )
          return true;
        if (scope === 'caches' && rule.metadata.category === 'cache') return true;
        if (
          scope === 'clean' &&
          (rule.metadata.category === 'cache' || rule.metadata.category === 'disk')
        )
          return true;
        if (scope === 'processes' && rule.metadata.category === 'process') return true;

        return false;
      }),
    );
  }
}

/**
 * Creates a pre-populated rule registry containing all 60 authoritative V1 diagnostic rules.
 */
export function createDefaultRuleRegistry(): DefaultRuleRegistry {
  return new DefaultRuleRegistry(allV1Rules);
}
