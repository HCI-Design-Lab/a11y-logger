import { describe, it, expect } from 'vitest';
import { CreateProjectSchema, UpdateProjectSchema } from '../projects';

describe('CreateProjectSchema', () => {
  it('accepts a valid name-only input', () => {
    const result = CreateProjectSchema.safeParse({ name: 'My Project' });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = CreateProjectSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = CreateProjectSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 200 chars', () => {
    const result = CreateProjectSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects description longer than 2000 chars', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'My Project',
      description: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid product_url', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'My Project',
      product_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid product_url', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'My Project',
      product_url: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'My Project',
      status: 'deleted',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid status values', () => {
    expect(CreateProjectSchema.safeParse({ name: 'P', status: 'active' }).success).toBe(true);
    expect(CreateProjectSchema.safeParse({ name: 'P', status: 'archived' }).success).toBe(true);
  });
});

describe('UpdateProjectSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = UpdateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial update', () => {
    const result = UpdateProjectSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('still rejects invalid values', () => {
    const result = UpdateProjectSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});
