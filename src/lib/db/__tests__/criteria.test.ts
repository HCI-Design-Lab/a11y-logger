// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb, closeDb } from '../index';
import { getCriteriaForEdition, getCriterion } from '../criteria';

beforeAll(async () => {
  await initDb(':memory:');
});
afterAll(() => {
  closeDb();
});

describe('getCriteriaForEdition', () => {
  it('returns A and AA sections for WCAG 2.1 AA edition', async () => {
    const sections = await getCriteriaForEdition('WCAG', ['web'], '2.1', 'AA');
    const sectionKeys = sections.map((s) => s.section);
    expect(sectionKeys).toContain('A');
    expect(sectionKeys).toContain('AA');
    expect(sectionKeys).not.toContain('AAA');
  });

  it('returns A, AA, AAA sections for WCAG 2.1 AAA edition', async () => {
    const sections = await getCriteriaForEdition('WCAG', ['web'], '2.1', 'AAA');
    const sectionKeys = sections.map((s) => s.section);
    expect(sectionKeys).toContain('AAA');
  });

  it('excludes 2.1-only criteria for 508 edition', async () => {
    const sections = await getCriteriaForEdition('508', ['web'], '2.1', 'AA');
    const allCodes = sections.flatMap((s) => s.criteria.map((c) => c.code));
    expect(allCodes).not.toContain('1.3.4');
    expect(allCodes).not.toContain('1.4.10');
    expect(allCodes).toContain('1.1.1');
  });

  it('includes 2.1 criteria for EU edition', async () => {
    const sections = await getCriteriaForEdition('EU', ['web'], '2.1', 'AA');
    const allCodes = sections.flatMap((s) => s.criteria.map((c) => c.code));
    expect(allCodes).toContain('1.3.4');
    expect(allCodes).toContain('1.4.10');
  });

  it('includes Chapter 3 section for 508 edition', async () => {
    const sections = await getCriteriaForEdition('508', ['web'], '2.1', 'AA');
    const sectionKeys = sections.map((s) => s.section);
    expect(sectionKeys).toContain('Chapter3');
    expect(sectionKeys).toContain('Chapter6');
  });

  it('includes Clause 4 section for EU edition', async () => {
    const sections = await getCriteriaForEdition('EU', ['web'], '2.1', 'AA');
    const sectionKeys = sections.map((s) => s.section);
    expect(sectionKeys).toContain('Clause4');
  });

  it('does not include 508 non-WCAG sections for WCAG edition', async () => {
    const sections = await getCriteriaForEdition('WCAG', ['web'], '2.1', 'AA');
    const sectionKeys = sections.map((s) => s.section);
    expect(sectionKeys).not.toContain('Chapter3');
  });

  it('includes both 508 and EN sections for INT edition', async () => {
    const sections = await getCriteriaForEdition('INT', ['web'], '2.1', 'AA');
    const sectionKeys = sections.map((s) => s.section);
    expect(sectionKeys).toContain('Chapter3');
    expect(sectionKeys).toContain('Clause4');
  });

  it('returns sections with labels', async () => {
    const sections = await getCriteriaForEdition('WCAG', ['web'], '2.1', 'AA');
    const aSection = sections.find((s) => s.section === 'A');
    expect(aSection?.label).toBe('Table 1: Success Criteria, Level A');
  });

  it('marks Chapter5 criteria as autoNotApplicable for web-only scope', async () => {
    const sections = await getCriteriaForEdition('508', ['web'], '2.1', 'AA');
    const ch5 = sections.find((s) => s.section === 'Chapter5');
    expect(ch5).toBeDefined();
    ch5!.criteria.forEach((c) => {
      expect(c.autoNotApplicable).toBe(true);
    });
  });

  it('does not mark Chapter5 criteria as autoNotApplicable when software is in scope', async () => {
    const sections = await getCriteriaForEdition('508', ['web', 'software-desktop'], '2.1', 'AA');
    const ch5 = sections.find((s) => s.section === 'Chapter5');
    expect(ch5).toBeDefined();
    ch5!.criteria.forEach((c) => {
      expect(c.autoNotApplicable).toBeUndefined();
    });
  });
});

describe('getCriterion', () => {
  it('returns a criterion by id', async () => {
    const sections = await getCriteriaForEdition('WCAG', ['web'], '2.1', 'AA');
    const firstCriterion = sections[0]!.criteria[0]!;
    const found = await getCriterion(firstCriterion.id);
    expect(found).not.toBeNull();
    expect(found!.code).toBe(firstCriterion.code);
  });

  it('returns null for non-existent id', async () => {
    expect(await getCriterion('non-existent')).toBeNull();
  });
});

describe('Criterion translation fields', () => {
  it('includes optional translation fields on criteria returned by getCriteriaForEdition', async () => {
    const sections = await getCriteriaForEdition('WCAG', ['web'], '2.1', 'AA');
    const first = sections[0]!.criteria[0]!;
    // Fields exist on the type (may be null/undefined — columns are nullable and unseeded)
    expect('name_fr' in first).toBe(true);
    expect('name_es' in first).toBe(true);
    expect('name_de' in first).toBe(true);
    expect('description_fr' in first).toBe(true);
    expect('description_es' in first).toBe(true);
    expect('description_de' in first).toBe(true);
  });

  it('translation fields default to null when not set', async () => {
    const sections = await getCriteriaForEdition('WCAG', ['web'], '2.1', 'AA');
    const first = sections[0]!.criteria[0]!;
    expect(first.name_fr).toBeNull();
    expect(first.description_fr).toBeNull();
  });

  it('getCriterion returns translation fields', async () => {
    const sections = await getCriteriaForEdition('WCAG', ['web'], '2.1', 'AA');
    const firstId = sections[0]!.criteria[0]!.id;
    const criterion = await getCriterion(firstId);
    expect(criterion).not.toBeNull();
    expect('name_fr' in criterion!).toBe(true);
  });
});
