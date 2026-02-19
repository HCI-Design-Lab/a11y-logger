import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

export const SENSITIVE_KEYS = ['ai_api_key'] as const;
export type SensitiveKey = (typeof SENSITIVE_KEYS)[number];

/**
 * Returns the 32-byte encryption key as a hex string (64 chars).
 * Priority: ENCRYPTION_SECRET env var > auto-generated file at ./data/.secret
 */
export function getEncryptionKey(): string {
  if (process.env.ENCRYPTION_SECRET) {
    const key = process.env.ENCRYPTION_SECRET;
    if (key.length !== 64) {
      throw new Error('ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)');
    }
    return key;
  }

  const secretPath = path.resolve('./data/.secret');
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }

  const generated = randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(secretPath), { recursive: true });
  fs.writeFileSync(secretPath, generated, { mode: 0o600 });
  console.warn('[a11y-logger] Generated new encryption key at ./data/.secret — keep this safe!');
  return generated;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 * Accepts an optional key override (used in tests).
 */
export function encrypt(plaintext: string, keyHex?: string): string {
  const key = Buffer.from(keyHex ?? getEncryptionKey(), 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

/**
 * Decrypts a value produced by encrypt().
 * Accepts an optional key override (used in tests).
 */
export function decrypt(ciphertext: string, keyHex?: string): string {
  const key = Buffer.from(keyHex ?? getEncryptionKey(), 'hex');
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * Detects whether a string was produced by encrypt() (iv:authTag:ciphertext format).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === 24 && parts[1].length === 32;
}
