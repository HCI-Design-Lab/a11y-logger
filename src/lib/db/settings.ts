import { getDb } from './index';
import { encrypt, decrypt, SENSITIVE_KEYS, isEncrypted } from '../crypto';

// NOTE: These functions use getDb() (better-sqlite3) rather than getDbClient() (Drizzle)
// because seedDefaultSettings() is called inside initDb() before the Drizzle client is
// initialized. The settings API routes call these functions only after initDb() completes,
// so the better-sqlite3 connection is always ready when a request arrives.

type SettingValue = string | number | boolean | null;

interface SettingRow {
  key: string;
  value: string; // JSON-serialized
}

const DEFAULT_SETTINGS: Record<string, SettingValue> = {
  ai_provider: 'none',
  ai_api_key: '',
  ai_model: '',
  ai_base_url: '',
  media_directory: './data/media',
  auth_enabled: false,
  app_version: '1.0.0',
  schema_version: 1,
  language: 'en',
};

function isSensitiveKey(key: string): key is (typeof SENSITIVE_KEYS)[number] {
  return (SENSITIVE_KEYS as readonly string[]).includes(key);
}

/**
 * Retrieves a single setting value by key, automatically decrypting sensitive keys (e.g. API keys).
 *
 * @param key - The settings key to retrieve.
 * @returns The parsed setting value, or null if the key does not exist or parsing fails.
 */
export function getSetting(key: string): SettingValue {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | SettingRow
    | undefined;

  if (!row) return null;

  let parsed: SettingValue;
  try {
    parsed = JSON.parse(row.value) as SettingValue;
  } catch {
    return null;
  }

  if (isSensitiveKey(key) && typeof parsed === 'string' && isEncrypted(parsed)) {
    return decrypt(parsed);
  }

  return parsed;
}

/**
 * Persists a setting value, automatically encrypting sensitive keys (e.g. API keys) before storage.
 *
 * @param key - The settings key to write.
 * @param value - The value to store; will be JSON-serialized.
 */
export function setSetting(key: string, value: SettingValue): void {
  let stored: SettingValue = value;

  if (isSensitiveKey(key) && typeof value === 'string' && value !== '') {
    stored = encrypt(value);
  }

  getDb()
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run(key, JSON.stringify(stored));
}

/**
 * Retrieves all settings as a key-value map. Sensitive keys are returned as '[REDACTED]'.
 *
 * @returns Object mapping setting keys to their values, with sensitive fields redacted.
 */
export function getSettings(): Record<string, SettingValue> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as SettingRow[];
  const result: Record<string, SettingValue> = {};

  for (const row of rows) {
    let parsed: SettingValue;
    try {
      parsed = JSON.parse(row.value) as SettingValue;
    } catch {
      continue;
    }

    if (isSensitiveKey(row.key)) {
      result[row.key] = '[REDACTED]';
    } else {
      result[row.key] = parsed;
    }
  }

  return result;
}

/**
 * Removes a setting from the database by key.
 *
 * @param key - The settings key to delete.
 */
export function deleteSetting(key: string): void {
  getDb().prepare('DELETE FROM settings WHERE key = ?').run(key);
}

/**
 * Inserts default setting values for any keys not already present in the settings table.
 * Called during database initialization to ensure required settings always exist.
 */
export function seedDefaultSettings(): void {
  const db = getDb();
  const existing = new Set(
    (db.prepare('SELECT key FROM settings').all() as { key: string }[]).map((r) => r.key)
  );

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!existing.has(key)) {
      setSetting(key, value);
    }
  }
}
