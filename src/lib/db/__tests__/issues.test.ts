// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';
import * as schema from '../schema';
import { createProject } from '../projects';
import { createAssessment } from '../assessments';
import {
  createIssue,
  getIssue,
  getIssues,
  updateIssue,
  deleteIssue,
  resolveIssue,
  getIssuesByProject,
  getIssuesByProjectAndWcagCode,
} from '../issues';

let projectId: string;
let assessmentId: string;

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
  await db().delete(schema.issues);
  await db().delete(schema.assessments);
  await db().delete(schema.projects);
  const project = await createProject({ name: 'Test Project' });
  projectId = project.id;
  const assessment = await createAssessment(projectId, { name: 'Baseline Audit' });
  assessmentId = assessment.id;
});

// ─── createIssue ────────────────────────────────────────────────────────────

describe('createIssue', () => {
  it('inserts an issue with required fields and returns it', async () => {
    const issue = await createIssue(assessmentId, { title: 'Missing alt text' });
    expect(issue.id).toBeDefined();
    expect(issue.title).toBe('Missing alt text');
    expect(issue.assessment_id).toBe(assessmentId);
    expect(issue.severity).toBe('medium');
    expect(issue.status).toBe('open');
    expect(issue.created_at).toBeDefined();
    expect(issue.updated_at).toBeDefined();
  });

  it('returns JSON array fields as real arrays, not strings', async () => {
    const issue = await createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'] });
    expect(Array.isArray(issue.wcag_codes)).toBe(true);
    expect(issue.wcag_codes).toEqual(['1.1.1']);
    expect(Array.isArray(issue.tags)).toBe(true);
    expect(Array.isArray(issue.evidence_media)).toBe(true);
  });

  it('defaults JSON array fields to empty arrays', async () => {
    const issue = await createIssue(assessmentId, { title: 'Minimal' });
    expect(issue.wcag_codes).toEqual([]);
    expect(issue.tags).toEqual([]);
    expect(issue.evidence_media).toEqual([]);
    expect(issue.ai_suggested_codes).toEqual([]);
  });

  it('stores all optional fields', async () => {
    const issue = await createIssue(assessmentId, {
      title: 'Full Issue',
      description: 'Detailed description',
      url: 'https://example.com/page',
      severity: 'critical',
      status: 'open',
      wcag_codes: ['1.1.1', '1.4.5'],
      device_type: 'mobile',
      browser: 'Safari',
      operating_system: 'iOS',
      assistive_technology: 'VoiceOver',
      evidence_media: ['/data/media/p1/i1/screen.png'],
      tags: ['homepage', 'images'],
      created_by: 'alice',
    });
    expect(issue.description).toBe('Detailed description');
    expect(issue.url).toBe('https://example.com/page');
    expect(issue.severity).toBe('critical');
    expect(issue.device_type).toBe('mobile');
    expect(issue.browser).toBe('Safari');
    expect(issue.operating_system).toBe('iOS');
    expect(issue.assistive_technology).toBe('VoiceOver');
    expect(issue.evidence_media).toEqual(['/data/media/p1/i1/screen.png']);
    expect(issue.tags).toEqual(['homepage', 'images']);
    expect(issue.created_by).toBe('alice');
  });

  it('generates a unique id for each issue', async () => {
    const i1 = await createIssue(assessmentId, { title: 'A' });
    const i2 = await createIssue(assessmentId, { title: 'B' });
    expect(i1.id).not.toBe(i2.id);
  });

  it('createIssue stores new fields', async () => {
    const issue = await createIssue(assessmentId, {
      title: 'Test',
      user_impact: 'Screen reader users cannot navigate',
      selector: '#main-nav > a',
      code_snippet: '<a href="#">Menu</a>',
      suggested_fix: 'Add aria-label to the link',
    });
    expect(issue.user_impact).toBe('Screen reader users cannot navigate');
    expect(issue.selector).toBe('#main-nav > a');
    expect(issue.code_snippet).toBe('<a href="#">Menu</a>');
    expect(issue.suggested_fix).toBe('Add aria-label to the link');
  });

  it('updateIssue updates new fields', async () => {
    const issue = await createIssue(assessmentId, { title: 'Test' });
    const updated = await updateIssue(issue.id, { suggested_fix: 'Use aria-label' });
    expect(updated?.suggested_fix).toBe('Use aria-label');
  });
});

// ─── getIssue ────────────────────────────────────────────────────────────────

describe('getIssue', () => {
  it('returns the issue by id with deserialized arrays', async () => {
    const created = await createIssue(assessmentId, { title: 'Find Me', wcag_codes: ['2.1.1'] });
    const found = await getIssue(created.id);
    expect(found).not.toBeNull();
    expect(found?.title).toBe('Find Me');
    expect(found?.wcag_codes).toEqual(['2.1.1']);
  });

  it('returns null for nonexistent id', async () => {
    expect(await getIssue('nonexistent')).toBeNull();
  });
});

