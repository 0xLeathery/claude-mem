import { describe, it, expect } from 'bun:test';
import * as fs from 'fs';

/**
 * Test: Model Inheritance for Local LM Studio Users
 *
 * Issue: When using claude-mem with locally-hosted models via LM Studio,
 * the plugin's hardcoded CLAUDE_MEM_MODEL setting causes LM Studio to
 * auto-load a specific model on every observer session, even if the user
 * wants to use whatever model is currently active.
 *
 * Expected behavior: When CLAUDE_MEM_MODEL is not explicitly set or is empty,
 * return an empty string so the parent session's model is inherited.
 */
describe('model-inheritance', () => {
  const testSettingsPath = '/tmp/test-claude-mem-settings.json';

  describe('getModelId fallback behavior', () => {
    it('should return empty string when CLAUDE_MEM_MODEL is not set (inherit from parent)', async () => {
      // Write test settings without CLAUDE_MEM_MODEL
      fs.writeFileSync(testSettingsPath, JSON.stringify({}));

      // Import SettingsDefaultsManager and check the behavior
      const { SettingsDefaultsManager } = await import('../src/shared/SettingsDefaultsManager.js');
      const settings = SettingsDefaultsManager.loadFromFile(testSettingsPath);

      // When CLAUDE_MEM_MODEL is not set, it should be empty string (inherit from parent)
      expect(settings.CLAUDE_MEM_MODEL).toBe('');
    });

    it('should return empty string when CLAUDE_MEM_MODEL is explicitly empty (inherit from parent)', async () => {
      // Write test settings with empty CLAUDE_MEM_MODEL
      fs.writeFileSync(testSettingsPath, JSON.stringify({
        CLAUDE_MEM_MODEL: ''
      }));

      const { SettingsDefaultsManager } = await import('../src/shared/SettingsDefaultsManager.js');
      const settings = SettingsDefaultsManager.loadFromFile(testSettingsPath);

      // When CLAUDE_MEM_MODEL is empty, it should be an empty string
      expect(settings.CLAUDE_MEM_MODEL).toBe('');
    });

    it('should return explicit model when CLAUDE_MEM_MODEL is set', async () => {
      // Write test settings with an explicit model
      fs.writeFileSync(testSettingsPath, JSON.stringify({
        CLAUDE_MEM_MODEL: 'qwen/qwen3.6-35b-a3b'
      }));

      const { SettingsDefaultsManager } = await import('../src/shared/SettingsDefaultsManager.js');
      const settings = SettingsDefaultsManager.loadFromFile(testSettingsPath);

      // When CLAUDE_MEM_MODEL is explicitly set, use that value
      expect(settings.CLAUDE_MEM_MODEL).toBe('qwen/qwen3.6-35b-a3b');
    });
  });
});
