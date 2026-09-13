import { describe, it, expect } from 'vitest';
import {
  DIAGNOSTIC_CATEGORIES,
  CANONICAL_DIAGNOSTIC_CATEGORIES,
  isDiagnosticCategory,
} from '../../src/domain/category.js';

describe('Domain - DiagnosticCategory', () => {
  it('defines the 15 canonical diagnostic categories', () => {
    const expected = [
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
    ];
    expect(DIAGNOSTIC_CATEGORIES).toEqual(expected);
    expect(CANONICAL_DIAGNOSTIC_CATEGORIES).toEqual(expected);
  });

  it('validates canonical categories with isDiagnosticCategory', () => {
    for (const cat of DIAGNOSTIC_CATEGORIES) {
      expect(isDiagnosticCategory(cat)).toBe(true);
    }
  });

  it('strictly rejects non-canonical categories, plural forms, and aliases', () => {
    expect(isDiagnosticCategory('processes')).toBe(false);
    expect(isDiagnosticCategory('ports')).toBe(false);
    expect(isDiagnosticCategory('env')).toBe(false);
    expect(isDiagnosticCategory('runtimes')).toBe(false);
    expect(isDiagnosticCategory('tools')).toBe(false);
    expect(isDiagnosticCategory('paths')).toBe(false);
    expect(isDiagnosticCategory('versions')).toBe(false);
    expect(isDiagnosticCategory('dependencies')).toBe(false);
    expect(isDiagnosticCategory('configuration')).toBe(false);
    expect(isDiagnosticCategory('caches')).toBe(false);
    expect(isDiagnosticCategory('database')).toBe(false);
    expect(isDiagnosticCategory('ai')).toBe(false);
    expect(isDiagnosticCategory('cloud')).toBe(false);
  });

  it('is case-sensitive and rejects uppercase/whitespace variants', () => {
    expect(isDiagnosticCategory('System')).toBe(false);
    expect(isDiagnosticCategory('  system  ')).toBe(false);
    expect(isDiagnosticCategory('')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isDiagnosticCategory(null)).toBe(false);
    expect(isDiagnosticCategory(undefined)).toBe(false);
    expect(isDiagnosticCategory(123)).toBe(false);
    expect(isDiagnosticCategory({})).toBe(false);
  });
});
