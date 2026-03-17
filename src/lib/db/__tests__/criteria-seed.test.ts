// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb, getDb } from '../index';
import { seedCriteria } from '../criteria-seed';

beforeAll(() => {
  initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

describe('seedCriteria', () => {
  it('populates WCAG 2.0 criteria', () => {
    const rows = getDb()
      .prepare("SELECT * FROM criteria WHERE standard = 'WCAG' AND wcag_version = '2.0'")
      .all();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('populates WCAG 2.1-only criteria with correct editions', () => {
    const rows = getDb()
      .prepare("SELECT editions FROM criteria WHERE wcag_version = '2.1' AND code = '1.3.4'")
      .all() as { editions: string }[];
    expect(rows).toHaveLength(1);
    const editions = JSON.parse(rows[0].editions);
    expect(editions).toContain('WCAG');
    expect(editions).toContain('EU');
    expect(editions).not.toContain('508');
  });

  it('WCAG 2.0 criteria include 508 in editions', () => {
    const rows = getDb()
      .prepare("SELECT editions FROM criteria WHERE wcag_version = '2.0' AND code = '1.1.1'")
      .all() as { editions: string }[];
    expect(rows).toHaveLength(1);
    const editions = JSON.parse(rows[0].editions);
    expect(editions).toContain('508');
  });

  it('WCAG 2.2-only criteria have editions WCAG and INT only', () => {
    const rows = getDb().prepare("SELECT editions FROM criteria WHERE code = '2.4.11'").all() as {
      editions: string;
    }[];
    expect(rows).toHaveLength(1);
    const editions = JSON.parse(rows[0].editions);
    expect(editions).toContain('WCAG');
    expect(editions).toContain('INT');
    expect(editions).not.toContain('508');
    expect(editions).not.toContain('EU');
  });

  it('each WCAG criterion has a non-empty chapter_section', () => {
    const rows = getDb()
      .prepare("SELECT chapter_section FROM criteria WHERE standard = 'WCAG'")
      .all() as { chapter_section: string }[];
    for (const row of rows) {
      expect(row.chapter_section.length).toBeGreaterThan(0);
    }
  });

  it('seeds exactly 87 WCAG criteria', () => {
    const count = (
      getDb().prepare("SELECT COUNT(*) as n FROM criteria WHERE standard = 'WCAG'").get() as {
        n: number;
      }
    ).n;
    expect(count).toBe(87);
  });

  it('is idempotent', () => {
    const count1 = (
      getDb().prepare("SELECT COUNT(*) as n FROM criteria WHERE standard = 'WCAG'").get() as {
        n: number;
      }
    ).n;
    seedCriteria();
    const count2 = (
      getDb().prepare("SELECT COUNT(*) as n FROM criteria WHERE standard = 'WCAG'").get() as {
        n: number;
      }
    ).n;
    expect(count2).toBe(count1);
  });

  it('populates Section 508 Chapter 3 with 9 criteria', () => {
    const rows = getDb()
      .prepare("SELECT * FROM criteria WHERE standard = '508' AND chapter_section = 'Chapter3'")
      .all();
    expect(rows).toHaveLength(9);
  });

  it('populates Section 508 Chapter 6 with 4 criteria', () => {
    const rows = getDb()
      .prepare("SELECT * FROM criteria WHERE standard = '508' AND chapter_section = 'Chapter6'")
      .all();
    expect(rows).toHaveLength(4);
  });

  it('populates EN 301 549 Clause 4 with 10 criteria', () => {
    const rows = getDb()
      .prepare("SELECT * FROM criteria WHERE standard = 'EN301549' AND chapter_section = 'Clause4'")
      .all();
    expect(rows).toHaveLength(10);
  });

  it('Section 508 criteria have 508 and INT editions only', () => {
    const rows = getDb().prepare("SELECT editions FROM criteria WHERE standard = '508'").all() as {
      editions: string;
    }[];
    for (const row of rows) {
      const editions = JSON.parse(row.editions);
      expect(editions).toContain('508');
      expect(editions).toContain('INT');
      expect(editions).not.toContain('WCAG');
      expect(editions).not.toContain('EU');
    }
  });

  it('EN 301 549 criteria have EU and INT editions only', () => {
    const rows = getDb()
      .prepare("SELECT editions FROM criteria WHERE standard = 'EN301549'")
      .all() as { editions: string }[];
    for (const row of rows) {
      const editions = JSON.parse(row.editions);
      expect(editions).toContain('EU');
      expect(editions).toContain('INT');
      expect(editions).not.toContain('WCAG');
      expect(editions).not.toContain('508');
    }
  });
});
