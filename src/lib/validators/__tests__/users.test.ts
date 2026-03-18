import { describe, it, expect } from 'vitest';
import { LoginSchema } from '../users';

describe('LoginSchema', () => {
  it('accepts valid username and password', () => {
    const result = LoginSchema.safeParse({ username: 'admin', password: 'secret' });
    expect(result.success).toBe(true);
  });

  it('rejects empty username', () => {
    const result = LoginSchema.safeParse({ username: '', password: 'secret' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Username is required');
  });

  it('rejects empty password', () => {
    const result = LoginSchema.safeParse({ username: 'admin', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Password is required');
  });

  it('rejects missing username', () => {
    const result = LoginSchema.safeParse({ password: 'secret' });
    expect(result.success).toBe(false);
  });
});
