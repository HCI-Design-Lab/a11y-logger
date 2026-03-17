// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
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

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM issues').run();
  getDb().prepare('DELETE FROM assessments').run();
  getDb().prepare('DELETE FROM projects').run();
  const project = createProject({ name: 'Test Project' });
  projectId = project.id;
  const assessment = createAssessment(projectId, { name: 'Baseline Audit' });
  assessmentId = assessment.id;
});

// ─── createIssue ────────────────────────────────────────────────────────────

describe('createIssue', () => {
  it('inserts an issue with required fields and returns it', () => {
    const issue = createIssue(assessmentId, { title: 'Missing alt text' });
    expect(issue.id).toBeDefined();
    expect(issue.title).toBe('Missing alt text');
    expect(issue.assessment_id).toBe(assessmentId);
    expect(issue.severity).toBe('medium');
    expect(issue.status).toBe('open');
    expect(issue.created_at).toBeDefined();
    expect(issue.updated_at).toBeDefined();
  });

  it('returns JSON array fields as real arrays, not strings', () => {
    const issue = createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'] });
    expect(Array.isArray(issue.wcag_codes)).toBe(true);
    expect(issue.wcag_codes).toEqual(['1.1.1']);
    expect(Array.isArray(issue.tags)).toBe(true);
    expect(Array.isArray(issue.evidence_media)).toBe(true);
  });

  it('defaults JSON array fields to empty arrays', () => {
    const issue = createIssue(assessmentId, { title: 'Minimal' });
    expect(issue.wcag_codes).toEqual([]);
    expect(issue.tags).toEqual([]);
    expect(issue.evidence_media).toEqual([]);
    expect(issue.ai_suggested_codes).toEqual([]);
  });

  it('stores all optional fields', () => {
    const issue = createIssue(assessmentId, {
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

  it('generates a unique id for each issue', () => {
    const i1 = createIssue(assessmentId, { title: 'A' });
    const i2 = createIssue(assessmentId, { title: 'B' });
    expect(i1.id).not.toBe(i2.id);
  });

  it('createIssue stores new fields', () => {
    const issue = createIssue(assessmentId, {
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

  it('updateIssue updates new fields', () => {
    const issue = createIssue(assessmentId, { title: 'Test' });
    const updated = updateIssue(issue.id, { suggested_fix: 'Use aria-label' });
    expect(updated?.suggested_fix).toBe('Use aria-label');
  });
});

// ─── getIssue ────────────────────────────────────────────────────────────────

describe('getIssue', () => {
  it('returns the issue by id with deserialized arrays', () => {
    const created = createIssue(assessmentId, { title: 'Find Me', wcag_codes: ['2.1.1'] });
    const found = getIssue(created.id);
    expect(found).not.toBeNull();
    expect(found?.title).toBe('Find Me');
    expect(found?.wcag_codes).toEqual(['2.1.1']);
  });

  it('returns null for nonexistent id', () => {
    expect(getIssue('nonexistent')).toBeNull();
  });
});

// ─── getIssues ───────────────────────────────────────────────────────────────

describe('getIssues', () => {
  it('returns all issues for an assessment', () => {
    createIssue(assessmentId, { title: 'Issue A' });
    createIssue(assessmentId, { title: 'Issue B' });
    const results = getIssues(assessmentId);
    expect(results).toHaveLength(2);
  });

  it('returns empty array when no issues exist', () => {
    expect(getIssues(assessmentId)).toEqual([]);
  });

  it('does not return issues from other assessments', () => {
    const other = createAssessment(projectId, { name: 'Other Audit' });
    createIssue(other.id, { title: 'Not Mine' });
    createIssue(assessmentId, { title: 'Mine' });
    const results = getIssues(assessmentId);
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Mine');
  });

  it('returns deserialized arrays for all issues', () => {
    createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'], tags: ['nav'] });
    const results = getIssues(assessmentId);
    expect(Array.isArray(results[0]!.wcag_codes)).toBe(true);
    expect(results[0]!.wcag_codes).toEqual(['1.1.1']);
    expect(results[0]!.tags).toEqual(['nav']);
  });

  it('filters by severity', () => {
    createIssue(assessmentId, { title: 'Critical', severity: 'critical' });
    createIssue(assessmentId, { title: 'Low', severity: 'low' });
    const results = getIssues(assessmentId, { severity: 'critical' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Critical');
  });

  it('filters by status', () => {
    createIssue(assessmentId, { title: 'Open', status: 'open' });
    createIssue(assessmentId, { title: 'Resolved' });
    // Manually resolve the second issue
    const second = createIssue(assessmentId, { title: 'Fixed' });
    resolveIssue(second.id, 'alice');
    const results = getIssues(assessmentId, { status: 'resolved' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Fixed');
  });

  it('filters by wcag_code', () => {
    createIssue(assessmentId, { title: 'Has 1.1.1', wcag_codes: ['1.1.1', '1.4.3'] });
    createIssue(assessmentId, { title: 'Has 2.1.1', wcag_codes: ['2.1.1'] });
    const results = getIssues(assessmentId, { wcag_code: '1.1.1' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Has 1.1.1');
  });

  it('filters by tag', () => {
    createIssue(assessmentId, { title: 'Tagged', tags: ['navigation', 'keyboard'] });
    createIssue(assessmentId, { title: 'Other', tags: ['forms'] });
    const results = getIssues(assessmentId, { tag: 'navigation' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Tagged');
  });

  it('supports combining multiple filters', () => {
    createIssue(assessmentId, { title: 'Match', severity: 'critical', wcag_codes: ['1.1.1'] });
    createIssue(assessmentId, { title: 'Wrong severity', severity: 'low', wcag_codes: ['1.1.1'] });
    createIssue(assessmentId, { title: 'Wrong wcag', severity: 'critical', wcag_codes: ['2.1.1'] });
    const results = getIssues(assessmentId, { severity: 'critical', wcag_code: '1.1.1' });
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Match');
  });
});

// ─── updateIssue ─────────────────────────────────────────────────────────────

describe('updateIssue', () => {
  it('updates provided fields and returns updated issue', () => {
    const created = createIssue(assessmentId, { title: 'Original', severity: 'medium' });
    const updated = updateIssue(created.id, { title: 'Updated', severity: 'high' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
    expect(updated!.severity).toBe('high');
  });

  it('does not change fields not included in the update', () => {
    const created = createIssue(assessmentId, {
      title: 'Keep Fields',
      description: 'Keep this',
      wcag_codes: ['1.1.1'],
    });
    const updated = updateIssue(created.id, { title: 'New Title' });
    expect(updated!.description).toBe('Keep this');
    expect(updated!.wcag_codes).toEqual(['1.1.1']);
  });

  it('serializes and deserializes JSON array fields on update', () => {
    const created = createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'] });
    const updated = updateIssue(created.id, { wcag_codes: ['1.1.1', '2.1.1'], tags: ['nav'] });
    expect(updated!.wcag_codes).toEqual(['1.1.1', '2.1.1']);
    expect(updated!.tags).toEqual(['nav']);
  });

  it('returns null for nonexistent id', () => {
    expect(updateIssue('nope', { title: 'X' })).toBeNull();
  });

  it('sets updated_at on update', () => {
    const created = createIssue(assessmentId, { title: 'Time' });
    const updated = updateIssue(created.id, { title: 'Changed' });
    expect(updated!.updated_at).toBeDefined();
  });

  it('returns existing issue when no fields provided', () => {
    const created = createIssue(assessmentId, { title: 'No-op' });
    const result = updateIssue(created.id, {});
    expect(result!.title).toBe('No-op');
  });
});

// ─── deleteIssue ─────────────────────────────────────────────────────────────

describe('deleteIssue', () => {
  it('removes the issue', () => {
    const created = createIssue(assessmentId, { title: 'Delete Me' });
    deleteIssue(created.id);
    expect(getIssue(created.id)).toBeNull();
  });

  it('returns true when issue existed', () => {
    const created = createIssue(assessmentId, { title: 'Exists' });
    expect(deleteIssue(created.id)).toBe(true);
  });

  it('returns false when issue did not exist', () => {
    expect(deleteIssue('ghost-id')).toBe(false);
  });
});

// ─── resolveIssue ────────────────────────────────────────────────────────────

describe('resolveIssue', () => {
  it('sets status to resolved and records resolved_at and resolved_by', () => {
    const created = createIssue(assessmentId, { title: 'Bug' });
    const resolved = resolveIssue(created.id, 'alice');
    expect(resolved).not.toBeNull();
    expect(resolved!.status).toBe('resolved');
    expect(resolved!.resolved_by).toBe('alice');
    expect(resolved!.resolved_at).toBeDefined();
  });

  it('returns null for nonexistent id', () => {
    expect(resolveIssue('nope', 'alice')).toBeNull();
  });
});

// ─── getIssuesByProject ──────────────────────────────────────────────────────

describe('getIssuesByProject', () => {
  it('returns all issues across all assessments for a project', () => {
    const a2 = createAssessment(projectId, { name: 'Second Audit' });
    createIssue(assessmentId, { title: 'From Audit 1' });
    createIssue(a2.id, { title: 'From Audit 2' });
    const results = getIssuesByProject(projectId);
    expect(results).toHaveLength(2);
  });

  it('does not return issues from another project', () => {
    const otherProject = createProject({ name: 'Other Project' });
    const otherAssessment = createAssessment(otherProject.id, { name: 'Other Audit' });
    createIssue(otherAssessment.id, { title: 'Not Mine' });
    createIssue(assessmentId, { title: 'Mine' });
    const results = getIssuesByProject(projectId);
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Mine');
  });

  it('returns empty array when project has no issues', () => {
    expect(getIssuesByProject(projectId)).toEqual([]);
  });

  it('returns deserialized array fields', () => {
    createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'] });
    const results = getIssuesByProject(projectId);
    expect(Array.isArray(results[0]!.wcag_codes)).toBe(true);
    expect(results[0]!.wcag_codes).toEqual(['1.1.1']);
  });
});

// ─── getIssuesByProjectAndWcagCode ───────────────────────────────────────────

describe('getIssuesByProjectAndWcagCode', () => {
  it('returns issues matching the project and wcag code', () => {
    createIssue(assessmentId, { title: 'Has 1.1.1', wcag_codes: ['1.1.1', '1.4.3'] });
    createIssue(assessmentId, { title: 'Has 2.1.1', wcag_codes: ['2.1.1'] });
    const results = getIssuesByProjectAndWcagCode(projectId, '1.1.1');
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Has 1.1.1');
  });

  it('returns empty array when no issues match the wcag code', () => {
    createIssue(assessmentId, { title: 'Has 2.1.1', wcag_codes: ['2.1.1'] });
    const results = getIssuesByProjectAndWcagCode(projectId, '1.1.1');
    expect(results).toEqual([]);
  });

  it('does not return issues from another project', () => {
    const otherProject = createProject({ name: 'Other Project' });
    const otherAssessment = createAssessment(otherProject.id, { name: 'Other Audit' });
    createIssue(otherAssessment.id, { title: 'Other 1.1.1', wcag_codes: ['1.1.1'] });
    createIssue(assessmentId, { title: 'Mine 1.1.1', wcag_codes: ['1.1.1'] });
    const results = getIssuesByProjectAndWcagCode(projectId, '1.1.1');
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Mine 1.1.1');
  });

  it('returns deserialized array fields', () => {
    createIssue(assessmentId, { title: 'T', wcag_codes: ['1.1.1'], tags: ['nav'] });
    const results = getIssuesByProjectAndWcagCode(projectId, '1.1.1');
    expect(Array.isArray(results[0]!.wcag_codes)).toBe(true);
    expect(results[0]!.wcag_codes).toEqual(['1.1.1']);
    expect(results[0]!.tags).toEqual(['nav']);
  });
});
