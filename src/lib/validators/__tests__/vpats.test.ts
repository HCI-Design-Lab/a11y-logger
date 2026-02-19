import { describe, it, expect } from 'vitest';
import { CreateVpatSchema, UpdateVpatSchema } from '../vpats';

describe('CreateVpatSchema', () => {
  it('accepts minimal valid input', () => {
    const result = CreateVpatSchema.safeParse({ title: 'VPAT 2024', project_id: 'proj-1' });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    expect(CreateVpatSchema.safeParse({ project_id: 'proj-1' }).success).toBe(false);
  });

  it('rejects empty title', () => {
    expect(CreateVpatSchema.safeParse({ title: '', project_id: 'proj-1' }).success).toBe(false);
  });

  it('rejects title longer than 200 chars', () => {
    expect(
      CreateVpatSchema.safeParse({ title: 'a'.repeat(201), project_id: 'proj-1' }).success
    ).toBe(false);
  });

  it('rejects missing project_id', () => {
    expect(CreateVpatSchema.safeParse({ title: 'VPAT' }).success).toBe(false);
  });

  it('rejects empty project_id', () => {
    expect(CreateVpatSchema.safeParse({ title: 'VPAT', project_id: '' }).success).toBe(false);
  });

  it('accepts valid wcag_scope as array of known codes', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'VPAT',
      project_id: 'proj-1',
      wcag_scope: ['1.1.1', '1.3.1', '4.1.2'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects wcag_scope containing unknown criterion code', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'VPAT',
      project_id: 'proj-1',
      wcag_scope: ['9.9.9'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid criteria_rows', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'VPAT',
      project_id: 'proj-1',
      criteria_rows: [
        {
          criterion_code: '1.1.1',
          conformance: 'supports',
          remarks: 'All images have alt text',
          related_issue_ids: [],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects criteria_rows with invalid conformance value', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'VPAT',
      project_id: 'proj-1',
      criteria_rows: [{ criterion_code: '1.1.1', conformance: 'unknown_value' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects criteria_rows with unknown criterion_code', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'VPAT',
      project_id: 'proj-1',
      criteria_rows: [{ criterion_code: '9.9.9', conformance: 'supports' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid conformance values', () => {
    const conformanceValues = [
      'supports',
      'partially_supports',
      'does_not_support',
      'not_applicable',
      'not_evaluated',
    ];
    for (const conformance of conformanceValues) {
      const result = CreateVpatSchema.safeParse({
        title: 'VPAT',
        project_id: 'proj-1',
        criteria_rows: [{ criterion_code: '1.1.1', conformance }],
      });
      expect(result.success).toBe(true);
    }
  });

  it('defaults wcag_scope to empty array when omitted', () => {
    const result = CreateVpatSchema.safeParse({ title: 'VPAT', project_id: 'proj-1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.wcag_scope).toEqual([]);
    }
  });

  it('defaults criteria_rows to empty array when omitted', () => {
    const result = CreateVpatSchema.safeParse({ title: 'VPAT', project_id: 'proj-1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.criteria_rows).toEqual([]);
    }
  });
});

describe('UpdateVpatSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    expect(UpdateVpatSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update with just title', () => {
    expect(UpdateVpatSchema.safeParse({ title: 'New Title' }).success).toBe(true);
  });

  it('still rejects invalid title (empty string)', () => {
    expect(UpdateVpatSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('still rejects invalid wcag_scope codes', () => {
    expect(UpdateVpatSchema.safeParse({ wcag_scope: ['9.9.9'] }).success).toBe(false);
  });

  it('still validates criteria_rows on partial update', () => {
    const result = UpdateVpatSchema.safeParse({
      criteria_rows: [{ criterion_code: '1.1.1', conformance: 'invalid' }],
    });
    expect(result.success).toBe(false);
  });
});
