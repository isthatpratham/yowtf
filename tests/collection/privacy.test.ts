import { describe, it, expect } from 'vitest';
import { SystemCollector } from '../../src/collection/system/system-collector.js';
import { resolvePlatformAdapter } from '../../src/platform/detector.js';

describe('Collection - Privacy Invariants', () => {
  it('does not casually expose sensitive environment variables or secrets in collected evidence', async () => {
    const collector = new SystemCollector();
    const adapter = resolvePlatformAdapter();

    const sensitiveEnv = {
      AWS_SECRET_ACCESS_KEY: 'super-secret-aws-key-12345',
      GITHUB_TOKEN: 'ghp_secret_github_token_xyz',
      DATABASE_URL: 'postgres://user:password@localhost:5432/production',
      OPENAI_API_KEY: 'sk-secret-openai-api-key',
    };

    const evidenceSet = await collector.collect({
      cwd: process.cwd(),
      platformAdapter: adapter,
      env: sensitiveEnv,
    });

    const serialized = JSON.stringify(evidenceSet);

    for (const secretValue of Object.values(sensitiveEnv)) {
      expect(serialized).not.toContain(secretValue);
    }

    for (const secretKey of Object.keys(sensitiveEnv)) {
      expect(serialized).not.toContain(secretKey);
    }
  });
});
