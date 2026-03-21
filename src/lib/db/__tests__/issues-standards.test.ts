// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '@/lib/db/index';
import { getDbClient } from '@/lib/db/client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '@/lib/db/schema';
import * as schema from '@/lib/db/schema';
import { createProject } from '@/lib/db/projects';
import { createAssessment } from '@/lib/db/assessments';
import { createIssue, updateIssue, deserializeIssue } from '@/lib/db/issues';
import type { IssueRow } from '@/lib/db/issues';

function db() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

let assessmentId: string;

beforeAll(async () => {
  await initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(async () => {
  await db().delete(schema.issues);
  await db().delete(schema.assessments);
  await db().delete(schema.projects);
  const project = await createProject({ name: 'Test Project' });
  const assessment = await createAssessment(project.id, { name: 'Test Assessment' });
  assessmentId = assessment.id;
});

describe('deserializeIssue', () => {
  it('deserializes section_508_codes and eu_codes from JSON strings', () => {
    const row = {
      id: 'x',
      assessment_id: 'a',
      title: 'T',
      description: null,
      url: null,
      severity: 'low' as const,
      status: 'open' as const,
      wcag_codes: '["1.1.1"]',
      section_508_codes: '["302.1"]',
      eu_codes: '["4.2.1"]',
      ai_suggested_codes: '[]',
      ai_confidence_score: null,
      device_type: null,
      browser: null,
      operating_system: null,
      assistive_technology: null,
      user_impact: null,
      selector: null,
      code_snippet: null,
      suggested_fix: null,
      evidence_media: '[]',
      tags: '[]',
      created_by: null,
      resolved_by: null,
      resolved_at: null,
      created_at: '',
      updated_at: '',
    } as IssueRow;
    const issue = deserializeIssue(row);
    expect(issue.section_508_codes).toEqual(['302.1']);
    expect(issue.eu_codes).toEqual(['4.2.1']);
  });

  it('defaults section_508_codes and eu_codes to empty array when null/missing', () => {
    const row = {
      id: 'x',
      assessment_id: 'a',
      title: 'T',
      description: null,
      url: null,
      severity: 'low' as const,
      status: 'open' as const,
      wcag_codes: '[]',
      section_508_codes: null as unknown as string,
      eu_codes: null as unknown as string,
      ai_suggested_codes: '[]',
      ai_confidence_score: null,
      device_type: null,
      browser: null,
      operating_system: null,
      assistive_technology: null,
      user_impact: null,
      selector: null,
      code_snippet: null,
      suggested_fix: null,
      evidence_media: '[]',
      tags: '[]',
      created_by: null,
      resolved_by: null,
      resolved_at: null,
      created_at: '',
      updated_at: '',
    } as IssueRow;
    const issue = deserializeIssue(row);
    expect(issue.section_508_codes).toEqual([]);
    expect(issue.eu_codes).toEqual([]);
  });
});

describe('createIssue', () => {
  it('stores section_508_codes and eu_codes', async () => {
    const issue = await createIssue(assessmentId, {
      title: 'New Issue',
      section_508_codes: ['302.1', '302.4'],
      eu_codes: ['4.2.1'],
    });
    expect(issue.section_508_codes).toEqual(['302.1', '302.4']);
    expect(issue.eu_codes).toEqual(['4.2.1']);
  });

  it('defaults section_508_codes and eu_codes to empty arrays', async () => {
    const issue = await createIssue(assessmentId, { title: 'No Standards' });
    expect(issue.section_508_codes).toEqual([]);
    expect(issue.eu_codes).toEqual([]);
  });
});

describe('updateIssue', () => {
  it('updates section_508_codes', async () => {
    const issue = await createIssue(assessmentId, { title: 'Existing Issue' });
    const updated = await updateIssue(issue.id, { section_508_codes: ['302.1'] });
    expect(updated?.section_508_codes).toEqual(['302.1']);
  });

  it('updates eu_codes', async () => {
    const issue = await createIssue(assessmentId, { title: 'Existing Issue' });
    const updated = await updateIssue(issue.id, { eu_codes: ['4.2.1', '5.2'] });
    expect(updated?.eu_codes).toEqual(['4.2.1', '5.2']);
  });
});
