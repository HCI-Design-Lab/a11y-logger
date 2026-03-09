// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../migrate';
import { loadMigrations } from '../load-migrations';
import path from 'path';

interface TableInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface ForeignKeyInfo {
  table: string;
  from: string;
  to: string;
}

function getColumns(db: Database.Database, table: string): TableInfo[] {
  return db.prepare(`PRAGMA table_info(${table})`).all() as TableInfo[];
}

function getColumnNames(db: Database.Database, table: string): string[] {
  return getColumns(db, table).map((c) => c.name);
}

function getForeignKeys(db: Database.Database, table: string): ForeignKeyInfo[] {
  return db.prepare(`PRAGMA foreign_key_list(${table})`).all() as ForeignKeyInfo[];
}

describe('core tables schema', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    const migrations = loadMigrations(path.resolve(__dirname, '../../../../migrations'));
    runMigrations(db, migrations);
  });

  afterEach(() => {
    db.close();
  });

  describe('projects', () => {
    it('has the correct columns', () => {
      const columns = getColumnNames(db, 'projects');
      expect(columns).toEqual([
        'id',
        'name',
        'description',
        'product_url',
        'status',
        'settings',
        'created_by',
        'created_at',
        'updated_at',
      ]);
    });

    it('defaults status to active', () => {
      db.prepare("INSERT INTO projects (id, name) VALUES ('p1', 'Test')").run();
      const row = db.prepare('SELECT status FROM projects WHERE id = ?').get('p1') as {
        status: string;
      };
      expect(row.status).toBe('active');
    });
  });

  describe('assessments', () => {
    it('has the correct columns', () => {
      const columns = getColumnNames(db, 'assessments');
      expect(columns).toEqual([
        'id',
        'project_id',
        'name',
        'description',
        'test_date_start',
        'test_date_end',
        'status',
        'assigned_to',
        'created_by',
        'created_at',
        'updated_at',
      ]);
    });

    it('has a foreign key to projects', () => {
      const fks = getForeignKeys(db, 'assessments');
      expect(fks.some((fk) => fk.table === 'projects' && fk.from === 'project_id')).toBe(true);
    });

    it('cascades delete when parent project is deleted', () => {
      db.prepare("INSERT INTO projects (id, name) VALUES ('p1', 'Test')").run();
      db.prepare(
        "INSERT INTO assessments (id, project_id, name) VALUES ('a1', 'p1', 'Assessment 1')"
      ).run();
      db.prepare("DELETE FROM projects WHERE id = 'p1'").run();
      const row = db.prepare("SELECT * FROM assessments WHERE id = 'a1'").get();
      expect(row).toBeUndefined();
    });
  });

  describe('issues', () => {
    it('has the correct columns', () => {
      const columns = getColumnNames(db, 'issues');
      expect(columns).toEqual([
        'id',
        'assessment_id',
        'title',
        'description',
        'url',
        'severity',
        'status',
        'wcag_codes',
        'ai_suggested_codes',
        'ai_confidence_score',
        'device_type',
        'browser',
        'operating_system',
        'assistive_technology',
        'evidence_media',
        'tags',
        'created_by',
        'resolved_by',
        'resolved_at',
        'created_at',
        'updated_at',
        'user_impact',
        'selector',
        'code_snippet',
        'suggested_fix',
      ]);
    });

    it('has a foreign key to assessments', () => {
      const fks = getForeignKeys(db, 'issues');
      expect(fks.some((fk) => fk.table === 'assessments' && fk.from === 'assessment_id')).toBe(
        true
      );
    });
  });

  describe('reports', () => {
    it('has the correct columns', () => {
      const columns = getColumnNames(db, 'reports');
      expect(columns).toEqual([
        'id',
        'project_id',
        'type',
        'title',
        'status',
        'content',
        'template_id',
        'ai_generated',
        'created_by',
        'published_at',
        'created_at',
        'updated_at',
      ]);
    });

    it('has a foreign key to projects', () => {
      const fks = getForeignKeys(db, 'reports');
      expect(fks.some((fk) => fk.table === 'projects' && fk.from === 'project_id')).toBe(true);
    });
  });

  describe('vpats', () => {
    it('has the correct columns', () => {
      const columns = getColumnNames(db, 'vpats');
      expect(columns).toEqual([
        'id',
        'project_id',
        'title',
        'status',
        'version_number',
        'wcag_scope',
        'criteria_rows',
        'ai_generated',
        'created_by',
        'published_at',
        'created_at',
        'updated_at',
      ]);
    });

    it('has a foreign key to projects', () => {
      const fks = getForeignKeys(db, 'vpats');
      expect(fks.some((fk) => fk.table === 'projects' && fk.from === 'project_id')).toBe(true);
    });
  });

  describe('settings', () => {
    it('has key and value columns', () => {
      const columns = getColumnNames(db, 'settings');
      expect(columns).toEqual(['key', 'value']);
    });

    it('uses key as primary key', () => {
      const cols = getColumns(db, 'settings');
      const keyCol = cols.find((c) => c.name === 'key');
      expect(keyCol?.pk).toBe(1);
    });
  });

  describe('users', () => {
    it('has the correct columns', () => {
      const columns = getColumnNames(db, 'users');
      expect(columns).toEqual([
        'id',
        'username',
        'password_hash',
        'role',
        'created_at',
        'updated_at',
      ]);
    });

    it('defaults role to member', () => {
      db.prepare(
        "INSERT INTO users (id, username, password_hash) VALUES ('u1', 'alice', 'hash')"
      ).run();
      const row = db.prepare('SELECT role FROM users WHERE id = ?').get('u1') as { role: string };
      expect(row.role).toBe('member');
    });
  });

  describe('report_assessments', () => {
    it('has the correct columns', () => {
      const columns = getColumnNames(db, 'report_assessments');
      expect(columns).toEqual(['report_id', 'assessment_id']);
    });

    it('has a foreign key to reports', () => {
      const fks = getForeignKeys(db, 'report_assessments');
      expect(fks.some((fk) => fk.table === 'reports' && fk.from === 'report_id')).toBe(true);
    });

    it('has a foreign key to assessments', () => {
      const fks = getForeignKeys(db, 'report_assessments');
      expect(fks.some((fk) => fk.table === 'assessments' && fk.from === 'assessment_id')).toBe(
        true
      );
    });

    it('cascades delete when parent report is deleted', () => {
      db.prepare("INSERT INTO projects (id, name) VALUES ('p1', 'Test')").run();
      db.prepare(
        "INSERT INTO assessments (id, project_id, name) VALUES ('a1', 'p1', 'Assessment 1')"
      ).run();
      db.prepare(
        "INSERT INTO reports (id, project_id, type, title) VALUES ('r1', 'p1', 'executive', 'Report 1')"
      ).run();
      db.prepare(
        "INSERT INTO report_assessments (report_id, assessment_id) VALUES ('r1', 'a1')"
      ).run();
      db.prepare("DELETE FROM reports WHERE id = 'r1'").run();
      const row = db.prepare("SELECT * FROM report_assessments WHERE report_id = 'r1'").get();
      expect(row).toBeUndefined();
    });

    it('cascades delete when parent assessment is deleted', () => {
      db.prepare("INSERT INTO projects (id, name) VALUES ('p1', 'Test')").run();
      db.prepare(
        "INSERT INTO assessments (id, project_id, name) VALUES ('a1', 'p1', 'Assessment 1')"
      ).run();
      db.prepare(
        "INSERT INTO reports (id, project_id, type, title) VALUES ('r1', 'p1', 'executive', 'Report 1')"
      ).run();
      db.prepare(
        "INSERT INTO report_assessments (report_id, assessment_id) VALUES ('r1', 'a1')"
      ).run();
      db.prepare("DELETE FROM assessments WHERE id = 'a1'").run();
      const row = db.prepare("SELECT * FROM report_assessments WHERE assessment_id = 'a1'").get();
      expect(row).toBeUndefined();
    });
  });

  describe('foreign key enforcement', () => {
    it('rejects inserting an assessment with a nonexistent project_id', () => {
      expect(() => {
        db.prepare(
          "INSERT INTO assessments (id, project_id, name) VALUES ('a1', 'nonexistent', 'Test')"
        ).run();
      }).toThrow();
    });
  });
});
