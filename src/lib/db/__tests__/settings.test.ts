// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import {
  getSetting,
  setSetting,
  getSettings,
  deleteSetting,
  seedDefaultSettings,
} from '../settings';

// Use a fixed encryption key so tests don't touch the filesystem
vi.stubEnv('ENCRYPTION_SECRET', 'a'.repeat(64));

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM settings').run();
});

describe('setSetting / getSetting', () => {
  it('stores and retrieves a string value', () => {
    setSetting('ai_provider', 'openai');
    expect(getSetting('ai_provider')).toBe('openai');
  });

  it('stores and retrieves a boolean value', () => {
    setSetting('auth_enabled', true);
    expect(getSetting('auth_enabled')).toBe(true);
  });

  it('stores and retrieves a numeric value', () => {
    setSetting('schema_version', 1);
    expect(getSetting('schema_version')).toBe(1);
  });

  it('upserts an existing key', () => {
    setSetting('ai_provider', 'openai');
    setSetting('ai_provider', 'anthropic');
    expect(getSetting('ai_provider')).toBe('anthropic');
  });

  it('returns null for a key that does not exist', () => {
    expect(getSetting('nonexistent')).toBeNull();
  });

  it('encrypts sensitive keys (ai_api_key stored as encrypted format)', () => {
    setSetting('ai_api_key', 'sk-test-123');
    const raw = getDb().prepare("SELECT value FROM settings WHERE key = 'ai_api_key'").get() as {
      value: string;
    };
    // Raw value should be JSON-stringified encrypted string, not the plain key
    const stored = JSON.parse(raw.value);
    expect(stored).not.toBe('sk-test-123');
    expect(stored.split(':')).toHaveLength(3); // iv:authTag:ciphertext
  });

  it('decrypts sensitive keys on retrieval', () => {
    setSetting('ai_api_key', 'sk-test-456');
    expect(getSetting('ai_api_key')).toBe('sk-test-456');
  });
});

describe('getSettings', () => {
  it('returns an empty object when no settings exist', () => {
    expect(getSettings()).toEqual({});
  });

  it('returns all settings as a key-value map', () => {
    setSetting('ai_provider', 'openai');
    setSetting('auth_enabled', false);
    const all = getSettings();
    expect(all.ai_provider).toBe('openai');
    expect(all.auth_enabled).toBe(false);
  });

  it('redacts sensitive keys in the returned object', () => {
    setSetting('ai_api_key', 'sk-real-key');
    const all = getSettings();
    expect(all.ai_api_key).toBe('[REDACTED]');
  });
});

describe('deleteSetting', () => {
  it('removes the setting', () => {
    setSetting('ai_provider', 'openai');
    deleteSetting('ai_provider');
    expect(getSetting('ai_provider')).toBeNull();
  });

  it('does not throw when deleting a non-existent key', () => {
    expect(() => deleteSetting('nonexistent')).not.toThrow();
  });
});

describe('seedDefaultSettings', () => {
  it('seeds all default settings when none exist', () => {
    seedDefaultSettings();
    expect(getSetting('ai_provider')).toBe('none');
    expect(getSetting('auth_enabled')).toBe(false);
    expect(getSetting('media_directory')).toBe('./data/media');
  });

  it('does not overwrite existing settings', () => {
    setSetting('ai_provider', 'openai');
    seedDefaultSettings();
    expect(getSetting('ai_provider')).toBe('openai'); // not overwritten
  });

  it('seeds language setting with default value "en"', () => {
    seedDefaultSettings();
    expect(getSetting('language')).toBe('en');
  });
});
