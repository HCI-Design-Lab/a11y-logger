import { getDb } from './index';
import { encrypt, decrypt, SENSITIVE_KEYS, isEncrypted } from '../crypto';

type SettingValue = string | number | boolean | null;

interface SettingRow {
  key: string;
  value: string; // JSON-serialized
}

const DEFAULT_SETTINGS: Record<string, SettingValue> = {
  ai_provider: 'none',
  ai_api_key: '',
  media_directory: './data/media',
  auth_enabled: false,
  app_version: '1.0.0',
  schema_version: 1,
};

function isSensitiveKey(key: string): key is (typeof SENSITIVE_KEYS)[number] {
  return (SENSITIVE_KEYS as readonly string[]).includes(key);
}

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

export function setSetting(key: string, value: SettingValue): void {
  let stored: SettingValue = value;

  if (isSensitiveKey(key) && typeof value === 'string' && value !== '') {
    stored = encrypt(value);
  }

  getDb()
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run(key, JSON.stringify(stored));
}

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

export function deleteSetting(key: string): void {
  getDb().prepare('DELETE FROM settings WHERE key = ?').run(key);
}

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
