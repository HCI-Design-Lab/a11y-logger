// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb } from '../index';
import { getDbClient } from '../client';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { vpatCriterionComponents } from '../schema';
import type * as sqliteSchema from '../schema';
import { eq } from 'drizzle-orm';

function dbc() {
  return getDbClient() as BetterSQLite3Database<typeof sqliteSchema>;
}

beforeAll(async () => {
  await initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

describe('vpatCriterionComponents Drizzle schema', () => {
  it('exports vpatCriterionComponents table definition', () => {
    expect(vpatCriterionComponents).toBeDefined();
  });

  it('can insert and query a component row via Drizzle', () => {
    dbc().run(`
      INSERT INTO projects (id, name, created_at, updated_at) VALUES ('p-schema', 'P', datetime('now'), datetime('now'))
    `);
    dbc().run(`
      INSERT INTO vpats (id, project_id, title, created_at, updated_at) VALUES ('v-schema', 'p-schema', 'V', datetime('now'), datetime('now'))
    `);
    dbc().run(`
      INSERT INTO criteria (id, code, name, description, standard, chapter_section, editions, product_types, sort_order)
      VALUES ('c-schema', '1.1.1', 'Non-text Content', '', 'WCAG', 'Perceivable', '[]', '[]', 1)
    `);
    dbc().run(`
      INSERT INTO vpat_criterion_rows (id, vpat_id, criterion_id, conformance, updated_at)
      VALUES ('row-schema', 'v-schema', 'c-schema', 'not_evaluated', datetime('now'))
    `);
    dbc()
      .insert(vpatCriterionComponents)
      .values({
        criterion_row_id: 'row-schema',
        component_name: 'web',
        conformance: 'not_evaluated',
        remarks: null,
      })
      .run();
    const rows = dbc()
      .select()
      .from(vpatCriterionComponents)
      .where(eq(vpatCriterionComponents.criterion_row_id, 'row-schema'))
      .all();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.component_name).toBe('web');
    expect(rows[0]!.conformance).toBe('not_evaluated');
  });
});
