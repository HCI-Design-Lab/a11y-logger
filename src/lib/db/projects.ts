import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { projects, assessments, issues } from './schema';
import type * as sqliteSchema from './schema';
import type { CreateProjectInput, UpdateProjectInput } from '../validators/projects';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  product_url: string | null;
  status: 'active' | 'archived';
  settings: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithCounts extends Project {
  assessment_count: number;
  issue_count: number;
}

export async function getProject(id: string): Promise<Project | null> {
  const rows = await db().select().from(projects).where(eq(projects.id, id)).limit(1);
  return (rows[0] as Project) ?? null;
}

export async function getProjects(): Promise<ProjectWithCounts[]> {
  const rows = await db()
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      product_url: projects.product_url,
      status: projects.status,
      settings: projects.settings,
      created_by: projects.created_by,
      created_at: projects.created_at,
      updated_at: projects.updated_at,
      assessment_count: sql<number>`COUNT(DISTINCT ${assessments.id})`.as('assessment_count'),
      issue_count: sql<number>`COUNT(DISTINCT ${issues.id})`.as('issue_count'),
    })
    .from(projects)
    .leftJoin(assessments, eq(assessments.project_id, projects.id))
    .leftJoin(issues, eq(issues.assessment_id, assessments.id))
    .groupBy(projects.id)
    .orderBy(sql`${projects.created_at} DESC`);
  return rows as ProjectWithCounts[];
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db()
    .insert(projects)
    .values({
      id,
      name: input.name,
      description: input.description ?? null,
      product_url: input.product_url ?? null,
      status: (input.status ?? 'active') as 'active' | 'archived',
      created_at: now,
      updated_at: now,
    });
  return (await getProject(id))!;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const existing = await getProject(id);
  if (!existing) return null;

  type ProjectUpdate = Partial<
    Pick<typeof projects.$inferInsert, 'name' | 'description' | 'product_url' | 'status'>
  >;
  const values: ProjectUpdate = {};
  if (input.name !== undefined) values.name = input.name;
  if (input.description !== undefined) values.description = input.description;
  if (input.product_url !== undefined) values.product_url = input.product_url;
  if (input.status !== undefined) values.status = input.status;

  if (Object.keys(values).length === 0) return existing;

  db()
    .update(projects)
    .set({ ...values, updated_at: new Date().toISOString() })
    .where(eq(projects.id, id))
    .run();
  return getProject(id);
}

export async function deleteProject(id: string): Promise<boolean> {
  const existing = await getProject(id);
  if (!existing) return false;
  await db().delete(projects).where(eq(projects.id, id));
  return true;
}

export async function archiveProject(id: string): Promise<Project | null> {
  return updateProject(id, { status: 'archived' });
}
