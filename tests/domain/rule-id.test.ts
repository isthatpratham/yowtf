import { describe, it, expect } from 'vitest';
import { isValidRuleId, parseRuleId } from '../../src/domain/rule-id.js';

describe('Domain - Rule ID', () => {
  it('validates canonical 3-segment dot-separated Rule IDs', () => {
    expect(isValidRuleId('system.memory.pressure')).toBe(true);
    expect(isValidRuleId('runtime.node.unpinned')).toBe(true);
    expect(isValidRuleId('git.working-tree.dirty')).toBe(true);
    expect(isValidRuleId('disk.space.low')).toBe(true);
  });

  it('validates multi-segment subjects', () => {
    expect(isValidRuleId('runtime.node.engine.mismatch')).toBe(true);
  });

  it('parses valid Rule IDs into component parts', () => {
    const parsed = parseRuleId('runtime.node.unpinned');
    expect(parsed).toEqual({
      category: 'runtime',
      subject: 'node',
      condition: 'unpinned',
    });

    const parsedMulti = parseRuleId('tool.docker.daemon.down');
    expect(parsedMulti).toEqual({
      category: 'tool',
      subject: 'docker.daemon',
      condition: 'down',
    });
  });

  it('rejects invalid Rule IDs', () => {
    expect(isValidRuleId('System.Memory.Pressure')).toBe(false); // Uppercase rejected
    expect(isValidRuleId('system')).toBe(false); // Too few segments
    expect(isValidRuleId('system.memory')).toBe(false); // Too few segments
    expect(isValidRuleId('system..pressure')).toBe(false); // Empty token
    expect(isValidRuleId('system memory pressure')).toBe(false); // Spaces
    expect(isValidRuleId('')).toBe(false);
    expect(parseRuleId('invalid')).toBeNull();
  });
});
