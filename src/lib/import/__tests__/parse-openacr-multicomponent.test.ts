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
});
