import { describe, it, expect } from 'vitest';
import {
  parseCatalog,
  inferWcagLevel,
  mapConformance,
  extractCriteria,
  parseOpenAcr,
} from '../parse-openacr';

describe('parseCatalog', () => {
  it('resolves WCAG 2.1 catalog', () => {
    const result = parseCatalog('2.4-edition-wcag-2.1-en');
    expect(result).toEqual({ standard_edition: 'WCAG', wcag_version: '2.1' });
  });

  it('resolves WCAG 2.2 catalog', () => {
    const result = parseCatalog('2.5-edition-wcag-2.2-en');
    expect(result).toEqual({ standard_edition: 'WCAG', wcag_version: '2.2' });
  });

  it('resolves 508 catalog', () => {
    const result = parseCatalog('2.4-edition-508-en');
    expect(result).toEqual({ standard_edition: '508', wcag_version: '2.1' });
  });

  it('resolves EU catalog', () => {
    const result = parseCatalog('2.4-edition-en301549-en');
    expect(result).toEqual({ standard_edition: 'EU', wcag_version: '2.1' });
  });

  it('returns null for unknown catalog', () => {
    expect(parseCatalog('unknown-catalog')).toBeNull();
  });
});

describe('inferWcagLevel', () => {
  it('returns AAA when level_aaa chapter present', () => {
    expect(inferWcagLevel({ success_criteria_level_aaa: {}, success_criteria_level_aa: {} })).toBe(
      'AAA'
    );
  });

  it('returns AA when level_aa present but not aaa', () => {
    expect(inferWcagLevel({ success_criteria_level_aa: {} })).toBe('AA');
  });

  it('returns A when only level_a present', () => {
    expect(inferWcagLevel({ success_criteria_level_a: {} })).toBe('A');
  });

  it('returns A when no level chapters present', () => {
    expect(inferWcagLevel({ hardware: {} })).toBe('A');
  });
});

describe('mapConformance', () => {
  it.each([
    ['supports', 'supports'],
    ['partially-supports', 'partially_supports'],
    ['does-not-support', 'does_not_support'],
    ['not-applicable', 'not_applicable'],
    ['not-evaluated', 'not_evaluated'],
  ])('maps %s to %s', (input, expected) => {
    expect(mapConformance(input)).toBe(expected);
  });

  it('returns not_evaluated for unknown values', () => {
    expect(mapConformance('unknown')).toBe('not_evaluated');
  });
});

describe('extractCriteria', () => {
  const chapters = {
    success_criteria_level_a: {
      criteria: [
        {
          num: '1.1.1',
          components: [
            { name: 'web', adherence: { level: 'supports', notes: 'All images have alt text' } },
          ],
        },
      ],
    },
    success_criteria_level_aa: {
      criteria: [
        {
          num: '1.4.3',
          components: [{ name: 'web', adherence: { level: 'partially-supports', notes: '' } }],
        },
      ],
    },
    hardware: { conformance: 'not-applicable' },
  };

  it('extracts criteria from all level chapters', () => {
    const result = extractCriteria(chapters);
    expect(result).toHaveLength(2);
  });

  it('maps criterion num to code', () => {
    const result = extractCriteria(chapters);
    expect(result[0]!.code).toBe('1.1.1');
    expect(result[1]!.code).toBe('1.4.3');
  });

  it('maps conformance level', () => {
    const result = extractCriteria(chapters);
    expect(result[0]!.conformance).toBe('supports');
    expect(result[1]!.conformance).toBe('partially_supports');
  });

  it('maps remarks, treating empty string as null', () => {
    const result = extractCriteria(chapters);
    expect(result[0]!.remarks).toBe('All images have alt text');
    expect(result[1]!.remarks).toBeNull();
  });

  it('ignores non-criteria chapters (hardware, software, etc.)', () => {
    const result = extractCriteria(chapters);
    expect(result.every((c) => c.code !== 'hardware')).toBe(true);
  });
});

describe('parseOpenAcr', () => {
  const validDoc = {
    title: 'My VPAT',
    catalog: '2.4-edition-wcag-2.1-en',
    notes: 'Test notes',
    chapters: {
      success_criteria_level_a: {
        criteria: [
          { num: '1.1.1', components: [{ adherence: { level: 'supports', notes: 'Good' } }] },
        ],
      },
    },
  };

  it('parses a valid OpenACR document', () => {
    const result = parseOpenAcr(validDoc);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('My VPAT');
    expect(result!.description).toBe('Test notes');
    expect(result!.standard_edition).toBe('WCAG');
    expect(result!.wcag_version).toBe('2.1');
    expect(result!.wcag_level).toBe('A');
    expect(result!.criteria).toHaveLength(1);
  });

  it('returns null when catalog is missing', () => {
    expect(parseOpenAcr({ title: 'X', chapters: {} })).toBeNull();
  });

  it('returns null when chapters is missing', () => {
    expect(parseOpenAcr({ title: 'X', catalog: '2.4-edition-wcag-2.1-en' })).toBeNull();
  });

  it('returns null for unknown catalog', () => {
    expect(parseOpenAcr({ title: 'X', catalog: 'bad-catalog', chapters: {} })).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(parseOpenAcr(null)).toBeNull();
    expect(parseOpenAcr('string')).toBeNull();
  });

  it('uses empty string notes as null description', () => {
    const result = parseOpenAcr({ ...validDoc, notes: '' });
    expect(result!.description).toBeNull();
  });
});
