import bcrypt from 'bcryptjs';
import { getDb } from './index';
import type { CreateUserInput, UpdateUserInput } from '../validators/users';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

// Full row including password_hash — only for internal auth use
export interface UserWithHash extends User {
  password_hash: string;
}

const BCRYPT_ROUNDS = 12;

const SELECT_WITHOUT_HASH = `
  SELECT id, username, role, created_at, updated_at FROM users
`;

export function getUsers(): User[] {
  return getDb().prepare(`${SELECT_WITHOUT_HASH} ORDER BY created_at DESC`).all() as User[];
}

export function getUser(id: string): User | null {
  return (
    (getDb().prepare(`${SELECT_WITHOUT_HASH} WHERE id = ?`).get(id) as User | undefined) ?? null
  );
}

export function getUserByUsername(username: string): UserWithHash | null {
  return (
    (getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as
      | UserWithHash
      | undefined) ?? null
  );
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  getDb()
    .prepare(
      `INSERT INTO users (id, username, password_hash, role)
       VALUES (?, ?, ?, ?)`
    )
    .run(id, input.username, passwordHash, input.role ?? 'member');

  return getUser(id)!;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
  const existing = getUser(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.username !== undefined) {
    fields.push('username = ?');
    values.push(input.username);
  }

  if (input.password !== undefined) {
    fields.push('password_hash = ?');
    values.push(await bcrypt.hash(input.password, BCRYPT_ROUNDS));
  }

  if (input.role !== undefined) {
    fields.push('role = ?');
    values.push(input.role);
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  getDb()
    .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);

  return getUser(id);
}

export function deleteUser(id: string): boolean {
  const result = getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
}