// ─── getIssues ───────────────────────────────────────────────────────────────

describe('getIssues', () => {
  it('returns all issues for an assessment', async () => {
    await createIssue(assessmentId, { title: 'Issue A' });
    await createIssue(assessmentId, { title: 'Issue B' });
    const results = await getIssues(assessmentId);
    expect(results).toHaveLength(2);
  });

  it('returns empty array when no issues exist', async () => {
    expect(await getIssues(assessmentId)).toEqual([]);
  });

  it('does not return issues from other assessments', async () => {
    const other = await createAssessment(projectId, { name: 'Other Audit' });
    await createIssue(other.id, { title: 'Not Mine' });
    await createIssue(assessmentId, { title: 'Mine' });
    const results = await getIssues(assessmentId);
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Mine');
  });

  it('returns deserialized arrays for all issues', async () => {
    await createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'], tags: ['nav'] });
    const results = await getIssues(assessmentId);
    expect(Array.isArray(results[0]!.wcag_codes)).toBe(true);
    expect(results[0]!.wcag_codes).toEqual(['1.1.1']);
    expect(results[0]!.tags).toEqual(['nav']);
  });

  it('filters by severity', async () => {
    await createIssue(assessmentId, { title: 'Critical', severity: 'critical' });
    await createIssue(assessmentId, { title: 'Low', severity: 'low' });
    const results = await getIssues(assessmentId, { severity: 'critical' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Critical');
  });

  it('filters by status', async () => {
    await createIssue(assessmentId, { title: 'Open', status: 'open' });
    await createIssue(assessmentId, { title: 'Resolved' });
    // Manually resolve the second issue
    const second = await createIssue(assessmentId, { title: 'Fixed' });
    await resolveIssue(second.id, 'alice');
    const results = await getIssues(assessmentId, { status: 'resolved' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Fixed');
  });

  it('filters by wcag_code', async () => {
    await createIssue(assessmentId, { title: 'Has 1.1.1', wcag_codes: ['1.1.1', '1.4.3'] });
    await createIssue(assessmentId, { title: 'Has 2.1.1', wcag_codes: ['2.1.1'] });
    const results = await getIssues(assessmentId, { wcag_code: '1.1.1' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Has 1.1.1');
  });

  it('filters by tag', async () => {
    await createIssue(assessmentId, { title: 'Tagged', tags: ['navigation', 'keyboard'] });
    await createIssue(assessmentId, { title: 'Other', tags: ['forms'] });
    const results = await getIssues(assessmentId, { tag: 'navigation' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Tagged');
  });

  it('supports combining multiple filters', async () => {
    await createIssue(assessmentId, {
      title: 'Match',
      severity: 'critical',
      wcag_codes: ['1.1.1'],
    });
    await createIssue(assessmentId, {
      title: 'Wrong severity',
      severity: 'low',
      wcag_codes: ['1.1.1'],
    });
    await createIssue(assessmentId, {
      title: 'Wrong wcag',
      severity: 'critical',
      wcag_codes: ['2.1.1'],
    });
    const results = await getIssues(assessmentId, { severity: 'critical', wcag_code: '1.1.1' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Match');
  });
});

// ─── updateIssue ─────────────────────────────────────────────────────────────

describe('updateIssue', () => {
  it('updates provided fields and returns updated issue', async () => {
    const created = await createIssue(assessmentId, { title: 'Original', severity: 'medium' });
    const updated = await updateIssue(created.id, { title: 'Updated', severity: 'high' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
    expect(updated!.severity).toBe('high');
  });

  it('does not change fields not included in the update', async () => {
    const created = await createIssue(assessmentId, {
      title: 'Keep Fields',
      description: 'Keep this',
      wcag_codes: ['1.1.1'],
    });
    const updated = await updateIssue(created.id, { title: 'New Title' });
    expect(updated!.description).toBe('Keep this');
    expect(updated!.wcag_codes).toEqual(['1.1.1']);
  });

  it('serializes and deserializes JSON array fields on update', async () => {
    const created = await createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'] });
    const updated = await updateIssue(created.id, {
      wcag_codes: ['1.1.1', '2.1.1'],
      tags: ['nav'],
    });
    expect(updated!.wcag_codes).toEqual(['1.1.1', '2.1.1']);
    expect(updated!.tags).toEqual(['nav']);
  });

  it('returns null for nonexistent id', async () => {
    expect(await updateIssue('nope', { title: 'X' })).toBeNull();
  });

  it('sets updated_at on update', async () => {
    const created = await createIssue(assessmentId, { title: 'Time' });
    const updated = await updateIssue(created.id, { title: 'Changed' });
    expect(updated!.updated_at).toBeDefined();
  });

  it('returns existing issue when no fields provided', async () => {
    const created = await createIssue(assessmentId, { title: 'No-op' });
    const result = await updateIssue(created.id, {});
    expect(result!.title).toBe('No-op');
  });
});

// ─── deleteIssue ─────────────────────────────────────────────────────────────

describe('deleteIssue', () => {
  it('removes the issue', async () => {
    const created = await createIssue(assessmentId, { title: 'Delete Me' });
    await deleteIssue(created.id);
    expect(await getIssue(created.id)).toBeNull();
  });

  it('returns true when issue existed', async () => {
    const created = await createIssue(assessmentId, { title: 'Exists' });
    expect(await deleteIssue(created.id)).toBe(true);
  });

  it('returns false when issue did not exist', async () => {
    expect(await deleteIssue('ghost-id')).toBe(false);
  });
});

// ─── resolveIssue ────────────────────────────────────────────────────────────

describe('resolveIssue', () => {
  it('sets status to resolved and records resolved_at and resolved_by', async () => {
    const created = await createIssue(assessmentId, { title: 'Bug' });
    const resolved = await resolveIssue(created.id, 'alice');
    expect(resolved).not.toBeNull();
    expect(resolved!.status).toBe('resolved');
    expect(resolved!.resolved_by).toBe('alice');
    expect(resolved!.resolved_at).toBeDefined();
  });

  it('returns null for nonexistent id', async () => {
    expect(await resolveIssue('nope', 'alice')).toBeNull();
  });
});

// ─── getIssuesByProject ──────────────────────────────────────────────────────

describe('getIssuesByProject', () => {
  it('returns all issues across all assessments for a project', async () => {
    const a2 = await createAssessment(projectId, { name: 'Second Audit' });
    await createIssue(assessmentId, { title: 'From Audit 1' });
    await createIssue(a2.id, { title: 'From Audit 2' });
    const results = await getIssuesByProject(projectId);
    expect(results).toHaveLength(2);
  });

  it('does not return issues from another project', async () => {
    const otherProject = await createProject({ name: 'Other Project' });
    const otherAssessment = await createAssessment(otherProject.id, { name: 'Other Audit' });
    await createIssue(otherAssessment.id, { title: 'Not Mine' });
    await createIssue(assessmentId, { title: 'Mine' });
    const results = await getIssuesByProject(projectId);
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Mine');
  });

  it('returns empty array when project has no issues', async () => {
    expect(await getIssuesByProject(projectId)).toEqual([]);
  });

  it('returns deserialized array fields', async () => {
    await createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'] });
    const results = await getIssuesByProject(projectId);
    expect(Array.isArray(results[0]!.wcag_codes)).toBe(true);
    expect(results[0]!.wcag_codes).toEqual(['1.1.1']);
  });
});

// ─── getIssuesByProjectAndWcagCode ───────────────────────────────────────────

describe('getIssuesByProjectAndWcagCode', () => {
  it('returns issues matching the project and wcag code', async () => {
    await createIssue(assessmentId, { title: 'Has 1.1.1', wcag_codes: ['1.1.1', '1.4.3'] });
    await createIssue(assessmentId, { title: 'Has 2.1.1', wcag_codes: ['2.1.1'] });
    const results = await getIssuesByProjectAndWcagCode(projectId, '1.1.1');
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Has 1.1.1');
  });

  it('returns empty array when no issues match the wcag code', async () => {
    await createIssue(assessmentId, { title: 'Has 2.1.1', wcag_codes: ['2.1.1'] });
    const results = await getIssuesByProjectAndWcagCode(projectId, '1.1.1');
    expect(results).toEqual([]);
  });

  it('does not return issues from another project', async () => {
    const otherProject = await createProject({ name: 'Other Project' });
    const otherAssessment = await createAssessment(otherProject.id, { name: 'Other Audit' });
    await createIssue(otherAssessment.id, { title: 'Other 1.1.1', wcag_codes: ['1.1.1'] });
    await createIssue(assessmentId, { title: 'Mine 1.1.1', wcag_codes: ['1.1.1'] });
    const results = await getIssuesByProjectAndWcagCode(projectId, '1.1.1');
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Mine 1.1.1');
  });

  it('returns deserialized array fields', async () => {
    await createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'], tags: ['nav'] });
    const results = await getIssuesByProjectAndWcagCode(projectId, '1.1.1');
    expect(Array.isArray(results[0]!.wcag_codes)).toBe(true);
    expect(results[0]!.wcag_codes).toEqual(['1.1.1']);
    expect(results[0]!.tags).toEqual(['nav']);
  });
});
