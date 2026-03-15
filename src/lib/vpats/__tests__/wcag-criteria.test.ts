import { describe, it, expect } from 'vitest';
import { WCAG_CRITERIA, getCriteriaForScope, buildDefaultCriteriaRows } from '../wcag-criteria';

describe('WCAG_CRITERIA', () => {
  it('contains all 87 criteria', () => {
    expect(WCAG_CRITERIA).toHaveLength(87);
  });

  it('every entry has required fields', () => {
    for (const c of WCAG_CRITERIA) {
      expect(c.criterion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(c.name).toBeTruthy();
      expect(['A', 'AA', 'AAA']).toContain(c.level);
      expect(['Perceivable', 'Operable', 'Understandable', 'Robust']).toContain(c.principle);
      expect(['2.0', '2.1', '2.2']).toContain(c.wcag_version);
    }
  });
});

describe('getCriteriaForScope', () => {
  it('WCAG 2.1 A returns only Level A criteria introduced in 2.0 or 2.1', () => {
    const result = getCriteriaForScope('2.1', 'A');
    expect(result.every((c) => c.level === 'A')).toBe(true);
    expect(result.every((c) => c.wcag_version !== '2.2')).toBe(true);
  });

  it('WCAG 2.1 AA returns Level A and AA criteria, no 2.2 criteria', () => {
    const result = getCriteriaForScope('2.1', 'AA');
    expect(result.every((c) => ['A', 'AA'].includes(c.level))).toBe(true);
    expect(result.every((c) => c.wcag_version !== '2.2')).toBe(true);
  });

  it('WCAG 2.1 AAA returns all criteria introduced in 2.0 or 2.1', () => {
    const result = getCriteriaForScope('2.1', 'AAA');
    expect(result).toHaveLength(78);
    expect(result.every((c) => c.wcag_version !== '2.2')).toBe(true);
  });

  it('WCAG 2.2 AA returns Level A and AA criteria including 2.2 additions', () => {
    const result = getCriteriaForScope('2.2', 'AA');
    const has2_2 = result.some((c) => c.wcag_version === '2.2' && c.level === 'AA');
    expect(has2_2).toBe(true);
    expect(result.every((c) => ['A', 'AA'].includes(c.level))).toBe(true);
  });

  it('WCAG 2.2 AAA returns all 87 criteria', () => {
    const result = getCriteriaForScope('2.2', 'AAA');
    expect(result).toHaveLength(87);
  });
});

describe('buildDefaultCriteriaRows', () => {
  it('builds rows for WCAG 2.1 AA scope', () => {
    const rows = buildDefaultCriteriaRows('2.1', 'AA');
    expect(rows.every((r) => r.conformance === 'not_evaluated')).toBe(true);
    expect(rows.every((r) => r.remarks === '')).toBe(true);
    expect(rows.every((r) => Array.isArray(r.related_issue_ids))).toBe(true);
    const allAandAA = rows.length;
    expect(allAandAA).toBeGreaterThan(40);
  });
});
