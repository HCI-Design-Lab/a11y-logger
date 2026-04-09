// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as sqliteSchema from '../schema';

function dbc() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

beforeAll(async () => {
  await initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

describe('migration 018 — vpat_criterion_components', () => {
  it('creates the vpat_criterion_components table with all expected columns', () => {
    const raw = dbc().all(
      "SELECT name FROM pragma_table_info('vpat_criterion_components') ORDER BY name"
    ) as Array<{ name: string }>;
    const cols = raw.map((r) => r.name);
    expect(cols).toContain('id');
    expect(cols).toContain('criterion_row_id');
    expect(cols).toContain('component_name');
    expect(cols).toContain('conformance');
    expect(cols).toContain('remarks');
    expect(cols).toContain('created_at');
    expect(cols).toContain('updated_at');
  });

  it('enforces UNIQUE constraint on (criterion_row_id, component_name)', () => {
    dbc().run(`
      INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p1', 'P', datetime('now'), datetime('now'))
    `);
    dbc().run(`
      INSERT INTO vpats (id, project_id, title, created_at, updated_at) VALUES ('v1', 'p1', 'V', datetime('now'), datetime('now'))
    `);
    dbc().run(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, editions, product_types, sort_order)
      VALUES ('c1', '1.1.1', 'Non-text Content', '', 'WCAG', 'Perceivable', '[]', '[]', 1)
    `);
    dbc().run(`
      INSERT INTO vpat_criterion_rows (id, vpat_id, criterion_id, conformance, updated_at)
      VALUES ('r1', 'v1', 'c1', 'not_evaluated', datetime('now'))
    `);
    dbc().run(`
      INSERT INTO vpat_criterion_components (criterion_row_id, component_name) VALUES ('r1', 'web')
    `);
    expect(() =>
      dbc().run(
        `INSERT INTO vpat_criterion_components (criterion_row_id, component_name) VALUES ('r1', 'web')`
      )
    ).toThrow();
  });

  it('cascades delete when parent criterion_row is deleted', () => {
    dbc().run(`DELETE FROM vpat_criterion_rows WHERE id = 'r1'`);
    const rows = dbc().all(
      `SELECT * FROM vpat_criterion_components WHERE criterion_row_id = 'r1'`
    ) as unknown[];
    expect(rows).toHaveLength(0);
  });

  it('rejects invalid conformance value', () => {
    dbc().run(`
      INSERT INTO vpat_criterion_rows (id, vpat_id, criterion_id, conformance, updated_at)
      VALUES ('r2', 'v1', 'c1', 'not_evaluated', datetime('now'))
    `);
    expect(() =>
      dbc().run(
        `INSERT INTO vpat_criterion_components (criterion_row_id, component_name, conformance) VALUES ('r2', 'web', 'invalid_value')`
      )
    ).toThrow();
  });

  it('creates index idx_vpat_criterion_components_row_id', () => {
    const indexes = dbc().all(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'vpat_criterion_components'"
    ) as Array<{ name: string }>;
    const names = indexes.map((i) => i.name);
    expect(names).toContain('idx_vpat_criterion_components_row_id');
  });
});
