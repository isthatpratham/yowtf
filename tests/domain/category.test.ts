import { describe, it, expect } from 'vitest';
import {
  CANONICAL_DIAGNOSTIC_CATEGORIES,
  isDiagnosticCategory,
  normalizeCategory,
} from '../../src/domain/category.js';

describe('Domain - DiagnosticCategory', () => {
  it('defines the 15 canonical diagnostic categories', () => {
    expect(CANONICAL_DIAGNOSTIC_CATEGORIES).toEqual([
      'system',
      'disk',
      'process',
      'port',
      'network',
      'environment',
      'runtime',
      'tool',
      'path',
      'version',
      'project',
      'dependency',
      'git',
      'config',
      'cache',
    ]);
  });

  it('validates canonical categories with isDiagnosticCategory', () => {
    for (const cat of CANONICAL_DIAGNOSTIC_CATEGORIES) {
      expect(isDiagnosticCategory(cat)).toBe(true);
    }
  });

  it('accepts and normalizes plural/short aliases', () => {
    expect(normalizeCategory('processes')).toBe('process');
    expect(normalizeCategory('ports')).toBe('port');
    expect(normalizeCategory('env')).toBe('environment');
    expect(normalizeCategory('runtimes')).toBe('runtime');
    expect(normalizeCategory('tools')).toBe('tool');
    expect(normalizeCategory('paths')).toBe('path');
    expect(normalizeCategory('versions')).toBe('version');
    expect(normalizeCategory('dependencies')).toBe('dependency');
    expect(normalizeCategory('configuration')).toBe('config');
    expect(normalizeCategory('caches')).toBe('cache');
  });

  it('handles case-insensitive and whitespace-padded category input', () => {
    expect(normalizeCategory('  SYSTEM  ')).toBe('system');
    expect(normalizeCategory('Runtimes')).toBe('runtime');
  });

  it('rejects unrecognized categories', () => {
    expect(isDiagnosticCategory('database')).toBe(false);
    expect(isDiagnosticCategory('ai')).toBe(false);
    expect(isDiagnosticCategory('cloud')).toBe(false);
    expect(normalizeCategory('cloud')).toBeNull();
  });
});
