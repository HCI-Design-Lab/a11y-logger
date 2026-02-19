import { describe, it, expect } from 'vitest';
import { CreateIssueSchema, UpdateIssueSchema } from '../issues';

describe('CreateIssueSchema', () => {
  it('accepts a minimal valid issue (title only)', () => {
    const result = CreateIssueSchema.safeParse({ title: 'Button has no label' });
    expect(result.success).toBe(true);
  });

  it('accepts a fully populated issue', () => {
    const result = CreateIssueSchema.safeParse({
      title: 'Image missing alt text',
      description: 'The hero image has no alt attribute.',
      url: 'https://example.com/home',
      severity: 'critical',
      status: 'open',
      wcag_codes: ['1.1.1', '1.4.5'],
      device_type: 'desktop',
      browser: 'Chrome',
      operating_system: 'macOS',
      assistive_technology: 'VoiceOver',
      tags: ['homepage', 'images'],
      evidence_media: ['/data/media/proj1/issue1/screenshot.png'],
      created_by: 'alice',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = CreateIssueSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 300 chars', () => {
    const result = CreateIssueSchema.safeParse({ title: 'x'.repeat(301) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid severity value', () => {
    const result = CreateIssueSchema.safeParse({ title: 'T', severity: 'blocker' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status value', () => {
    const result = CreateIssueSchema.safeParse({ title: 'T', status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid device_type value', () => {
    const result = CreateIssueSchema.safeParse({ title: 'T', device_type: 'smartwatch' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown WCAG codes', () => {
    const result = CreateIssueSchema.safeParse({ title: 'T', wcag_codes: ['9.9.9'] });
    expect(result.success).toBe(false);
  });

  it('accepts empty arrays for wcag_codes, tags, evidence_media', () => {
    const result = CreateIssueSchema.safeParse({
      title: 'T',
      wcag_codes: [],
      tags: [],
      evidence_media: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateIssueSchema', () => {
  it('accepts empty object (no-op update)', () => {
    const result = UpdateIssueSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only severity', () => {
    const result = UpdateIssueSchema.safeParse({ severity: 'low' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid severity on update', () => {
    const result = UpdateIssueSchema.safeParse({ severity: 'blocker' });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 300 chars on update', () => {
    const result = UpdateIssueSchema.safeParse({ title: 'x'.repeat(301) });
    expect(result.success).toBe(false);
  });
});
