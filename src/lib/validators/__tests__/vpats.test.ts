import { describe, it, expect } from 'vitest';
import { CreateVpatSchema, UpdateVpatSchema } from '../vpats';

describe('CreateVpatSchema', () => {
  it('accepts a valid minimal input', () => {
    const result = CreateVpatSchema.safeParse({ title: 'Test', project_id: 'proj-1' });
    expect(result.success).toBe(true);
  });

  it('defaults standard_edition to WCAG', () => {
    const result = CreateVpatSchema.safeParse({ title: 'Test', project_id: 'proj-1' });
    expect(result.success && result.data.standard_edition).toBe('WCAG');
  });

  it('defaults wcag_version to 2.1', () => {
    const result = CreateVpatSchema.safeParse({ title: 'Test', project_id: 'proj-1' });
    expect(result.success && result.data.wcag_version).toBe('2.1');
  });

  it('defaults wcag_level to AA', () => {
    const result = CreateVpatSchema.safeParse({ title: 'Test', project_id: 'proj-1' });
    expect(result.success && result.data.wcag_level).toBe('AA');
  });

  it('defaults product_scope to ["web"]', () => {
    const result = CreateVpatSchema.safeParse({ title: 'Test', project_id: 'proj-1' });
    expect(result.success && result.data.product_scope).toEqual(['web']);
  });

  it('accepts all valid standard editions', () => {
    for (const edition of ['WCAG', '508', 'EU', 'INT']) {
      const result = CreateVpatSchema.safeParse({
        title: 'T',
        project_id: 'p',
        standard_edition: edition,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid standard_edition', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'T',
      project_id: 'p',
      standard_edition: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty product_scope', () => {
    const result = CreateVpatSchema.safeParse({ title: 'T', project_id: 'p', product_scope: [] });
    expect(result.success).toBe(false);
  });

  it('accepts all valid product scope values', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'T',
      project_id: 'p',
      product_scope: [
        'web',
        'software-desktop',
        'software-mobile',
        'documents',
        'hardware',
        'telephony',
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid product scope value', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'T',
      project_id: 'p',
      product_scope: ['invalid'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 200 characters', () => {
    const result = CreateVpatSchema.safeParse({ title: 'x'.repeat(201), project_id: 'p' });
    expect(result.success).toBe(false);
  });

  it('accepts description up to 1000 chars', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'T',
      project_id: 'p',
      description: 'd'.repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects description exceeding 1000 chars', () => {
    const result = CreateVpatSchema.safeParse({
      title: 'T',
      project_id: 'p',
      description: 'd'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateVpatSchema', () => {
  it('rejects empty object (at least one field required)', () => {
    const result = UpdateVpatSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts title update', () => {
    const result = UpdateVpatSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });

  it('rejects title exceeding 200 characters', () => {
    const result = UpdateVpatSchema.safeParse({ title: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });
});
