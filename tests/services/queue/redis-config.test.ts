// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('redis queue config', () => {
  const previousEnv = new Map<string, string | undefined>();
  let tempDir: string | null = null;

  afterEach(() => {
    for (const [key, value] of previousEnv.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    previousEnv.clear();
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  test('loads queue settings from settings file with env override precedence', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'claude-mem-redis-config-'));
    const settingsPath = join(tempDir, 'settings.json');
    writeFileSync(settingsPath, JSON.stringify({
      CLAUDE_MEM_QUEUE_ENGINE: 'bullmq',
      CLAUDE_MEM_REDIS_MODE: 'external',
      CLAUDE_MEM_REDIS_HOST: 'settings-host',
      CLAUDE_MEM_REDIS_PORT: '6381',
      CLAUDE_MEM_REDIS_URL: '',
      CLAUDE_MEM_QUEUE_REDIS_PREFIX: 'settings-prefix',
    }), 'utf-8');

    // Set env var to point to our test settings file
    setEnv('CLAUDE_MEM_DATA_DIR', tempDir);
    setEnv('CLAUDE_MEM_REDIS_HOST', 'env-host');

    const { getRedisQueueConfig, getObservationQueueEngineName } = await import('../../../src/server/queue/redis-config.js');

    expect(getObservationQueueEngineName()).toBe('bullmq');
    const config = getRedisQueueConfig();
    expect(config.host).toBe('env-host');
    expect(config.port).toBe(6381);
    expect(config.prefix).toBe('settings-prefix');
  });

  function setEnv(key: string, value: string): void {
    if (!previousEnv.has(key)) {
      previousEnv.set(key, process.env[key]);
    }
    process.env[key] = value;
  }
});
