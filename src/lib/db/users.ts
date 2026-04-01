import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { users } from './schema';
import type * as sqliteSchema from './schema';
import type { CreateUserInput, UpdateUserInput } from '../validators/users';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

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

/**
 * Retrieves all users ordered by creation date ascending, excluding password hashes.
 *
 * @returns Array of user records with id, username, role, and timestamps.
 */
export async function getUsers(): Promise<User[]> {
  const rows = await db()
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      created_at: users.created_at,
      updated_at: users.updated_at,
    })
    .from(users)
    .orderBy(users.created_at);
  return rows as User[];
}

/**
 * Retrieves a single user by their ID, excluding the password hash.
 *
 * @param id - The UUID of the user to retrieve.
 * @returns The user record, or null if not found.
 */
export async function getUser(id: string): Promise<User | null> {
  const rows = await db()
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      created_at: users.created_at,
      updated_at: users.updated_at,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return (rows[0] as User) ?? null;
}

/**
 * Retrieves a user by username, including the password hash for authentication purposes.
 * Do not expose the returned record to API responses.
 *
 * @param username - The exact username to look up.
 * @returns The full user record including password_hash, or null if not found.
 */
export async function getUserByUsername(username: string): Promise<UserWithHash | null> {
  const rows = await db().select().from(users).where(eq(users.username, username)).limit(1);
  return (rows[0] as UserWithHash) ?? null;
}

/**
 * Creates a new user with a bcrypt-hashed password.
 *
 * @param input - Validated user creation payload including username, password (plaintext), and optional role.
 * @returns The newly created user record excluding the password hash.
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  await db()
    .insert(users)
    .values({
      id,
      username: input.username,
      password_hash: passwordHash,
      role: (input.role ?? 'member') as 'admin' | 'member',
      created_at: now,
      updated_at: now,
    });

  return (await getUser(id))!;
}

/**
 * Updates an existing user's username, password, and/or role.
 * Passwords are re-hashed with bcrypt before storage.
 *
 * @param id - The UUID of the user to update.
 * @param input - Partial update payload; only provided fields are written.
 * @returns The updated user record excluding the password hash, or null if not found.
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
  const existing = await getUser(id);
  if (!existing) return null;

  type UserUpdate = Partial<Pick<typeof users.$inferInsert, 'username' | 'password_hash' | 'role'>>;
  const values: UserUpdate = {};

  if (input.username !== undefined) values.username = input.username;
  if (input.password !== undefined) {
    values.password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  }
  if (input.role !== undefined) values.role = input.role;

  if (Object.keys(values).length === 0) return existing;

  db()
    .update(users)
    .set({ ...values, updated_at: new Date().toISOString() })
    .where(eq(users.id, id))
    .run();

  return getUser(id);
}

/**
 * Permanently deletes a user.
 *
 * @param id - The UUID of the user to delete.
 * @returns True if the user was deleted, false if not found.
 */
export async function deleteUser(id: string): Promise<boolean> {
  const result = db().delete(users).where(eq(users.id, id)).run();
  return result.changes > 0;
}
