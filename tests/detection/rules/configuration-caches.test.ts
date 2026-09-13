import { describe, expect, it } from 'vitest';
import {
  cfg001EnvFileMissing,
  cfg002RequiredValueMissing,
} from '../../../src/detection/rules/configuration/index.js';
import {
  cache001StorageLarge,
  cache002BuildArtifactLarge,
} from '../../../src/detection/rules/caches/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Configuration & Cache Rules', () => {
  describe('CFG-001: config.environment.file.missing', () => {
    it('warns when expected environment file is missing', () => {
      const missingEv: EvidenceItem[] = [
        {
          key: 'config.environment.file',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isExpected: true, isPresent: false, expectedFileName: '.env' },
        },
      ];
      expect(cfg001EnvFileMissing.isApplicable({}, missingEv)).toBe(true);
      expect(cfg001EnvFileMissing.evaluate({}, missingEv).status).toBe('WARN');

      const presentEv: EvidenceItem[] = [
        {
          key: 'config.environment.file',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isExpected: true, isPresent: true, expectedFileName: '.env' },
        },
      ];
      expect(cfg001EnvFileMissing.evaluate({}, presentEv).status).toBe('PASS');
    });
  });

  describe('CFG-002: config.required.value.missing', () => {
    it('fails when required configuration keys are missing and never exposes secret values', () => {
      const missingEv: EvidenceItem[] = [
        {
          key: 'config.required.keys',
          source: 'test',
          availability: 'AVAILABLE',
          value: { requiredKeys: ['PORT', 'DATABASE_URL'], missingKeys: ['DATABASE_URL'] },
        },
      ];
      expect(cfg002RequiredValueMissing.isApplicable({}, missingEv)).toBe(true);
      const res = cfg002RequiredValueMissing.evaluate({}, missingEv);
      expect(res.status).toBe('FAIL');
      expect(res.finding?.summary).toContain('DATABASE_URL');
    });
  });

  describe('CACHE-001: cache.storage.large', () => {
    it('evaluates cache thresholds: <10GB PASS, 10-49.9GB WARN, >=50GB FAIL', () => {
      const ONE_GB = 1024 * 1024 * 1024;
      const makeEv = (gb: number): EvidenceItem[] => [
        {
          key: 'cache.developer.storage',
          source: 'test',
          availability: 'AVAILABLE',
          value: { cacheName: 'npm-cache', sizeBytes: gb * ONE_GB },
        },
      ];

      expect(cache001StorageLarge.isApplicable({}, makeEv(5))).toBe(true);
      expect(cache001StorageLarge.evaluate({}, makeEv(9.9)).status).toBe('PASS');
      expect(cache001StorageLarge.evaluate({}, makeEv(10.0)).status).toBe('WARN');
      expect(cache001StorageLarge.evaluate({}, makeEv(49.9)).status).toBe('WARN');
      expect(cache001StorageLarge.evaluate({}, makeEv(50.0)).status).toBe('FAIL');
    });
  });

  describe('CACHE-002: cache.build.artifact.large', () => {
    it('evaluates build artifact thresholds: <5GB PASS, 5-19.9GB WARN, >=20GB FAIL', () => {
      const ONE_GB = 1024 * 1024 * 1024;
      const makeEv = (gb: number): EvidenceItem[] => [
        {
          key: 'cache.build.artifacts',
          source: 'test',
          availability: 'AVAILABLE',
          value: { directoryName: 'dist', sizeBytes: gb * ONE_GB },
        },
      ];

      expect(cache002BuildArtifactLarge.isApplicable({}, makeEv(2))).toBe(true);
      expect(cache002BuildArtifactLarge.evaluate({}, makeEv(4.9)).status).toBe('PASS');
      expect(cache002BuildArtifactLarge.evaluate({}, makeEv(5.0)).status).toBe('WARN');
      expect(cache002BuildArtifactLarge.evaluate({}, makeEv(19.9)).status).toBe('WARN');
      expect(cache002BuildArtifactLarge.evaluate({}, makeEv(20.0)).status).toBe('FAIL');
    });
  });
});
