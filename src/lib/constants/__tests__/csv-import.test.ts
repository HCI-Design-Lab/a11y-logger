import { describe, it, expect } from 'vitest';
import { IMPORTABLE_ISSUE_FIELDS, ARRAY_FIELDS, ENUM_FIELDS } from '../csv-import';

describe('csv-import constants', () => {
  it('exports an array of field definitions with key and label', () => {
    expect(IMPORTABLE_ISSUE_FIELDS.length).toBeGreaterThan(0);
    for (const field of IMPORTABLE_ISSUE_FIELDS) {
      expect(field).toHaveProperty('key');
      expect(field).toHaveProperty('label');
    }
  });

  it('includes title, description, severity, and status fields', () => {
    const keys = IMPORTABLE_ISSUE_FIELDS.map((f) => f.key);
    expect(keys).toContain('title');
    expect(keys).toContain('description');
    expect(keys).toContain('severity');
    expect(keys).toContain('status');
  });

  it('ARRAY_FIELDS contains fields that should be split on comma', () => {
    expect(ARRAY_FIELDS).toContain('wcag_codes');
    expect(ARRAY_FIELDS).toContain('tags');
  });

  it('ENUM_FIELDS maps field keys to valid enum values', () => {
    expect(ENUM_FIELDS.severity).toContain('critical');
    expect(ENUM_FIELDS.status).toContain('open');
  });
});
