// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';

let db: Database.Database;

vi.mock('@/lib/db/index', () => ({
  getDb: () => db,
}));

import { createIssue, updateIssue, deserializeIssue } from '@/lib/db/issues';
import type { IssueRow } from '@/lib/db/issues';

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(`
    CREATE TABLE issues (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT,
      severity TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      wcag_codes TEXT DEFAULT '[]',
      section_508_codes TEXT DEFAULT '[]',
      eu_codes TEXT DEFAULT '[]',
      ai_suggested_codes TEXT DEFAULT '[]',
      ai_confidence_score REAL,
      device_type TEXT,
      browser TEXT,
      operating_system TEXT,
      assistive_technology TEXT,
      user_impact TEXT,
      selector TEXT,
      code_snippet TEXT,
      suggested_fix TEXT,
      evidence_media TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      created_by TEXT,
      resolved_by TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO issues (id, assessment_id, title) VALUES ('test-1', 'assess-1', 'Existing Issue');
  `);
});

afterEach(() => db.close());

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
  it('stores section_508_codes and eu_codes', () => {
    const issue = createIssue('assess-1', {
      title: 'New Issue',
      section_508_codes: ['302.1', '302.4'],
      eu_codes: ['4.2.1'],
    });
    expect(issue.section_508_codes).toEqual(['302.1', '302.4']);
    expect(issue.eu_codes).toEqual(['4.2.1']);
  });

  it('defaults section_508_codes and eu_codes to empty arrays', () => {
    const issue = createIssue('assess-1', { title: 'No Standards' });
    expect(issue.section_508_codes).toEqual([]);
    expect(issue.eu_codes).toEqual([]);
  });
});

describe('updateIssue', () => {
  it('updates section_508_codes', () => {
    const updated = updateIssue('test-1', { section_508_codes: ['302.1'] });
    expect(updated?.section_508_codes).toEqual(['302.1']);
  });

  it('updates eu_codes', () => {
    const updated = updateIssue('test-1', { eu_codes: ['4.2.1', '5.2'] });
    expect(updated?.eu_codes).toEqual(['4.2.1', '5.2']);
  });
});
