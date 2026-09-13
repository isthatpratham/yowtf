import { describe, it, expect } from 'vitest';
import { isValidRuleId, parseRuleId } from '../../src/domain/rule-id.js';

describe('Domain - Rule ID', () => {
  it('validates 2-segment dot-separated Rule IDs', () => {
    expect(isValidRuleId('system.memory')).toBe(true);
    expect(isValidRuleId('disk.space')).toBe(true);
    expect(isValidRuleId('git.clean')).toBe(true);
  });

  it('validates 3-segment dot-separated Rule IDs', () => {
    expect(isValidRuleId('system.memory.pressure')).toBe(true);
    expect(isValidRuleId('runtime.node.unpinned')).toBe(true);
    expect(isValidRuleId('git.working-tree.dirty')).toBe(true);
    expect(isValidRuleId('disk.space.low')).toBe(true);
  });

  it('validates multi-segment subjects (4+ segments)', () => {
    expect(isValidRuleId('runtime.node.engine.mismatch')).toBe(true);
    expect(isValidRuleId('tool.docker.daemon.down')).toBe(true);
  });

  it('parses valid Rule IDs into component parts', () => {
    const parsedTwo = parseRuleId('system.memory');
    expect(parsedTwo).toEqual({
      category: 'system',
      segments: ['memory'],
      condition: 'memory',
    });

    const parsedThree = parseRuleId('runtime.node.unpinned');
    expect(parsedThree).toEqual({
      category: 'runtime',
      segments: ['node', 'unpinned'],
      subject: 'node',
      condition: 'unpinned',
    });

    const parsedFour = parseRuleId('tool.docker.daemon.down');
    expect(parsedFour).toEqual({
      category: 'tool',
      segments: ['docker', 'daemon', 'down'],
      subject: 'docker.daemon',
      condition: 'down',
    });
  });

  it('rejects invalid Rule IDs', () => {
    expect(isValidRuleId('System.Memory.Pressure')).toBe(false); // Uppercase rejected
    expect(isValidRuleId('system')).toBe(false); // Single segment without dot
    expect(isValidRuleId('system..pressure')).toBe(false); // Empty token / consecutive dots
    expect(isValidRuleId('system.memory.')).toBe(false); // Trailing dot
    expect(isValidRuleId('.system.memory')).toBe(false); // Leading dot
    expect(isValidRuleId('system memory pressure')).toBe(false); // Spaces
    expect(isValidRuleId('')).toBe(false);
    expect(parseRuleId('invalid')).toBeNull();
  });
});
