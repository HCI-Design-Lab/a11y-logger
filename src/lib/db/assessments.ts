import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { getDbClient } from './client';
import { assessments, issues, projects } from './schema';
import type * as sqliteSchema from './schema';
import type { CreateAssessmentInput, UpdateAssessmentInput } from '../validators/assessments';

// Cast helper: the union type BetterSQLite3Database | PostgresJsDatabase does not
// share callable overloads in TypeScript, so we cast to the SQLite type for query building.
// At runtime the correct driver is used transparently by Drizzle.
function db(): BetterSQLite3Database<typeof sqliteSchema> {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

export interface Assessment {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  test_date_start: string | null;
  test_date_end: string | null;
  status: 'ready' | 'in_progress' | 'completed';
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentWithCounts extends Assessment {
  issue_count: number;
}

export interface AssessmentWithProject extends AssessmentWithCounts {
  project_name: string;
}

export async function getAssessment(id: string): Promise<Assessment | null> {
  const rows = await db().select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return (rows[0] as Assessment) ?? null;
}

export async function getAssessments(projectId: string): Promise<AssessmentWithCounts[]> {
  const rows = await db()
    .select({
      id: assessments.id,
      project_id: assessments.project_id,
      name: assessments.name,
      description: assessments.description,
      test_date_start: assessments.test_date_start,
      test_date_end: assessments.test_date_end,
      status: assessments.status,
      assigned_to: assessments.assigned_to,
      created_by: assessments.created_by,
      created_at: assessments.created_at,
      updated_at: assessments.updated_at,
      issue_count: sql<number>`COUNT(DISTINCT ${issues.id})`.as('issue_count'),
    })
    .from(assessments)
    .leftJoin(issues, eq(issues.assessment_id, assessments.id))
    .where(eq(assessments.project_id, projectId))
    .groupBy(assessments.id)
    .orderBy(sql`${assessments.created_at} DESC`);
  return rows as AssessmentWithCounts[];
}

export async function createAssessment(
  projectId: string,
  input: CreateAssessmentInput
): Promise<Assessment> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db()
    .insert(assessments)
    .values({
      id,
      project_id: projectId,
      name: input.name,
      description: input.description ?? null,
      test_date_start: input.test_date_start ?? null,
      test_date_end: input.test_date_end ?? null,
      status: (input.status ?? 'ready') as 'ready' | 'in_progress' | 'completed',
      assigned_to: input.assigned_to ?? null,
      created_at: now,
      updated_at: now,
    });
  return (await getAssessment(id))!;
}

export async function updateAssessment(
  id: string,
  input: UpdateAssessmentInput
): Promise<Assessment | null> {
  const existing = await getAssessment(id);
  if (!existing) return null;

  type AssessmentUpdate = Partial<
    Pick<
      typeof assessments.$inferInsert,
      | 'name'
      | 'description'
      | 'test_date_start'
      | 'test_date_end'
      | 'status'
      | 'assigned_to'
      | 'project_id'
    >
  >;
  const values: AssessmentUpdate = {};
  if (input.name !== undefined) values.name = input.name;
  if (input.description !== undefined) values.description = input.description;
  if (input.test_date_start !== undefined) values.test_date_start = input.test_date_start;
  if (input.test_date_end !== undefined) values.test_date_end = input.test_date_end;
  if (input.status !== undefined) values.status = input.status;
  if (input.assigned_to !== undefined) values.assigned_to = input.assigned_to;
  if (input.project_id !== undefined) values.project_id = input.project_id;

  if (Object.keys(values).length === 0) return existing;

  db()
    .update(assessments)
    .set({ ...values, updated_at: new Date().toISOString() })
    .where(eq(assessments.id, id))
    .run();
  return getAssessment(id);
}

export async function deleteAssessment(id: string): Promise<boolean> {
  const existing = await getAssessment(id);
  if (!existing) return false;
  await db().delete(assessments).where(eq(assessments.id, id));
  return true;
}

export async function getAllAssessments(): Promise<AssessmentWithProject[]> {
  const rows = await db()
    .select({
      id: assessments.id,
      project_id: assessments.project_id,
      name: assessments.name,
      description: assessments.description,
      test_date_start: assessments.test_date_start,
      test_date_end: assessments.test_date_end,
      status: assessments.status,
      assigned_to: assessments.assigned_to,
      created_by: assessments.created_by,
      created_at: assessments.created_at,
      updated_at: assessments.updated_at,
      issue_count: sql<number>`COUNT(DISTINCT ${issues.id})`.as('issue_count'),
      project_name: projects.name,
    })
    .from(assessments)
    .leftJoin(issues, eq(issues.assessment_id, assessments.id))
    .innerJoin(projects, eq(projects.id, assessments.project_id))
    .groupBy(assessments.id)
    .orderBy(sql`${assessments.created_at} DESC`);
  return rows as AssessmentWithProject[];
}
