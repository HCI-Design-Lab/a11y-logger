import { describe, it, expect } from 'vitest';
import { mapRows } from '../map-rows';

const rows = [
  { col_title: 'Missing alt text', col_desc: 'Images lack alt attributes', col_sev: 'critical' },
  { col_title: 'Low contrast', col_desc: 'Text fails WCAG AA', col_sev: 'invalid-value' },
  { col_title: '', col_desc: 'No title provided', col_sev: 'high' },
];

const mapping = {
  title: 'col_title',
  description: 'col_desc',
  severity: 'col_sev',
};

describe('mapRows', () => {
  it('maps CSV columns to issue fields using the mapping', () => {
    const { issues } = mapRows(rows, mapping);
    expect(issues[0].title).toBe('Missing alt text');
    expect(issues[0].description).toBe('Images lack alt attributes');
    expect(issues[0].severity).toBe('critical');
  });

  it('replaces empty title with "Untitled"', () => {
    const { issues } = mapRows(rows, mapping);
    expect(issues[2].title).toBe('Untitled');
  });

  it('omits invalid enum values and records a warning', () => {
    const { issues, warnings } = mapRows(rows, mapping);
    expect(issues[1].severity).toBeUndefined();
    expect(warnings.some((w) => w.includes('severity'))).toBe(true);
  });

  it('splits comma-separated array fields into arrays', () => {
    const arrayRows = [{ codes: '1.1.1, 1.3.1, 2.4.4' }];
    const arrayMapping = { wcag_codes: 'codes' };
    const { issues } = mapRows(arrayRows, arrayMapping);
    expect(issues[0].wcag_codes).toEqual(['1.1.1', '1.3.1', '2.4.4']);
  });

  it('omits unmapped fields from the result', () => {
    const { issues } = mapRows(rows, mapping);
    expect(issues[0].url).toBeUndefined();
  });

  it('warns about unmapped title field', () => {
    const { warnings } = mapRows(rows, {});
    expect(warnings.some((w) => w.includes('Title'))).toBe(true);
  });

  it('returns one issue per row', () => {
    const { issues } = mapRows(rows, mapping);
    expect(issues).toHaveLength(3);
  });
});
