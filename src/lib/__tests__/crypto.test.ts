// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, SENSITIVE_KEYS, isEncrypted } from '../crypto';

const TEST_KEY = 'a'.repeat(64); // 32-byte key as 64 hex chars

describe('encrypt', () => {
  it('returns a string in the format iv:authTag:ciphertext', () => {
    const result = encrypt('my-secret', TEST_KEY);
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24); // 12-byte IV as 24 hex chars
    expect(parts[1]).toHaveLength(32); // 16-byte auth tag as 32 hex chars
  });

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const a = encrypt('same-value', TEST_KEY);
    const b = encrypt('same-value', TEST_KEY);
    expect(a).not.toBe(b);
  });
});

describe('decrypt', () => {
  it('round-trips correctly', () => {
    const encrypted = encrypt('sk-my-openai-key', TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe('sk-my-openai-key');
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('value', TEST_KEY);
    // XOR the last byte with 0x01 to guarantee it changes regardless of original value
    const lastByte = parseInt(encrypted.slice(-2), 16);
    const tampered = encrypted.slice(0, -2) + (lastByte ^ 0x01).toString(16).padStart(2, '0');
    expect(() => decrypt(tampered, TEST_KEY)).toThrow();
  });
});

describe('isEncrypted', () => {
  it('returns true for an encrypted value', () => {
    const encrypted = encrypt('test', TEST_KEY);
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('returns false for a plain string', () => {
    expect(isEncrypted('openai')).toBe(false);
    expect(isEncrypted('none')).toBe(false);
  });
});

describe('SENSITIVE_KEYS', () => {
  it('includes ai_api_key', () => {
    expect(SENSITIVE_KEYS).toContain('ai_api_key');
  });
});
