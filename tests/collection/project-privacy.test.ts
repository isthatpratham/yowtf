import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectCollector } from '../../src/collection/project/project-collector.js';
import { resolvePlatformAdapter } from '../../src/platform/detector.js';

describe('Collection - Project Privacy Invariants', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yowtf-privacy-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('detects .env file presence without exposing secret values in evidence', async () => {
    // Write a .env file containing sensitive credentials
    const secretContent = [
      'DATABASE_PASSWORD=super_secret_db_password_123!',
      'JWT_SECRET=ultra_confidential_jwt_signing_key_456',
      'STRIPE_SECRET_KEY=sk_live_very_secret_stripe_token_789',
    ].join('\n');

    await fs.writeFile(path.join(tmpDir, '.env'), secretContent, 'utf8');
    await fs.writeFile(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'privacy-app' }),
      'utf8',
    );

    const collector = new ProjectCollector();
    const adapter = resolvePlatformAdapter();

    const evidenceSet = await collector.collect({
      cwd: tmpDir,
      platformAdapter: adapter,
    });

    const serialized = JSON.stringify(evidenceSet);

    // Verify .env file is detected by name in config
    const configItem = evidenceSet.items.find((i) => i.key === 'project.config');
    expect(configItem).toBeDefined();
    const configValue = configItem?.value as {
      configFiles: Array<{ name: string; category: string }>;
    };
    expect(configValue.configFiles.some((c) => c.name === '.env')).toBe(true);

    // CRITICAL: Verify secret values are nowhere in the serialized evidence
    expect(serialized).not.toContain('super_secret_db_password_123!');
    expect(serialized).not.toContain('ultra_confidential_jwt_signing_key_456');
    expect(serialized).not.toContain('sk_live_very_secret_stripe_token_789');
    expect(serialized).not.toContain('DATABASE_PASSWORD');
    expect(serialized).not.toContain('JWT_SECRET');
  });
});
