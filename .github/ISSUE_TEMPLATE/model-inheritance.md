# Feature Request: Model Inheritance for Local LM Studio Users

## Problem Description

When using claude-mem with locally-hosted models via LM Studio (or similar local inference servers), the plugin's hardcoded `CLAUDE_MEM_MODEL` setting causes issues:

1. **Auto-loading unwanted models**: Every time an observer session is spawned, claude-mem explicitly requests a specific model (e.g., `qwen/qwen3.6-35b-a3b`). LM Studio sees this request and auto-loads that model into memory.

2. **Memory pressure**: Large models (30GB+) are loaded unnecessarily, even when the user's parent Claude Code session is using a different/smaller model.

3. **Inflexible workflow**: Users who want to switch between models in their parent session find that claude-mem observer sessions keep triggering loads of the hardcoded model.

### Root Cause

The issue stems from two places:

1. **`src/shared/SettingsDefaultsManager.ts`** (line 79):
   ```typescript
   CLAUDE_MEM_MODEL: 'claude-haiku-4-5-20251001',
   ```
   This hardcoded default means even new installations get a specific model.

2. **User settings** (`~/.claude-mem/settings.json`):
   Once set, this value persists and is used for every observer session.

### Why This Happens

When claude-mem spawns an observer session via the Anthropic SDK:
```typescript
const modelId = session.modelOverride || this.getModelId();
```

The `modelId` is explicitly passed to LM Studio's API. LM Studio then auto-loads that specific model if not already in memory — regardless of what model the parent Claude Code session is using.

## Proposed Solution

### Change Default Behavior

Change `CLAUDE_MEM_MODEL` default from a hardcoded model to an **empty string**, signaling "inherit from parent session":

```typescript
// Before
CLAUDE_MEM_MODEL: 'claude-haiku-4-5-20251001',

// After  
CLAUDE_MEM_MODEL: '', // Empty by default — inherits model from parent session
```

### How It Works

When `CLAUDE_MEM_MODEL` is empty:
- Observer sessions don't explicitly request a specific model
- LM Studio uses whatever model is currently active/loaded (the parent session's model)
- No unnecessary model switching or memory pressure

Users who want explicit control can still set `CLAUDE_MEM_MODEL` to a specific value.

### Benefits

1. **Respects user workflow**: Local hosting users often switch models based on task complexity
2. **Reduces memory pressure**: No auto-loading of large models unnecessarily  
3. **Backward compatible**: Users with explicit `CLAUDE_MEM_MODEL` settings unaffected
4. **Better defaults**: Empty default is more neutral than assuming a specific cloud model

## Testing

Added test suite in `tests/model-inheritance.test.ts`:
- Verifies empty string returned when `CLAUDE_MEM_MODEL` not set
- Verifies explicit model used when `CLAUDE_MEM_MODEL` is configured
- All tests pass with the proposed change

## Migration Path

Existing users with hardcoded models in settings will continue to work as before. The change only affects:
1. New installations (get empty default instead of hardcoded cloud model)
2. Users who manually clear their `CLAUDE_MEM_MODEL` setting

---

**Related**: This change makes claude-mem more friendly to local inference setups while maintaining full functionality for cloud API users.
