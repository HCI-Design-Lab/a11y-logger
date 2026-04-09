// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { extractCriteria, parseOpenAcr } from '../parse-openacr';

describe('extractCriteria — multi-component', () => {
  it('extracts all components for each criterion', () => {
    const chapters = {
      success_criteria_level_a: {
        criteria: [
          {
            num: '1.1.1',
            components: [
              { name: 'web', adherence: { level: 'supports', notes: 'OK' } },
              {
                name: 'electronic-docs',
                adherence: { level: 'partially-supports', notes: 'Missing alt' },
              },
            ],
          },
        ],
      },
    };
    const result = extractCriteria(chapters);
    expect(result).toHaveLength(1);
    expect(result[0]!.code).toBe('1.1.1');
    expect(result[0]!.components).toHaveLength(2);
    expect(result[0]!.components[0]!.component_name).toBe('web');
    expect(result[0]!.components[0]!.conformance).toBe('supports');
    expect(result[0]!.components[1]!.component_name).toBe('electronic-docs');
    expect(result[0]!.components[1]!.conformance).toBe('partially_supports');
    expect(result[0]!.components[1]!.remarks).toBe('Missing alt');
  });

  it('row-level conformance is derived from first component (backward compat)', () => {
    const chapters = {
      success_criteria_level_a: {
        criteria: [
          {
            num: '1.1.1',
            components: [
              { name: 'web', adherence: { level: 'supports', notes: '' } },
              { name: 'electronic-docs', adherence: { level: 'does-not-support', notes: '' } },
            ],
          },
        ],
      },
    };
    const result = extractCriteria(chapters);
    expect(result[0]!.conformance).toBe('supports');
  });

  it('handles single-component criteria (no regression)', () => {
    const chapters = {
      success_criteria_level_a: {
        criteria: [
          {
            num: '1.1.1',
            components: [{ name: 'web', adherence: { level: 'not-applicable', notes: '' } }],
          },
        ],
      },
    };
    const result = extractCriteria(chapters);
    expect(result[0]!.conformance).toBe('not_applicable');
    expect(result[0]!.components).toHaveLength(1);
  });
});

describe('parseOpenAcr — multi-component', () => {
  it('returns criteria with components array', () => {
    const raw = {
      catalog: '2.4-edition-wcag-2.1-en',
      title: 'My VPAT',
      notes: '',
      chapters: {
        success_criteria_level_a: {
          criteria: [
            {
              num: '1.1.1',
              components: [
                { name: 'web', adherence: { level: 'supports', notes: '' } },
                {
                  name: 'electronic-docs',
                  adherence: { level: 'partially-supports', notes: 'Test' },
                },
              ],
            },
          ],
        },
      },
    };
    const result = parseOpenAcr(raw);
    expect(result).not.toBeNull();
    expect(result!.criteria[0]!.components).toHaveLength(2);
  });

  it('captures non-empty description from notes field', () => {
    const raw = {
      catalog: '2.4-edition-wcag-2.1-en',
      title: 'My VPAT',
      notes: 'Some evaluation notes',
      chapters: { success_criteria_level_a: { criteria: [] } },
    };
    const result = parseOpenAcr(raw);
    expect(result!.description).toBe('Some evaluation notes');
  });
});

describe('extractCriteria — edge cases', () => {
  it('falls back to "web" when component name is missing', () => {
    const chapters = {
      success_criteria_level_a: {
        criteria: [
          {
            num: '1.1.1',
            components: [{ adherence: { level: 'supports', notes: '' } }],
          },
        ],
      },
    };
    const result = extractCriteria(chapters);
    expect(result[0]!.components[0]!.component_name).toBe('web');
  });

  it('captures non-empty remarks on a component', () => {
    const chapters = {
      success_criteria_level_a: {
        criteria: [
          {
            num: '1.1.1',
            components: [{ name: 'web', adherence: { level: 'supports', notes: 'Works well' } }],
          },
        ],
      },
    };
    const result = extractCriteria(chapters);
    expect(result[0]!.remarks).toBe('Works well');
    expect(result[0]!.components[0]!.remarks).toBe('Works well');
  });

  it('handles criteria with no components array', () => {
    const chapters = {
      success_criteria_level_a: {
        criteria: [{ num: '1.1.1' }],
      },
    };
    const result = extractCriteria(chapters);
    expect(result[0]!.components).toHaveLength(0);
    expect(result[0]!.conformance).toBe('not_evaluated');
  });
});
