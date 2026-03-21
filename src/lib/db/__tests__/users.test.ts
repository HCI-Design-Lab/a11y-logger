// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';
import { users } from '../schema';
import { getUsers, getUser, getUserByUsername, createUser, updateUser, deleteUser } from '../users';

function db() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

beforeAll(async () => {
  await initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  await db().delete(users);
});

describe('createUser', () => {
  it('inserts a user and returns it without password_hash', async () => {
    const user = await createUser({ username: 'alice', password: 'secure123', role: 'admin' });
    expect(user.id).toBeDefined();
    expect(user.username).toBe('alice');
    expect(user.role).toBe('admin');
    expect(user).not.toHaveProperty('password_hash');
  });

  it('defaults role to member', async () => {
    const user = await createUser({ username: 'bob', password: 'pass' });
    expect(user.role).toBe('member');
  });

  it('throws when username already exists', async () => {
    await createUser({ username: 'alice', password: 'pass' });
    await expect(createUser({ username: 'alice', password: 'pass' })).rejects.toThrow();
  });

  it('hashes the password (does not store plaintext)', async () => {
    await createUser({ username: 'carol', password: 'mypassword' });
    const rows = await db().select({ password_hash: users.password_hash }).from(users);
    const row = rows[0]!;
    expect(row.password_hash).not.toBe('mypassword');
    expect(row.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
  });
});

describe('getUsers', () => {
  it('returns empty array when no users exist', async () => {
    expect(await getUsers()).toEqual([]);
  });

  it('returns all users without password_hash', async () => {
    await createUser({ username: 'alice', password: 'pass' });
    await createUser({ username: 'bob', password: 'pass' });
    const allUsers = await getUsers();
    expect(allUsers).toHaveLength(2);
    allUsers.forEach((u) => expect(u).not.toHaveProperty('password_hash'));
  });
});

describe('getUser', () => {
  it('returns a user by id without password_hash', async () => {
    const created = await createUser({ username: 'alice', password: 'pass' });
    const found = await getUser(created.id);
    expect(found).not.toBeNull();
    expect(found!.username).toBe('alice');
    expect(found).not.toHaveProperty('password_hash');
  });

  it('returns null for non-existent id', async () => {
    expect(await getUser('nonexistent-id')).toBeNull();
  });
});

describe('getUserByUsername', () => {
  it('returns the full row including password_hash (for auth verification)', async () => {
    await createUser({ username: 'alice', password: 'secret' });
    const found = await getUserByUsername('alice');
    expect(found).not.toBeNull();
    expect(found!.password_hash).toBeDefined();
  });

  it('returns null when not found', async () => {
    expect(await getUserByUsername('nobody')).toBeNull();
  });
});

describe('updateUser', () => {
  it('updates the username', async () => {
    const created = await createUser({ username: 'alice', password: 'pass' });
    const updated = await updateUser(created.id, { username: 'alicia' });
    expect(updated!.username).toBe('alicia');
  });

  it('re-hashes the password when updated', async () => {
    const created = await createUser({ username: 'alice', password: 'old-pass' });
    await updateUser(created.id, { password: 'new-pass' });
    const rows = await db().select({ password_hash: users.password_hash }).from(users);
    const row = rows[0]!;
    expect(row.password_hash).toMatch(/^\$2[aby]\$/);
    // verify new password actually works
    const bcrypt = await import('bcryptjs');
    expect(await bcrypt.compare('new-pass', row.password_hash)).toBe(true);
  });

  it('returns null for non-existent id', async () => {
    expect(await updateUser('nonexistent', { username: 'x' })).toBeNull();
  });

  it('does not change untouched fields', async () => {
    const created = await createUser({ username: 'alice', password: 'pass', role: 'admin' });
    const updated = await updateUser(created.id, { username: 'alicia' });
    expect(updated!.role).toBe('admin');
  });
});

describe('deleteUser', () => {
  it('removes the user', async () => {
    const created = await createUser({ username: 'alice', password: 'pass' });
    await deleteUser(created.id);
    expect(await getUser(created.id)).toBeNull();
  });

  it('does not throw for non-existent id', async () => {
    await expect(deleteUser('nonexistent')).resolves.not.toThrow();
  });

  it('returns true when the user was deleted', async () => {
    const created = await createUser({ username: 'alice', password: 'pass' });
    expect(await deleteUser(created.id)).toBe(true);
  });

  it('returns false when user does not exist', async () => {
    expect(await deleteUser('nonexistent-id')).toBe(false);
  });
});
